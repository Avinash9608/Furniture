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

// Function to fix image URLs
export const fixImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // If it's a data URL (base64 encoded image), return it as is
  if (imageUrl.startsWith("data:image")) {
    return imageUrl;
  }

  // If it's already a full URL, return it as is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // If it's a relative path, add the base URL
  const baseUrl = getBaseUrl();

  // Make sure the path starts with a slash
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  return `${baseUrl}${path}`;
};

// Function to perform a direct admin login
export const directAdminLogin = async () => {
  try {
    console.log("Performing direct admin login");

    // Admin credentials
    const adminCredentials = {
      email: "avinashmadhukar4@gmail.com",
      password: "123456",
    };

    // Determine if we're in development or production
    const baseUrl = getBaseUrl();

    // Define login endpoints to try
    const loginEndpoints = [
      `${baseUrl}/api/auth/login`,
      `${baseUrl}/api/users/login`,
      `${baseUrl}/api/admin/login`,
      `${baseUrl}/api/login`,
    ];

    let loginResponse = null;
    let loginError = null;

    // Try each login endpoint until one works
    for (const endpoint of loginEndpoints) {
      try {
        console.log(`Trying login endpoint: ${endpoint}`);
        const response = await axios.post(endpoint, adminCredentials, {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        });

        if (response.data && response.data.token) {
          loginResponse = response.data;
          console.log("Login successful at endpoint:", endpoint);
          break;
        }
      } catch (error) {
        console.log(`Login failed at endpoint ${endpoint}:`, error.message);
        loginError = error;
      }
    }

    if (loginResponse && loginResponse.token) {
      // Store the token in localStorage and sessionStorage
      localStorage.setItem("adminToken", loginResponse.token);
      sessionStorage.setItem("adminToken", loginResponse.token);

      // Store user data if available
      if (loginResponse.user) {
        localStorage.setItem("user", JSON.stringify(loginResponse.user));
        sessionStorage.setItem("user", JSON.stringify(loginResponse.user));
      } else {
        // Create basic user data
        const userData = {
          email: adminCredentials.email,
          role: "admin",
          name: "Admin User",
        };
        localStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("user", JSON.stringify(userData));
      }

      console.log("Admin login successful, token stored");
      return loginResponse.token;
    } else {
      console.error("All login attempts failed");
      throw loginError || new Error("Login failed");
    }
  } catch (error) {
    console.error("Error in directAdminLogin:", error);
    throw error;
  }
};

/**
 * Determine the product type based on the product name
 * @param {string} productName - The product name
 * @returns {string} - The product type
 */
export const getProductType = (productName) => {
  if (!productName) return "unknown";

  const lowerName = productName.toLowerCase();

  if (lowerName.includes("sofa") || lowerName.includes("couch")) {
    return "sofa";
  } else if (lowerName.includes("bed")) {
    return "bed";
  } else if (lowerName.includes("table") || lowerName.includes("dining")) {
    return "table";
  } else if (lowerName.includes("chair")) {
    return "chair";
  } else if (lowerName.includes("wardrobe") || lowerName.includes("cabinet")) {
    return "wardrobe";
  } else {
    return "furniture";
  }
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
// export const updateProduct = async (productId, productData) => {
//   try {
//     // Update product in database

//     // Extract file from FormData if present
//     let imageFile = null;
//     let processedProductData = productData;

//     if (productData instanceof FormData) {
//       // Extract the image file from FormData
//       imageFile = productData.get("images");

//       // Convert FormData to regular object
//       processedProductData = {};
//       for (const [key, value] of productData.entries()) {
//         if (key !== "images") {
//           // Try to parse JSON strings
//           if (
//             typeof value === "string" &&
//             (value.startsWith("{") || value.startsWith("["))
//           ) {
//             try {
//               processedProductData[key] = JSON.parse(value);
//             } catch (e) {
//               processedProductData[key] = value;
//             }
//           } else {
//             processedProductData[key] = value;
//           }
//         }
//       }
//     }

//     // Create a data URL from the image file if present
//     if (imageFile && imageFile instanceof File) {
//       try {
//         const reader = new FileReader();
//         const dataUrlPromise = new Promise((resolve, reject) => {
//           reader.onload = () => resolve(reader.result);
//           reader.onerror = reject;
//         });
//         reader.readAsDataURL(imageFile);

//         const dataUrl = await dataUrlPromise;

//         // Store the data URL as the image
//         processedProductData.images = [dataUrl];
//       } catch (imageError) {
//         // Error creating data URL from image
//       }
//     }

//     // Try multiple endpoints with fallbacks
//     const baseUrl = getBaseUrl();
//     const endpoints = [
//       `${baseUrl}/api/products/${productId}`,
//       `${baseUrl}/api/direct/products/${productId}`,
//       `${baseUrl}/api/admin/products/${productId}`,
//     ];

//     // CRITICAL FIX: Perform a direct admin login to get a fresh token
//     console.log("Starting authentication token retrieval for product update");

//     let authToken;
//     try {
//       console.log("Attempting direct admin login before product update");
//       authToken = await directAdminLogin();
//       console.log("Direct admin login successful, got fresh token");
//     } catch (loginError) {
//       console.error("Direct admin login failed, falling back to stored tokens");

//       // Try to get admin token from all possible sources
//       let adminToken = localStorage.getItem("adminToken");
//       if (!adminToken) {
//         console.log("No adminToken in localStorage, checking sessionStorage");
//         adminToken = sessionStorage.getItem("adminToken");
//       }

//       // Try to get regular token as fallback
//       const token = localStorage.getItem("token");

//       // Determine which token to use
//       authToken = adminToken || token;
//     }

//     // Log authentication token for debugging
//     console.log(
//       "Auth token available:",
//       !!authToken,
//       "First 10 chars:",
//       authToken ? authToken.substring(0, 10) + "..." : "none"
//     );

//     // Create headers with the token if available
//     const headers = authToken
//       ? {
//           Authorization: `Bearer ${authToken}`,
//           "Content-Type": "application/json",
//         }
//       : { "Content-Type": "application/json" };

//     // Log the headers for debugging
//     console.log(
//       "Request headers:",
//       headers.Authorization
//         ? `Authorization: Bearer ${headers.Authorization.substring(0, 10)}...`
//         : "No Authorization header"
//     );

//     let updatedProduct = null;
//     let error = null;

//     // CRITICAL FIX: Ensure images array is properly set before sending
//     if (
//       !processedProductData.images ||
//       !Array.isArray(processedProductData.images) ||
//       processedProductData.images.length === 0
//     ) {
//       console.error(
//         "Images array is empty or invalid in updateProduct! Attempting to fix..."
//       );

//       // CRITICAL FIX: Try to recover image from localStorage
//       let recoveredImage = null;
//       try {
//         // Get all keys in localStorage
//         const keys = Object.keys(localStorage);

//         // Find any temp image keys
//         const imageKeys = keys.filter((key) => key.startsWith("temp_image_"));

//         if (imageKeys.length > 0) {
//           // Sort by timestamp (newest first)
//           imageKeys.sort((a, b) => {
//             const timeA = parseInt(a.split("_")[2]);
//             const timeB = parseInt(b.split("_")[2]);
//             return timeB - timeA;
//           });

//           // Get the most recent image
//           const latestKey = imageKeys[0];
//           recoveredImage = localStorage.getItem(latestKey);

//           if (recoveredImage && recoveredImage.startsWith("data:image")) {
//             console.log("Recovered image from localStorage:", latestKey);
//             processedProductData.images = [recoveredImage];
//             console.log("Set recovered image in product data");

//             // Add a timestamp to force the server to recognize this as a new image
//             processedProductData.imageUpdated = Date.now();

//             // Skip the rest of the recovery process
//             console.log("Image recovery successful");
//           }
//         }
//       } catch (recoveryError) {
//         console.error(
//           "Error recovering image from localStorage:",
//           recoveryError
//         );
//       }

//       // If recovery failed, use a placeholder image
//       if (
//         !recoveredImage ||
//         !processedProductData.images ||
//         processedProductData.images.length === 0
//       ) {
//         console.log("Image recovery failed, using placeholder image");

//         // Try to use a placeholder image
//         const productType = processedProductData.name
//           ? getProductType(processedProductData.name)
//           : "furniture";

//         // Import the getPlaceholderByType function if available
//         let getPlaceholderByType;
//         try {
//           const {
//             getPlaceholderByType: importedFunc,
//           } = require("./reliableImageHelper");
//           getPlaceholderByType = importedFunc;
//         } catch (importError) {
//           console.warn("Could not import getPlaceholderByType, using fallback");
//           // Fallback placeholder function
//           getPlaceholderByType = () =>
//             "https://placehold.co/300x300/gray/white?text=Furniture";
//         }

//         // Set a placeholder image
//         processedProductData.images = [
//           getPlaceholderByType(productType, processedProductData.name),
//         ];
//         console.log("Added placeholder image to product data");
//       }
//     }

//     // CRITICAL FIX: Ensure the images array is properly formatted
//     if (
//       processedProductData.images &&
//       Array.isArray(processedProductData.images)
//     ) {
//       // Ensure all images are strings
//       processedProductData.images = processedProductData.images.filter(
//         (img) => typeof img === "string"
//       );

//       // Log the image count and first image type
//       console.log(
//         "Images array contains",
//         processedProductData.images.length,
//         "images. First image type:",
//         processedProductData.images.length > 0
//           ? processedProductData.images[0].startsWith("data:image")
//             ? "data URL"
//             : "URL"
//           : "none"
//       );
//     }

//     // Log the final processed data
//     console.log("Final processed product data for API:", {
//       ...processedProductData,
//       images: processedProductData.images
//         ? `${processedProductData.images.length} images`
//         : "No images",
//     });

//     // Try each endpoint until one works
//     for (const endpoint of endpoints) {
//       try {
//         // Try to update product at this endpoint

//         // CRITICAL FIX: Simplified headers approach to avoid CORS issues
//         console.log("Sending PUT request to:", endpoint);
//         console.log("With headers:", {
//           ...headers,
//           Authorization: headers.Authorization
//             ? `Bearer ${headers.Authorization.split(" ")[1].substring(
//                 0,
//                 20
//               )}...`
//             : "None",
//         });

//         // CRITICAL FIX: Ensure the image data is properly formatted for the server
//         const dataToSend = { ...processedProductData };

//         // Ensure images is always an array
//         if (dataToSend.images && !Array.isArray(dataToSend.images)) {
//           dataToSend.images = [dataToSend.images];
//           console.log("Converted images to array for server");
//         }

//         // Add a flag to indicate this is an image update
//         if (
//           dataToSend.images &&
//           dataToSend.images.length > 0 &&
//           dataToSend.images[0].startsWith("data:image")
//         ) {
//           dataToSend.imageUpdated = Date.now();
//           dataToSend.replaceImages = "true";
//           console.log("Added imageUpdated flag for server");
//         }

//         // Log the final data being sent
//         console.log("Final data being sent to server:", {
//           ...dataToSend,
//           images: dataToSend.images
//             ? `${dataToSend.images.length} images (first type: ${
//                 dataToSend.images[0]?.substring(0, 20) + "..."
//               })`
//             : "No images",
//         });

//         // Use standard headers to avoid CORS issues
//         const response = await axios.put(endpoint, dataToSend, {
//           headers: headers,
//           timeout: 30000, // Increased timeout for better reliability
//           withCredentials: true, // Send cookies with the request
//         });

//         // Check if we got valid data
//         if (response.data) {
//           // Extract product from various response formats
//           if (response.data.data) {
//             updatedProduct = response.data.data;
//             // Product updated successfully in data.data format
//             break;
//           } else if (response.data._id) {
//             updatedProduct = response.data;
//             // Product updated successfully in direct format
//             break;
//           }
//         }
//       } catch (endpointError) {
//         // Endpoint failed, try next one
//         error = endpointError;
//         // Continue to next endpoint
//       }
//     }

//     // If we successfully updated the product, return it
//     if (updatedProduct) {
//       // Product updated successfully in database
//       return updatedProduct;
//     }

//     // If all endpoints failed, throw an error
//     throw (
//       error ||
//       new Error(`Failed to update product with ID ${productId} in database`)
//     );
//   } catch (error) {
//     // Error updating product in database
//     throw error;
//   }
// };

/**
 * Update a product in the database with fallbacks
 * @param {string} productId - ID of product to update
 * @param {Object|FormData} productData - Updated product data (can be FormData for images)
 * @returns {Promise<Object|null>} - Updated product object or null if update failed
 */
// export const updateProduct = async (productId, productData) => {
//   try {
//     const baseUrl = getBaseUrl();

//     // Get auth token
//     const authToken =
//       localStorage.getItem("adminToken") ||
//       sessionStorage.getItem("adminToken") ||
//       localStorage.getItem("token");

//     // Prepare request config
//     const config = {
//       headers: {
//         Authorization: authToken ? `Bearer ${authToken}` : undefined,
//       },
//       timeout: 30000,
//     };

//     // Handle FormData vs regular object
//     let finalData = productData;
//     if (productData instanceof FormData) {
//       // For FormData, let browser set Content-Type with boundary
//       delete config.headers["Content-Type"];
//     } else {
//       // For JSON data, ensure proper formatting
//       config.headers["Content-Type"] = "application/json";

//       // Ensure images array exists
//       if (!productData.images || !Array.isArray(productData.images)) {
//         productData.images = [];
//       }

//       // Convert to JSON string
//       finalData = JSON.stringify(productData);
//     }

//     // Try multiple endpoints
//     const endpoints = [
//       `${baseUrl}/api/products/${productId}`,
//       `${baseUrl}/api/admin/products/${productId}`,
//     ];

//     for (const endpoint of endpoints) {
//       try {
//         console.log(`Attempting update at ${endpoint}`);
//         const response = await axios.put(endpoint, finalData, config);

//         // Return the updated product data
//         return response.data?.data || response.data;
//       } catch (error) {
//         console.error(`Update failed at ${endpoint}:`, error);
//         if (error.response?.status === 400) {
//           // Log detailed error info for 400 errors
//           console.error("Server response:", error.response.data);
//         }
//         continue;
//       }
//     }

//     throw new Error("All update attempts failed");
//   } catch (error) {
//     console.error("Error in updateProduct:", error);
//     throw error;
//   }
// };

export const updateProduct = async (productId, formData) => {
  try {
    const baseUrl = getBaseUrl();
    const authToken =
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");

    const response = await axios.put(
      `${baseUrl}/api/products/${productId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 30000,
      }
    );

    // More flexible response handling
    if (response.data) {
      return response.data.data || response.data; // Handle both formats
    }
    throw new Error("Empty response from server");
  } catch (error) {
    console.error("Update error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to update product"
    );
  }
};
/**
 *
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
