# Deployment Guide for Shyam Furnitures

This guide provides instructions for deploying the Shyam Furnitures application to various hosting platforms.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Cloudinary account (for image storage)
- Git

## Environment Variables

The application requires the following environment variables:

### Server Environment Variables

```
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
BYPASS_AUTH=false
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Client Environment Variables

```
VITE_API_URL=/api
VITE_NODE_ENV=production
```

## Deployment Steps

### 1. Prepare Your Application

1. Update the API configuration in `client/src/utils/api.js` to use relative URLs in production
2. Ensure your server is configured to serve the client's static files
3. Make sure your MongoDB Atlas connection string is correct
4. Verify that Cloudinary credentials are set up correctly

### 2. Build the Application

Run the following command to build the client application:

```bash
npm run build
```

This will create a production-ready build in the `client/dist` directory.

### 3. Deploy to Vercel

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Set the following build settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `client/dist`
4. Add all the required environment variables in the Vercel dashboard
5. Deploy the application

### 4. Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following build settings:
   - Build Command: `npm run render-build`
   - Start Command: `npm start`
4. Add all the required environment variables in the Render dashboard
5. Deploy the application

## Troubleshooting

### API Connection Issues

If you're experiencing API connection issues after deployment:

1. Check that the API base URL is correctly configured in `client/src/utils/api.js`
2. Verify that the server is properly serving the API routes
3. Check that CORS is properly configured on the server
4. Look for any network errors in the browser console

### Database Connection Issues

If you're having trouble connecting to MongoDB:

1. Verify that your MongoDB Atlas connection string is correct
2. Ensure that your IP address is whitelisted in MongoDB Atlas
3. Check that the database user has the correct permissions

### Image Upload Issues

If image uploads are failing:

1. Verify that your Cloudinary credentials are correct
2. Check that the Cloudinary configuration is properly set up in `server/config/cloudinary.js`
3. Ensure that the Cloudinary API is accessible from your deployment environment

## Post-Deployment Verification

After deploying your application, verify the following:

1. The application loads correctly
2. User authentication works (login/register)
3. Product listings are displayed
4. Contact form submissions work
5. Admin panel is accessible and functional
6. Image uploads work correctly
7. Orders can be placed and processed

If any of these features are not working, check the browser console and server logs for errors.
