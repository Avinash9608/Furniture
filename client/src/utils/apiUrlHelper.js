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
  // Get the current hostname and origin
  const hostname = window.location.hostname;
  const origin = window.location.origin;

  // Check if we're on Render's domain
  if (hostname.includes("render.com") || hostname === "furniture-q3nb.onrender.com") {
    console.log("Using Render production API URL");
    return `${origin}/api`;
  }

  // In development, use localhost:5000
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    console.log("Using development API URL");
    return "http://localhost:5000/api";
  }

  // In other production environments, use relative path
  console.log("Using relative API URL");
  return "/api";
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
  const hostname = window.location.hostname;
  const origin = window.location.origin;

  // Always use HTTPS in production
  if (hostname.includes("render.com") || hostname === "furniture-q3nb.onrender.com") {
    return origin.replace('http:', 'https:');
  }

  // In development, use localhost:5000
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  // In other production environments, use HTTPS
  return origin.replace('http:', 'https:');
};

/**
 * Get the full URL for an asset
 * @param {string|object} asset - The asset path or object containing the path
 * @returns {string} The full URL for the asset
 */
export const getAssetUrl = (asset) => {
  if (!asset) return '';

  // If the asset is an object (like from FileUpload)
  if (typeof asset === 'object') {
    // If it's a File object or has a preview URL
    if (asset instanceof File || asset.preview) {
      return asset.preview || URL.createObjectURL(asset);
    }
    // If it has a URL property
    if (asset.url) {
      return getAssetUrl(asset.url);
    }
    // If it has a file property that's a File object
    if (asset.file instanceof File) {
      return URL.createObjectURL(asset.file);
    }
  }

  // If it's a string URL
  if (typeof asset === 'string') {
    // If it's already a full URL
    if (asset.startsWith('http')) {
      const hostname = window.location.hostname;
      // Ensure HTTPS in production
      if (hostname.includes("render.com") || hostname === "furniture-q3nb.onrender.com") {
        return asset.replace('http:', 'https:');
      }
      return asset;
    }

    // Handle relative paths
    const baseUrl = getAssetsBaseUrl();
    const normalizedPath = asset.startsWith('/') ? asset : `/${asset}`;
    return `${baseUrl}${normalizedPath}`;
  }

  return '';
};

/**
 * Fix image URLs to ensure they work in both development and production
 * @param {string[]} urls - Array of image URLs to fix
 * @returns {string[]} Array of fixed image URLs
 */
export const fixImageUrls = (urls) => {
  if (!Array.isArray(urls)) return [];
  
  return urls.map(url => {
    if (!url) return '';
    
    // If it's an object
    if (typeof url === 'object') {
      return getAssetUrl(url);
    }
    
    // If it's a string
    return getAssetUrl(url);
  });
};

export default {
  getApiBaseUrl,
  getApiUrl,
  getAssetsBaseUrl,
  getAssetUrl,
  fixImageUrls
};
