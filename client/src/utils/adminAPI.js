/**
 * Admin API utilities for authenticated admin operations
 * 
 * This module provides API functions that always include authentication headers
 * for operations that require admin privileges.
 */

import axios from "axios";

// Create an axios instance specifically for authenticated admin requests
const adminAPI = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to always include the auth token
adminAPI.interceptors.request.use(
  (config) => {
    // Get the token from localStorage (prioritize adminToken)
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("Added auth token to admin request:", config.url);
    } else {
      console.warn("No auth token found for admin request:", config.url);
    }
    
    // For FormData, don't set Content-Type (browser will set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      console.log("FormData detected, removed Content-Type header");
    }
    
    return config;
  },
  (error) => {
    console.error("Admin request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Admin API Error:", error.message);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        console.error("401 Unauthorized - Token may be invalid or expired");
        
        // Check if we're on an admin page
        const isAdminPage = window.location.pathname.startsWith("/admin");
        
        if (isAdminPage) {
          // Redirect to admin login
          alert("Your session has expired. Please log in again.");
          window.location.href = "/admin/login";
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get the base URL
const getBaseURL = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Get the current hostname and origin
  const hostname = window.location.hostname;
  const origin = window.location.origin;

  // Check if we're on Render's domain
  if (hostname.includes("render.com") || hostname === "furniture-q3nb.onrender.com") {
    return `${origin}/api`;
  }

  // In production but not on Render, use the current origin
  if (import.meta.env.PROD) {
    return `${origin}/api`;
  }

  // In development, use localhost:5000
  return "http://localhost:5000/api";
};

// Categories API with authentication
export const adminCategoriesAPI = {
  getAll: () => adminAPI.get(`${getBaseURL()}/categories`),
  getById: (id) => adminAPI.get(`${getBaseURL()}/categories/${id}`),
  create: (categoryData) => {
    console.log("Creating category with admin token");
    
    // Handle FormData vs JSON
    if (categoryData instanceof FormData) {
      return adminAPI.post(`${getBaseURL()}/categories`, categoryData);
    } else {
      return adminAPI.post(`${getBaseURL()}/categories`, categoryData);
    }
  },
  update: (id, categoryData) => {
    // Handle FormData vs JSON
    if (categoryData instanceof FormData) {
      return adminAPI.put(`${getBaseURL()}/categories/${id}`, categoryData);
    } else {
      return adminAPI.put(`${getBaseURL()}/categories/${id}`, categoryData);
    }
  },
  delete: (id) => adminAPI.delete(`${getBaseURL()}/categories/${id}`),
};

// Products API with authentication
export const adminProductsAPI = {
  getAll: (params) => adminAPI.get(`${getBaseURL()}/products`, { params }),
  getById: (id) => adminAPI.get(`${getBaseURL()}/products/${id}`),
  create: (productData) => {
    console.log("Creating product with admin token");
    
    // Handle FormData vs JSON
    if (productData instanceof FormData) {
      return adminAPI.post(`${getBaseURL()}/products`, productData);
    } else {
      return adminAPI.post(`${getBaseURL()}/products`, productData);
    }
  },
  update: (id, productData) => {
    // Handle FormData vs JSON
    if (productData instanceof FormData) {
      return adminAPI.put(`${getBaseURL()}/products/${id}`, productData);
    } else {
      return adminAPI.put(`${getBaseURL()}/products/${id}`, productData);
    }
  },
  delete: (id) => adminAPI.delete(`${getBaseURL()}/products/${id}`),
};

export default adminAPI;
