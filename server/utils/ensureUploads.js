/**
 * Utility to ensure the uploads directory exists
 */

const fs = require("fs");
const path = require("path");

// Define the uploads directory paths
const uploadsDir = path.join(__dirname, "../../uploads");
const imagesDir = path.join(uploadsDir, "images");

// Function to ensure a directory exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Directory created successfully: ${dirPath}`);
    } catch (error) {
      console.error(`Error creating directory ${dirPath}: ${error.message}`);
    }
  } else {
    console.log(`Directory already exists: ${dirPath}`);
  }
};

// Ensure the uploads directory exists
ensureDir(uploadsDir);

// Ensure the images directory exists
ensureDir(imagesDir);

module.exports = {
  uploadsDir,
  imagesDir,
};
