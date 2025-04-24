# Render Deployment Guide for Shyam Furnitures

This guide provides step-by-step instructions for deploying the Shyam Furnitures application to Render, addressing the 502 Bad Gateway error and other common deployment issues.

## Prerequisites

- A GitHub repository with your Shyam Furnitures code
- A Render account
- A MongoDB Atlas account with a database set up
- A Cloudinary account for image storage

## Step 1: Prepare Your Application

1. **Update the server.js file**:
   - Ensure the server listens on the PORT environment variable
   - Add proper error handling for static file serving
   - Implement a robust health check endpoint

2. **Verify your package.json**:
   - Make sure the root package.json has the correct start script: `"start": "node server.js"`
   - Ensure all dependencies are properly listed

3. **Build the client**:
   - Run `cd client && npm run build` to create the production build
   - Verify that the build files are created in the `client/dist` directory

## Step 2: Configure Render

1. **Create a new Web Service**:
   - Log in to your Render dashboard
   - Click "New" and select "Web Service"
   - Connect your GitHub repository

2. **Configure the Web Service**:
   - **Name**: `furniture-shop` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose the region closest to your users
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm install && cd client && npm install && npm run build && cd ..`
   - **Start Command**: `node server.js`

3. **Set Environment Variables**:
   - Click on "Environment" and add the following variables:
     - `PORT`: Leave this blank (Render will set it automatically)
     - `MONGO_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A secure random string for JWT token signing
     - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
     - `CLOUDINARY_API_KEY`: Your Cloudinary API key
     - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
     - `NODE_ENV`: Set to `production`

4. **Advanced Settings**:
   - Click on "Advanced"
   - Set the **Health Check Path** to `/api/health`
   - Increase the **Auto-Deploy** timeout to at least 15 minutes

## Step 3: Deploy Your Application

1. **Create Web Service**:
   - Click "Create Web Service"
   - Wait for the deployment to complete (this may take several minutes)

2. **Monitor the Deployment**:
   - Click on the "Logs" tab to monitor the deployment process
   - Look for any error messages or warnings

3. **Verify the Deployment**:
   - Once the deployment is complete, click on the URL to access your application
   - If you see a 502 Bad Gateway error, continue to the troubleshooting section

## Step 4: Troubleshooting 502 Bad Gateway Errors

If you're seeing a 502 Bad Gateway error, follow these steps:

1. **Check the Logs**:
   - Go to the "Logs" tab in your Render dashboard
   - Look for any error messages related to server startup

2. **Common Issues and Solutions**:

   a. **Port Binding Issues**:
   ```javascript
   // Make sure your server.js has this:
   const PORT = process.env.PORT || 5000;
   app.listen(PORT, "0.0.0.0", () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

   b. **MongoDB Connection Issues**:
   - Verify your MongoDB Atlas connection string
   - Make sure your IP whitelist in MongoDB Atlas includes Render's IPs or is set to allow access from anywhere

   c. **Static File Serving Issues**:
   - Make sure the client build files are being created correctly
   - Verify that the static file path is correct in server.js

   d. **Environment Variable Issues**:
   - Double-check all environment variables in the Render dashboard

3. **Restart the Service**:
   - After making changes, click "Manual Deploy" > "Deploy latest commit"
   - Monitor the logs during the deployment

## Step 5: Verifying Your Application

Once your application is deployed successfully, verify these key features:

1. **Admin Panel**:
   - Log in to the admin panel
   - Verify that categories, products, orders, and messages are displayed correctly
   - Try adding a new category and product
   - Check payment settings and payment requests

2. **Customer-Facing Pages**:
   - Browse products and categories
   - Add products to cart
   - Complete a test order
   - Submit a contact form

## Step 6: Ongoing Maintenance

1. **Monitoring**:
   - Regularly check the Render logs for any errors
   - Set up uptime monitoring for your application

2. **Updates**:
   - When updating your application, test changes locally before pushing to GitHub
   - Monitor the deployment logs when changes are deployed

3. **Backups**:
   - Regularly backup your MongoDB database
   - Consider setting up automated backups

## Troubleshooting Specific Issues

### Issue: 502 Bad Gateway

**Cause**: The server is not starting correctly or is not binding to the correct port.

**Solution**:
1. Check the logs for specific error messages
2. Ensure the server is binding to the PORT environment variable
3. Verify that all required environment variables are set
4. Check for any syntax errors in your code

### Issue: MongoDB Connection Errors

**Cause**: The server cannot connect to the MongoDB database.

**Solution**:
1. Verify your MongoDB Atlas connection string
2. Check if your MongoDB Atlas cluster is running
3. Make sure your IP whitelist in MongoDB Atlas includes Render's IPs
4. Add better error handling for MongoDB connection failures

### Issue: Static Files Not Loading

**Cause**: The server is not serving static files correctly.

**Solution**:
1. Verify that the client build files are being created correctly
2. Check the static file path in server.js
3. Add logging to debug static file serving

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## Support

If you need further assistance, please contact the development team or refer to the official documentation for the technologies used in this project.
