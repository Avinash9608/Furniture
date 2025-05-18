/**
 * Utility functions for handling image URLs in both development and production environments
 */

/**
 * Gets the correct image URL based on the environment
 * @param {string} imagePath - The image path (e.g., /uploads/image.jpg)
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    console.log("No image path provided, using placeholder");
    return "https://placehold.co/300x300/gray/white?text=No+Image";
  }

  // Log the image path for debugging
  console.log("Processing image path:", imagePath);

  // If it's already a full URL (starts with http or https), return it as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    // Fix localhost URLs in production
    if (
      window.location.hostname.includes("render.com") &&
      imagePath.includes("localhost")
    ) {
      const fixedUrl = imagePath.replace(
        "http://localhost:5000",
        "https://furniture-q3nb.onrender.com"
      );
      console.log("Fixed localhost URL in production:", fixedUrl);
      return fixedUrl;
    }
    console.log("Using full URL:", imagePath);
    return imagePath;
  }

  // If it's a relative path starting with /uploads
  if (imagePath.startsWith("/uploads/")) {
    // Get the hostname for environment detection
    const hostname = window.location.hostname;
    const isProduction =
      hostname.includes("render.com") ||
      hostname === "furniture-q3nb.onrender.com";

    // In production, use the Render URL
    if (isProduction) {
      const baseUrl = "https://furniture-q3nb.onrender.com";
      const fullUrl = `${baseUrl}${imagePath}`;
      console.log("Production image URL:", fullUrl);
      return fullUrl;
    }

    // In development, use the local server URL
    const devUrl = `${
      import.meta.env.VITE_API_URL || "http://localhost:5000"
    }${imagePath}`;
    console.log("Development image URL:", devUrl);
    return devUrl;
  }

  // If it's just a filename, assume it's in the uploads directory
  if (!imagePath.startsWith("/")) {
    // Get the hostname for environment detection
    const hostname = window.location.hostname;
    const isProduction =
      hostname.includes("render.com") ||
      hostname === "furniture-q3nb.onrender.com";

    // In production, use the Render URL
    if (isProduction) {
      const baseUrl = "https://furniture-q3nb.onrender.com";
      const fullUrl = `${baseUrl}/uploads/${imagePath}`;
      console.log("Production filename URL:", fullUrl);
      return fullUrl;
    }

    // In development, use the local server URL
    const devUrl = `${
      import.meta.env.VITE_API_URL || "http://localhost:5000"
    }/uploads/${imagePath}`;
    console.log("Development filename URL:", devUrl);
    return devUrl;
  }

  // For any other case, return the path as is with base URL
  const hostname = window.location.hostname;
  const isProduction =
    hostname.includes("render.com") ||
    hostname === "furniture-q3nb.onrender.com";
  const baseUrl = isProduction
    ? "https://furniture-q3nb.onrender.com"
    : import.meta.env.VITE_API_URL || "http://localhost:5000";
  const fullUrl = `${baseUrl}${imagePath}`;
  console.log("Fallback URL:", fullUrl);
  return fullUrl;
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
