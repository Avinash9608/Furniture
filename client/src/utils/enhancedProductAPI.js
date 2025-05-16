import axios from "axios";

/**
 * Enhanced product API with better error handling and multiple fallback mechanisms
 * for creating products in the admin panel
 */

// Get the base URL based on the environment
const getBaseURL = () => {
  const hostname = window.location.hostname;

  // In development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  // In production on Render
  if (
    hostname.includes("render.com") ||
    hostname === "furniture-q3nb.onrender.com"
  ) {
    return "https://furniture-q3nb.onrender.com";
  }

  // Fallback to current origin
  return window.location.origin;
};

/**
 * Create a product with enhanced error handling and multiple fallback mechanisms
 * @param {FormData} formData - The form data containing the product information
 * @returns {Promise<Object>} - The created product
 */
export const createProduct = async (formData) => {
  console.log("Creating product with enhanced API...");

  // Log form data for debugging
  console.log("FormData entries:");
  for (let pair of formData.entries()) {
    console.log(pair[0], typeof pair[1], pair[1]);
  }

  // Get admin token from localStorage
  const adminToken = localStorage.getItem("adminToken");

  // Add admin token to form data if it exists
  if (adminToken) {
    formData.append("adminToken", adminToken);
    console.log("Added admin token to form data");
  } else {
    console.warn("No admin token found in localStorage");
  }

  // Create axios config with headers
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };

  // If admin token exists, add it to headers
  if (adminToken) {
    config.headers["Authorization"] = `Bearer ${adminToken}`;
  }

  // Define endpoints to try in order
  const endpoints = [
    "/api/bypass/product",
    "/bypass/product",
    "/admin/bypass/product",
    "/api/direct/product-create",
    "/api/product-create",
    "/admin/product-create",
    "/api/direct/products",
    "/api/products",
    "/admin/products",
  ];

  // Try each endpoint in sequence
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`Attempting to create product using ${endpoint} endpoint...`);

      // Get the full URL
      const baseUrl = getBaseURL();
      const url = `${baseUrl}${endpoint}`;

      // Make the request
      const response = await axios.post(url, formData, config);

      // If successful, return the response data
      if (response && response.data && response.data.success) {
        console.log(
          `Successfully created product using ${endpoint} endpoint:`,
          response.data
        );
        return response.data;
      } else {
        console.warn(
          `Endpoint ${endpoint} returned success: false or invalid response:`,
          response.data
        );
      }
    } catch (error) {
      console.error(
        `Error creating product with ${endpoint} endpoint:`,
        error.response?.data || error.message
      );
      lastError = error;

      // If the error is due to authentication, break the loop
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error("Authentication error. Please log in again.");
        break;
      }
    }
  }

  // If all endpoints fail, throw the last error
  if (lastError) {
    // Extract the error message
    const errorMessage =
      lastError.response?.data?.message ||
      lastError.message ||
      "Failed to create product. Please try again.";

    // Create a custom error with the message
    const error = new Error(errorMessage);

    // Add the original error response for debugging
    error.originalError = lastError;
    error.response = lastError.response;

    throw error;
  } else {
    throw new Error("Failed to create product. Please try again.");
  }
};

/**
 * Get all products with enhanced error handling
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - The products
 */
export const getAllProducts = async (params = {}) => {
  try {
    // Define endpoints to try in order
    const endpoints = ["/api/direct/products", "/api/products", "/products"];

    // Try each endpoint in sequence
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Attempting to get products using ${endpoint} endpoint...`);

        // Get the full URL
        const baseUrl = getBaseURL();
        const url = `${baseUrl}${endpoint}`;

        // Make the request
        const response = await axios.get(url, { params });

        // If successful, return the response data
        if (response && response.data) {
          console.log(`Successfully got products using ${endpoint} endpoint`);
          return response.data;
        }
      } catch (error) {
        console.error(
          `Error getting products with ${endpoint} endpoint:`,
          error.response?.data || error.message
        );
        lastError = error;
      }
    }

    // If all endpoints fail, throw the last error
    if (lastError) {
      throw lastError;
    } else {
      throw new Error("Failed to get products. Please try again.");
    }
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
};

export default {
  createProduct,
  getAllProducts,
};
