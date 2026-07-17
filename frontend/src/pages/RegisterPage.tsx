import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getRoleHome, useAuth } from '../auth/AuthContext';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function RegisterPage() {
  const [form, setForm] = useState({
    certificateName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const { currentUser, registerStudent } = useAuth();
  const navigate = useNavigate();

  if (currentUser) {
    return <Navigate to={getRoleHome(currentUser.role)} replace />;
  }

  const passwordsDoNotMatch = useMemo(
    () => form.confirmPassword.length > 0 && form.password !== form.confirmPassword,
    [form.password, form.confirmPassword]
  );
  const emailIsInvalid = form.email.length > 0 && !isValidEmail(form.email);

  const handleChange =
    (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((currentForm) => ({
        ...currentForm,
        [field]: event.target.value
      }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.certificateName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (emailIsInvalid || !form.email || form.password.length < 8 || passwordsDoNotMatch) {
      setFormError('Please check your account information.');
      return;
    }

    const user = registerStudent(form.certificateName, form.email);
    navigate(getRoleHome(user.role), { replace: true });
  };

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <h1>Create your EduCloud Lite account</h1>
        <p>Start learning with a Student account. Instructor access is assigned by an Admin.</p>
        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <label>
            <span>Name on certificate</span>
            <input
              autoComplete="name"
              placeholder="Enter your full name"
              value={form.certificateName}
              onChange={handleChange('certificateName')}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              placeholder="you@example.com"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              aria-invalid={emailIsInvalid}
              aria-describedby={emailIsInvalid ? 'register-email-error' : undefined}
            />
          </label>
          {emailIsInvalid && (
            <p className="form-error" id="register-email-error">
              Please enter a valid email address.
            </p>
          )}
          <label>
            <span>Password</span>
            <input
              autoComplete="new-password"
              placeholder="Create a password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
            />
          </label>
          <label>
            <span>Confirm password</span>
            <input
              autoComplete="new-password"
              placeholder="Re-enter your password"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              aria-invalid={passwordsDoNotMatch}
              aria-describedby={passwordsDoNotMatch ? 'password-match-error' : undefined}
            />
          </label>
          {passwordsDoNotMatch && (
            <p className="form-error" id="password-match-error">
              Password and confirm password do not match.
            </p>
          )}
          {formError && <p className="form-error">{formError}</p>}
          <button type="submit" disabled={passwordsDoNotMatch || emailIsInvalid}>
            Create account
          </button>
        </form>
      </div>
    </section>
  );
}

export default RegisterPage;
