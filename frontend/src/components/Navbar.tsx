import { useState } from 'react';
import { ChevronDown, LogOut, Search, ShieldCheck, UserRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import logoUrl from '../../image/logo.png';
import { getRoleHome, useAuth } from '../auth/AuthContext';

const roleLabels = {
  student: 'Student',
  instructor: 'Instructor',
  admin: 'Admin'
};

function Navbar() {
  const { currentUser, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const links = currentUser
    ? currentUser.role === 'student'
      ? [
          { to: '/courses', label: 'Courses' },
          { to: '/my-learning', label: 'My Learning' }
        ]
      : currentUser.role === 'instructor'
        ? [
            { to: '/courses', label: 'Courses' },
            { to: '/instructor/courses', label: 'Instructor' }
          ]
        : [
            { to: '/admin', label: 'Admin' },
            { to: '/courses', label: 'Courses' }
          ]
    : [{ to: '/courses', label: 'Courses' }];

  const initials = currentUser?.fullName
    .split(' ')
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = () => {
    signOut();
    setProfileOpen(false);
    navigate('/courses');
  };

  return (
    <nav className="navbar">
      <NavLink
        className="brand"
        to={currentUser ? getRoleHome(currentUser.role) : '/courses'}
        aria-label="EduCloud home"
      >
        <img src={logoUrl} alt="AWS" />
        <span>
          EduCloud Lite
          <small>Cloud Learning Platform</small>
        </span>
      </NavLink>
      <label className="search" aria-label="Search courses">
        <Search size={17} aria-hidden="true" />
        <input type="search" placeholder="Search courses..." />
      </label>
      <div className="nav-links">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to}>
            {link.label}
          </NavLink>
        ))}
        {currentUser ? (
          <div className="profile-menu">
            <button
              className="profile-trigger"
              type="button"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="profile-avatar">{initials}</span>
              <span className="profile-copy">
                <strong>{currentUser.fullName}</strong>
                <small>{roleLabels[currentUser.role]}</small>
              </span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {profileOpen && (
              <div className="profile-popover">
                <div className="profile-summary">
                  {currentUser.role === 'admin' ? <ShieldCheck /> : <UserRound />}
                  <span>
                    <strong>{currentUser.fullName}</strong>
                    <small>{currentUser.email}</small>
                  </span>
                </div>
                <button type="button" onClick={handleSignOut}>
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <NavLink to="/login">Sign in</NavLink>
            <NavLink className="signup-link" to="/register">Sign up</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
