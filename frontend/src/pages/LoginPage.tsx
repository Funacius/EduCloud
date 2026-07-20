import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { getRoleHome, useAuth } from '../auth/AuthContext';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function LoginPage() {
  const location = useLocation();
  const routeState = (location.state as { from?: string; email?: string; emailConfirmed?: boolean; passwordReset?: boolean; applyAsInstructor?: boolean } | null) ?? {};
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState(routeState.email ?? '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(Boolean(routeState.emailConfirmed || routeState.passwordReset));
  const { currentUser, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), 3800);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  if (currentUser) {
    return <Navigate to={getRoleHome(currentUser.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);
    if ('error' in result) {
      setAuthError(result.error);
      return;
    }

    if (routeState.applyAsInstructor && result.user.role === 'student') {
      navigate('/profile?apply=instructor', { replace: true });
      return;
    }
    navigate(routeState.from || getRoleHome(result.user.role), { replace: true });
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (authError === 'Please enter a valid email address.') {
      setAuthError('');
    }
  };

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <h1>Sign in to EduCloud Lite</h1>
        <p>Continue learning and manage your enrolled courses.</p>
        {showSuccess && routeState.emailConfirmed && <p className="auth-success auth-success-auto-hide" role="status">Email confirmed. Sign in to continue.</p>}
        {showSuccess && routeState.passwordReset && <p className="auth-success auth-success-auto-hide" role="status">Password updated. Sign in with your new password.</p>}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={handleEmailChange}
              aria-invalid={Boolean(authError)}
              aria-describedby={authError ? 'login-error' : undefined}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setAuthError('');
              }}
              aria-invalid={Boolean(authError)}
              aria-describedby={authError ? 'login-error' : undefined}
            />
          </label>
          {authError && (
            <p className="form-error" id="login-error">
              {authError}
            </p>
          )}
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
          <Link className="auth-link" to="/forgot-password">
            Forgot password?
          </Link>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;
