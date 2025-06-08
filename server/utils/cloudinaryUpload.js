const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload to Cloudinary function
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uniqueFilename = `product_${uuidv4()}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "furniture_products",
        public_id: uniqueFilename,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

module.exports = {
  upload,
  uploadToCloudinary
};
