# API Endpoints Fix for Render Deployment

This guide explains how to fix API endpoint issues when deploying the Shyam Furnitures application to Render.

## Problem

When deploying the application to Render, API requests fail with a 404 Not Found error or show a duplicate `/api/api/` prefix in the URL. This happens because:

1. The API base URL already includes `/api` (configured in `getBaseURL()` function)
2. The API endpoints also include `/api` in their paths
3. This results in duplicate `/api/api/` prefixes in the URLs

## Solution

### 1. Check the API Base URL Configuration

First, check how the API base URL is configured in `client/src/utils/api.js`:

```javascript
// Determine the API base URL based on environment
const getBaseURL = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, use relative URL
  if (import.meta.env.PROD) {
    return "/api";
  }
  
  // In development, use localhost
  return "http://localhost:5000/api";
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  // other configuration...
});
```

### 2. Remove Duplicate `/api` Prefixes from Endpoints

Since the base URL already includes `/api`, we need to remove the `/api` prefix from all API endpoints:

#### Before:
```javascript
// Contact API
export const contactAPI = {
  create: (contactData) => {
    return api.post("/api/contact", contactData);
  },
  // other methods...
};
```

#### After:
```javascript
// Contact API
export const contactAPI = {
  create: (contactData) => {
    return api.post("/contact", contactData);
  },
  // other methods...
};
```

### 3. Automated Fix

You can use the provided `fix-api-endpoints.js` script to automatically fix all API endpoints:

```javascript
const fs = require('fs');
const path = require('path');

// Path to the API file
const apiFilePath = path.join(__dirname, 'client', 'src', 'utils', 'api.js');

// Read the file
let content = fs.readFileSync(apiFilePath, 'utf8');

// Check if the baseURL already includes /api
const baseUrlIncludesApi = content.includes('return "/api"') || 
                          content.includes('return "http://localhost:5000/api"');

if (baseUrlIncludesApi) {
  // Replace all occurrences of /api/ in API endpoints
  const patterns = [
    { from: 'api.post("/api/', to: 'api.post("/' },
    { from: 'api.get("/api/', to: 'api.get("/' },
    // other patterns...
  ];
  
  // Apply all replacements
  patterns.forEach(pattern => {
    content = content.replace(new RegExp(pattern.from, 'g'), pattern.to);
  });
  
  // Write the updated content back to the file
  fs.writeFileSync(apiFilePath, content);
}
```

### 4. Testing the Fix

To test the fix locally:

1. Build the client application:
   ```
   cd client
   npm run build
   ```

2. Create a simple test server:
   ```javascript
   const express = require('express');
   const path = require('path');
   const app = express();
   const PORT = 4173;

   // Serve static files from the dist directory
   app.use(express.static(path.join(__dirname, 'dist')));

   // API routes
   app.post('/contact', (req, res) => {
     console.log('Contact form submission received');
     res.json({ success: true, message: 'Contact form submitted successfully' });
   });

   // Catch-all route for the React app
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'dist', 'index.html'));
   });

   // Start the server
   app.listen(PORT, () => {
     console.log(`Test server running at http://localhost:${PORT}`);
   });
   ```

3. Run the test server and check the contact form

## Deployment to Render

After making these changes:

1. Commit and push your changes to your repository
2. Deploy to Render using the render-build script
3. Monitor the logs for any issues

## Why This Works

The issue was caused by having the `/api` prefix in two places:

1. In the base URL: `baseURL: "/api"`
2. In the endpoint paths: `api.post("/api/contact", ...)`

This resulted in duplicate `/api/api/` prefixes in the URLs. By removing the `/api` prefix from the endpoint paths, we ensure that the requests are sent to the correct URLs.

## Additional Notes

- The API base URL is determined dynamically based on the environment
- In production, it uses a relative URL (`/api`)
- In development, it uses the localhost URL (`http://localhost:5000/api`)
- This ensures that API requests work correctly in all environments
