/**
 * Image Controller
 * Handles image uploads and updates for products
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Upload images to the server
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with uploaded file paths
 */
exports.uploadImages = async (req, res) => {
  try {
    console.log('Image upload endpoint called');
    
    // Check if files exist in the request
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    console.log(`Received ${req.files.length} files`);
    
    // Process each uploaded file
    const uploadedFiles = req.files.map(file => {
      console.log(`Processing file: ${file.originalname}`);
      
      // Create a path relative to the uploads directory
      const relativePath = `/uploads/${file.filename}`;
      
      return {
        originalName: file.originalname,
        filename: file.filename,
        path: relativePath,
        size: file.size,
        mimetype: file.mimetype
      };
    });
    
    console.log('Files processed successfully');
    
    // Return success response with file information
    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
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
    console.log('Update product images endpoint called');
    
    const { id } = req.params;
    
    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid product ID:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    // Get image paths from request body
    let imagePaths = [];
    try {
      if (req.body.imagePaths) {
        imagePaths = JSON.parse(req.body.imagePaths);
        console.log('Parsed image paths:', imagePaths);
      }
    } catch (parseError) {
      console.error('Error parsing image paths:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid image paths format',
        error: parseError.message
      });
    }
    
    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      console.log('Product not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    console.log('Found product:', product.name);
    
    // Update the product images
    product.images = imagePaths;
    
    // Save the updated product
    await product.save();
    
    console.log('Product images updated successfully');
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Product images updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product images:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating product images',
      error: error.message
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
      'dinner-set': '/uploads/dinner-set-default.jpg',
      'bed': '/uploads/bed-default.jpg',
      'wardrobe': '/uploads/wardrobe-default.jpg',
      'sofa': '/uploads/sofa-default.jpg',
      'chair': '/uploads/chair-default.jpg',
      'table': '/uploads/table-default.jpg',
      'furniture': '/uploads/furniture-default.jpg',
    };
    
    // Get the default image path
    const imagePath = defaultImages[type] || defaultImages.furniture;
    
    // Return the image path
    return res.status(200).json({
      success: true,
      path: imagePath
    });
  } catch (error) {
    console.error('Error getting default image:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting default image',
      error: error.message
    });
  }
};
