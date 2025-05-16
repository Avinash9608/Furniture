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
    // Create unique file name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images only
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Please upload image files only"), false);
  }
};

// Create the multer instance
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Export both the middleware instance and common configurations
module.exports = {
  upload: uploadMiddleware,
  single: (fieldName) => uploadMiddleware.single(fieldName),
  array: (fieldName, maxCount) => uploadMiddleware.array(fieldName, maxCount),
  fields: (fields) => uploadMiddleware.fields(fields),
  none: () => uploadMiddleware.none(),
};
