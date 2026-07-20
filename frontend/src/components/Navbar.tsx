import { useEffect, useState, type KeyboardEvent } from 'react';
import { ChevronDown, LogOut, Search, ShieldCheck, UserRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import logoUrl from '../../image/logo.png';
import { getRoleHome, useAuth } from '../auth/AuthContext';
import { loadCourseCatalog } from '../data/courseCatalog';
import type { Course } from '../types/course';

const roleLabels = {
  student: 'Student',
  instructor: 'Instructor',
  admin: 'Admin'
};

function Navbar() {
  const { currentUser, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      loadCourseCatalog()
        .then((courses) => {
          if (isCancelled) return;
          setSearchResults(
            courses
              .filter((course) => course.title.toLowerCase().includes(query))
              .slice(0, 3)
          );
        })
        .catch(() => {
          if (!isCancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!isCancelled) setIsSearching(false);
        });
    }, 180);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const links = currentUser
    ? currentUser.role === 'student'
      ? [
          { to: '/courses', label: 'Courses' },
          { to: '/my-learning', label: 'My Learning' },
          { to: '/profile', label: 'Profile' }
        ]
      : currentUser.role === 'instructor'
        ? [
            { to: '/courses', label: 'Courses' },
            { to: '/instructor/courses', label: 'Instructor' }
          ]
        : [
            { to: '/admin', label: 'Admin' },
            { to: '/admin/health', label: 'Health' },
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

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearchOpen(false);
      event.currentTarget.blur();
    }
    if (event.key === 'Enter' && searchResults[0]) {
      navigate(`/courses/${searchResults[0].id}`);
      setSearchOpen(false);
    }
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
      <div
        className="search-wrapper"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
        }}
      >
        <label className="search" aria-label="Search courses">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search courses..."
            value={searchQuery}
            aria-expanded={searchOpen && Boolean(searchQuery.trim())}
            aria-controls="course-search-results"
            onFocus={() => setSearchOpen(Boolean(searchQuery.trim()))}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(Boolean(event.target.value.trim()));
            }}
            onKeyDown={handleSearchKeyDown}
          />
        </label>

        {searchOpen && searchQuery.trim() && (
          <div className="search-results" id="course-search-results" role="listbox">
            {isSearching ? (
              <p className="search-state">Searching...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map((course) => (
                <NavLink
                  className="search-result"
                  key={course.id}
                  role="option"
                  to={`/courses/${course.id}`}
                  onClick={() => {
                    setSearchQuery(course.title);
                    setSearchOpen(false);
                  }}
                >
                  <img
                    src={course.thumbnailUrl || logoUrl}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = logoUrl;
                    }}
                  />
                  <span>
                    <strong>{course.title}</strong>
                    <small>{course.category || 'EduCloud course'}</small>
                  </span>
                </NavLink>
              ))
            ) : (
              <p className="search-state">No courses found</p>
            )}
          </div>
        )}
      </div>
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
