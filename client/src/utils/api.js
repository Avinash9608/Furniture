import axios from "axios";
import { validateCategories } from "./safeDataHandler";

// Determine the API base URL based on environment
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const origin = window.location.origin;

  // Check if we're on Render's domain
  if (hostname.includes("render.com") || hostname === "furniture-q3nb.onrender.com") {
    console.log("Using Render production API URL");
    return `${origin}/api`;
  }

  // In development, use localhost:5000
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    console.log("Using development API URL");
    return "http://localhost:5000/api";
  }

  // In other production environments, use relative path
  console.log("Using relative API URL");
  return "/api";
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000, // Increased timeout to 60 seconds for production
  withCredentials: false, // Must be false to work with wildcard CORS
  headers: {
    'Accept': 'application/json',
  }
});

// Add request interceptor to handle auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token here if you have a refresh token mechanism
        const token = localStorage.getItem('adminToken');
        if (token) {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Products API
const productsAPI = {
  create: async (formData) => {
    try {
      const response = await api.post('/admin/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },
  
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },

  update: async (id, formData) => {
    try {
      const response = await api.put(`/admin/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }
};

// Categories API
const categoriesAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/admin/categories', data);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/admin/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }
};

// Export the API instances and utilities
export {
  api,
  productsAPI,
  categoriesAPI,
  getBaseURL
};

export default api;
