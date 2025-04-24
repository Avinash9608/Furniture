# API Prefix Fix for Render Deployment

This document explains the fix for the duplicate API prefix issue in the Shyam Furnitures application.

## Problem

When deploying the application to Render, the contact form and other API features fail with 404 errors. The error shows:

```
POST https://furniture-q3nb.onrender.com/api/api/contact 404 (Not Found)
```

This happens because:

1. The server routes are configured with `/api` prefix (e.g., `/api/contact`)
2. The client-side API utility also adds `/api` prefix to endpoints
3. This results in duplicate `/api/api/` prefixes in the URLs

## Solution

We've implemented a middleware solution that automatically detects and fixes requests with duplicate `/api` prefixes.

### 1. Created a Middleware

We created a new middleware file `server/middleware/apiPrefixFix.js`:

```javascript
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
```

### 2. Added the Middleware to the Server

We added the middleware to `server/index.js` before the API routes:

```javascript
// Logging middleware
const logger = require("./middleware/logger");
app.use(logger);

// Fix for duplicate API prefixes in client requests
const apiPrefixFix = require('./middleware/apiPrefixFix');
app.use(apiPrefixFix);

// Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

### 3. Removed Individual Route Handlers

We removed the individual route handlers for duplicate API prefixes since the middleware now handles all of them automatically.

## How It Works

1. When a request comes in with a duplicate `/api` prefix (e.g., `/api/api/contact`), the middleware detects it
2. The middleware modifies the request URL to remove the duplicate prefix
3. The request is then processed by the correct route handler

This solution is:
- **Robust**: It handles all API endpoints, not just the contact form
- **Maintainable**: It's a single middleware instead of multiple route handlers
- **Transparent**: It logs the fix for debugging purposes

## Deployment Instructions

1. Add the new middleware file `server/middleware/apiPrefixFix.js`
2. Update `server/index.js` to use the middleware
3. Deploy to Render

## Long-Term Solution

For a more permanent solution, consider one of these approaches:

1. **Update Client-Side API Utility**: Remove the `/api` prefix from all endpoint paths in the client code
2. **Configure Vite Proxy**: Update the Vite development server proxy to match the production environment

## Testing

After deployment, test the contact form and other API features on the live site. The middleware will automatically fix any requests with duplicate `/api` prefixes.
