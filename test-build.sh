#!/bin/bash

# This script tests the production build locally

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

# Create a production .env file for the client
echo "Creating production environment file for client..."
cat > .env.production << EOL
VITE_API_URL=/api
VITE_NODE_ENV=production
EOL

# Build client with production mode
echo "Building client in production mode..."
npm run build

# Test the build
echo "Testing the build..."
npm run preview &
PREVIEW_PID=$!

# Wait for the preview server to start
sleep 5

# Open the browser
echo "Opening browser to test the build..."
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:4173
elif command -v open > /dev/null; then
  open http://localhost:4173
elif command -v start > /dev/null; then
  start http://localhost:4173
else
  echo "Please open http://localhost:4173 in your browser to test the build"
fi

# Wait for user to press Enter
echo "Press Enter to stop the preview server and continue..."
read

# Kill the preview server
kill $PREVIEW_PID

# Return to root directory
cd ..

# Print success message
echo "Test completed successfully!"
echo "If the application loaded correctly in your browser, you can deploy it to Render."
