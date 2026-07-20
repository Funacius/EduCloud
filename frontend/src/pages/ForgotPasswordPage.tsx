import { KeyRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';
import { isCognitoConfigured } from '../services/cognitoService';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (!isCognitoConfigured) { setError('Cognito password recovery is not configured.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      navigate('/forgot-password/code', { state: { email: email.trim().toLowerCase() } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to request a reset code.');
    } finally { setIsSubmitting(false); }
  }

  return <section className="page auth-page"><div className="auth-card">
    <KeyRound className="auth-feature-icon" />
    <h1>Forgot your password?</h1>
    <p>Enter your confirmed EduCloud email and we will send a six-digit reset code.</p>
    <form className="auth-form" onSubmit={requestCode} noValidate>
      <label><span>Email</span><input autoComplete="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} /></label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending code...' : 'Send reset code'}</button>
      <Link className="auth-link" to="/login">Back to sign in</Link>
    </form>
  </div></section>;
}

export default ForgotPasswordPage;
