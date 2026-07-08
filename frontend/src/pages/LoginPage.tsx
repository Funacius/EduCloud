import { Link } from 'react-router-dom';
import { useState, type ChangeEvent, type FormEvent } from 'react';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function LoginPage() {
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setAuthError('Email or password is incorrect.');
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
              aria-invalid={Boolean(authError)}
              aria-describedby={authError ? 'login-error' : undefined}
            />
          </label>
          {authError && (
            <p className="form-error" id="login-error">
              {authError}
            </p>
          )}
          <button type="submit">Sign in</button>
          <Link className="auth-link" to="/forgot-password">
            Forgot password?
          </Link>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;
