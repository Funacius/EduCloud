import { useState, type ChangeEvent, type FormEvent } from 'react';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function ForgotPasswordPage() {
  const [emailError, setEmailError] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailError('Password reset email is not configured yet. Contact an administrator for local development access.');
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (emailError === 'Please enter a valid email address.') {
      setEmailError('');
    }
  };

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <h1>Reset your password</h1>
        <p>Password reset by email is not available in this local development build.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={handleEmailChange}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'reset-email-error' : undefined}
            />
          </label>
          {emailError && (
            <p className="form-error" id="reset-email-error">
              {emailError}
            </p>
          )}
          <button type="submit">Check reset availability</button>
        </form>
      </div>
    </section>
  );
}

export default ForgotPasswordPage;
