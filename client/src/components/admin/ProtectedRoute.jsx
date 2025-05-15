import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

// Protected route component for admin routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // If we're authenticated and at the intended path, clear it
    if (isAuthenticated && isAdmin) {
      const storedPath = localStorage.getItem('adminIntendedPath');
      if (storedPath && storedPath === location.pathname) {
        localStorage.removeItem('adminIntendedPath');
      }
    }
  }, [isAuthenticated, isAdmin, location.pathname]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-light"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    // Store the current location for redirect after login
    localStorage.setItem('adminIntendedPath', location.pathname);
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  // User is authenticated and is an admin, render children
  return children;
};

export default ProtectedRoute;
