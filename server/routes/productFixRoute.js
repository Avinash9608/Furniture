/**
 * Special route to fix product update functionality
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { updateProductDocument } = require("../utils/updateProductFix");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "image-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Update product route
router.put("/:id", upload.array("images", 10), async (req, res) => {
  try {
    console.log("Product fix route called for ID:", req.params.id);
    console.log("Request body:", req.body);
    console.log("Files received:", req.files ? req.files.length : 0);

    // Build update object
    const updates = { $set: {} };

    // Handle basic fields
    if (req.body.name) updates.$set.name = req.body.name;
    if (req.body.description) updates.$set.description = req.body.description;
    if (req.body.price) updates.$set.price = Number(req.body.price);
    if (req.body.stock) updates.$set.stock = Number(req.body.stock);
    if (req.body.featured) updates.$set.featured = req.body.featured === "true";

    // Handle category
    if (req.body.category) {
      updates.$set.category = req.body.category;
    }

    // Handle images
    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(
        (file) => `/uploads/${path.basename(file.path)}`
      );
      console.log("New image paths:", imagePaths);

      if (req.body.replaceImages === "true") {
        // Replace all images
        updates.$set.images = imagePaths;
      } else {
        // Append to existing images - we'll need to get the existing product first
        // This will be handled in the updateProductDocument function
        updates.$set.newImages = imagePaths;
      }
    }

    // Handle existing images from form data
    if (req.body.existingImages) {
      try {
        let existingImages;

        if (typeof req.body.existingImages === "string") {
          // Try to parse as JSON
          try {
            existingImages = JSON.parse(req.body.existingImages);
          } catch (parseError) {
            // If not JSON, treat as comma-separated list
            existingImages = req.body.existingImages
              .split(",")
              .map((url) => url.trim());
          }
        } else if (Array.isArray(req.body.existingImages)) {
          existingImages = req.body.existingImages;
        } else {
          existingImages = [req.body.existingImages];
        }

        updates.$set.images = existingImages;
      } catch (error) {
        console.error("Error processing existing images:", error);
        return res.status(400).json({
          success: false,
          message: "Invalid image data format",
          error: error.message,
        });
      }
    }

    // Update the product using our fixed function
    const result = await updateProductDocument(req.params.id, updates);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: result.product,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to update product",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in product fix route:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during product update",
      error: error.message,
    });
  }
});

module.exports = router;
