import { MailCheck, RefreshCw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cognitoErrorMessage, confirmCognitoSignUp, resendCognitoConfirmation } from '../services/cognitoService';

type VerificationState = { email?: string; applyAsInstructor?: boolean };

function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state as VerificationState | null) ?? {};
  const [email, setEmail] = useState(routeState.email ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await confirmCognitoSignUp(email, code);
      navigate('/login', {
        replace: true,
        state: { email, emailConfirmed: true, applyAsInstructor: Boolean(routeState.applyAsInstructor) }
      });
    } catch (caught) {
      setError(cognitoErrorMessage(caught));
    } finally { setIsSubmitting(false); }
  }

  async function resendCode() {
    setError('');
    setNotice('');
    setIsResending(true);
    try {
      await resendCognitoConfirmation(email);
      setNotice('A new confirmation code was sent to your email.');
    } catch (caught) {
      setError(cognitoErrorMessage(caught));
    } finally { setIsResending(false); }
  }

  return <section className="page auth-page"><div className="auth-card">
    <MailCheck className="auth-feature-icon" />
    <h1>Confirm your email</h1>
    <p>Enter the verification code Amazon Cognito sent to your email address.</p>
    <form className="auth-form" onSubmit={handleSubmit}>
      <label><span>Email</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label><span>Confirmation code</span><input required inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} placeholder="6-digit code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
      {notice && <p className="auth-success">{notice}</p>}
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={isSubmitting || code.length !== 6}>{isSubmitting ? 'Confirming...' : 'Confirm email'}</button>
      <button className="auth-secondary-button" type="button" disabled={isResending || !email} onClick={resendCode}><RefreshCw />{isResending ? 'Sending...' : 'Resend code'}</button>
      <Link className="auth-link" to="/login">Back to sign in</Link>
    </form>
  </div></section>;
}

export default VerifyEmailPage;
