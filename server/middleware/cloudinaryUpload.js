/**
 * Cloudinary Upload Middleware
 * 
 * This middleware handles file uploads to Cloudinary with robust error handling
 * and fallback mechanisms for production environments.
 */

const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Create a memory storage for multer (temporary storage before Cloudinary upload)
const storage = multer.memoryStorage();

// Configure multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Check file type
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
  }
});

// Ensure local uploads directory exists as fallback
const uploadsDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory for fallback:', uploadsDir);
}

/**
 * Middleware to handle Cloudinary uploads with fallback to local storage
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const processUpload = async (req, res, next) => {
  // Skip if no files were uploaded
  if (!req.files || req.files.length === 0) {
    console.log('No files to upload, skipping Cloudinary processing');
    return next();
  }

  try {
    console.log(`Processing ${req.files.length} files for Cloudinary upload`);
    
    // Track uploaded files
    const uploadedFiles = [];
    const uploadErrors = [];
    
    // Process each file
    for (const file of req.files) {
      try {
        // Create a buffer from the file
        const buffer = file.buffer;
        
        // Generate a unique filename
        const filename = `${path.parse(file.originalname).name}-${Date.now()}`;
        
        // Upload to Cloudinary
        console.log(`Uploading ${filename} to Cloudinary...`);
        
        // Convert buffer to base64 for Cloudinary upload
        const b64 = Buffer.from(buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        
        // Upload to Cloudinary with retry logic
        let cloudinaryResult = null;
        let retries = 0;
        const maxRetries = 3;
        
        while (!cloudinaryResult && retries < maxRetries) {
          try {
            cloudinaryResult = await cloudinary.uploader.upload(dataURI, {
              resource_type: 'auto',
              folder: 'furniture_products',
              public_id: filename,
            });
            
            console.log(`Successfully uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);
          } catch (cloudinaryError) {
            retries++;
            console.error(`Cloudinary upload failed (attempt ${retries}/${maxRetries}):`, cloudinaryError.message);
            
            if (retries >= maxRetries) {
              throw cloudinaryError;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Add the Cloudinary URL to the uploaded files
        uploadedFiles.push({
          originalname: file.originalname,
          filename: filename,
          path: cloudinaryResult.secure_url,
          cloudinaryId: cloudinaryResult.public_id,
          size: cloudinaryResult.bytes,
          mimetype: file.mimetype,
          isCloudinary: true
        });
        
      } catch (fileError) {
        console.error('Error uploading file to Cloudinary:', fileError);
        
        // Fallback to local storage
        try {
          console.log('Falling back to local storage for file:', file.originalname);
          
          // Generate a unique filename for local storage
          const uniqueFilename = `${uuidv4()}-${file.originalname}`;
          const localPath = path.join(uploadsDir, uniqueFilename);
          
          // Write the file to local storage
          fs.writeFileSync(localPath, buffer);
          
          // Generate the URL for the local file
          const isProduction = process.env.NODE_ENV === 'production';
          const baseUrl = isProduction 
            ? process.env.BASE_URL || 'https://furniture-q3nb.onrender.com'
            : 'http://localhost:5000';
          
          const fileUrl = `${baseUrl}/uploads/images/${uniqueFilename}`;
          
          // Add the local URL to the uploaded files
          uploadedFiles.push({
            originalname: file.originalname,
            filename: uniqueFilename,
            path: fileUrl,
            size: buffer.length,
            mimetype: file.mimetype,
            isCloudinary: false
          });
          
          console.log('Successfully saved file to local storage:', fileUrl);
        } catch (localError) {
          console.error('Error saving file to local storage:', localError);
          uploadErrors.push({
            file: file.originalname,
            error: localError.message
          });
        }
      }
    }
    
    // Add the uploaded files to the request object
    req.uploadedFiles = uploadedFiles;
    req.uploadErrors = uploadErrors;
    
    // Log upload summary
    console.log('Upload summary:');
    console.log(`- Total files: ${req.files.length}`);
    console.log(`- Successfully uploaded: ${uploadedFiles.length}`);
    console.log(`- Failed uploads: ${uploadErrors.length}`);
    
    next();
  } catch (error) {
    console.error('Error in processUpload middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing file uploads',
      error: error.message
    });
  }
};

// Export the middleware
module.exports = {
  upload,
  processUpload
};
