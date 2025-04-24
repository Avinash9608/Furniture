/**
 * Robust API Utility
 * 
 * This utility provides a robust approach to making API requests that works in all environments.
 * It tries multiple endpoints and provides detailed logging for debugging.
 */

import axios from 'axios';

// Create a base axios instance
const baseApi = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Make a robust API request that tries multiple endpoints
 * 
 * @param {string} path - The API path (e.g., '/contact', '/products')
 * @param {string} method - The HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - The request data (for POST, PUT)
 * @param {object} options - Additional options
 * @returns {Promise} - A promise that resolves to the API response
 */
export const makeRobustRequest = async (path, method = 'GET', data = null, options = {}) => {
  const baseUrl = window.location.origin;
  console.log(`Making robust ${method} request to ${path}`);
  
  // Generate endpoints to try
  const endpoints = generateEndpoints(baseUrl, path);
  
  // Try each endpoint until one works
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`Attempt ${i + 1}: Trying ${method} request to ${endpoint}`);
    
    try {
      let response;
      
      // Make the request based on the method
      switch (method.toUpperCase()) {
        case 'GET':
          response = await baseApi.get(endpoint, options);
          break;
        case 'POST':
          response = await baseApi.post(endpoint, data, options);
          break;
        case 'PUT':
          response = await baseApi.put(endpoint, data, options);
          break;
        case 'DELETE':
          response = await baseApi.delete(endpoint, options);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      console.log(`Success with endpoint ${endpoint}:`, response);
      return response;
    } catch (error) {
      console.error(`Error with endpoint ${endpoint}:`, error.message);
      
      // If this is the last endpoint, throw the error
      if (i === endpoints.length - 1) {
        throw error;
      }
      // Otherwise, try the next endpoint
    }
  }
};

/**
 * Generate endpoints to try for a given path
 * 
 * @param {string} baseUrl - The base URL (e.g., 'https://furniture-q3nb.onrender.com')
 * @param {string} path - The API path (e.g., '/contact', '/products')
 * @returns {array} - An array of endpoints to try
 */
const generateEndpoints = (baseUrl, path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  return [
    // Direct URL with /api prefix (standard API route)
    `${baseUrl}/api/${cleanPath}`,
    // Direct URL without /api prefix (fallback route)
    `${baseUrl}/${cleanPath}`,
    // Direct URL with double /api prefix (for misconfigured environments)
    `${baseUrl}/api/api/${cleanPath}`,
    // Absolute URL to the deployed backend (last resort)
    `https://furniture-q3nb.onrender.com/api/${cleanPath}`
  ];
};

/**
 * Robust API utility with methods for common HTTP verbs
 */
export const robustApi = {
  get: (path, options) => makeRobustRequest(path, 'GET', null, options),
  post: (path, data, options) => makeRobustRequest(path, 'POST', data, options),
  put: (path, data, options) => makeRobustRequest(path, 'PUT', data, options),
  delete: (path, options) => makeRobustRequest(path, 'DELETE', null, options)
};

export default robustApi;
