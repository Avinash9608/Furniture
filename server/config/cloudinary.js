const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test Cloudinary configuration
const testCloudinaryConfig = async () => {
  try {
    // Ping Cloudinary to check if credentials are valid
    const result = await cloudinary.api.ping();
    console.log('Cloudinary configuration is valid:', result.status === 'ok');
    return true;
  } catch (error) {
    console.error('Cloudinary configuration error:', error.message);
    console.log('Check your Cloudinary credentials');
    return false;
  }
};

// Export Cloudinary and test function
module.exports = { cloudinary, testCloudinaryConfig };
