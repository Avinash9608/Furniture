/**
 * Cleanup script for Shyam Furnitures project
 * This script removes unnecessary and duplicate files to simplify the project structure
 */

const fs = require('fs');
const path = require('path');

// Files to remove from root directory
const rootFilesToRemove = [
  // Documentation files (keep only the most comprehensive ones)
  'API_404_FIX.md',
  'API_ENDPOINTS_FIX.md',
  'API_ENDPOINT_FIX.md',
  'API_PREFIX_FIX.md',
  'COMPREHENSIVE_API_FIX.md',
  'COMPREHENSIVE_RENDER_FIX.md',
  'CONTACT_FORM_500_ERROR_FIX.md',
  'CONTACT_FORM_DIRECT_API_FIX.md',
  'CONTACT_FORM_DIRECT_FIX.md',
  'CONTACT_FORM_FIX.md',
  'CONTACT_FORM_SERVER_FIX.md',
  'CONTACT_FORM_SIMPLIFIED_FIX.md',
  'CORS_FIX.md',
  'DEPLOYMENT.md',
  'DEPLOYMENT_CHECKLIST.md',
  'DEPLOYMENT_FIX_GUIDE.md',
  'DEPLOYMENT_SIMULATION.md',
  
  // Test and temporary files
  'build-test.js',
  'contact-test-server.js',
  'fix-api-endpoints.js',
  'fix-es-modules.js',
  'fix-jsx-runtime.js',
  'fix-require-error.js',
  'install-deps.js',
  'serve.js',
  'simple-build.js',
  'test-api.js',
  'test-build.sh',
  'test-prod.js',
  'test-server.js',
  
  // Duplicate deployment scripts
  'build.sh',
  'deploy-render.sh',
  'deploy.sh',
  'render-build.sh',
  'remove-env-files.sh',
];

// Files to remove from client directory
const clientFilesToRemove = [
  'test-api.js',
  'test-contact-form.html',
  'test.html',
  'simple.html',
  'serve-dist.js',
];

// Files to remove from server directory
const serverFilesToRemove = [
  'test-auth.js',
  'test-category.js',
  'test-product.js',
  'ensure-uploads.js',
];

// Function to safely remove a file
function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${filePath}`);
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${filePath}: ${error.message}`);
  }
}

// Remove files from root directory
console.log('\n🧹 Cleaning up root directory...');
rootFilesToRemove.forEach(file => {
  removeFile(path.join(__dirname, file));
});

// Remove files from client directory
console.log('\n🧹 Cleaning up client directory...');
clientFilesToRemove.forEach(file => {
  removeFile(path.join(__dirname, 'client', file));
});

// Remove files from server directory
console.log('\n🧹 Cleaning up server directory...');
serverFilesToRemove.forEach(file => {
  removeFile(path.join(__dirname, 'server', file));
});

// Create a consolidated documentation file
console.log('\n📝 Creating consolidated documentation...');
const consolidatedDocs = `# Shyam Furnitures - Project Documentation

This document consolidates all the important information about the Shyam Furnitures project.

## Deployment Guide

For detailed deployment instructions, please refer to:
- DEPLOYMENT_GUIDE_V2.md - Comprehensive deployment guide
- RENDER_DEPLOYMENT_GUIDE.md - Render-specific deployment instructions
- SERVER_API_FIXES.md - Server API fixes documentation

## API Documentation

For API documentation, please refer to:
- API_FIXES_GUIDE.md - Comprehensive API fixes guide

## Environment Variables

For environment variable management, please refer to:
- ENV_MANAGEMENT.md - Environment variable management guide
- GIT_ENV_SECURITY.md - Git environment security guide

## Project Structure

The project is structured as follows:

\`\`\`
/
├── client/             # React frontend
│   ├── dist/           # Built frontend files
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
└── server.js           # Main server file
\`\`\`

## Important Notes

1. The application uses MongoDB Atlas for the database
2. Authentication is handled using JWT
3. File uploads are handled using Cloudinary
4. The application is deployed on Render
`;

fs.writeFileSync(path.join(__dirname, 'DOCUMENTATION.md'), consolidatedDocs);
console.log('✅ Created consolidated documentation: DOCUMENTATION.md');

console.log('\n🎉 Cleanup complete! The project structure has been simplified.');
