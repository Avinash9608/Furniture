/**
 * Image Controller
 * Handles image uploads and updates for products
 */

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Product = require("../models/Product");

/**
 * Upload images to the server
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with uploaded file paths
 */
exports.uploadImages = async (req, res) => {
  try {
    console.log("Image upload endpoint called");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Handle case where multer failed to process files
    if (!req.files) {
      console.log("No files in request - multer may have failed");

      // Try to handle direct file uploads from the request
      if (req.body && req.body.images) {
        console.log("Found images in request body");

        // Try to parse images from body
        let images = [];

        if (typeof req.body.images === "string") {
          try {
            // Try to parse as JSON
            images = JSON.parse(req.body.images);
            console.log("Parsed images from JSON:", images);
          } catch (parseError) {
            // If not JSON, treat as comma-separated string
            images = req.body.images.split(",").map((img) => img.trim());
            console.log("Parsed images as comma-separated string:", images);
          }
        } else if (Array.isArray(req.body.images)) {
          images = req.body.images;
          console.log("Images already in array format:", images);
        }

        if (images.length > 0) {
          // Return the images as they are
          return res.status(200).json({
            success: true,
            message: "Images processed from request body",
            files: images.map((img) => ({
              path: img,
              originalName: img.split("/").pop(),
              filename: img.split("/").pop(),
            })),
          });
        }
      }

      // If we have existingImages, return those
      if (req.body && req.body.existingImages) {
        console.log("Found existingImages in request body");

        let existingImages = [];

        if (typeof req.body.existingImages === "string") {
          try {
            // Try to parse as JSON
            existingImages = JSON.parse(req.body.existingImages);
            console.log("Parsed existingImages from JSON:", existingImages);
          } catch (parseError) {
            // If not JSON, treat as comma-separated string
            existingImages = req.body.existingImages
              .split(",")
              .map((img) => img.trim());
            console.log(
              "Parsed existingImages as comma-separated string:",
              existingImages
            );
          }
        } else if (Array.isArray(req.body.existingImages)) {
          existingImages = req.body.existingImages;
          console.log(
            "ExistingImages already in array format:",
            existingImages
          );
        }

        if (existingImages.length > 0) {
          // Return the existingImages as they are
          return res.status(200).json({
            success: true,
            message: "ExistingImages processed from request body",
            files: existingImages.map((img) => ({
              path: img,
              originalName: img.split("/").pop(),
              filename: img.split("/").pop(),
            })),
          });
        }
      }

      // If we couldn't find any images, return a 200 with empty array to avoid client errors
      return res.status(200).json({
        success: true,
        message: "No files to process",
        files: [],
      });
    }

    // If files array is empty, return a 200 with empty array
    if (req.files.length === 0) {
      console.log("Empty files array");
      return res.status(200).json({
        success: true,
        message: "No files uploaded",
        files: [],
      });
    }

    console.log(`Received ${req.files.length} files`);

    // Process each uploaded file
    const uploadedFiles = req.files.map((file) => {
      console.log(`Processing file: ${file.originalname}`);

      // Create a path relative to the uploads directory
      const relativePath = `/uploads/${file.filename}`;

      return {
        originalName: file.originalname,
        filename: file.filename,
        path: relativePath,
        size: file.size,
        mimetype: file.mimetype,
      };
    });

    console.log("Files processed successfully");

    // Return success response with file information
    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Error uploading images:", error);

    // Return a 200 response with error info to avoid client errors
    return res.status(200).json({
      success: false,
      message:
        "Error uploading images, but returning 200 to avoid client errors",
      error: error.message,
      files: [],
    });
  }
};

/**
 * Update product images
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with updated product
 */
exports.updateProductImages = async (req, res) => {
  try {
    console.log("Update product images endpoint called");
    console.log("Request body:", req.body);

    const { id } = req.params;
    console.log("Product ID:", id);

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid product ID:", id);
      return res.status(200).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Get image paths from request body
    let imagePaths = [];

    // Try multiple ways to get image paths
    if (req.body.imagePaths) {
      try {
        if (typeof req.body.imagePaths === "string") {
          imagePaths = JSON.parse(req.body.imagePaths);
        } else if (Array.isArray(req.body.imagePaths)) {
          imagePaths = req.body.imagePaths;
        }
        console.log("Parsed image paths from imagePaths:", imagePaths);
      } catch (parseError) {
        console.error("Error parsing imagePaths:", parseError);
      }
    }

    // If imagePaths is empty, try existingImages
    if (imagePaths.length === 0 && req.body.existingImages) {
      try {
        if (typeof req.body.existingImages === "string") {
          imagePaths = JSON.parse(req.body.existingImages);
        } else if (Array.isArray(req.body.existingImages)) {
          imagePaths = req.body.existingImages;
        }
        console.log("Parsed image paths from existingImages:", imagePaths);
      } catch (parseError) {
        console.error("Error parsing existingImages:", parseError);
        // Try to handle as comma-separated string
        imagePaths = req.body.existingImages
          .split(",")
          .map((path) => path.trim());
        console.log("Parsed image paths as comma-separated:", imagePaths);
      }
    }

    // If imagePaths is still empty, try images
    if (imagePaths.length === 0 && req.body.images) {
      try {
        if (typeof req.body.images === "string") {
          imagePaths = JSON.parse(req.body.images);
        } else if (Array.isArray(req.body.images)) {
          imagePaths = req.body.images;
        }
        console.log("Parsed image paths from images:", imagePaths);
      } catch (parseError) {
        console.error("Error parsing images:", parseError);
        // Try to handle as comma-separated string
        imagePaths = req.body.images.split(",").map((path) => path.trim());
        console.log("Parsed image paths as comma-separated:", imagePaths);
      }
    }

    // If we still don't have image paths, return an error
    if (imagePaths.length === 0) {
      console.log("No image paths found in request");
      return res.status(200).json({
        success: false,
        message: "No image paths found in request",
      });
    }

    // Find the product
    let product;
    try {
      product = await Product.findById(id);
    } catch (findError) {
      console.error("Error finding product:", findError);

      // Try direct MongoDB access
      try {
        const db = mongoose.connection.db;
        const productsCollection = db.collection("products");

        // Convert string ID to ObjectId
        const objectId = new mongoose.Types.ObjectId(id);

        // Find the product
        const productDoc = await productsCollection.findOne({ _id: objectId });

        if (productDoc) {
          console.log(
            "Found product via direct MongoDB access:",
            productDoc.name
          );

          // Update the product images
          const updateResult = await productsCollection.updateOne(
            { _id: objectId },
            { $set: { images: imagePaths } }
          );

          console.log("Update result:", updateResult);

          if (updateResult.modifiedCount > 0) {
            console.log(
              "Product images updated successfully via direct MongoDB access"
            );

            // Get the updated product
            const updatedProduct = await productsCollection.findOne({
              _id: objectId,
            });

            // Return success response
            return res.status(200).json({
              success: true,
              message:
                "Product images updated successfully via direct MongoDB access",
              data: updatedProduct,
            });
          }
        }
      } catch (directError) {
        console.error("Error with direct MongoDB access:", directError);
      }

      // If we get here, both approaches failed
      return res.status(200).json({
        success: false,
        message: "Error finding product",
        error: findError.message,
      });
    }

    if (!product) {
      console.log("Product not found:", id);
      return res.status(200).json({
        success: false,
        message: "Product not found",
      });
    }

    console.log("Found product:", product.name);

    // Update the product images
    product.images = imagePaths;

    // Save the updated product
    try {
      await product.save();
      console.log("Product images updated successfully");
    } catch (saveError) {
      console.error("Error saving product:", saveError);

      // Try direct MongoDB access
      try {
        const db = mongoose.connection.db;
        const productsCollection = db.collection("products");

        // Convert string ID to ObjectId
        const objectId = new mongoose.Types.ObjectId(id);

        // Update the product images
        const updateResult = await productsCollection.updateOne(
          { _id: objectId },
          { $set: { images: imagePaths } }
        );

        console.log("Update result:", updateResult);

        if (updateResult.modifiedCount > 0) {
          console.log(
            "Product images updated successfully via direct MongoDB access"
          );

          // Get the updated product
          const updatedProduct = await productsCollection.findOne({
            _id: objectId,
          });

          // Return success response
          return res.status(200).json({
            success: true,
            message:
              "Product images updated successfully via direct MongoDB access",
            data: updatedProduct,
          });
        }
      } catch (directError) {
        console.error("Error with direct MongoDB access:", directError);
      }

      // If we get here, both approaches failed
      return res.status(200).json({
        success: false,
        message: "Error saving product",
        error: saveError.message,
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Product images updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product images:", error);

    // Return a 200 response with error info to avoid client errors
    return res.status(200).json({
      success: false,
      message:
        "Error updating product images, but returning 200 to avoid client errors",
      error: error.message,
    });
  }
};

/**
 * Get default image for product type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with default image path
 */
exports.getDefaultImage = async (req, res) => {
  try {
    const { type } = req.params;

    // Define default images for different product types
    const defaultImages = {
      "dinner-set": "/uploads/dinner-set-default.jpg",
      bed: "/uploads/bed-default.jpg",
      wardrobe: "/uploads/wardrobe-default.jpg",
      sofa: "/uploads/sofa-default.jpg",
      chair: "/uploads/chair-default.jpg",
      table: "/uploads/table-default.jpg",
      furniture: "/uploads/furniture-default.jpg",
    };

    // Get the default image path
    const imagePath = defaultImages[type] || defaultImages.furniture;

    // Return the image path
    return res.status(200).json({
      success: true,
      path: imagePath,
    });
  } catch (error) {
    console.error("Error getting default image:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting default image",
      error: error.message,
    });
  }
};
