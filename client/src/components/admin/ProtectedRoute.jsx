import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

// Simple protected route that checks localStorage and handles admin authentication
const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  // Check if we're on an admin page
  const isAdminPage = location.pathname.startsWith("/admin");

  // For non-admin pages, always render children
  if (!isAdminPage) {
    return children;
  }

  // For admin pages, check localStorage directly
  const token = localStorage.getItem("token");
  const localUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  // Log authentication state for debugging
  console.log("ProtectedRoute - Auth Check:", {
    token,
    localUser,
    isAdminToken: token === "admin-token-fixed-value",
  });

  // Set up a side effect to log authentication state
  useEffect(() => {
    if (isAdminPage) {
      console.log("ProtectedRoute - Admin page check:", {
        path: location.pathname,
        localUser: localUser ? "exists" : "none",
        isAdmin: localUser?.role === "admin",
      });
    }
  }, [isAdminPage, location.pathname, localUser]);

  // If we have an admin user in localStorage and the correct token, render the protected component
  if (
    localUser &&
    localUser.role === "admin" &&
    token === "admin-token-fixed-value"
  ) {
    return children;
  }

  // Otherwise, redirect to admin login
  return <Navigate to={`/admin/login?redirect=${location.pathname}`} replace />;
};

export default ProtectedRoute;
