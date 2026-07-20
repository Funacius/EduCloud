import { LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { cognitoErrorMessage, confirmCognitoPasswordReset } from '../services/cognitoService';

type PasswordRouteState = { email?: string; code?: string };

function NewPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state as PasswordRouteState | null) ?? {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!routeState.email || !routeState.code) return <Navigate to="/forgot-password" replace />;

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) { setError('Password must contain at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Password and confirmation do not match.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      await confirmCognitoPasswordReset(routeState.email!, routeState.code!, password);
      navigate('/login', { replace: true, state: { email: routeState.email, passwordReset: true } });
    } catch (caught) {
      setError(cognitoErrorMessage(caught));
    } finally { setIsSubmitting(false); }
  }

  return <section className="page auth-page"><div className="auth-card">
    <LockKeyhole className="auth-feature-icon" />
    <h1>Create a new password</h1>
    <p>Choose a new password for <strong>{routeState.email}</strong>.</p>
    <form className="auth-form" onSubmit={resetPassword}>
      <label><span>New password</span><input autoFocus required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} /></label>
      <label><span>Confirm new password</span><input required type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(''); }} /></label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating password...' : 'Reset password'}</button>
      <Link className="auth-link" to="/forgot-password/code" state={{ email: routeState.email }}>Back to code</Link>
    </form>
  </div></section>;
}

export default NewPasswordPage;
