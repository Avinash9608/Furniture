/**
 * File upload middleware using multer
 * Handles file uploads for products, categories, etc.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create the multer instance with enhanced error handling
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Maximum 1 file per request
  },
  fileFilter: fileFilter
});

// Middleware that handles file upload errors
const uploadMiddleware = (req, res, next) => {
  const singleUpload = upload.single('image');
  
  singleUpload(req, res, function (err) {
    if (err) {
      console.error('File upload error:', err);
      
      // Handle specific multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(200).json({
          success: false,
          message: 'File is too large. Maximum size is 5MB.'
        });
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(200).json({
          success: false,
          message: 'Unexpected file field. Use "image" as the field name.'
        });
      }
      
      // For other errors
      return res.status(200).json({
        success: false,
        message: err.message || 'Error uploading file'
      });
    }
    
    // Log file information if uploaded
    if (req.file) {
      console.log('File uploaded successfully:', {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
      // Add the file path to the request body for easier access
      if (!req.body) req.body = {};
      req.body.image = `/uploads/${req.file.filename}`;
    }
    
    next();
  });
};

module.exports = uploadMiddleware;
