/**
 * API URL Helper
 * 
 * This utility provides functions to handle API URLs consistently across the application.
 * It ensures that API calls work correctly in both development and production environments.
 */

/**
 * Get the base URL for API calls
 * @returns {string} The base URL for API calls
 */
export const getApiBaseUrl = () => {
  // Always use relative URLs for API calls
  return '/api';
};

/**
 * Get the full URL for an API endpoint
 * @param {string} endpoint - The API endpoint (without /api prefix)
 * @returns {string} The full URL for the API endpoint
 */
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  
  // Ensure endpoint doesn't start with a slash if baseUrl ends with one
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  return `${baseUrl}/${normalizedEndpoint}`;
};

/**
 * Get the base URL for static assets
 * @returns {string} The base URL for static assets
 */
export const getAssetsBaseUrl = () => {
  // Use the current origin
  return window.location.origin;
};

/**
 * Get the full URL for a static asset
 * @param {string} path - The asset path
 * @returns {string} The full URL for the asset
 */
export const getAssetUrl = (path) => {
  // If it's already a full URL, return as is
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  
  const baseUrl = getAssetsBaseUrl();
  
  // Ensure path starts with a slash
  const normalizedPath = path && !path.startsWith('/') ? `/${path}` : path;
  
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Fix image URLs in objects
 * @param {Object|Array} data - The data containing image URLs
 * @param {string[]} imageFields - The fields containing image URLs
 * @returns {Object|Array} The data with fixed image URLs
 */
export const fixImageUrls = (data, imageFields = ['image', 'images']) => {
  if (!data) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => fixImageUrls(item, imageFields));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const result = { ...data };
    
    // Fix image URLs in specified fields
    imageFields.forEach(field => {
      if (result[field]) {
        if (Array.isArray(result[field])) {
          // Handle array of images
          result[field] = result[field].map(img => 
            typeof img === 'string' ? getAssetUrl(img) : img
          );
        } else if (typeof result[field] === 'string') {
          // Handle single image
          result[field] = getAssetUrl(result[field]);
        }
      }
    });
    
    return result;
  }
  
  return data;
};

export default {
  getApiBaseUrl,
  getApiUrl,
  getAssetsBaseUrl,
  getAssetUrl,
  fixImageUrls
};
