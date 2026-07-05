import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <strong>EduCloud Lite</strong>
      <div className="nav-links">
        <NavLink to="/login">Login</NavLink>
        <NavLink to="/register">Register</NavLink>
        <NavLink to="/courses">Courses</NavLink>
        <NavLink to="/my-learning">My Learning</NavLink>
        <NavLink to="/instructor/courses">Instructor</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
