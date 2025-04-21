import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Loading';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" />
      </div>
    );
  }
  
  // Check if user is authenticated and is an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    // Redirect to login page with the return url
    return <Navigate to={`/admin/login?redirect=${location.pathname}`} replace />;
  }
  
  // If authenticated and admin, render the protected component
  return children;
};

export default ProtectedRoute;
