# Render Deployment Fix for API Endpoints

This guide explains how to fix the API endpoint issues in the deployed Shyam Furnitures application on Render.

## Problem

The contact form and other API features are failing with 404 errors on the deployed site. The error shows:

```
POST https://furniture-q3nb.onrender.com/api/contact 404 (Not Found)
```

This happens because:

1. The server routes are configured with `/api` prefix (e.g., `/api/contact`)
2. The client-side API utility also adds `/api` prefix to endpoints
3. The base URL in the API utility already includes `/api`
4. This results in duplicate `/api/api/` prefixes in the URLs

## Solution

### Option 1: Fix the Client-Side API Utility

1. Edit `client/src/utils/api.js` to remove the `/api` prefix from all endpoint paths:

```javascript
// Before
export const contactAPI = {
  create: (contactData) => {
    return api.post("/api/contact", contactData);
  },
  // other methods...
};

// After
export const contactAPI = {
  create: (contactData) => {
    return api.post("/contact", contactData);
  },
  // other methods...
};
```

2. Rebuild the client application:

```bash
cd client
npm run build
```

3. Redeploy to Render

### Option 2: Fix the Server-Side Routes

1. Edit `server/index.js` to remove the `/api` prefix from route registrations:

```javascript
// Before
app.use("/api/contact", contactRoutes);

// After
app.use("/contact", contactRoutes);
```

2. Redeploy to Render

## Recommended Approach

**Option 1 is recommended** because it's less invasive and maintains the standard API structure. Here's how to implement it:

1. Clone your repository locally:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```

2. Create a script to fix all API endpoints:
   ```javascript
   // fix-api-endpoints.js
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
       { from: 'api.put("/api/', to: 'api.put("/' },
       { from: 'api.delete("/api/', to: 'api.delete("/' },
       { from: 'api.patch("/api/', to: 'api.patch("/' },
       // Add more patterns as needed
     ];
     
     // Apply all replacements
     patterns.forEach(pattern => {
       content = content.replace(new RegExp(pattern.from, 'g'), pattern.to);
     });
     
     // Handle template literals with backticks
     const templatePatterns = [
       { from: 'api.get(`/api/', to: 'api.get(`/' },
       { from: 'api.post(`/api/', to: 'api.post(`/' },
       { from: 'api.put(`/api/', to: 'api.put(`/' },
       { from: 'api.delete(`/api/', to: 'api.delete(`/' },
       { from: 'api.patch(`/api/', to: 'api.patch(`/' },
       // Add more patterns as needed
     ];
     
     // Apply all template literal replacements
     templatePatterns.forEach(pattern => {
       content = content.replace(new RegExp(pattern.from, 'g'), pattern.to);
     });
     
     // Write the updated content back to the file
     fs.writeFileSync(apiFilePath, content);
     console.log('All API endpoints have been updated successfully!');
   }
   ```

3. Run the script:
   ```bash
   node fix-api-endpoints.js
   ```

4. Build the client application:
   ```bash
   cd client
   npm run build
   ```

5. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Fix API endpoint paths for production"
   git push
   ```

6. Redeploy on Render:
   - Go to your Render dashboard
   - Select your Shyam Furnitures application
   - Click "Manual Deploy" and select "Clear build cache & deploy"

## Testing

After deployment, test the contact form and other API features on the live site. The URLs should now be correctly formed without the duplicate `/api` prefix.

## Preventing Future Issues

To prevent similar issues in the future:

1. Add a comment in the API utility file explaining the base URL configuration:
   ```javascript
   // Note: The baseURL already includes '/api', so don't add '/api' to endpoint paths
   ```

2. Consider adding a pre-deployment check script that verifies API endpoints don't have duplicate prefixes

3. Document the API structure in your project README
