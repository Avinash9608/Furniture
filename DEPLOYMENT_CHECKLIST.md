# Deployment Checklist for Shyam Furnitures

This checklist ensures that all data is properly displayed in the admin panel when deployed to Render.

## Pre-Deployment Checks

### 1. Environment Variables

- [ ] Verify MongoDB Atlas connection string in `.env` file
- [ ] Verify Cloudinary configuration in `.env` file
- [ ] Ensure `PORT` is set to a value that Render will use (or leave it for Render to set)
- [ ] Check that `NODE_ENV` is set to `production` for deployment

### 2. API Configuration

- [ ] Verify that all API endpoints use relative URLs in production
- [ ] Check that the client-side API implementation handles different response formats
- [ ] Ensure that all API endpoints have proper error handling
- [ ] Verify that all API endpoints return data in a consistent format

### 3. Database Models

- [ ] Verify that all models are properly defined and exported
- [ ] Check that model loading is robust and handles errors gracefully
- [ ] Ensure that all required fields are properly validated

## Deployment Process

### 1. Build Process

- [ ] Run `npm run build` in the client directory to build the frontend
- [ ] Verify that the build process completes successfully
- [ ] Check that the build files are generated in the `client/dist` directory

### 2. Render Configuration

- [ ] Set the build command to `cd client && npm install && npm run build && cd .. && npm install`
- [ ] Set the start command to `node server.js`
- [ ] Add all required environment variables in Render's environment settings
- [ ] Set the Node.js version to a compatible version (e.g., 16.x or 18.x)

## Post-Deployment Checks

### 1. API Endpoints

- [ ] Run the test script to verify all API endpoints are working:
  ```bash
  node test-data-display.js
  ```
- [ ] Check the server logs for any errors or warnings
- [ ] Verify that all API endpoints return the expected data

### 2. Admin Panel

- [ ] Log in to the admin panel using admin credentials
- [ ] Check that categories are displayed correctly
- [ ] Verify that products are displayed correctly
- [ ] Ensure that orders are displayed correctly
- [ ] Check that contact messages are displayed correctly
- [ ] Verify that payment requests are displayed correctly

### 3. Data Management

- [ ] Create a new category and verify it appears in the list
- [ ] Create a new product and verify it appears in the list
- [ ] Update an existing product and verify the changes are saved
- [ ] Delete a product and verify it is removed from the list
- [ ] Check that images are properly uploaded to Cloudinary and displayed

## Troubleshooting

If data is not being displayed correctly, check the following:

1. **Server Logs**: Check the server logs for any errors or warnings
2. **Network Requests**: Use the browser's developer tools to inspect network requests
3. **Response Format**: Verify that the API responses have the expected format
4. **Client-Side Code**: Check that the client-side code properly handles different response formats
5. **Database Connection**: Verify that the application is connected to the correct database

## Data Display Verification

Use this table to verify that all data types are properly displayed:

| Data Type | API Endpoint | Admin Panel Page | Status |
|-----------|--------------|------------------|--------|
| Categories | `/api/categories` | Categories | ✅/❌ |
| Products | `/api/products` | Products | ✅/❌ |
| Orders | `/api/orders` | Orders | ✅/❌ |
| Contact Messages | `/api/contact` | Messages | ✅/❌ |
| Payment Requests | `/api/payment-requests/all` | Payment Requests | ✅/❌ |
| Payment Settings | `/api/payment-settings/all` | Payment Settings | ✅/❌ |

## Final Verification

After completing all checks, perform these final verification steps:

1. **Clear Browser Cache**: Clear your browser cache and reload the application
2. **Test in Incognito Mode**: Test the application in an incognito/private browsing window
3. **Test on Different Devices**: Test the application on different devices (desktop, tablet, mobile)
4. **Test with Different Browsers**: Test the application with different browsers (Chrome, Firefox, Safari)

Once all checks pass, the application is ready for production use!
