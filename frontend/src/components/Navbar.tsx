import { NavLink } from 'react-router-dom';
import logoUrl from '../../image/logo.png';

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink className="brand" to="/courses" aria-label="EduCloud home">
        <img src={logoUrl} alt="AWS" />
        <span>
          EduCloud Lite
          <small>Cloud Learning Platform</small>
        </span>
      </NavLink>
      <label className="search" aria-label="Search courses">
        <span aria-hidden="true">Q</span>
        <input type="search" placeholder="Search courses..." />
      </label>
      <div className="nav-links">
        <NavLink to="/courses">Courses</NavLink>
        <NavLink to="/my-learning">My Learning</NavLink>
        <NavLink to="/instructor/courses">Instructor</NavLink>
        <NavLink to="/login">Sign in</NavLink>
        <NavLink className="signup-link" to="/register">Sign up</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
