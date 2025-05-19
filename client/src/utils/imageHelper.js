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
    // If it's already a full URL and it's from a reliable source like Cloudinary or placeholder
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      // If it's a Cloudinary URL, return it as is
      if (
        imagePath.includes("cloudinary.com") ||
        imagePath.includes("placehold.co") ||
        imagePath.includes("placeholder.com")
      ) {
        return imagePath;
      }

      // If it's a localhost URL, use a default image instead
      if (
        imagePath.includes("localhost") ||
        imagePath.includes("furniture-q3nb.onrender.com")
      ) {
        return getDefaultImageForProduct(
          options.productName,
          options.productId
        );
      }

      // For any other URL, return it as is
      return imagePath;
    }

    // For relative paths, use a default image based on product type
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
  // Default placeholder using a reliable external service
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

      // Map of product types to reliable external default images
      const productTypeImages = {
        "dinner set":
          "https://placehold.co/300x300/brown/white?text=Dinner+Set",
        dinning: "https://placehold.co/300x300/brown/white?text=Dining+Table",
        beds: "https://placehold.co/300x300/blue/white?text=Bed",
        "bed set": "https://placehold.co/300x300/blue/white?text=Bed+Set",
        wardroom: "https://placehold.co/300x300/purple/white?text=Wardrobe",
        wardrobe: "https://placehold.co/300x300/purple/white?text=Wardrobe",
        sofa: "https://placehold.co/300x300/red/white?text=Sofa",
        chair: "https://placehold.co/300x300/green/white?text=Chair",
        table: "https://placehold.co/300x300/orange/white?text=Table",
      };

      // Check if the product name contains any of the keys
      for (const [key, url] of Object.entries(productTypeImages)) {
        if (lowerName.includes(key)) {
          return url;
        }
      }

      // If no match found, create a placeholder with the product name
      const encodedName = encodeURIComponent(productName.substring(0, 20));
      return `https://placehold.co/300x300/gray/white?text=${encodedName}`;
    }

    // If we have a product ID but no name, use a generic image with the ID
    if (productId) {
      const shortId = productId.substring(productId.length - 6);
      return `https://placehold.co/300x300/gray/white?text=Product+${shortId}`;
    }

    return defaultPlaceholder;
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
    // If it's already a reliable external URL, return it immediately
    if (
      imageUrl.includes("placehold.co") ||
      imageUrl.includes("placeholder.com") ||
      imageUrl.includes("cloudinary.com")
    ) {
      return imageUrl;
    }

    // If it's a server URL (either localhost or render.com), use the fallback
    if (
      imageUrl.includes("localhost") ||
      imageUrl.includes("furniture-q3nb.onrender.com") ||
      imageUrl.includes("/uploads/")
    ) {
      return fallbackUrl;
    }

    // For any other URL, return the fallback to be safe
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
