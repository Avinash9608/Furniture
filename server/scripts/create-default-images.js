/**
 * Script to create default product type images
 * 
 * This script downloads default images for different product types and saves them
 * to the server's public/uploads directory. These images are used as fallbacks
 * when product images are missing or cannot be loaded.
 * 
 * Usage: node create-default-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

// Define the upload directory
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

// Define default images for different product types
const defaultImages = {
  'dinner-set-default.jpg': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop',
  'bed-default.jpg': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop',
  'wardrobe-default.jpg': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&auto=format&fit=crop',
  'sofa-default.jpg': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop',
  'chair-default.jpg': 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&auto=format&fit=crop',
  'table-default.jpg': 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=600&auto=format&fit=crop',
  'furniture-default.jpg': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop',
};

/**
 * Downloads an image from a URL and saves it to the specified path
 * @param {string} url - The URL of the image to download
 * @param {string} filePath - The path where the image should be saved
 * @returns {Promise<void>}
 */
function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Check if the response is successful
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      // Create a write stream to save the image
      const fileStream = fs.createWriteStream(filePath);
      
      // Pipe the response to the file
      response.pipe(fileStream);
      
      // Handle errors
      fileStream.on('error', (err) => {
        reject(err);
      });
      
      // Resolve the promise when the file is saved
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${filePath}`);
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main function to create default images
 */
async function createDefaultImages() {
  try {
    // Create the upload directory if it doesn't exist
    if (!(await existsAsync(uploadDir))) {
      await mkdirAsync(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }

    // Download each default image
    const downloadPromises = Object.entries(defaultImages).map(([filename, url]) => {
      const filePath = path.join(uploadDir, filename);
      return downloadImage(url, filePath);
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    console.log('All default images have been created successfully!');
  } catch (error) {
    console.error('Error creating default images:', error);
  }
}

// Run the main function
createDefaultImages();
