const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique file name with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images only
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedTypes.join(", ")} are allowed`), false);
  }
};

// Create the multer instance with enhanced error handling
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5 // Maximum 5 files per request
  },
});

// Wrapper function for handling multiple files
const handleMultipleFiles = (req, res, next) => {
  const upload = uploadMiddleware.array("images", 5);

  upload(req, res, function(err) {
    if (err) {
      console.error("File upload error:", err);

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File is too large. Maximum size is 5MB"
        });
      }

      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Too many files. Maximum is 5 files"
        });
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Unexpected field. Please use 'images' as the field name"
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || "Error uploading files"
      });
    }

    // Log successful uploads
    if (req.files && req.files.length > 0) {
      console.log("Successfully uploaded files:", req.files.map(f => ({
        filename: f.filename,
        size: f.size,
        mimetype: f.mimetype
      })));
    }

    next();
  });
};

// Export both the middleware instance and common configurations
module.exports = {
  upload: uploadMiddleware,
  single: (fieldName) => uploadMiddleware.single(fieldName),
  array: (fieldName, maxCount) => uploadMiddleware.array(fieldName, maxCount),
  fields: (fields) => uploadMiddleware.fields(fields),
  none: () => uploadMiddleware.none(),
  handleMultipleFiles
};
