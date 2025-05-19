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

    // Special handling for problematic products
    if (options.productName) {
      const lowerName = options.productName.toLowerCase();

      // Check if this is one of the problematic products
      if (
        lowerName.includes("dinner set") ||
        lowerName.includes("dinning") ||
        lowerName.includes("beds set") ||
        lowerName.includes("wardroom") ||
        lowerName.includes("wardrobe")
      ) {
        // For these products, try to use a fixed image path format
        if (isProduction) {
          // In production, use a specific format that works
          if (imagePath.includes("product-")) {
            // This is likely a dynamically generated filename
            return `${productionBaseUrl}/uploads/${imagePath.split("/").pop()}`;
          }
        }
      }
    }

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
    // Special handling for problematic products
    if (options.productName) {
      const lowerName = options.productName.toLowerCase();

      // Check if this is one of the problematic products
      if (
        lowerName.includes("dinner set") ||
        lowerName.includes("dinning") ||
        lowerName.includes("beds set") ||
        lowerName.includes("wardroom") ||
        lowerName.includes("wardrobe")
      ) {
        // For these products, try to use a fixed image path format
        const hostname = window.location.hostname;
        const isProduction =
          hostname.includes("render.com") ||
          hostname === "furniture-q3nb.onrender.com";

        if (isProduction) {
          // In production, use a specific format that works
          if (imageUrl.includes("product-")) {
            // This is likely a dynamically generated filename
            const fixedUrl = `https://furniture-q3nb.onrender.com/uploads/${imageUrl
              .split("/")
              .pop()}`;

            // Try to fetch the fixed URL
            try {
              const fixedResponse = await fetch(fixedUrl, {
                method: "HEAD",
                cache: "no-cache",
                headers: {
                  "Cache-Control": "no-cache",
                },
              });

              if (fixedResponse.ok) {
                return fixedUrl;
              }
            } catch (fixedError) {
              console.error("Error fetching fixed URL:", fixedError);
            }
          }

          // If we couldn't fix the URL, return the product-specific default
          return fallbackUrl;
        }
      }
    }

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

    // Try one more approach - extract the filename and use it directly
    try {
      const filename = imageUrl.split("/").pop();
      if (filename && !filename.includes("://")) {
        const directUrl = `https://furniture-q3nb.onrender.com/uploads/${filename}`;

        const directResponse = await fetch(directUrl, {
          method: "HEAD",
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (directResponse.ok) {
          return directUrl;
        }
      }
    } catch (directError) {
      console.error("Error with direct URL approach:", directError);
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
