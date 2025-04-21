import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";

// Initial state
const initialState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
  isAuthenticated: localStorage.getItem("token") ? true : false,
  isAdmin: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))?.role === "admin"
    : false,
};

// Log initial state for debugging
console.log("AuthContext - Initial State:", {
  user: initialState.user,
  token: initialState.token ? "exists" : "none",
  isAuthenticated: initialState.isAuthenticated,
  isAdmin: initialState.isAdmin,
  localStorage: {
    token: localStorage.getItem("token") ? "exists" : "none",
    user: localStorage.getItem("user") ? "exists" : "none",
  },
});

// Create context
const AuthContext = createContext(initialState);

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_REQUEST":
    case "REGISTER_REQUEST":
    case "USER_DETAILS_REQUEST":
      return {
        ...state,
        loading: true,
        error: null,
      };

    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS": {
      const isAdmin = action.payload.data?.role === "admin";
      console.log("Reducer - LOGIN_SUCCESS:", {
        user: action.payload.data,
        token: action.payload.token ? "exists" : "none",
        isAdmin,
      });

      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.data,
        token: action.payload.token,
        isAdmin,
        error: null,
      };
    }

    case "USER_DETAILS_SUCCESS":
      return {
        ...state,
        loading: false,
        user: action.payload,
      };

    case "LOGIN_FAIL":
    case "REGISTER_FAIL":
    case "USER_DETAILS_FAIL":
      console.log("Reducer - AUTH_FAIL:", action.payload);
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case "LOGOUT":
      console.log("Reducer - LOGOUT");
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token in axios headers
  useEffect(() => {
    console.log("AuthContext - Token/User Effect:", {
      token: state.token ? "exists" : "none",
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isAdmin: state.isAdmin,
    });

    if (state.token) {
      console.log("Setting token in localStorage and axios headers");
      axios.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
      localStorage.setItem("token", state.token);
      localStorage.setItem("user", JSON.stringify(state.user));

      // Verify localStorage was updated
      setTimeout(() => {
        console.log("Verifying localStorage was updated:", {
          token: localStorage.getItem("token"),
          user: localStorage.getItem("user"),
        });
      }, 100);
    } else {
      console.log("Removing token from localStorage and axios headers");
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, [state.token, state.user]);

  // Login user
  const login = async (email, password) => {
    try {
      dispatch({ type: "LOGIN_REQUEST" });

      // In a real app, this would call the API
      // For now, we'll simulate a user login
      const userData = {
        data: {
          name: email.split("@")[0],
          email: email,
          isAdmin: false,
          role: "user",
        },
        token: "user-token-" + Date.now(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: userData,
      });

      return userData;
    } catch (error) {
      dispatch({
        type: "LOGIN_FAIL",
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      });
      throw error;
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      dispatch({ type: "REGISTER_REQUEST" });

      // In a real app, this would call the API
      // For now, we'll simulate user registration
      const registeredUser = {
        data: {
          ...userData,
          isAdmin: false,
          role: "user",
        },
        token: "user-token-" + Date.now(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      dispatch({
        type: "REGISTER_SUCCESS",
        payload: registeredUser,
      });

      return registeredUser;
    } catch (error) {
      dispatch({
        type: "REGISTER_FAIL",
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      });
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // In a real app, this would call the API
      // For now, we'll just simulate a logout
      await new Promise((resolve) => setTimeout(resolve, 300));
      dispatch({ type: "LOGOUT" });
    } catch (error) {
      console.error("Logout error:", error);
      dispatch({ type: "LOGOUT" });
    }
  };

  // Get user details
  const getUserDetails = async () => {
    try {
      dispatch({ type: "USER_DETAILS_REQUEST" });

      // In a real app, this would call the API
      // For now, we'll simulate getting user details
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use the user data from state
      const data = { data: state.user };

      dispatch({
        type: "USER_DETAILS_SUCCESS",
        payload: data.data,
      });

      return data;
    } catch (error) {
      dispatch({
        type: "USER_DETAILS_FAIL",
        payload:
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message,
      });
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Admin login
  const adminLogin = async (email, password) => {
    try {
      console.log("Admin login attempt:", { email });
      dispatch({ type: "LOGIN_REQUEST" });

      // Check for specific admin credentials
      if (email !== "avinashmadhukar4@gmail.com" || password !== "123456") {
        console.error("Invalid admin credentials");
        throw new Error("Invalid admin credentials");
      }

      // Use a fixed token for admin to ensure consistency
      const userData = {
        data: {
          _id: "admin-id-fixed", // Add a fixed ID
          name: "Admin User",
          email: email,
          isAdmin: true,
          role: "admin",
        },
        token: "admin-token-fixed-value",
      };

      console.log("Admin login - using fixed token:", userData.token);

      // Clear any existing tokens first to ensure clean state
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Set tokens directly for immediate effect
      localStorage.setItem("token", userData.token);
      localStorage.setItem("user", JSON.stringify(userData.data));

      // Set axios default headers
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${userData.token}`;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Dispatch after localStorage is set
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: userData,
      });

      console.log("Admin login successful - state after dispatch:", {
        token: userData.token,
        user: userData.data,
        localStorage: {
          token: localStorage.getItem("token"),
          user: localStorage.getItem("user"),
        },
      });

      return userData;
    } catch (error) {
      console.error("Admin login error:", error);
      dispatch({
        type: "LOGIN_FAIL",
        payload: error.message || "Invalid admin credentials",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        adminLogin,
        getUserDetails,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
