#!/bin/bash

# Print current environment
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Clean up previous builds
echo "Cleaning up previous builds..."
rm -rf client/dist

# Install dependencies
echo "Installing dependencies..."
npm install

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install --include=dev

# Build client with production mode
echo "Building client in production mode..."
npm run build

# Return to root directory
cd ..

# Create a production .env file
echo "Creating production environment file..."
cat > .env << EOL
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://avinashmadhukar4:wwtcgIAvcC8WNAPY@cluster0.dpeo7nm.mongodb.net/shyam_furnitures?retryWrites=true&w=majority
JWT_SECRET=dG8sY2FuSSUo*22dk@fj9s8
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
BYPASS_AUTH=false
CLOUDINARY_CLOUD_NAME=dfdtdqumn
CLOUDINARY_API_KEY=759566998672355
CLOUDINARY_API_SECRET=o8IRXq5nkO3L9XnvDMNhM1bxyiY
EOL

# Print success message
echo "Deployment build completed successfully!"
echo "You can now deploy the application to your hosting platform."
