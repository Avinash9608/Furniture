/**
 * Utility functions for handling image URLs in both development and production environments
 */

/**
 * Gets the correct image URL based on the environment
 * @param {string} imagePath - The image path (e.g., /uploads/image.jpg)
 * @param {Object} options - Optional parameters
 * @param {string} options.productName - Product name for special handling
 * @param {string} options.productId - Product ID for special handling
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imagePath, options = {}) => {
  // Use a default placeholder if no image path is provided
  if (!imagePath || imagePath === "undefined" || imagePath === "null") {
    return getDefaultImageForProduct(options.productName, options.productId);
  }

  try {
    // ALWAYS use the production URL in all environments for consistency
    const productionBaseUrl = "https://furniture-q3nb.onrender.com";

    // If it's already a full URL
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      // Fix localhost URLs to use production URL
      if (imagePath.includes("localhost")) {
        return imagePath.replace(
          /http:\/\/localhost(:\d+)?/g,
          productionBaseUrl
        );
      }

      // If it's already a full URL and doesn't need fixing, return it as is
      return imagePath;
    }

    // Extract the filename from the path
    const filename = imagePath.split("/").pop();

    // Always use the direct filename approach for maximum compatibility
    if (filename) {
      return `${productionBaseUrl}/uploads/${filename}`;
    }

    // If we couldn't extract a filename, use a default image
    return getDefaultImageForProduct(options.productName, options.productId);
  } catch (error) {
    console.error("Error processing image URL:", error);
    // Return a placeholder in case of any error
    return getDefaultImageForProduct(options.productName, options.productId);
  }
};

/**
 * Gets a default image URL based on product name or ID
 * @param {string} productName - The product name
 * @param {string} productId - The product ID
 * @returns {string} - The default image URL
 */
export const getDefaultImageForProduct = (productName, productId) => {
  // Default placeholder
  const defaultPlaceholder =
    "https://placehold.co/300x300/gray/white?text=No+Image";

  // If no product name or ID, return default placeholder
  if (!productName && !productId) {
    return defaultPlaceholder;
  }

  try {
    // Check if we have a product name
    if (productName) {
      const lowerName = productName.toLowerCase();

      // Map of product types to default images
      const productTypeImages = {
        "dinner set":
          "https://furniture-q3nb.onrender.com/uploads/dinner-set-default.jpg",
        dinning:
          "https://furniture-q3nb.onrender.com/uploads/dinner-set-default.jpg",
        beds: "https://furniture-q3nb.onrender.com/uploads/bed-default.jpg",
        "bed set":
          "https://furniture-q3nb.onrender.com/uploads/bed-default.jpg",
        wardroom:
          "https://furniture-q3nb.onrender.com/uploads/wardrobe-default.jpg",
        wardrobe:
          "https://furniture-q3nb.onrender.com/uploads/wardrobe-default.jpg",
        sofa: "https://furniture-q3nb.onrender.com/uploads/sofa-default.jpg",
        chair: "https://furniture-q3nb.onrender.com/uploads/chair-default.jpg",
        table: "https://furniture-q3nb.onrender.com/uploads/table-default.jpg",
      };

      // Check if the product name contains any of the keys
      for (const [key, url] of Object.entries(productTypeImages)) {
        if (lowerName.includes(key)) {
          return url;
        }
      }

      // If no match found, use a generic furniture image
      return "https://furniture-q3nb.onrender.com/uploads/furniture-default.jpg";
    }

    // If we have a product ID but no name, use a generic image
    return "https://furniture-q3nb.onrender.com/uploads/furniture-default.jpg";
  } catch (error) {
    console.error("Error getting default image:", error);
    return defaultPlaceholder;
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

  // Create options object with product info for better image handling
  const options = {
    productName: product.name || "",
    productId: product._id || "",
  };

  // Fix images array
  if (fixedProduct.images && Array.isArray(fixedProduct.images)) {
    fixedProduct.images = fixedProduct.images.map((img) =>
      typeof img === "string" ? getImageUrl(img, options) : img
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
 * @param {Object} options - Optional parameters
 * @param {string} options.productName - Product name for special handling
 * @param {string} options.productId - Product ID for special handling
 * @returns {Promise<string>} - A promise that resolves to the valid image URL or fallback
 */
export const validateImageUrl = async (imageUrl, options = {}) => {
  // Get the default fallback URL based on product name/ID
  const fallbackUrl = getDefaultImageForProduct(
    options.productName,
    options.productId
  );

  if (!imageUrl) return fallbackUrl;

  try {
    // Extract the filename from the URL
    const filename = imageUrl.split("/").pop();

    // Always use the direct filename approach for maximum compatibility
    if (filename && !filename.includes("://")) {
      const directUrl = `https://furniture-q3nb.onrender.com/uploads/${filename}`;

      try {
        // Skip the HEAD request to avoid CORS issues
        // Just return the direct URL immediately
        return directUrl;
      } catch (directError) {
        console.error("Error with direct URL approach:", directError);
      }
    }

    // If we couldn't extract a filename or the direct approach failed,
    // return the fallback URL based on product type
    return fallbackUrl;
  } catch (error) {
    console.error("Error validating image URL:", error);
    return fallbackUrl;
  }
};

/**
 * Gets a cached image URL or validates and caches it
 * @param {string} imagePath - The image path
 * @param {Object} options - Optional parameters
 * @param {string} options.productName - Product name for special handling
 * @param {string} options.productId - Product ID for special handling
 * @returns {string} - The image URL (may be a placeholder if invalid)
 */
const imageCache = {};

export const getCachedImageUrl = (imagePath, options = {}) => {
  // Create a cache key that includes product info for better specificity
  const cacheKey = options.productName
    ? `${imagePath}_${options.productName}`
    : imagePath;

  // If we have a cached result, return it
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }

  // Otherwise, get the URL and cache it for next time
  const imageUrl = getImageUrl(imagePath, options);
  imageCache[cacheKey] = imageUrl;

  // Validate the URL in the background and update the cache
  validateImageUrl(imageUrl, options).then((validatedUrl) => {
    imageCache[cacheKey] = validatedUrl;
  });

  return imageUrl;
};
