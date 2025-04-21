import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../../components/Button";
import Alert from "../../components/Alert";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from query parameter or default to admin dashboard
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get("redirect") || "/admin/dashboard";

  // Check localStorage directly for admin credentials
  useEffect(() => {
    const user = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null;
    const isLocalAdmin = user?.role === "admin";

    // If we have admin credentials in localStorage, redirect immediately
    if (isLocalAdmin) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath]);

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

      // Only allow specific admin credentials
      if (email !== "avinashmadhukar4@gmail.com" || password !== "123456") {
        throw new Error("Invalid admin credentials");
      }

      // Create admin user object
      const adminUser = {
        _id: "admin-id",
        name: "Admin User",
        email: email,
        role: "admin",
      };

      // Set directly in localStorage
      localStorage.setItem("token", "admin-token");
      localStorage.setItem("user", JSON.stringify(adminUser));

      // Redirect to dashboard
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-3xl font-serif font-bold text-primary">
            Shyam Furnitures
          </h2>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your admin credentials to access the dashboard
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
                className="block text-sm font-medium text-gray-700"
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
            <div className="rounded-md bg-blue-50 p-4">
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
                  <p className="text-sm text-blue-700">
                    <strong>Admin Login:</strong> avinashmadhukar4@gmail.com /
                    123456
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
