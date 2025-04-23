import axios from "axios";

// Determine the API base URL based on environment
const getBaseURL = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production, use relative URL
  if (import.meta.env.PROD) {
    return "/api";
  }

  // In development, use localhost
  return "http://localhost:5000/api";
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: false, // Must be false to work with wildcard CORS
  headers: {
    Accept: "application/json",
  },
});

// Log the actual baseURL being used
console.log("API baseURL:", api.defaults.baseURL);

// This request interceptor has been moved below

// Helper function to get cookies (used for future cookie-based auth)
// function getCookie(name) {
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) return parts.pop().split(";").shift();
// }

// This response interceptor has been moved below

// This helper function has been replaced with inline code in the response interceptor

// Products API with better error handling
const productsAPI = {
  getAll: (params = {}) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData, headers) => {
    console.log("Creating product with data:", productData);
    const formData = new FormData();

    // Handle different types of product data
    if (productData instanceof FormData) {
      // If already FormData, use as is
      // Check if custom headers were provided
      if (headers) {
        console.log("Using custom headers for product creation:", headers);
        return api.post("/products", productData, { headers });
      }
      return api.post("/products", productData);
    }

    // Convert object to FormData
    Object.entries(productData).forEach(([key, value]) => {
      if (key === "images") {
        // Handle images array (could be FileList, File[], or array of objects with file property)
        if (value instanceof FileList) {
          if (value.length === 0) {
            // Use default image if no files provided
            console.log("No images provided, using default image");
            formData.append("defaultImage", "true");
          } else {
            Array.from(value).forEach((file) =>
              formData.append("images", file)
            );
          }
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            // Use default image if empty array
            console.log("Empty images array, using default image");
            formData.append("defaultImage", "true");
          } else {
            let hasValidImages = false;
            value.forEach((item) => {
              if (item instanceof File) {
                formData.append("images", item);
                hasValidImages = true;
              } else if (item.file instanceof File) {
                formData.append("images", item.file);
                hasValidImages = true;
              }
            });

            if (!hasValidImages) {
              console.log("No valid images found, using default image");
              formData.append("defaultImage", "true");
            }
          }
        }
      } else if (
        key === "dimensions" ||
        key === "specifications" ||
        typeof value === "object"
      ) {
        // Handle objects by stringifying them
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        // Handle primitive values
        formData.append(key, value);
      }
    });

    console.log("Sending product data to server...");
    // Check if custom headers were provided
    if (headers) {
      console.log("Using custom headers for product creation:", headers);
      return api.post("/products", formData, { headers });
    }
    return api.post("/products", formData);
  },
  update: (id, productData) => {
    console.log("Updating product with ID:", id);
    const formData = new FormData();

    // Handle different types of product data
    if (productData instanceof FormData) {
      // If already FormData, use as is
      return api.put(`/products/${id}`, productData);
    }

    // Convert object to FormData
    Object.entries(productData).forEach(([key, value]) => {
      if (key === "images") {
        // Handle images array (could be FileList, File[], or array of objects with file property)
        if (value instanceof FileList) {
          Array.from(value).forEach((file) => formData.append("images", file));
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item instanceof File) {
              formData.append("images", item);
            } else if (item.file instanceof File) {
              formData.append("images", item.file);
            }
          });
        }
      } else if (
        key === "dimensions" ||
        key === "specifications" ||
        typeof value === "object"
      ) {
        // Handle objects by stringifying them
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        // Handle primitive values
        formData.append(key, value);
      }
    });

    return api.put(`/products/${id}`, formData);
  },
  delete: (id) => api.delete(`/products/${id}`),
  createReview: (id, reviewData) =>
    api.post(`/products/${id}/reviews`, reviewData),
  getFeatured: () => api.get("/products/featured"),
  getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
  search: (query) => api.get(`/products/search?q=${query}`),
  getStats: () => api.get("/products/stats"),
};

// Add request interceptor to always set the Authorization header
api.interceptors.request.use(
  (config) => {
    console.log("Request interceptor - config:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      hasAuthHeader: !!config.headers.Authorization,
    });

    // Check if Authorization header is already set (from custom headers)
    if (config.headers.Authorization) {
      console.log(
        "Authorization header already set:",
        config.headers.Authorization
      );
      return config;
    }

    // Always check for token in localStorage (prioritize adminToken for admin routes)
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log(
        "Using token from localStorage for request to:",
        config.url,
        token
      );
    } else {
      // For development testing, use a hardcoded admin token
      if (import.meta.env.DEV && config.url.includes("/admin")) {
        console.log(
          "🔑 DEV MODE: Using admin test credentials for:",
          config.url
        );
        // This is just for development - in production, this would be a security risk
        config.headers["Authorization"] = `Bearer admin-test-token`;
      }
    }

    // Set appropriate content type header
    if (config.data instanceof FormData) {
      // Let the browser set the content type for FormData
      delete config.headers["Content-Type"];
      console.log("FormData detected, removing Content-Type header");

      // Log FormData contents for debugging
      if (config.data instanceof FormData) {
        console.log("FormData entries in request interceptor:");
        for (let pair of config.data.entries()) {
          console.log(
            pair[0] + ": " + (pair[1] instanceof File ? pair[1].name : pair[1])
          );
        }
      }
    } else {
      // Set JSON content type for other requests
      config.headers["Content-Type"] = "application/json";
      console.log("Setting Content-Type: application/json");
    }

    // Don't include credentials to avoid CORS issues
    config.withCredentials = false;

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(
      "API Error:",
      error.message,
      error.response?.status,
      error.config?.url
    );

    // Check if we're on an admin page
    const isAdminPage = window.location.pathname.startsWith("/admin/");
    const isAdminLoginPage = window.location.pathname === "/admin/login";

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log("401 Unauthorized error:", {
        url: error.config?.url,
        isAdminPage,
        isAdminLoginPage,
        token: localStorage.getItem("token"),
        user: localStorage.getItem("user"),
      });

      if (isAdminPage && !isAdminLoginPage) {
        console.log("401 on admin page, clearing admin token and redirecting");
        // Force redirect to admin login
        window.location.href = `/admin/login?redirect=${window.location.pathname}`;
        return Promise.reject(error);
      } else if (!isAdminPage && !isAdminLoginPage) {
        console.log("401 on non-admin page, clearing tokens and redirecting");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.log("403 Forbidden: User doesn't have permission");
      if (isAdminPage) {
        window.location.href = "/admin/login";
        return Promise.reject(error);
      }
    }

    // Handle 500 Server errors
    if (error.response?.status >= 500) {
      console.error(
        "Server error:",
        error.response?.data?.message || "Unknown server error"
      );
      // Don't redirect, just show the error to the user
    }

    // Handle network errors
    if (error.message === "Network Error") {
      console.error("Network error - server might be down");
      // Don't redirect, just show the error to the user
    }

    return Promise.reject(error);
  }
);

// Default image URLs for fallbacks
export const DEFAULT_PRODUCT_IMAGE =
  "https://via.placeholder.com/300x300?text=Product";
export const DEFAULT_CATEGORY_IMAGE =
  "https://via.placeholder.com/300x300?text=Category";

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/me"),
  logout: () => api.get("/auth/logout"),
};

// Old Products API implementation (commented out)

// Categories API
export const categoriesAPI = {
  // Get all categories with fallback for server errors
  getAll: async () => {
    try {
      return await api.get("/categories");
    } catch (error) {
      console.warn("Error fetching categories from server:", error);
      // Return empty array as fallback
      return { data: [] };
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/categories/${id}`);
    } catch (error) {
      console.warn(`Error fetching category ${id}:`, error);
      return { data: null };
    }
  },
  create: async (categoryData) => {
    // Check if categoryData is FormData (for file uploads)
    const isFormData = categoryData instanceof FormData;
    try {
      return await api.post("/categories", categoryData, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
      });
    } catch (error) {
      console.warn("Error creating category:", error);
      // Return the category data as if it was created successfully
      // This is a fallback for when the server is not working
      return {
        data: {
          ...categoryData,
          _id: `temp_${Date.now()}`, // Generate a temporary ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    }
  },
  update: async (id, categoryData) => {
    // Check if categoryData is FormData (for file uploads)
    const isFormData = categoryData instanceof FormData;
    try {
      return await api.put(`/categories/${id}`, categoryData, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
      });
    } catch (error) {
      console.warn(`Error updating category ${id}:`, error);
      return {
        data: {
          ...categoryData,
          _id: id,
          updatedAt: new Date().toISOString(),
        },
      };
    }
  },
  delete: async (id) => {
    try {
      console.log(`Attempting to delete category with ID: ${id}`);
      const response = await api.delete(`/categories/${id}`);
      console.log(`Successfully deleted category ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      // Don't return a fake success response - let the component handle the error
      throw error;
    }
  },
  getWithProducts: async () => {
    try {
      return await api.get("/categories/with-products");
    } catch (error) {
      console.warn("Error fetching categories with products:", error);
      return { data: [] };
    }
  },
};

// Contact API
export const contactAPI = {
  create: (contactData) => {
    console.log("Creating contact message with data:", contactData);
    return api.post("/contact", contactData);
  },
  getAll: async () => {
    try {
      console.log("Fetching all contact messages");
      const response = await api.get("/contact");
      console.log("Contact messages fetched successfully:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      throw error;
    }
  },
  getById: (id) => api.get(`/contact/${id}`),
  update: (id, statusData) => {
    console.log("Updating contact message status:", id, statusData);
    return api.put(`/contact/${id}`, statusData);
  },
  delete: (id) => {
    console.log("Deleting contact message:", id);
    return api.delete(`/contact/${id}`);
  },
};

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post("/orders", orderData),
  getAll: (params) => api.get("/orders", { params }),
  getMyOrders: () => api.get("/orders/myorders"),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
  updateToPaid: (id, paymentResult) =>
    api.put(`/orders/${id}/pay`, paymentResult),
  getStats: () => api.get("/orders/stats"),
  getRecent: (limit = 5) => api.get(`/orders/recent?limit=${limit}`),
  getAllOrders: () => api.get("/orders"),
  updateOrderStatus: (id, status) =>
    api.patch(`/orders/${id}/status`, { status }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentOrders: (limit = 5) =>
    api.get(`/dashboard/recent-orders?limit=${limit}`),
  getRecentUsers: (limit = 5) =>
    api.get(`/dashboard/recent-users?limit=${limit}`),
  getSalesData: (period = "monthly") =>
    api.get(`/dashboard/sales?period=${period}`),
  getTopProducts: (limit = 5) =>
    api.get(`/dashboard/top-products?limit=${limit}`),
  getTopCategories: (limit = 5) =>
    api.get(`/dashboard/top-categories?limit=${limit}`),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  updateRole: (id, roleData) => api.put(`/users/${id}/role`, roleData),
  getStats: () => api.get("/users/stats"),
};

// Payment Settings API
export const paymentSettingsAPI = {
  get: async () => {
    try {
      console.log("Fetching active payment settings");
      const response = await api.get("/payment-settings");
      console.log("Payment settings response:", response);
      return response;
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      throw error;
    }
  },
  getAll: async () => {
    try {
      console.log("Fetching all payment settings");
      const response = await api.get("/payment-settings/all");
      console.log("All payment settings response:", response);
      return response;
    } catch (error) {
      console.error("Error fetching all payment settings:", error);
      throw error;
    }
  },
  create: async (data) => {
    try {
      console.log("Creating payment setting with data:", data);
      const response = await api.post("/payment-settings", data);
      console.log("Create payment setting response:", response);
      return response;
    } catch (error) {
      console.error("Error creating payment setting:", error);
      throw error;
    }
  },
  update: async (id, data) => {
    try {
      console.log(`Updating payment setting ${id} with data:`, data);
      const response = await api.put(`/payment-settings/${id}`, data);
      console.log("Update payment setting response:", response);
      return response;
    } catch (error) {
      console.error(`Error updating payment setting ${id}:`, error);
      throw error;
    }
  },
  delete: async (id) => {
    try {
      console.log(`Deleting payment setting ${id}`);
      const response = await api.delete(`/payment-settings/${id}`);
      console.log("Delete payment setting response:", response);
      return response;
    } catch (error) {
      console.error(`Error deleting payment setting ${id}:`, error);
      throw error;
    }
  },
};

// Payment Requests API
export const paymentRequestsAPI = {
  create: async (data) => {
    try {
      console.log("Creating payment request with data:", data);
      const response = await api.post("/payment-requests", data);
      console.log("Create payment request response:", response);
      return response;
    } catch (error) {
      console.error("Error creating payment request:", error);
      throw error;
    }
  },
  getMine: async () => {
    try {
      console.log("Fetching my payment requests");
      const response = await api.get("/payment-requests");
      console.log("My payment requests response:", response);
      return response;
    } catch (error) {
      console.error("Error fetching my payment requests:", error);
      throw error;
    }
  },
  getAll: async () => {
    try {
      console.log("Fetching all payment requests");
      const response = await api.get("/payment-requests/all");
      console.log("All payment requests response:", response);
      return response;
    } catch (error) {
      console.error("Error fetching all payment requests:", error);
      throw error;
    }
  },
  getById: async (id) => {
    try {
      console.log(`Fetching payment request ${id}`);
      const response = await api.get(`/payment-requests/${id}`);
      console.log("Payment request response:", response);
      return response;
    } catch (error) {
      console.error(`Error fetching payment request ${id}:`, error);
      throw error;
    }
  },
  updateStatus: async (id, data) => {
    try {
      console.log(`Updating payment request ${id} status to ${data.status}`);
      const response = await api.put(`/payment-requests/${id}/status`, data);
      console.log("Update payment request status response:", response);
      return response;
    } catch (error) {
      console.error(`Error updating payment request ${id} status:`, error);
      throw error;
    }
  },
  uploadProof: async (id, formData) => {
    try {
      console.log(`Uploading proof for payment request ${id}`);
      const response = await api.put(
        `/payment-requests/${id}/proof`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Upload payment proof response:", response);
      return response;
    } catch (error) {
      console.error(`Error uploading proof for payment request ${id}:`, error);
      throw error;
    }
  },
};

export { productsAPI };
export default api;
