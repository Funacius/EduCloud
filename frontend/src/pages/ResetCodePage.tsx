import { MailCheck, RefreshCw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';

type ResetRouteState = { email?: string };

function ResetCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as ResetRouteState | null)?.email;
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);

  if (!email) return <Navigate to="/forgot-password" replace />;

  function continueToPassword(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6) { setError('Enter the 6-digit reset code.'); return; }
    navigate('/forgot-password/reset', { state: { email, code } });
  }

  async function resendCode() {
    setError('');
    setNotice('');
    setIsResending(true);
    try {
      await requestPasswordReset(email!);
      setNotice('If this email is linked to EduCloud, a new reset code has been sent.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to resend the reset code.');
    } finally { setIsResending(false); }
  }

  return <section className="page auth-page"><div className="auth-card">
    <MailCheck className="auth-feature-icon" />
    <h1>Enter reset code</h1>
    <p>Enter the six-digit code sent to <strong>{email}</strong>.</p>
    <form className="auth-form" onSubmit={continueToPassword}>
      <label><span>Reset code</span><input autoFocus required inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} placeholder="6-digit code" value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} /></label>
      {notice && <p className="auth-success">{notice}</p>}
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={code.length !== 6}>Continue</button>
      <button className="auth-secondary-button" type="button" disabled={isResending} onClick={resendCode}><RefreshCw />{isResending ? 'Sending...' : 'Resend code'}</button>
      <Link className="auth-link" to="/forgot-password">Use another email</Link>
    </form>
  </div></section>;
}

export default ResetCodePage;
