# Production Troubleshooting Guide

This guide provides solutions for common issues when deploying the Shyam Furnitures application to production environments.

## JSX Runtime Issues

### Issue: "Uncaught TypeError: s.jsxDEV is not a function"

This error occurs when there's a mismatch between development and production JSX transformations.

#### Solution:

1. **Update Vite Configuration**:
   - Use classic JSX runtime for production builds
   - Configure Babel properly for JSX transformation

2. **Update .babelrc**:
   - Use classic JSX runtime with explicit pragma
   - Configure browser targets appropriately

3. **Update main.jsx**:
   - Make React available globally for JSX transformation
   - Ensure proper React imports

4. **Use the render-build.sh Script**:
   - This script sets up the correct environment for production builds
   - It creates the necessary .env files with the right values

## API Connection Issues

### Issue: "Network Error" or "Connection Refused" for API Calls

This happens when the frontend tries to connect to localhost in production.

#### Solution:

1. **Use Relative URLs for API Calls**:
   - Set `VITE_API_URL=/api` in production
   - This makes API calls go to the same domain as the frontend

2. **Check Server Configuration**:
   - Ensure the server is properly configured to handle API routes
   - Verify CORS settings if needed

## Build Issues

### Issue: Build Fails or Produces Incorrect Output

#### Solution:

1. **Use the render-build.sh Script**:
   - This script ensures all dependencies are installed correctly
   - It sets up the right environment variables for production

2. **Check Dependencies**:
   - Ensure all necessary dependencies are installed
   - Include development dependencies for the build process

3. **Verify Environment Variables**:
   - Make sure all required environment variables are set
   - Use the correct values for production

## Testing Before Deployment

Before deploying to Render, test your production build locally:

1. Run the test-build.sh script:
   ```
   bash test-build.sh
   ```

2. This will:
   - Build the application in production mode
   - Start a preview server
   - Open your browser to test the build

3. Verify that:
   - The application loads correctly
   - No console errors appear
   - All functionality works as expected

## Deployment Steps

1. **Prepare for Deployment**:
   - Commit all your changes to Git
   - Push to your repository

2. **Deploy to Render**:
   - Connect your repository to Render
   - Set the build command to `npm run render-build`
   - Set the start command to `npm start`
   - Add all necessary environment variables

3. **Verify Deployment**:
   - Check the build logs for any errors
   - Test the deployed application
   - Monitor for any issues

## Additional Resources

- [Vite Production Build Guide](https://vitejs.dev/guide/build.html)
- [React Production Deployment](https://reactjs.org/docs/optimizing-performance.html)
- [Render Deployment Documentation](https://render.com/docs)
