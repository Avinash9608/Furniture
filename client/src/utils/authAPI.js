/**
 * Robust Auth API
 * 
 * This module provides reliable authentication functionality with multiple fallback mechanisms
 * to ensure it works even when MongoDB has connection issues.
 */

import axios from "axios";

// Create a robust auth API with multiple fallback mechanisms
const authAPI = {
  /**
   * Register a new user with robust fallback
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration response
   */
  register: async (userData) => {
    console.log("Registering user:", userData.email);
    
    // Create a direct axios instance with increased timeout
    const directApi = axios.create({
      timeout: 60000, // 60 seconds timeout
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    
    // Determine if we're in development or production
    const baseUrl = window.location.origin;
    const deployedUrl = "https://furniture-q3nb.onrender.com";
    const localServerUrl = "http://localhost:5000";
    const isDevelopment = !baseUrl.includes("onrender.com");
    
    // Create a list of endpoints to try - prioritize reliable endpoints
    const endpoints = [
      // Reliable endpoints first (these always work)
      ...(isDevelopment
        ? [`${localServerUrl}/api/auth/reliable/register`]
        : [`${baseUrl}/api/auth/reliable/register`]),
      `${deployedUrl}/api/auth/reliable/register`,
      
      // Direct endpoints next (also reliable)
      ...(isDevelopment
        ? [`${localServerUrl}/api/auth/direct/register`]
        : [`${baseUrl}/api/auth/direct/register`]),
      `${deployedUrl}/api/auth/direct/register`,
      
      // Then try standard API endpoints
      ...(isDevelopment
        ? [`${localServerUrl}/api/auth/register`]
        : [`${baseUrl}/api/auth/register`]),
      `${deployedUrl}/api/auth/register`,
    ];
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying to register user at: ${endpoint}`);
        const response = await directApi.post(endpoint, userData);
        console.log("Registration successful:", response.data);
        return response;
      } catch (error) {
        console.warn(`Error registering at ${endpoint}:`, error.message);
        // Continue to the next endpoint
      }
    }
    
    // If all endpoints fail, throw an error
    throw new Error("Registration failed after trying all endpoints");
  },
  
  /**
   * Login a user with robust fallback
   * @param {Object} credentials - User login credentials
   * @returns {Promise<Object>} - Login response
   */
  login: async (credentials) => {
    console.log("Logging in user:", credentials.email);
    
    // Create a direct axios instance with increased timeout
    const directApi = axios.create({
      timeout: 60000, // 60 seconds timeout
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    
    // Determine if we're in development or production
    const baseUrl = window.location.origin;
    const deployedUrl = "https://furniture-q3nb.onrender.com";
    const localServerUrl = "http://localhost:5000";
    const isDevelopment = !baseUrl.includes("onrender.com");
    
    // Create a list of endpoints to try - prioritize reliable endpoints
    const endpoints = [
      // Reliable endpoints first (these always work)
      ...(isDevelopment
        ? [`${localServerUrl}/api/auth/reliable/login`]
        : [`${baseUrl}/api/auth/reliable/login`]),
      `${deployedUrl}/api/auth/reliable/login`,
      
      // Direct endpoints next (also reliable)
      ...(isDevelopment
        ? [`${localServerUrl}/api/auth/direct/login`]
        : [`${baseUrl}/api/auth/direct/login`]),
      `${deployedUrl}/api/auth/direct/login`,
      
      // Then try standard API endpoints
      ...(isDevelopment
        ? [`${localServerUrl}/api/auth/login`]
        : [`${baseUrl}/api/auth/login`]),
      `${deployedUrl}/api/auth/login`,
    ];
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying to login user at: ${endpoint}`);
        const response = await directApi.post(endpoint, credentials);
        console.log("Login successful:", response.data);
        return response;
      } catch (error) {
        console.warn(`Error logging in at ${endpoint}:`, error.message);
        // Continue to the next endpoint
      }
    }
    
    // If all endpoints fail, throw an error
    throw new Error("Login failed after trying all endpoints");
  },
  
  /**
   * Get user profile with robust fallback
   * @returns {Promise<Object>} - User profile response
   */
  getProfile: async () => {
    console.log("Getting user profile");
    
    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }
    
    // Create a direct axios instance with increased timeout
    const directApi = axios.create({
      timeout: 30000, // 30 seconds timeout
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Determine if we're in development or production
    const baseUrl = window.location.origin;
    const deployedUrl = "https://furniture-q3nb.onrender.com";
    const localServerUrl = "http://localhost:5000";
    const isDevelopment = !baseUrl.includes("onrender.com");
    
    // Create a list of endpoints to try
    const endpoints = [
      ...(isDevelopment
        ? [`${localServerUrl}/api/auth/me`]
        : [`${baseUrl}/api/auth/me`]),
      `${deployedUrl}/api/auth/me`,
    ];
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying to get user profile from: ${endpoint}`);
        const response = await directApi.get(endpoint);
        console.log("Profile fetch successful:", response.data);
        return response;
      } catch (error) {
        console.warn(`Error getting profile from ${endpoint}:`, error.message);
        // Continue to the next endpoint
      }
    }
    
    // If all endpoints fail, throw an error
    throw new Error("Failed to get user profile after trying all endpoints");
  },
  
  /**
   * Logout user
   * @returns {Promise<Object>} - Logout response
   */
  logout: async () => {
    console.log("Logging out user");
    
    // Get token from localStorage
    const token = localStorage.getItem("token");
    
    // Create a direct axios instance
    const directApi = axios.create({
      timeout: 10000, // 10 seconds timeout
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    
    // Determine if we're in development or production
    const baseUrl = window.location.origin;
    const deployedUrl = "https://furniture-q3nb.onrender.com";
    const localServerUrl = "http://localhost:5000";
    const isDevelopment = !baseUrl.includes("onrender.com");
    
    // Create a list of endpoints to try
    const endpoints = [
      ...(isDevelopment
        ? [`${localServerUrl}/api/auth/logout`]
        : [`${baseUrl}/api/auth/logout`]),
      `${deployedUrl}/api/auth/logout`,
    ];
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying to logout user at: ${endpoint}`);
        const response = await directApi.get(endpoint);
        console.log("Logout successful:", response.data);
        return response;
      } catch (error) {
        console.warn(`Error logging out at ${endpoint}:`, error.message);
        // Continue to the next endpoint
      }
    }
    
    // For logout, we don't throw an error if all endpoints fail
    // Just return a success response to ensure the user is logged out client-side
    return {
      data: {
        success: true,
        message: "Logged out successfully (client-side only)",
      },
    };
  },
};

export default authAPI;
