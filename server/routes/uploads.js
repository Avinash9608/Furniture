const express = require('express');
const router = express.Router();
const path = require('path');
const { upload, uploadToCloudinary } = require('../utils/fileUpload');

// Upload a single image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path);
    
    res.json({
      success: true,
      file: result
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload multiple images (up to 5)
router.post('/images', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
    const results = await Promise.all(uploadPromises);
    
    res.json({
      success: true,
      files: results
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({
    message: 'File upload API is working',
    cloudinaryConfig: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'missing',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'configured' : 'missing',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'configured' : 'missing'
    }
  });
});

module.exports = router;
