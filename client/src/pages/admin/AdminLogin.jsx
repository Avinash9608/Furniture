import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../../components/Button";
import Alert from "../../components/Alert";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const location = useLocation();

  // Get redirect path from query parameter or default to admin dashboard
  const from = location.state?.from?.pathname || "/admin/dashboard";
  const redirectPath = from;

  // Check if user is already logged in as admin - only run once on mount
  useEffect(() => {
    // Use a flag to track if we've already checked
    let isChecking = true;

    const checkAdminStatus = () => {
      // Skip if we're no longer mounted
      if (!isChecking) return;

      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
          return; // No credentials, don't redirect
        }

        const user = JSON.parse(userStr);

        // Only redirect if user is an admin
        if (user?.role === "admin") {
          console.log(
            "Already logged in as admin, redirecting to",
            redirectPath
          );

          // Use window.location instead of navigate to break the React Router cycle
          window.location.href = redirectPath;
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
        // Clear potentially corrupted data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    };

    // Check admin status once on mount
    checkAdminStatus();

    // Cleanup function
    return () => {
      isChecking = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   // Validate form
  //   if (!email || !password) {
  //     setError("Please fill in all fields");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     setError(null);

  //     // Only allow specific admin credentials
  //     if (email !== "avinashmadhukar4@gmail.com" || password !== "123456") {
  //       throw new Error("Invalid admin credentials");
  //     }

  //     // Create admin user object with the same ID as in AuthContext
  //     const adminUser = {
  //       _id: "admin-id-fixed",
  //       name: "Admin User",
  //       email: email,
  //       role: "admin",
  //     };

  //     // Set directly in localStorage with the same token as in AuthContext
  //     localStorage.setItem("token", "admin-token-fixed-value");
  //     localStorage.setItem("user", JSON.stringify(adminUser));

  //     // Redirect to dashboard
  //     navigate(redirectPath, { replace: true });
  //   } catch (err) {
  //     console.error("Admin login error:", err);
  //     setError(err.message || "Invalid admin credentials");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Determine the API URL based on environment
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5000/api/auth/admin/login" // Development
        : "/api/auth/admin/login"; // Production

      console.log("Attempting admin login with API:", apiUrl);

      // Send credentials to server for validation against .env values
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
        credentials: "include", // Include cookies in the request
      });

      // Handle non-JSON responses
      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing response:", responseText);
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      console.log("Admin login successful");

      // Clear any existing data first
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Store token and user data from server response
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Admin credentials saved, redirecting to", redirectPath);

      // Use window.location instead of navigate to break the React Router cycle
      window.location.href = redirectPath;
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen theme-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-3xl font-serif font-bold text-primary">
            Shyam Furnitures
          </h2>
          <h2 className="mt-6 text-center text-2xl font-bold theme-text-primary">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm theme-text-secondary">
            Enter your admin credentials to access the dashboard
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="theme-bg-primary py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
              className="mb-4"
            />
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium theme-text-primary"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border theme-border rounded-md shadow-sm placeholder-gray-400 theme-bg-primary theme-text-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium theme-text-primary"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border theme-border rounded-md shadow-sm placeholder-gray-400 theme-bg-primary theme-text-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Signing in..." : "Sign in as Admin"}
              </Button>
            </div>
          </form>

          {/* Admin credentials hint */}
          <div className="mt-4">
            <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Admin Login:</strong> Use admin credentials from
                    .env file
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <div>
              <Link
                to="/"
                className="font-medium text-primary hover:text-primary-dark"
              >
                Return to Website
              </Link>
            </div>
            <div>
              <Link
                to="/admin/dashboard"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Go to Admin Dashboard
              </Link>
              <span className="text-xs text-gray-500 ml-2">
                (if already logged in)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
