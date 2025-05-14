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
    // Try to get admin token first, then fall back to regular token
    const adminToken = localStorage.getItem('adminToken');
    const regularToken = localStorage.getItem('token');
    const token = adminToken || regularToken;

    if (token) {
      console.log('Adding auth token to request');
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No auth token found in localStorage');
    }

    // For admin endpoints, ensure we're using admin token
    if (config.url.includes('/admin/') && !adminToken) {
      console.error('Attempting to access admin endpoint without admin token');
      throw new Error('Admin authentication required. Please log in as an administrator.');
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error Response:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('Authentication error - clearing tokens and redirecting to login');
      // Clear all tokens
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/admin/login';
    }
    
    return Promise.reject(error);
  }
);

// Products API
const productsAPI = {
  create: async (formData) => {
    try {
      // Log the request details
      console.log('Creating product with FormData');
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], typeof pair[1], pair[1]);
      }

      // Ensure we're using the correct content type for FormData
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      };

      const response = await api.post('/admin/products', formData, config);
      console.log('Product creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error.response?.data || error.message);
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

// Payment Settings API
const paymentSettingsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/payment-settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      throw error;
    }
  },

  getByMethod: async (method) => {
    try {
      const response = await api.get(`/payment-settings/${method}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment settings for ${method}:`, error);
      throw error;
    }
  },

  update: async (method, data) => {
    try {
      const response = await api.put(`/admin/payment-settings/${method}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating payment settings for ${method}:`, error);
      throw error;
    }
  }
};

// Orders API
const ordersAPI = {
  create: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/orders/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id} status:`, error);
      throw error;
    }
  }
};

// Payment Requests API
const paymentRequestsAPI = {
  create: async (requestData) => {
    try {
      const response = await api.post('/payment-requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await api.get('/payment-requests', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/payment-requests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment request ${id}:`, error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/payment-requests/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating payment request ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/payment-requests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting payment request ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/payment-requests/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating payment request ${id} status:`, error);
      throw error;
    }
  }
};

// Contact API
const contactAPI = {
  create: async (messageData) => {
    try {
      const response = await api.post('/contact', messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending contact message:', error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/contact', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/admin/contact/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contact message ${id}:`, error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/admin/contact/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating contact message ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/contact/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting contact message ${id}:`, error);
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/admin/contact/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking contact message ${id} as read:`, error);
      throw error;
    }
  }
};

// Export the API instances and utilities
export {
  api,
  productsAPI,
  categoriesAPI,
  paymentSettingsAPI,
  ordersAPI,
  paymentRequestsAPI,
  contactAPI,
  getBaseURL
};

export default api;
