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
    return 'https://placehold.co/300x300/gray/white?text=No+Image';
  }

  // If it's already a full URL (starts with http or https), return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path starting with /uploads
  if (imagePath.startsWith('/uploads/')) {
    // In production, use the Render URL
    if (import.meta.env.PROD) {
      return `${import.meta.env.VITE_API_URL || 'https://furniture-q3nb.onrender.com'}${imagePath}`;
    }
    // In development, use the local server URL
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;
  }

  // For other relative paths
  return imagePath;
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
    fixedProduct.images = fixedProduct.images.map(img => 
      typeof img === 'string' ? getImageUrl(img) : img
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
  return products.map(product => fixProductImageUrls(product));
};
