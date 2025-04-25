# Shyam Furnitures - Deployment Guide

This guide provides step-by-step instructions for deploying the Shyam Furnitures application to Render.

## Prerequisites

- A Render account (https://render.com)
- A MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- Git repository with your application code

## Step 1: Prepare MongoDB Atlas

1. Create a new MongoDB Atlas cluster if you don't have one already
2. Configure Network Access:
   - Go to Network Access in the MongoDB Atlas dashboard
   - Add `0.0.0.0/0` to allow access from anywhere (for simplicity)
   - For production, you can restrict to specific IP addresses later
3. Create a database user:
   - Go to Database Access
   - Add a new database user with read/write permissions
4. Get your MongoDB connection string:
   - Go to Clusters > Connect > Connect your application
   - Copy the connection string (it should look like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`)
   - Replace `<password>` with your actual password
   - Replace `myFirstDatabase` with `shyam_furnitures`

## Step 2: Prepare Your Application

1. Make sure your application has the following structure:
   ```
   /
   ├── client/             # React frontend
   │   ├── dist/           # Built frontend files (will be created during deployment)
   │   ├── public/         # Public assets
   │   └── src/            # Source code
   ├── server/             # Express backend
   │   ├── config/         # Configuration files
   │   ├── controllers/    # Route controllers
   │   ├── middleware/     # Express middleware
   │   ├── models/         # Mongoose models
   │   ├── routes/         # Express routes
   │   ├── utils/          # Utility functions
   │   └── uploads/        # Uploaded files
   ├── server.js           # Main server file
   ├── package.json        # Project dependencies
   └── .env                # Environment variables (do not commit to Git)
   ```

2. Update your package.json to include the following scripts:
   ```json
   "scripts": {
     "start": "node server.js",
     "build": "npm install && cd client && npm install && npm run build",
     "dev": "concurrently \"npm run server\" \"npm run client\"",
     "server": "nodemon server/index.js",
     "client": "cd client && npm run dev"
   }
   ```

3. Create a `.env.example` file with the following content:
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/shyam_furnitures?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   ```

## Step 3: Deploy to Render

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your Git repository
4. Configure the web service:
   - **Name**: shyam-furnitures
   - **Environment**: Node
   - **Region**: Choose the region closest to your users
   - **Branch**: main (or your default branch)
   - **Build Command**: `npm run build`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or choose a paid plan for better performance)

5. Add environment variables:
   - Click on "Environment" tab
   - Add the following environment variables:
     - `PORT`: 10000 (Render uses this port by default)
     - `MONGO_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A secure random string for JWT authentication
     - `NODE_ENV`: production

6. Click "Create Web Service"

## Step 4: Verify Deployment

1. Wait for the deployment to complete (this may take a few minutes)
2. Once deployed, click on the URL provided by Render to access your application
3. Test the following functionality:
   - Home page loads correctly
   - Products are displayed
   - User registration and login
   - Adding products to cart
   - Checkout process
   - Admin panel access and functionality

## Troubleshooting

If you encounter issues with your deployment, check the following:

### API Connection Issues

If the frontend is not connecting to the backend API:

1. Check the Render logs for any errors
2. Verify that the API endpoints are correctly configured
3. Make sure CORS is properly configured in the server.js file
4. Check that the frontend is using the correct API URL

### Database Connection Issues

If the application cannot connect to the database:

1. Verify that the MongoDB Atlas connection string is correct
2. Check that the IP whitelist in MongoDB Atlas includes `0.0.0.0/0`
3. Ensure the database user has the correct permissions

### Payment Requests Not Working

If payment requests are not working:

1. Check that the PaymentRequest model is being loaded correctly
2. Verify that the payment request routes are registered in server.js
3. Check the client-side API implementation for payment requests
4. Look for any errors in the browser console or server logs

## Updating Your Deployment

To update your deployment:

1. Push your changes to the Git repository
2. Render will automatically detect the changes and redeploy your application

## Environment Variables

Make sure the following environment variables are set in your Render deployment:

- `PORT`: 10000 (Render uses this port by default)
- `MONGO_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure random string for JWT authentication
- `NODE_ENV`: production

## Conclusion

Your Shyam Furnitures application should now be successfully deployed to Render. If you encounter any issues, refer to the troubleshooting section or check the Render logs for more information.

For additional help, refer to the Render documentation at https://render.com/docs or the MongoDB Atlas documentation at https://docs.atlas.mongodb.com/.
