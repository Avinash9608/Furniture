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

  // In production on Render, use the current origin
  if (hostname.includes("render.com") || hostname === "furniture-q3nb.onrender.com") {
    return origin;
  }

  // In development, use localhost:5000
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  // In other production environments, use the current origin
  return origin;
};

/**
 * Get the full URL for an asset
 * @param {string} assetPath - The asset path
 * @returns {string} The full URL for the asset
 */
export const getAssetUrl = (assetPath) => {
  const baseUrl = getAssetsBaseUrl();
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Fix image URLs to ensure they work in both development and production
 * @param {string[]} urls - Array of image URLs to fix
 * @returns {string[]} Array of fixed image URLs
 */
export const fixImageUrls = (urls) => {
  if (!Array.isArray(urls)) return [];
  
  return urls.map(url => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
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
