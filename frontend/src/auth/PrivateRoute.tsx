import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { jwtDecode } from 'jwt-decode';

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    if (!exp) return false;
    if (Date.now() >= exp * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

type PrivateRouteProps = {
  children: ReactNode;
  role?: string;
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, role }) => {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!user || !isTokenValid(token)) return <Navigate to="/login" />;
  if (role && !role.includes(user.role)) return <Navigate to={`/dashboard/${user.role}`} />;
  return <>{children}</>;
};

export default PrivateRoute; 