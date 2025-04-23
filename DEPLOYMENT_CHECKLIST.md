# Shyam Furnitures Deployment Checklist

Use this checklist to ensure a successful deployment of your Shyam Furnitures application on Render.com.

## Before Deployment

- [ ] Verify that `vite` is listed in the `devDependencies` section of `client/package.json`
- [ ] Ensure all environment variables are correctly set in `.env.render`
- [ ] Check that `server.js` correctly serves static files from `client/dist`
- [ ] Make sure `build.sh` is executable (`chmod +x build.sh`)
- [ ] Verify that MongoDB Atlas connection string is correct and accessible

## Render Configuration

- [ ] **Build Command**:
  ```bash
  npm install
  cd client && npm install --include=dev
  cd client && npm run build
  cd ..
  ```
- [ ] **Start Command**: `npm start`

## Environment Variables

- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `MONGO_URI=mongodb+srv://avinashmadhukar4:wwtcgIAvcC8WNAPY@cluster0.dpeo7nm.mongodb.net/shyam_furnitures?retryWrites=true&w=majority&appName=Cluster0`
- [ ] `JWT_SECRET=dG8sY2FuSSUo*22dk@fj9s8`
- [ ] `JWT_EXPIRE=30d`
- [ ] `JWT_COOKIE_EXPIRE=30`
- [ ] `BYPASS_AUTH=false`
- [ ] `CLOUDINARY_CLOUD_NAME=dfdtdqumn`
- [ ] `CLOUDINARY_API_KEY=759566998672355`
- [ ] `CLOUDINARY_API_SECRET=o8IRXq5nkO3L9XnvDMNhM1bxyiY`

## After Deployment

- [ ] Check build logs for any errors
- [ ] Verify that the application is accessible at the provided URL
- [ ] Test the frontend functionality (navigation, dark mode, etc.)
- [ ] Test the backend functionality (API endpoints, authentication, etc.)
- [ ] Test the admin panel (login, product management, etc.)

## Troubleshooting

If deployment fails:

1. Check the build logs for specific errors
2. Clear the build cache and redeploy
3. Verify that all dependencies are correctly installed
4. Check that the MongoDB connection is working
5. Ensure that the static files are being served correctly

## Common Errors and Solutions

- **"vite: not found"**: Make sure to use `npm install --include=dev` in the build command
- **"Cannot find module"**: Check that all dependencies are correctly installed
- **"MongoDB connection error"**: Verify the MongoDB connection string and network access
- **"Port already in use"**: Make sure no other service is using the same port
- **"Cannot GET /"**: Verify that the static files are being served correctly
