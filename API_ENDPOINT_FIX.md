# API Endpoint Fix for Render Deployment

This guide explains how to fix API endpoint issues when deploying the Shyam Furnitures application to Render.

## Problem

When deploying the application to Render, API requests fail with a 404 Not Found error. This happens because:

1. The client-side API utility is using relative paths like `/contact` instead of `/api/contact`
2. The server is configured to handle API requests at `/api/contact` and other similar paths
3. In production, the base URL is different from development, causing the API requests to fail

## Solution

### 1. Update API Endpoints in client/src/utils/api.js

All API endpoints need to be prefixed with `/api` to match the server routes. Here's what was changed:

#### Contact API
```javascript
// Before
export const contactAPI = {
  create: (contactData) => {
    return api.post("/contact", contactData);
  },
  // other methods...
};

// After
export const contactAPI = {
  create: (contactData) => {
    return api.post("/api/contact", contactData);
  },
  // other methods...
};
```

#### Other APIs
The same pattern was applied to all other API endpoints:

- Auth API: `/auth/login` → `/api/auth/login`
- Products API: `/products` → `/api/products`
- Categories API: `/categories` → `/api/categories`
- Orders API: `/orders` → `/api/orders`
- Dashboard API: `/dashboard` → `/api/dashboard`
- Users API: `/users` → `/api/users`
- Payment Settings API: `/payment-settings` → `/api/payment-settings`
- Payment Requests API: `/payment-requests` → `/api/payment-requests`

### 2. Update Server Configuration

The server is already correctly configured to:

1. Serve static files from the client/dist directory
2. Handle API routes at `/api/*`
3. Serve the React app for all other routes

The path in the catch-all route was updated to use the correct relative path:

```javascript
// Before
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist", "index.html"));
});

// After
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});
```

## Testing the Fix

To test the fix locally:

1. Build the client application:
   ```
   cd client
   npm run build
   ```

2. Start the server in production mode:
   ```
   cd ..
   NODE_ENV=production npm start
   ```

3. Test the contact form and other API functionality

## Deployment to Render

After making these changes:

1. Commit and push your changes to your repository
2. Deploy to Render using the render-build script
3. Monitor the logs for any issues

## Why This Works

In development, the Vite dev server proxies API requests to the backend server. In production, both the frontend and backend are served from the same server, so the API requests need to use the correct paths.

By updating all API endpoints to use the `/api` prefix, we ensure that the requests are routed correctly in both development and production environments.

## Additional Notes

- The API base URL is determined dynamically based on the environment
- In production, it uses a relative URL (`/api`)
- In development, it uses the localhost URL (`http://localhost:5000/api`)
- This ensures that API requests work correctly in all environments
