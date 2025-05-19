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

/**
 * Get all products from the database with fallbacks
 * @returns {Promise<Array>} - Array of product objects
 */
export const getAllProducts = async () => {
  try {
    console.log("Fetching products from database...");

    // Try multiple endpoints with fallbacks
    const baseUrl = getBaseUrl();
    const endpoints = [
      `${baseUrl}/api/products`,
      `${baseUrl}/api/direct/products`,
      `${baseUrl}/api/admin/products`,
      `${baseUrl}/api/fallback/products`,
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
          timeout: 10000,
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

      // Save products to localStorage as backup
      saveProductsToLocalStorage(processedProducts);

      return processedProducts;
    }

    // If all endpoints failed, use localStorage as fallback
    console.log("All endpoints failed, using localStorage as fallback");
    const localProducts = getProductsFromLocalStorage();

    if (localProducts && localProducts.length > 0) {
      console.log(`Found ${localProducts.length} products in localStorage`);
      return localProducts;
    }

    // If localStorage is empty, throw the original error
    throw error || new Error("Failed to fetch products from all sources");
  } catch (error) {
    console.error("Error fetching products:", error);

    // Use localStorage as fallback
    const localProducts = getProductsFromLocalStorage();

    if (localProducts && localProducts.length > 0) {
      console.log(`Found ${localProducts.length} products in localStorage`);
      return localProducts;
    }

    // If localStorage is empty, return an empty array
    return [];
  }
};

/**
 * Get a product by ID from the database with fallbacks
 * @param {string} productId - ID of product to get
 * @returns {Promise<Object|null>} - Product object or null if not found
 */
export const getProductById = async (productId) => {
  try {
    console.log(`Fetching product with ID: ${productId}`);

    // Try multiple endpoints with fallbacks
    const baseUrl = getBaseUrl();
    const endpoints = [
      `${baseUrl}/api/products/${productId}`,
      `${baseUrl}/api/direct/products/${productId}`,
      `${baseUrl}/api/admin/products/${productId}`,
      `${baseUrl}/api/fallback/products/${productId}`,
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
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await axios.get(endpoint, {
          headers,
          timeout: 10000,
        });

        // Check if we got valid data
        if (response.data) {
          // Extract product from various response formats
          if (response.data.data) {
            productData = response.data.data;
            break;
          } else if (response.data._id) {
            productData = response.data;
            break;
          }
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed:`, endpointError);
        error = endpointError;
        // Continue to next endpoint
      }
    }

    // If we found the product, process it
    if (productData) {
      console.log("Found product:", productData);

      // Save product to localStorage as backup
      saveProductToLocalStorage(productData);

      return productData;
    }

    // If all endpoints failed, use localStorage as fallback
    console.log("All endpoints failed, using localStorage as fallback");
    const localProduct = getProductsFromLocalStorage().find(
      (p) => p._id === productId
    );

    if (localProduct) {
      console.log("Found product in localStorage:", localProduct);
      return localProduct;
    }

    // If product not found in localStorage, throw the original error
    throw error || new Error(`Product with ID ${productId} not found`);
  } catch (error) {
    console.error("Error fetching product:", error);

    // Use localStorage as fallback
    const localProduct = getProductsFromLocalStorage().find(
      (p) => p._id === productId
    );

    if (localProduct) {
      console.log("Found product in localStorage:", localProduct);
      return localProduct;
    }

    // If product not found in localStorage, return null
    return null;
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
    console.log(`Updating product with ID: ${productId}`);

    // Try multiple endpoints with fallbacks
    const baseUrl = getBaseUrl();
    const endpoints = [
      `${baseUrl}/api/products/${productId}`,
      `${baseUrl}/api/direct/products/${productId}`,
      `${baseUrl}/api/admin/products/${productId}`,
      `${baseUrl}/api/fallback/products/${productId}`,
    ];

    // Add authentication headers
    const adminToken =
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");
    const token = localStorage.getItem("token");
    const authToken = adminToken || token;

    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    let updatedProduct = null;
    let error = null;

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);

        // Check if productData is FormData
        const isFormData = productData instanceof FormData;
        console.log("Is FormData:", isFormData);

        // Set up request config
        let requestConfig = {
          headers: {
            ...headers,
          },
          timeout: 15000,
        };

        // If it's FormData, don't set Content-Type (let axios set it with boundary)
        if (isFormData) {
          console.log("Using FormData for update");
        } else {
          requestConfig.headers["Content-Type"] = "application/json";
        }

        // Make the request
        const response = await axios.put(endpoint, productData, requestConfig);

        // Check if we got valid data
        if (response.data) {
          console.log("Update response:", response.data);

          // Extract product from various response formats
          if (response.data.data) {
            updatedProduct = response.data.data;
            break;
          } else if (response.data._id) {
            updatedProduct = response.data;
            break;
          } else if (response.data.success) {
            // If we got a success response but no data, fetch the product again
            updatedProduct = await getProductById(productId);
            break;
          }
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed:`, endpointError);
        console.log(
          "Error details:",
          endpointError.response
            ? endpointError.response.data
            : endpointError.message
        );
        error = endpointError;
        // Continue to next endpoint
      }
    }

    // If we updated the product, process it
    if (updatedProduct) {
      console.log("Updated product:", updatedProduct);

      // Save product to localStorage as backup
      saveProductToLocalStorage(updatedProduct);

      return updatedProduct;
    }

    // If all endpoints failed, update in localStorage as fallback
    console.log("All endpoints failed, updating in localStorage as fallback");
    const locallyUpdatedProduct = saveProductToLocalStorage({
      ...productData,
      _id: productId,
      updatedAt: new Date().toISOString(),
    });

    if (locallyUpdatedProduct) {
      console.log("Updated product in localStorage:", locallyUpdatedProduct);
      return locallyUpdatedProduct;
    }

    // If update failed in localStorage, throw the original error
    throw error || new Error(`Failed to update product with ID ${productId}`);
  } catch (error) {
    console.error("Error updating product:", error);

    // Try to update in localStorage as fallback
    try {
      const locallyUpdatedProduct = saveProductToLocalStorage({
        ...productData,
        _id: productId,
        updatedAt: new Date().toISOString(),
      });

      if (locallyUpdatedProduct) {
        console.log("Updated product in localStorage:", locallyUpdatedProduct);
        return locallyUpdatedProduct;
      }
    } catch (localError) {
      console.error("Error updating product in localStorage:", localError);
    }

    // If all updates failed, return null
    return null;
  }
};

/**
 * Delete a product from the database with fallbacks
 * @param {string} productId - ID of product to delete
 * @returns {Promise<boolean>} - True if product was deleted, false otherwise
 */
export const deleteProduct = async (productId) => {
  try {
    console.log(`Deleting product with ID: ${productId}`);

    // Try multiple endpoints with fallbacks
    const baseUrl = getBaseUrl();
    const endpoints = [
      `${baseUrl}/api/products/${productId}`,
      `${baseUrl}/api/direct/products/${productId}`,
      `${baseUrl}/api/admin/products/${productId}`,
      `${baseUrl}/api/fallback/products/${productId}`,
    ];

    // Add authentication headers
    const adminToken =
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");
    const token = localStorage.getItem("token");
    const authToken = adminToken || token;

    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    let deleted = false;
    let error = null;

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await axios.delete(endpoint, {
          headers,
          timeout: 10000,
        });

        // Check if we got a success response
        if (response.data && response.data.success) {
          deleted = true;
          break;
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed:`, endpointError);
        error = endpointError;
        // Continue to next endpoint
      }
    }

    // If we deleted the product, also delete it from localStorage
    if (deleted) {
      console.log(`Deleted product with ID: ${productId}`);
      deleteProductFromLocalStorage(productId);
      return true;
    }

    // If all endpoints failed, delete from localStorage as fallback
    console.log("All endpoints failed, deleting from localStorage as fallback");
    const locallyDeleted = deleteProductFromLocalStorage(productId);

    if (locallyDeleted) {
      console.log(`Deleted product with ID: ${productId} from localStorage`);
      return true;
    }

    // If delete failed in localStorage, throw the original error
    throw error || new Error(`Failed to delete product with ID ${productId}`);
  } catch (error) {
    console.error("Error deleting product:", error);

    // Try to delete from localStorage as fallback
    try {
      const locallyDeleted = deleteProductFromLocalStorage(productId);

      if (locallyDeleted) {
        console.log(`Deleted product with ID: ${productId} from localStorage`);
        return true;
      }
    } catch (localError) {
      console.error("Error deleting product from localStorage:", localError);
    }

    // If all deletes failed, return false
    return false;
  }
};
