#!/bin/bash

# Print debugging information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing server dependencies..."
npm install

# Install client dependencies and build
echo "Installing client dependencies..."
cd client
npm install --include=dev

# Check if Vite is installed
echo "Checking Vite installation..."
npx vite --version

# Build the client
echo "Building client..."
npm run build
cd ..

# Copy .env.render to .env
echo "Copying environment variables..."
cp .env.render .env

# List the build output directory
echo "Checking build output..."
ls -la client/dist

# Print success message
echo "Build completed successfully!"
