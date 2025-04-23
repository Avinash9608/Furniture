#!/bin/bash

# Print debugging information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

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

# Print success message
echo "Build completed successfully!"
