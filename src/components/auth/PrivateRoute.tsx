import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // TODO: Implement actual authentication check
  const isAuthenticated = true; // This should be replaced with actual auth check

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
