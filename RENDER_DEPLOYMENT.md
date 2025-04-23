# Deploying Shyam Furnitures to Render.com

This guide will help you deploy your Shyam Furnitures application to Render.com.

## Prerequisites

1. A Render.com account
2. Your MongoDB Atlas database (already set up)

## Deployment Steps

### 1. Create a New Web Service on Render

1. Log in to your Render.com account
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository or upload your code directly
4. Configure your web service:
   - **Name**: shyam-furnitures
   - **Environment**: Node
   - **Build Command**:
   ```bash
   npm install
   cd client && npm install --include=dev
   cd client && npm run build
   cd ..
   ```
   - **Start Command**: `npm start`

### 2. Set Environment Variables

In the Render dashboard, go to your web service and click on "Environment" tab. Add the following environment variables:

- `NODE_ENV`: production
- `PORT`: 10000 (Render will override this with its own port)
- `MONGO_URI`: mongodb+srv://avinashmadhukar4:wwtcgIAvcC8WNAPY@cluster0.dpeo7nm.mongodb.net/shyam_furnitures?retryWrites=true&w=majority&appName=Cluster0
- `JWT_SECRET`: dG8sY2FuSSUo\*22dk@fj9s8
- `JWT_EXPIRE`: 30d
- `JWT_COOKIE_EXPIRE`: 30
- `BYPASS_AUTH`: false
- `CLOUDINARY_CLOUD_NAME`: dfdtdqumn
- `CLOUDINARY_API_KEY`: 759566998672355
- `CLOUDINARY_API_SECRET`: o8IRXq5nkO3L9XnvDMNhM1bxyiY

### 3. Deploy

Click on "Create Web Service" and wait for the deployment to complete. Render will automatically build and deploy your application.

### 4. Verify Deployment

Once the deployment is complete, Render will provide you with a URL for your application (e.g., https://shyam-furnitures.onrender.com). Visit this URL to verify that your application is working correctly.

## Troubleshooting

If you encounter any issues during deployment, check the following:

### 1. "vite: not found" Error

This error occurs when Vite is not properly installed in the production environment. To fix this:

- Make sure your build command includes the `--include=dev` flag when installing client dependencies:
  ```bash
  cd client && npm install --include=dev
  ```
- Verify that `vite` is listed in the `devDependencies` section of your `client/package.json` file
- Try clearing the build cache in Render before redeploying

### 2. MongoDB Connection Issues

- Verify that your MongoDB Atlas connection string is correct
- Make sure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or from Render's IP addresses
- Check that your database user has the correct permissions

### 3. Static Files Not Serving Correctly

- Verify that your `server.js` file correctly serves the static files from the `client/dist` directory
- Make sure the build process is completing successfully and generating the `client/dist` directory
- Check that the paths in your Express routes are correct

### 4. Environment Variables

- Make sure all required environment variables are set in the Render dashboard
- Verify that the environment variables are being correctly accessed in your code

### 5. Server Not Starting

- Check that your `server.js` file is correctly binding to the PORT environment variable
- Make sure your start command is correct: `npm start`
- Verify that all required dependencies are installed

## Updating Your Application

To update your application:

1. Push your changes to your GitHub repository
2. Render will automatically detect the changes and redeploy your application

Alternatively, you can manually trigger a deployment from the Render dashboard by clicking on "Manual Deploy" > "Deploy latest commit".
