/**
 * Robust API Helper Utility
 *
 * This utility provides reliable API functions that work with MongoDB Atlas
 * while providing fallbacks for image display and error handling.
 */
import axios from "axios";
import {
  getProductsFromLocalStorage,
  saveProductsToLocalStorage,
  saveProductToLocalStorage,
  deleteProductFromLocalStorage,
  getCategoryNameById,
  getCategoriesFromLocalStorage,
} from "./localStorageHelper";

// Get the base URL based on environment
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const isProduction =
    hostname.includes("render.com") ||
    hostname === "furniture-q3nb.onrender.com";
  return isProduction
    ? "https://furniture-q3nb.onrender.com"
    : "http://localhost:5000";
};

// Function to fix image URLs with improved handling for production
export const fixImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // If it's a data URL (base64 encoded image), return it as is
  if (imageUrl.startsWith("data:image")) {
    return imageUrl;
  }

  // If it's a placeholder or Cloudinary URL, return it as is
  if (
    imageUrl.includes("placehold.co") ||
    imageUrl.includes("placeholder.com") ||
    imageUrl.includes("cloudinary.com") ||
    imageUrl.includes("dicebear.com")
  ) {
    return imageUrl;
  }

  // If it's already a full URL but not from our domain, return it as is
  if (
    imageUrl.startsWith("http") &&
    !imageUrl.includes("localhost") &&
    !imageUrl.includes("furniture-q3nb.onrender.com")
  ) {
    return imageUrl;
  }

  // For server URLs, use the reliable placeholder instead
  // This is the key fix for production image issues
  if (
    imageUrl.includes("/uploads/") ||
    imageUrl.startsWith("/uploads/") ||
    imageUrl.startsWith("uploads/")
  ) {
    // Import the placeholder functions
    const {
      getProductType,
      getPlaceholderByType,
    } = require("./reliableImageHelper");

    // Create a placeholder based on the filename
    const filename = imageUrl.split("/").pop();
    const productType = filename.includes("sofa")
      ? "sofa"
      : filename.includes("bed")
      ? "bed"
      : filename.includes("table")
      ? "table"
      : filename.includes("chair")
      ? "chair"
      : filename.includes("wardrobe")
      ? "wardrobe"
      : "furniture";

    return getPlaceholderByType(productType, filename);
  }

  // If it's a relative path, add the base URL
  const baseUrl = getBaseUrl();

  // Make sure the path starts with a slash
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  return `${baseUrl}${path}`;
};

// Global flag to track if we're in offline mode
let isOfflineMode = false;

// Function to set offline mode
export const setOfflineMode = (value) => {
  isOfflineMode = value;

  // Store in localStorage for persistence across page refreshes
  try {
    localStorage.setItem("isOfflineMode", value ? "true" : "false");
  } catch (error) {
    console.error("Error storing offline mode in localStorage:", error);
  }

  console.log(`Offline mode ${value ? "enabled" : "disabled"}`);
};

// Function to check if we're in offline mode
export const checkOfflineMode = () => {
  // Check localStorage first
  try {
    const storedValue = localStorage.getItem("isOfflineMode");
    if (storedValue === "true") {
      isOfflineMode = true;
    }
  } catch (error) {
    console.error("Error reading offline mode from localStorage:", error);
  }

  return isOfflineMode;
};

/**
 * Get all products directly from the database
 * @returns {Promise<Array>} - Array of product objects
 */
export const getAllProducts = async () => {
  try {
    console.log("Fetching all products directly from database...");

    // Try multiple endpoints with fallbacks
    const baseUrl = getBaseUrl();
    const endpoints = [
      `${baseUrl}/api/products?limit=1000`, // Use high limit to get all products
      `${baseUrl}/api/direct/products?limit=1000`,
      `${baseUrl}/api/admin/products?limit=1000`,
    ];

    let productsData = null;
    let successEndpoint = null;
    let error = null;

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);

        // Add authentication headers
        const adminToken =
          localStorage.getItem("adminToken") ||
          sessionStorage.getItem("adminToken");
        const token = localStorage.getItem("token");
        const authToken = adminToken || token;

        const headers = authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {};

        const response = await axios.get(endpoint, {
          headers,
          timeout: 30000, // Increased timeout for better reliability
        });

        // Check if we got valid data
        if (response.data) {
          // Extract products array from various response formats
          let extractedProducts = null;

          if (Array.isArray(response.data)) {
            extractedProducts = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            extractedProducts = response.data.data;
          } else if (
            response.data.products &&
            Array.isArray(response.data.products)
          ) {
            extractedProducts = response.data.products;
          }

          // If we found products, use them
          if (extractedProducts && extractedProducts.length > 0) {
            productsData = extractedProducts;
            successEndpoint = endpoint;
            break;
          }
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed:`, endpointError);
        error = endpointError;
        // Continue to next endpoint
      }
    }

    // If we found products, process them
    if (productsData && productsData.length > 0) {
      console.log(
        `Found ${productsData.length} products from ${successEndpoint}`
      );

      // Process products to ensure they have all required fields
      const processedProducts = productsData.map((product) => {
        // Ensure product has a category object
        if (!product.category) {
          product.category = { _id: "unknown", name: "Unknown" };
        } else if (typeof product.category === "string") {
          // Try to map known category IDs to names
          const categoryMap = {
            "680c9481ab11e96a288ef6d9": "Sofa Beds",
            "680c9484ab11e96a288ef6da": "Tables",
            "680c9486ab11e96a288ef6db": "Chairs",
            "680c9489ab11e96a288ef6dc": "Wardrobes",
            "680c948eab11e96a288ef6dd": "Beds",
          };

          const categoryName =
            categoryMap[product.category] ||
            `Category ${product.category.substring(
              product.category.length - 6
            )}`;

          product.category = {
            _id: product.category,
            name: categoryName,
          };
        }

        // Ensure product has stock value
        if (product.stock === undefined || product.stock === null) {
          product.stock = 0;
        }

        return product;
      });

      return processedProducts;
    }

    // If all endpoints failed, throw an error
    throw error || new Error("Failed to fetch products from all sources");
  } catch (error) {
    console.error("Error fetching products from database:", error);
    throw error;
  }
};

/**
 * Get a product by ID directly from the database
 * @param {string} productId - ID of product to get
 * @returns {Promise<Object|null>} - Product object or null if not found
 */
export const getProductById = async (productId) => {
  try {
    // Fetch product from database

    // Try multiple endpoints with fallbacks
    const baseUrl = getBaseUrl();
    const endpoints = [
      `${baseUrl}/api/products/${productId}`,
      `${baseUrl}/api/direct/products/${productId}`,
      `${baseUrl}/api/admin/products/${productId}`,
    ];

    // Add authentication headers
    const adminToken =
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");
    const token = localStorage.getItem("token");
    const authToken = adminToken || token;

    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    let productData = null;
    let error = null;

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        // Try this endpoint
        const response = await axios.get(endpoint, {
          headers,
          timeout: 15000, // Increased timeout for better reliability
        });

        // Check if we got valid data
        if (response.data) {
          // Extract product from various response formats
          if (response.data.data) {
            productData = response.data.data;
            // Found product in data.data format
            break;
          } else if (response.data._id) {
            productData = response.data;
            // Found product in direct format
            break;
          }
        }
      } catch (endpointError) {
        // Endpoint failed, try next one
        error = endpointError;
        // Continue to next endpoint
      }
    }

    // If we found the product, return it
    if (productData) {
      // Successfully retrieved product from database
      return productData;
    }

    // If all endpoints failed, throw an error
    throw (
      error || new Error(`Product with ID ${productId} not found in database`)
    );
  } catch (error) {
    // Error fetching product from database
    throw error;
  }
};

/**
 * Update a product in the database with fallbacks
 * @param {string} productId - ID of product to update
 * @param {Object} productData - Updated product data
 * @returns {Promise<Object|null>} - Updated product object or null if update failed
 */
export const updateProduct = async (productId, productData) => {
  try {
    // Update product in database

    // Extract file from FormData if present
    let imageFile = null;
    let processedProductData = productData;

    if (productData instanceof FormData) {
      // Extract the image file from FormData
      imageFile = productData.get("images");

      // Convert FormData to regular object
      processedProductData = {};
      for (const [key, value] of productData.entries()) {
        if (key !== "images") {
          // Try to parse JSON strings
          if (
            typeof value === "string" &&
            (value.startsWith("{") || value.startsWith("["))
          ) {
            try {
              processedProductData[key] = JSON.parse(value);
            } catch (e) {
              processedProductData[key] = value;
            }
          } else {
            processedProductData[key] = value;
          }
        }
      }
    }

    // Create a data URL from the image file if present
    if (imageFile && imageFile instanceof File) {
      try {
        const reader = new FileReader();
        const dataUrlPromise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(imageFile);

        const dataUrl = await dataUrlPromise;

        // Store the data URL as the image
        processedProductData.images = [dataUrl];
      } catch (imageError) {
        // Error creating data URL from image
      }
    }

    // Try multiple endpoints with fallbacks
    const baseUrl = getBaseUrl();
    const endpoints = [
      `${baseUrl}/api/products/${productId}`,
      `${baseUrl}/api/direct/products/${productId}`,
      `${baseUrl}/api/admin/products/${productId}`,
    ];

    // Add authentication headers
    const adminToken =
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");
    const token = localStorage.getItem("token");
    const authToken = adminToken || token;

    const headers = authToken
      ? {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        }
      : { "Content-Type": "application/json" };

    let updatedProduct = null;
    let error = null;

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        // Try to update product at this endpoint

        const response = await axios.put(endpoint, processedProductData, {
          headers,
          timeout: 15000, // Increased timeout for better reliability
        });

        // Check if we got valid data
        if (response.data) {
          // Extract product from various response formats
          if (response.data.data) {
            updatedProduct = response.data.data;
            // Product updated successfully in data.data format
            break;
          } else if (response.data._id) {
            updatedProduct = response.data;
            // Product updated successfully in direct format
            break;
          }
        }
      } catch (endpointError) {
        // Endpoint failed, try next one
        error = endpointError;
        // Continue to next endpoint
      }
    }

    // If we successfully updated the product, return it
    if (updatedProduct) {
      // Product updated successfully in database
      return updatedProduct;
    }

    // If all endpoints failed, throw an error
    throw (
      error ||
      new Error(`Failed to update product with ID ${productId} in database`)
    );
  } catch (error) {
    // Error updating product in database
    throw error;
  }
};

/**
 * Delete a product directly from the database
 * @param {string} productId - ID of product to delete
 * @returns {Promise<boolean>} - True if product was deleted, false otherwise
 */
export const deleteProduct = async (productId) => {
  try {
    // Delete product from database

    // Try multiple endpoints with fallbacks
    const baseUrl = getBaseUrl();
    const endpoints = [
      `${baseUrl}/api/products/${productId}`,
      `${baseUrl}/api/direct/products/${productId}`,
      `${baseUrl}/api/admin/products/${productId}`,
    ];

    // Add authentication headers
    const adminToken =
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");
    const token = localStorage.getItem("token");
    const authToken = adminToken || token;

    const headers = authToken
      ? {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        }
      : { "Content-Type": "application/json" };

    let deleted = false;
    let error = null;

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        // Try to delete product at this endpoint
        const response = await axios.delete(endpoint, {
          headers,
          timeout: 15000, // Increased timeout for better reliability
        });

        // Check if deletion was successful
        if (
          response.data &&
          (response.data.success || response.status === 200)
        ) {
          // Product deleted successfully
          deleted = true;
          break;
        }
      } catch (endpointError) {
        // Endpoint failed, try next one
        error = endpointError;
        // Continue to next endpoint
      }
    }

    // If we successfully deleted the product, return true
    if (deleted) {
      return true;
    }

    // If all endpoints failed, throw an error
    throw (
      error ||
      new Error(`Failed to delete product with ID ${productId} from database`)
    );
  } catch (error) {
    // Error deleting product from database
    throw error;
  }
};
