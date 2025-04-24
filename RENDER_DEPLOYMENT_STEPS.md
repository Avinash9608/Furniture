# Render Deployment Steps for Shyam Furnitures

This guide provides step-by-step instructions for deploying the Shyam Furnitures application to Render.

## Prerequisites

- A Render account
- Your project code in a Git repository (GitHub, GitLab, etc.)

## Deployment Steps

### 1. Fix API Endpoints

Before deploying, make sure your API endpoints are correctly configured:

1. Run the `fix-api-endpoints.js` script to remove duplicate `/api` prefixes:
   ```bash
   node fix-api-endpoints.js
   ```

2. Build the client application:
   ```bash
   cd client
   npm run build
   cd ..
   ```

3. Commit your changes:
   ```bash
   git add .
   git commit -m "Fix API endpoints for production"
   git push
   ```

### 2. Create a Web Service on Render

1. Log in to your Render dashboard
2. Click "New" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `shyam-furnitures` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && cd client && npm install && npm run build && cd ..`
   - **Start Command**: `npm start`
   - **Plan**: Select the appropriate plan (Free tier works for testing)

### 3. Configure Environment Variables

Add the following environment variables in the Render dashboard:

- `NODE_ENV`: `production`
- `PORT`: `10000` (Render will override this with its own PORT)
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `JWT_EXPIRE`: `30d`
- `JWT_COOKIE_EXPIRE`: `30`
- `BYPASS_AUTH`: `false`
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### 4. Deploy the Application

1. Click "Create Web Service"
2. Wait for the deployment to complete (this may take a few minutes)
3. Once deployed, Render will provide a URL for your application (e.g., `https://shyam-furnitures.onrender.com`)

### 5. Verify the Deployment

1. Visit your application URL
2. Test the contact form and other API features
3. Check the browser console for any errors

## Troubleshooting

### API Endpoint Issues

If you encounter 404 errors for API requests:

1. Check the browser console to see the exact URL being requested
2. Verify that the API endpoints in `client/src/utils/api.js` don't have duplicate `/api` prefixes
3. Make sure the server routes in `server/index.js` are correctly configured with `/api` prefixes
4. Redeploy with the fixed configuration

### Database Connection Issues

If the application can't connect to MongoDB:

1. Verify your MongoDB connection string in the environment variables
2. Make sure your MongoDB Atlas IP whitelist includes Render's IPs (or set it to allow all IPs)
3. Check the Render logs for any connection errors

### Build Failures

If the build fails:

1. Check the Render logs for specific error messages
2. Make sure all dependencies are correctly listed in `package.json`
3. Verify that your build commands are correct

## Maintenance

### Updating Your Application

To update your deployed application:

1. Make changes to your code locally
2. Commit and push to your Git repository
3. Render will automatically rebuild and deploy your application

### Monitoring

Monitor your application's performance and logs through the Render dashboard.

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables on Render](https://render.com/docs/environment-variables)
