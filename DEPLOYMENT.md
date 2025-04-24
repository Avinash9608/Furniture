# Deployment Guide for Shyam Furnitures

This guide provides instructions for deploying the Shyam Furnitures application to Render.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Cloudinary account (for image storage)
- Git
- Render account

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository is up to date with all the latest changes:

```bash
git add .
git commit -m "Prepare for deployment"
git push
```

### 2. Set Up a New Web Service on Render

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the following settings:
   - **Name**: shyam-furnitures (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose the region closest to your users
   - **Branch**: main (or your deployment branch)
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose a paid plan for better performance)

### 3. Set Environment Variables

In the Render dashboard, go to the "Environment" tab and add the following environment variables:

```
NODE_ENV=production
PORT=10000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
BYPASS_AUTH=false
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace the placeholder values with your actual credentials.

### 4. Deploy the Application

1. Click on "Create Web Service" to start the deployment process
2. Render will automatically build and deploy your application
3. Once the deployment is complete, you can access your application at the provided URL

## Troubleshooting

### JSX Runtime Issues

If you encounter JSX runtime issues (e.g., "s.jsxDEV is not a function"), make sure:

1. The `.babelrc` file is correctly configured
2. React is made available globally in `main.jsx`
3. All necessary Babel dependencies are installed

### "require is not defined" Error

If you encounter a "require is not defined" error in the browser console:

1. Make sure your `vite.config.js` file uses ES modules syntax (import/export instead of require/module.exports)
2. Configure the build to use ES modules format in the rollupOptions:
   ```js
   rollupOptions: {
     output: {
       format: 'es',
     },
   },
   ```
3. Update the `render-deploy.sh` script to use the correct configuration
4. Make sure all client-side code uses ES modules syntax (import/export)

### API Connection Issues

If API calls are failing, check:

1. The `VITE_API_URL` environment variable is set to `/api`
2. The server is correctly configured to handle API routes

### Database Connection Issues

If you're having trouble connecting to MongoDB:

1. Verify that your MongoDB Atlas connection string is correct
2. Ensure that your IP address is whitelisted in MongoDB Atlas
3. Check that the database user has the correct permissions

## Monitoring and Maintenance

After deployment, monitor your application for any issues:

1. Check the Render logs for any errors
2. Monitor your MongoDB Atlas dashboard for database performance
3. Keep an eye on your Cloudinary usage for image storage

## Updating the Application

To update your deployed application:

1. Push your changes to the connected GitHub repository
2. Render will automatically rebuild and redeploy your application

For manual deployments, you can use the "Manual Deploy" button in the Render dashboard.
