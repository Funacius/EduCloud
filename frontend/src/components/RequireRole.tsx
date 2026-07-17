import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getRoleHome, useAuth } from '../auth/AuthContext';
import type { UserRole } from '../types/user';

function RequireRole({
  allow,
  children
}: {
  allow: UserRole[];
  children: ReactNode;
}) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allow.includes(currentUser.role)) {
    return <Navigate to={getRoleHome(currentUser.role)} replace />;
  }

  return children;
}

export default RequireRole;
