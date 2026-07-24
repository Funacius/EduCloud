import { KeyRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type FirstLoginRouteState = {
  from?: string;
  applyAsInstructor?: boolean;
};

function FirstLoginPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state as FirstLoginRouteState | null) ?? {};
  const {
    pendingNewPasswordEmail,
    pendingNewPasswordRequiredAttributes,
    completeNewPassword,
    cancelNewPassword
  } = useAuth();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingNewPasswordEmail) return <Navigate to="/login" replace />;

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    if (pendingNewPasswordRequiredAttributes.includes('name') && fullName.trim().length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirmation do not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const attributes: Record<string, string> = {};
    if (pendingNewPasswordRequiredAttributes.includes('name')) {
      attributes.name = fullName.trim();
    }
    const result = await completeNewPassword(password, attributes);
    setIsSubmitting(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    if ('requiresNewPassword' in result) {
      setError('Cognito still requires a new password. Please choose another password.');
      return;
    }

    const profileParams = new URLSearchParams({ setup: 'required' });
    if (routeState.applyAsInstructor && result.user.role === 'student') {
      profileParams.set('apply', 'instructor');
    }
    if (routeState.from) profileParams.set('continue', routeState.from);
    navigate(`/profile?${profileParams.toString()}`, { replace: true });
  }

  function returnToLogin() {
    cancelNewPassword();
    navigate('/login', {
      replace: true,
      state: { email: pendingNewPasswordEmail }
    });
  }

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <KeyRound className="auth-feature-icon" />
        <h1>Set your permanent password</h1>
        <p>
          This is the first sign-in for <strong>{pendingNewPasswordEmail}</strong>.
          Choose the password you want to use from now on.
        </p>
        <form className="auth-form" onSubmit={submitPassword}>
          {pendingNewPasswordRequiredAttributes.includes('name') && (
            <label>
              <span>Full name</span>
              <input
                autoFocus
                required
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setError('');
                }}
              />
            </label>
          )}
          <label>
            <span>New password</span>
            <input
              autoFocus={!pendingNewPasswordRequiredAttributes.includes('name')}
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
            />
          </label>
          <label>
            <span>Confirm new password</span>
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError('');
              }}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving password...' : 'Save password and sign in'}
          </button>
          <button className="auth-secondary-button" type="button" onClick={returnToLogin}>
            Back to sign in
          </button>
        </form>
      </div>
    </section>
  );
}

export default FirstLoginPasswordPage;
