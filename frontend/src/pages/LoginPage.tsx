import { Link, useNavigate } from 'react-router-dom';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { loginUser } from '../services/authService';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function LoginPage() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    try {
      // Ép kiểu any để TypeScript không báo lỗi khi ta đọc trực tiếp access_token
      const response: any = await loginUser({
        username: email, 
        password: password
      });

      // SỬA Ở ĐÂY: Chỉ cần kiểm tra xem có lấy được token từ Backend hay không
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        alert('Đăng nhập thành công!');
        navigate('/my-learning'); 
      } else {
        // Nếu sai pass thật, FastAPI sẽ trả về lỗi trong trường "detail"
        setAuthError(response.detail || 'Email hoặc mật khẩu không đúng.');
      }
    } catch (error) {
        setAuthError('Lỗi kết nối tới server.');
    }
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (authError) setAuthError('');
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (authError) setAuthError('');
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
              value={password}
              onChange={handlePasswordChange}
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