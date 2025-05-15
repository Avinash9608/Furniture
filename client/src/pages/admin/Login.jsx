import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";
import Alert from "../../components/Alert";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const { adminLogin, isAuthenticated, isAdmin, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Check if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setFormErrors({});

    // Basic validation
    if (!formData.email || !formData.password) {
      setFormErrors({
        submit: "Please fill in all fields"
      });
      return;
    }

    try {
      // Attempt login
      await adminLogin(formData.email, formData.password);
      
      // If successful, navigate to dashboard
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setFormErrors({
        submit: err.message || 'Login failed. Please try again.'
      });
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    setFormErrors({});
    clearError();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mt-6 text-center text-3xl font-serif font-bold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access the admin dashboard
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
        >
          {(error || formErrors.submit) && (
            <Alert
              type="error"
              message={error || formErrors.submit}
              onClose={() => {
                clearError();
                setFormErrors({});
              }}
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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                disabled={isAuthenticated}
                className="w-full"
              >
                Sign in
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
