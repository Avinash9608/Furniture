import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Alert from "../components/Alert";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, adminLogin, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || "/";

  // Redirect if already authenticated
  useEffect(() => {
    console.log("Login page - auth check:", { isAuthenticated, isAdmin, from });

    if (isAuthenticated) {
      if (isAdmin) {
        console.log(
          "Already authenticated as admin, redirecting to admin dashboard"
        );
        navigate("/admin/dashboard", { replace: true });
      } else {
        console.log("Already authenticated as user, redirecting to:", from);
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, navigate, from]);

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

      // Check if this is an admin login attempt
      if (email === "avinashmadhukar4@gmail.com") {
        console.log(
          "Admin login attempt detected, redirecting to admin login page"
        );
        // Redirect to the dedicated admin login page
        navigate("/admin/login", { replace: true });
        return;
      } else {
        // Call regular login function from AuthContext
        console.log("Regular user login attempt");
        await login(email, password);
      }

      // Redirect will happen automatically due to the useEffect above
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <h2 className="text-center text-3xl font-serif font-bold text-primary">
            Shyam Furnitures
          </h2>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold theme-text-primary">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm theme-text-secondary">
          Or{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary-dark"
          >
            create a new account
          </Link>
        </p>
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm theme-text-primary"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary hover:text-primary-dark"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t theme-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 theme-bg-primary theme-text-secondary">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Admin Login Link */}
            <div className="mt-4 text-center">
              <Link
                to="/admin/login"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Admin Login
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <button className="w-full inline-flex justify-center py-2 px-4 border theme-border rounded-md shadow-sm theme-bg-primary text-sm font-medium theme-text-secondary hover:bg-gray-50">
                  <span className="sr-only">Sign in with Google</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                </button>
              </div>

              <div>
                <button className="w-full inline-flex justify-center py-2 px-4 border theme-border rounded-md shadow-sm theme-bg-primary text-sm font-medium theme-text-secondary hover:bg-gray-50">
                  <span className="sr-only">Sign in with Facebook</span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
