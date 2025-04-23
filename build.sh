#!/bin/bash

# Install dependencies
npm install

# Install client dependencies and build
cd client
npm install
npm run build
cd ..

# Copy .env.render to .env
cp .env.render .env

# Print success message
echo "Build completed successfully!"
