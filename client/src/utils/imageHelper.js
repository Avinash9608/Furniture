/**
 * Utility functions for handling image URLs in both development and production environments
 */

/**
 * Gets the correct image URL based on the environment
 * @param {string} imagePath - The image path (e.g., /uploads/image.jpg)
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imagePath) => {
  // Use a default placeholder if no image path is provided
  if (!imagePath || imagePath === "undefined" || imagePath === "null") {
    return "https://placehold.co/300x300/gray/white?text=No+Image";
  }

  try {
    // Get the hostname for environment detection
    const hostname = window.location.hostname;
    const isProduction =
      hostname.includes("render.com") ||
      hostname === "furniture-q3nb.onrender.com";

    // Production base URL
    const productionBaseUrl = "https://furniture-q3nb.onrender.com";

    // Development base URL
    const developmentBaseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5000";

    // Current base URL based on environment
    const baseUrl = isProduction ? productionBaseUrl : developmentBaseUrl;

    // Clean up the image path
    let cleanPath = imagePath;

    // If it's already a full URL
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      // Fix localhost URLs in production
      if (isProduction && imagePath.includes("localhost")) {
        return imagePath.replace(
          /http:\/\/localhost(:\d+)?/g,
          productionBaseUrl
        );
      }

      // If it's already a full URL and doesn't need fixing, return it as is
      return imagePath;
    }

    // Handle relative paths
    if (imagePath.startsWith("/uploads/")) {
      // Path already starts with /uploads/, just add the base URL
      return `${baseUrl}${imagePath}`;
    }

    // If it's just a filename or a path without /uploads/ prefix
    if (!imagePath.includes("/uploads/")) {
      // Check if it's already a path but missing the /uploads/ prefix
      if (imagePath.startsWith("/")) {
        // It's a path but doesn't have /uploads/, check if it's in uploads
        if (imagePath.includes("/uploads")) {
          // It has uploads somewhere in the path, use as is
          return `${baseUrl}${imagePath}`;
        } else {
          // Add /uploads/ prefix
          return `${baseUrl}/uploads${imagePath}`;
        }
      } else {
        // It's just a filename, add /uploads/ prefix
        return `${baseUrl}/uploads/${imagePath}`;
      }
    }

    // For any other case, add the base URL
    return `${baseUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  } catch (error) {
    console.error("Error processing image URL:", error);
    // Return a placeholder in case of any error
    return "https://placehold.co/300x300/gray/white?text=Error+Loading+Image";
  }
};

/**
 * Converts all image URLs in a product object to use the correct domain
 * @param {Object} product - The product object
 * @returns {Object} - The product with fixed image URLs
 */
export const fixProductImageUrls = (product) => {
  if (!product) return product;

  const fixedProduct = { ...product };

  // Fix images array
  if (fixedProduct.images && Array.isArray(fixedProduct.images)) {
    fixedProduct.images = fixedProduct.images.map((img) =>
      typeof img === "string" ? getImageUrl(img) : img
    );
  }

  return fixedProduct;
};

/**
 * Converts all image URLs in an array of product objects
 * @param {Array} products - Array of product objects
 * @returns {Array} - Array of products with fixed image URLs
 */
export const fixProductsImageUrls = (products) => {
  if (!products || !Array.isArray(products)) return products;
  return products.map((product) => fixProductImageUrls(product));
};

/**
 * Checks if an image URL is valid and returns a fallback if not
 * @param {string} imageUrl - The image URL to check
 * @param {string} fallbackUrl - Optional fallback URL
 * @returns {Promise<string>} - A promise that resolves to the valid image URL or fallback
 */
export const validateImageUrl = async (imageUrl) => {
  const fallbackUrl = "https://placehold.co/300x300/gray/white?text=No+Image";

  if (!imageUrl) return fallbackUrl;

  try {
    // Try to fetch the image with a HEAD request
    const response = await fetch(imageUrl, {
      method: "HEAD",
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    // If the response is ok, return the original URL
    if (response.ok) {
      return imageUrl;
    }

    // If the response is not ok, try with the production URL
    const productionUrl = imageUrl.replace(
      /http:\/\/localhost(:\d+)?/g,
      "https://furniture-q3nb.onrender.com"
    );

    if (productionUrl !== imageUrl) {
      const productionResponse = await fetch(productionUrl, {
        method: "HEAD",
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (productionResponse.ok) {
        return productionUrl;
      }
    }

    // If all else fails, return the fallback URL
    return fallbackUrl;
  } catch (error) {
    console.error("Error validating image URL:", error);
    return fallbackUrl;
  }
};

/**
 * Gets a cached image URL or validates and caches it
 * @param {string} imagePath - The image path
 * @returns {string} - The image URL (may be a placeholder if invalid)
 */
const imageCache = {};

export const getCachedImageUrl = (imagePath) => {
  // If we have a cached result, return it
  if (imageCache[imagePath]) {
    return imageCache[imagePath];
  }

  // Otherwise, get the URL and cache it for next time
  const imageUrl = getImageUrl(imagePath);
  imageCache[imagePath] = imageUrl;

  // Validate the URL in the background and update the cache
  validateImageUrl(imageUrl).then((validatedUrl) => {
    imageCache[imagePath] = validatedUrl;
  });

  return imageUrl;
};
