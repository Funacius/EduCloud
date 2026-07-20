import { GraduationCap, Presentation } from 'lucide-react';
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getRoleHome, useAuth } from '../auth/AuthContext';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function RegisterPage() {
  const [accountType, setAccountType] = useState<'student' | 'instructor'>('student');
  const [form, setForm] = useState({
    certificateName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.certificateName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (emailIsInvalid || !form.email || form.password.length < 8 || passwordsDoNotMatch) {
      setFormError('Please check your account information.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerStudent(form.certificateName, form.email, form.password);
    setIsSubmitting(false);
    if ('error' in result) {
      setFormError(result.error);
      return;
    }
    if ('requiresConfirmation' in result) {
      navigate('/verify-email', {
        replace: true,
        state: { email: result.email, applyAsInstructor: accountType === 'instructor' }
      });
      return;
    }
    navigate(accountType === 'instructor' ? '/profile?apply=instructor' : '/profile', { replace: true });
  };

  return (
    <section className="page auth-page">
      <div className="auth-card register-card">
        <h1>Create your EduCloud Lite account</h1>
        <p>Choose how you want to use EduCloud. Instructor applications require Admin approval.</p>
        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <fieldset className="signup-role-picker">
            <legend>I want to join as</legend>
            <div>
              <button className={accountType === 'student' ? 'signup-role-option is-selected' : 'signup-role-option'} type="button" aria-pressed={accountType === 'student'} onClick={() => setAccountType('student')}>
                <GraduationCap /><span><strong>Student</strong><small>Enroll in courses and earn certificates</small></span>
              </button>
              <button className={accountType === 'instructor' ? 'signup-role-option is-selected' : 'signup-role-option'} type="button" aria-pressed={accountType === 'instructor'} onClick={() => setAccountType('instructor')}>
                <Presentation /><span><strong>Instructor</strong><small>Apply to create and publish courses</small></span>
              </button>
            </div>
          </fieldset>
          <label>
            <span>{accountType === 'instructor' ? 'Full name' : 'Name on certificate'}</span>
            <input
              autoComplete="name"
              placeholder={accountType === 'instructor' ? 'Enter your full name' : 'Enter the name to print on certificates'}
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
          <button type="submit" disabled={passwordsDoNotMatch || emailIsInvalid || isSubmitting}>
            {isSubmitting ? 'Creating account...' : accountType === 'instructor' ? 'Continue as Instructor applicant' : 'Create Student account'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default RegisterPage;
