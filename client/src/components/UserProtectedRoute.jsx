import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const UserProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Check authentication status once when component mounts or auth state changes
  useEffect(() => {
    // Only check when loading is complete
    if (!loading) {
      // If not authenticated, set redirect flag
      if (!user) {
        setShouldRedirect(true);
      } else {
        setShouldRedirect(false);
      }
    }
  }, [user, loading]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-light"></div>
      </div>
    );
  }

  // If redirect flag is set, redirect to login
  if (shouldRedirect) {
    // Store the current path for redirect after login
    const redirectPath = location.pathname;
    return <Navigate to="/login" state={{ from: redirectPath }} replace />;
  }

  // User is authenticated, render children
  return children;
};

export default UserProtectedRoute;
