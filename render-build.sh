#!/bin/bash

# Print debugging information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install client dependencies with dev dependencies
echo "Installing client dependencies..."
cd client
npm install --include=dev

# Create a production .env file for the client
echo "Creating production environment file for client..."
cat > .env.production << EOL
VITE_API_URL=/api
VITE_NODE_ENV=production
EOL

# Check if Vite is installed
echo "Checking Vite installation..."
npx vite --version

# Build the client with production mode
echo "Building client in production mode..."
npm run build
cd ..

# Create a production .env file for the server
echo "Creating production environment file for server..."
cat > .env << EOL
NODE_ENV=production
PORT=10000
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
echo "Build completed successfully!"
