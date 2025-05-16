import axios from "axios";
import { validateCategories } from "./safeDataHandler";

// Determine the API base URL based on environment
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const origin = window.location.origin;

  // Check if we're on Render's domain
  if (
    hostname.includes("render.com") ||
    hostname === "furniture-q3nb.onrender.com"
  ) {
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

// Helper function to properly format image URLs
const getImageUrl = (imagePath) => {
  // Default placeholder image (from a reliable source)
  const defaultImage =
    "https://placehold.co/300x300/e2e8f0/1e293b?text=No+Image";

  // If no image path provided, return default
  if (!imagePath || imagePath === "no-image.jpg") {
    console.log("No image path or using no-image.jpg, returning default image");
    return defaultImage;
  }

  // If it's already a full URL, return it as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    console.log("Image is already a full URL:", imagePath);
    return imagePath;
  }

  // If it's a relative path starting with /uploads
  if (imagePath.startsWith("/uploads/")) {
    const hostname = window.location.hostname;
    let imageUrl;

    // In development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      imageUrl = `http://localhost:5000${imagePath}`;
      console.log("Development image URL:", imageUrl);
      return imageUrl;
    }

    // In production on Render
    if (
      hostname.includes("render.com") ||
      hostname === "furniture-q3nb.onrender.com"
    ) {
      imageUrl = `https://furniture-q3nb.onrender.com${imagePath}`;
      console.log("Production image URL:", imageUrl);
      return imageUrl;
    }

    // Other production environments
    console.log("Using relative image path as is:", imagePath);
    return imagePath;
  }

  // If it's a relative path not starting with /uploads, add /uploads/
  if (!imagePath.startsWith("/") && !imagePath.includes("/")) {
    const fixedPath = `/uploads/${imagePath}`;
    console.log("Fixed relative path by adding /uploads/:", fixedPath);

    // Now process the fixed path
    return getImageUrl(fixedPath);
  }

  // If it doesn't match any pattern, return default image
  console.log(
    "Image path doesn't match any pattern, returning default:",
    imagePath
  );
  return defaultImage;
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000, // Increased timeout to 60 seconds for production
  withCredentials: true, // Enable credentials for all requests
});

// Add request interceptor to handle auth token
api.interceptors.request.use(
  (config) => {
    // Get both tokens
    const adminToken = localStorage.getItem("adminToken");
    const token = localStorage.getItem("token");

    // For admin endpoints, try multiple token sources
    if (config.url.includes("/admin/") || config.url.includes("/api/admin/")) {
      const effectiveToken = adminToken || token;

      if (!effectiveToken) {
        console.error("No valid token found for admin endpoint");
        throw new Error(
          "Admin authentication required. Please log in as an administrator."
        );
      }

      // Add token to headers
      config.headers["Authorization"] = `Bearer ${effectiveToken}`;

      // Add token to cookies if not already set
      if (!document.cookie.includes("adminToken=")) {
        document.cookie = `adminToken=${effectiveToken}; path=/; secure; samesite=strict`;
      }

      // If it's a FormData request, ensure proper headers
      if (config.data instanceof FormData) {
        // Remove Content-Type header to let browser set it with boundary
        delete config.headers["Content-Type"];
      }

      // Log the request for debugging
      console.log("Admin request:", {
        url: config.url,
        method: config.method,
        hasToken: !!effectiveToken,
        isFormData: config.data instanceof FormData,
        headers: config.headers,
      });

      return config;
    }

    // For non-admin endpoints, use regular token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("API Error:", error.message);
    console.error("Response:", error.response?.data);

    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("Authentication error - clearing tokens");

      // Clear all tokens
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");

      // Clear cookies
      document.cookie =
        "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

      // Get the error message from the response
      const errorMessage =
        error.response?.data?.message ||
        "Authentication failed. Please log in again.";

      // Redirect based on the endpoint type
      const isAdminEndpoint =
        error.config.url.includes("/admin/") ||
        error.config.url.includes("/api/admin/");

      if (isAdminEndpoint) {
        window.location.href = `/admin/login?error=${encodeURIComponent(
          errorMessage
        )}`;
      } else {
        window.location.href = `/login?error=${encodeURIComponent(
          errorMessage
        )}`;
      }
    }

    return Promise.reject(error);
  }
);

// Products API
const productsAPI = {
  create: async (formData) => {
    try {
      // Verify admin token exists
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        throw new Error("Admin authentication required. Please log in as an administrator.");
      }

      // Log the request details for debugging
      console.log("Creating product with FormData");
      console.log("FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0], typeof pair[1], pair[1]);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${adminToken}`,
        },
      };

      // Try multiple endpoints in sequence until one works
      const endpoints = [
        "/api/direct/products",
        "/api/products",
        "/products"
      ];

      let response = null;
      let error = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Attempting to create product using ${endpoint}`);
          response = await api.post(endpoint, formData, config);

          if (response?.data?.success) {
            console.log(`Product created successfully using ${endpoint}:`, response.data);
            return response.data;
          }
        } catch (err) {
          console.error(`Error with ${endpoint}:`, err);
          error = err;
          continue;
        }
      }

      // If we get here, all endpoints failed
      throw error || new Error("Failed to create product");
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await api.get("/products", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
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
          "Content-Type": "multipart/form-data",
        },
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
  },
};

// Categories API
const categoriesAPI = {
  getAll: async () => {
    try {
      // Try multiple endpoints in sequence
      const endpoints = [
        "/categories",
        "/api/categories",
        "/api/direct/categories",
        "/admin/categories",
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch categories from ${endpoint}`);
          response = await api.get(endpoint);
          if (response && response.data) {
            console.log(`Successfully fetched categories from ${endpoint}`);
            return response.data;
          }
        } catch (endpointError) {
          console.error(
            `Error fetching categories from ${endpoint}:`,
            endpointError
          );
          lastError = endpointError;
        }
      }

      // If we get here, all endpoints failed
      throw lastError || new Error("All category endpoints failed");
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      // Try multiple endpoints in sequence
      const endpoints = [
        `/categories/${id}`,
        `/api/categories/${id}`,
        `/api/direct/categories/${id}`,
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch category from ${endpoint}`);
          response = await api.get(endpoint);
          if (response && response.data) {
            console.log(`Successfully fetched category from ${endpoint}`);
            return response.data;
          }
        } catch (endpointError) {
          console.error(
            `Error fetching category from ${endpoint}:`,
            endpointError
          );
          lastError = endpointError;
        }
      }

      // If we get here, all endpoints failed
      throw (
        lastError || new Error(`All category endpoints failed for ID ${id}`)
      );
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },

  create: async (data, config = {}) => {
    try {
      console.log("Creating category with data:", data);

      // Ensure we have the correct content type for FormData
      if (data instanceof FormData) {
        config.headers = {
          ...config.headers,
          "Content-Type": "multipart/form-data",
        };
      }

      // Try multiple endpoints in sequence
      const endpoints = [
        "/api/direct/categories",
        "/categories",
        "/api/categories",
        "/admin/categories",
      ];

      let response = null;
      let lastError = null;
      let successData = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to create category at ${endpoint}`);
          response = await api.post(endpoint, data, config);

          if (response && response.data) {
            console.log(
              `Successfully created category at ${endpoint}:`,
              response.data
            );

            // Check if we have valid data
            if (response.data.success === false) {
              console.warn(`Endpoint ${endpoint} returned success: false`);
              continue;
            }

            // Extract the actual data
            if (response.data.data) {
              successData = response.data;
            } else if (typeof response.data === "object") {
              successData = { success: true, data: response.data };
            }

            if (successData) {
              console.log("Extracted success data:", successData);
              return successData;
            }
          }
        } catch (endpointError) {
          console.error(
            `Error creating category at ${endpoint}:`,
            endpointError
          );
          lastError = endpointError;
        }
      }

      // If we get here, all endpoints failed
      throw lastError || new Error("All category creation endpoints failed");
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  update: async (id, data, config = {}) => {
    try {
      console.log(`Updating category ${id} with data:`, data);

      // Ensure we have the correct content type for FormData
      if (data instanceof FormData) {
        config.headers = {
          ...config.headers,
          "Content-Type": "multipart/form-data",
        };
      }

      // Try multiple endpoints in sequence
      const endpoints = [
        `/api/direct/categories/${id}`,
        `/categories/${id}`,
        `/api/categories/${id}`,
        `/admin/categories/${id}`,
      ];

      let response = null;
      let lastError = null;
      let successData = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to update category at ${endpoint}`);
          response = await api.put(endpoint, data, config);

          if (response && response.data) {
            console.log(
              `Successfully updated category at ${endpoint}:`,
              response.data
            );

            // Check if we have valid data
            if (response.data.success === false) {
              console.warn(`Endpoint ${endpoint} returned success: false`);
              continue;
            }

            // Extract the actual data
            if (response.data.data) {
              successData = response.data;
            } else if (typeof response.data === "object") {
              successData = { success: true, data: response.data };
            }

            if (successData) {
              console.log("Extracted success data:", successData);
              return successData;
            }
          }
        } catch (endpointError) {
          console.error(
            `Error updating category at ${endpoint}:`,
            endpointError
          );
          lastError = endpointError;
        }
      }

      // If we get here, all endpoints failed
      throw (
        lastError ||
        new Error(`All category update endpoints failed for ID ${id}`)
      );
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      console.log(`Deleting category ${id}`);

      // Try multiple endpoints in sequence
      const endpoints = [
        `/api/direct/categories/${id}`,
        `/categories/${id}`,
        `/api/categories/${id}`,
        `/admin/categories/${id}`,
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to delete category at ${endpoint}`);
          response = await api.delete(endpoint);
          if (response && response.data) {
            console.log(
              `Successfully deleted category at ${endpoint}:`,
              response.data
            );
            return response.data;
          }
        } catch (endpointError) {
          console.error(
            `Error deleting category at ${endpoint}:`,
            endpointError
          );
          lastError = endpointError;
        }
      }

      // If we get here, all endpoints failed
      throw (
        lastError ||
        new Error(`All category deletion endpoints failed for ID ${id}`)
      );
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  },
};

// Payment Settings API
const paymentSettingsAPI = {
  get: async () => {
    try {
      console.log("Fetching payment settings...");

      // Try multiple endpoints in sequence
      const endpoints = [
        "/api/direct/payment-settings",
        "/api/payment-settings",
        "/payment-settings",
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch payment settings from ${endpoint}`);
          response = await api.get(endpoint);

          if (response && response.data && response.data.success) {
            console.log(
              `Successfully fetched payment settings from ${endpoint}:`,
              response.data
            );
            return response.data;
          }
        } catch (endpointError) {
          console.error(
            `Error fetching payment settings from ${endpoint}:`,
            endpointError
          );
          lastError = endpointError;
        }
      }

      // If we get here, all endpoints failed
      // Return default payment settings as fallback
      console.log(
        "All payment settings endpoints failed, using default settings"
      );

      const defaultSettings = {
        success: true,
        data: {
          accountNumber: "42585534295",
          ifscCode: "SBIN0030442",
          accountHolder: "Avinash Kumar",
          bankName: "State Bank of India",
          isActive: true,
          _id: "default-settings",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        source: "client_fallback",
      };

      return defaultSettings;
    } catch (error) {
      console.error("Error fetching payment settings:", error);

      // Return default payment settings as fallback
      return {
        success: true,
        data: {
          accountNumber: "42585534295",
          ifscCode: "SBIN0030442",
          accountHolder: "Avinash Kumar",
          bankName: "State Bank of India",
          isActive: true,
          _id: "default-settings",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        source: "error_fallback",
      };
    }
  },

  getAll: async () => {
    try {
      console.log("Fetching all payment settings...");

      // Try multiple endpoints in sequence
      const endpoints = [
        "/api/direct/payment-settings/all",
        "/api/payment-settings/all",
        "/payment-settings/all",
        "/admin/payment-settings",
        "/api/admin/payment-settings",
        "/payment-settings", // Fallback to regular endpoint
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch all payment settings from ${endpoint}`);
          response = await api.get(endpoint);

          if (response && response.data && response.data.success) {
            console.log(
              `Successfully fetched all payment settings from ${endpoint}:`,
              response.data
            );

            // If we got data from the regular endpoint, convert it to the expected format
            if (endpoint === "/payment-settings" && !response.data.count) {
              return {
                success: true,
                count: 1,
                data: [response.data.data],
                source: endpoint,
              };
            }

            return response.data;
          }
        } catch (endpointError) {
          console.error(
            `Error fetching all payment settings from ${endpoint}:`,
            endpointError
          );
          lastError = endpointError;
        }
      }

      // If we get here, all endpoints failed
      // Return default payment settings as fallback
      console.log(
        "All payment settings endpoints failed, using default settings"
      );

      const defaultSettings = {
        success: true,
        count: 1,
        data: [
          {
            accountNumber: "42585534295",
            ifscCode: "SBIN0030442",
            accountHolder: "Avinash Kumar",
            bankName: "State Bank of India",
            isActive: true,
            _id: "default-settings",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        source: "client_fallback",
      };

      return defaultSettings;
    } catch (error) {
      console.error("Error fetching all payment settings:", error);

      // Return default payment settings as fallback
      return {
        success: true,
        count: 1,
        data: [
          {
            accountNumber: "42585534295",
            ifscCode: "SBIN0030442",
            accountHolder: "Avinash Kumar",
            bankName: "State Bank of India",
            isActive: true,
            _id: "default-settings",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        source: "error_fallback",
      };
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
  },

  create: async (data) => {
    try {
      const response = await api.post("/api/payment-settings", data);
      return response.data;
    } catch (error) {
      console.error("Error creating payment settings:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/api/payment-settings/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting payment settings ${id}:`, error);
      throw error;
    }
  },
};

// Orders API
const ordersAPI = {
  create: async (orderData) => {
    try {
      const response = await api.post("/orders", orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await api.get("/orders", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
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
  },
};

// Payment Requests API
const paymentRequestsAPI = {
  create: async (requestData) => {
    try {
      const response = await api.post("/payment-requests", requestData);
      return response.data;
    } catch (error) {
      console.error("Error creating payment request:", error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await api.get("/payment-requests", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching payment requests:", error);
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
      const response = await api.patch(`/payment-requests/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating payment request ${id} status:`, error);
      throw error;
    }
  },
};

// Contact API
const contactAPI = {
  create: async (messageData) => {
    try {
      const response = await api.post("/contact", messageData);
      return response.data;
    } catch (error) {
      console.error("Error sending contact message:", error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const response = await api.get("/admin/contact", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching contact messages:", error);
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
  },
};

// Export everything at the end of the file
export {
  api,
  productsAPI,
  categoriesAPI,
  paymentSettingsAPI,
  ordersAPI,
  paymentRequestsAPI,
  contactAPI,
  getBaseURL,
  getImageUrl,
};

export default api;
