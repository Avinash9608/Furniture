import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
// Import the robust authAPI implementation
import authAPI from "../utils/authAPI";

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    let isMounted = true;

    try {
      setLoading(true);

      // Check if we have a token in localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Check for admin token pattern
      if (token.startsWith("admin-token-")) {
        // For admin tokens, just use the stored user data
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role === "admin") {
              if (isMounted) {
                setUser(parsedUser);
                setLoading(false);
              }
              return;
            }
          } catch (e) {
            console.error("Error parsing stored admin user:", e);
          }
        }
      }

      // Set auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Get user profile
      const response = await authAPI.getProfile();

      // Set user if component is still mounted
      if (isMounted) {
        setUser(response.data.data);
      }
    } catch (err) {
      console.error("Auth check error:", err);
      // Clear localStorage on auth error
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (isMounted) {
        setUser(null);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    // Return cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check if we have a token and user in localStorage
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          // Parse the user from localStorage
          const parsedUser = JSON.parse(userStr);

          // Set the user in state
          setUser(parsedUser);

          // If this is an admin user, we're done
          if (parsedUser.role === "admin") {
            console.log("Using stored admin credentials");
            setLoading(false);
            return;
          }

          // For regular users, verify with the server
          await checkAuth();
        } catch (err) {
          console.error("Error processing authentication:", err);
          // Clear localStorage on error
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setLoading(false);
      }
    };

    // Check authentication on mount
    checkAuthentication();

    // No cleanup needed - we're not using any refs or timeouts
  }, []);

  // Register user with robust error handling
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Starting user registration process for:", userData.email);

      // Try multiple times with increasing timeouts
      let response = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!response && attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`Registration attempt ${attempts}/${maxAttempts}`);
          response = await authAPI.register(userData);
          console.log("Registration successful:", response.data);
          break;
        } catch (attemptError) {
          console.warn(
            `Registration attempt ${attempts} failed:`,
            attemptError.message
          );

          if (attempts >= maxAttempts) {
            throw attemptError; // Re-throw the last error if we've exhausted all attempts
          }

          // Wait before trying again (exponential backoff)
          const waitTime = Math.min(1000 * Math.pow(2, attempts), 8000);
          console.log(`Waiting ${waitTime}ms before next attempt...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      if (!response) {
        throw new Error("Registration failed after multiple attempts");
      }

      // Save token and user to localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Set auth header
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.token}`;

      // Set user
      setUser(response.data.user);

      return response.data;
    } catch (err) {
      console.error("Registration error:", err);

      // Provide a more helpful error message
      let errorMessage = "Registration failed";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message && err.message.includes("timeout")) {
        errorMessage = "Registration timed out. Please try again later.";
      } else if (err.message && err.message.includes("Network Error")) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user with robust error handling
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Starting user login process for:", email);

      // Try multiple times with increasing timeouts
      let response = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!response && attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`Login attempt ${attempts}/${maxAttempts}`);
          response = await authAPI.login({ email, password });
          console.log("Login successful:", response.data);
          break;
        } catch (attemptError) {
          console.warn(
            `Login attempt ${attempts} failed:`,
            attemptError.message
          );

          // If it's an invalid credentials error, don't retry
          if (
            attemptError.response?.status === 401 ||
            (attemptError.response?.data?.message &&
              attemptError.response.data.message.includes(
                "Invalid credentials"
              ))
          ) {
            console.log("Invalid credentials, not retrying");
            throw attemptError;
          }

          if (attempts >= maxAttempts) {
            throw attemptError; // Re-throw the last error if we've exhausted all attempts
          }

          // Wait before trying again (exponential backoff)
          const waitTime = Math.min(1000 * Math.pow(2, attempts), 8000);
          console.log(`Waiting ${waitTime}ms before next attempt...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      if (!response) {
        throw new Error("Login failed after multiple attempts");
      }

      // Save token and user to localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Set auth header
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.token}`;

      // Set user
      setUser(response.data.user);

      return response.data;
    } catch (err) {
      console.error("Login error:", err);

      // Provide a more helpful error message
      let errorMessage = "Login failed";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message && err.message.includes("timeout")) {
        errorMessage = "Login timed out. Please try again later.";
      } else if (err.message && err.message.includes("Network Error")) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin login
  const adminLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Determine if we're in development or production
      const baseUrl = window.location.origin;
      const isDevelopment = !baseUrl.includes("onrender.com");
      const localServerUrl = "http://localhost:5000";

      // Try the direct admin login endpoint first (more reliable)
      const directApiUrl = isDevelopment
        ? `${localServerUrl}/api/auth/admin/direct-login`
        : "/api/auth/admin/login";

      console.log("Attempting admin login with:", directApiUrl);

      const response = await axios.post(
        directApiUrl,
        {
          email,
          password,
        },
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      // Store tokens properly
      const { token, user } = response.data;
      
      // Store the admin token specifically
      localStorage.setItem("adminToken", token);
      localStorage.setItem("token", token); // Also store as regular token for compatibility
      localStorage.setItem("user", JSON.stringify({ ...user, role: "admin" }));

      // Set auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Set user with admin role
      setUser({ ...user, role: "admin" });

      console.log("Admin login successful");
      return response.data;
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.response?.data?.message || "Admin login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setLoading(true);

      // Call logout endpoint
      await authAPI.logout();

      // Clear all tokens
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");

      // Clear auth header
      delete axios.defaults.headers.common["Authorization"];

      // Clear user
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear localStorage and user on error
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Get user details
  const getUserDetails = async () => {
    try {
      setLoading(true);

      const response = await authAPI.getProfile();

      // Update user
      setUser(response.data.data);

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(response.data.data));

      return response.data.data;
    } catch (err) {
      console.error("Get user details error:", err);
      setError(err.response?.data?.message || "Failed to get user details");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Computed values
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    register,
    login,
    adminLogin,
    logout,
    getUserDetails,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
