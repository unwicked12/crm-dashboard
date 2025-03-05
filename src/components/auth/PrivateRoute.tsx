import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
