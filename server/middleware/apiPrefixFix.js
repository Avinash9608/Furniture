/**
 * Middleware to handle duplicate API prefixes in requests
 * This fixes the issue where client-side code sends requests to /api/api/* instead of /api/*
 */

const apiPrefixFix = (req, res, next) => {
  // Check if the URL has a duplicate /api prefix
  if (req.originalUrl.startsWith('/api/api/')) {
    // Log the fix for debugging
    console.log(`Fixing duplicate API prefix: ${req.originalUrl} -> ${req.originalUrl.replace('/api/api/', '/api/')}`);
    
    // Modify the URL to remove the duplicate prefix
    req.url = req.url.replace('/api/', '/');
  }
  
  // Continue to the next middleware
  next();
};

module.exports = apiPrefixFix;
