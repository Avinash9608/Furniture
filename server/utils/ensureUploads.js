/**
 * Utility to ensure the uploads directory exists
 */

const fs = require('fs');
const path = require('path');

// Define the uploads directory path
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Check if the directory exists, if not create it
if (!fs.existsSync(uploadsDir)) {
  console.log(`Creating uploads directory: ${uploadsDir}`);
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created successfully');
  } catch (error) {
    console.error(`Error creating uploads directory: ${error.message}`);
  }
} else {
  console.log(`Uploads directory already exists: ${uploadsDir}`);
}

module.exports = uploadsDir;
