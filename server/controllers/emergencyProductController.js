/**
 * Emergency Product Controller
 * Handles emergency product updates when normal routes fail
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * Update a product (emergency endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with updated product
 */
exports.updateProduct = async (req, res) => {
  try {
    console.log('Emergency product update endpoint called');
    
    const { id } = req.params;
    
    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid product ID:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    console.log('Product ID:', id);
    console.log('Request body:', req.body);
    
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
    
    // Update basic product fields
    const { name, description, price, stock, category, featured, discountPrice } = req.body;
    
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = parseFloat(price);
    if (stock) product.stock = parseInt(stock);
    if (featured) product.featured = featured === 'true';
    if (discountPrice) product.discountPrice = parseFloat(discountPrice);
    
    // Update category if provided
    if (category) {
      // Validate category ID
      if (!mongoose.Types.ObjectId.isValid(category)) {
        console.log('Invalid category ID:', category);
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
      
      // Find the category
      const categoryObj = await Category.findById(category);
      
      if (!categoryObj) {
        console.log('Category not found:', category);
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      product.category = category;
    }
    
    // Handle existing images
    if (req.body.existingImages) {
      try {
        const existingImages = JSON.parse(req.body.existingImages);
        console.log('Existing images:', existingImages);
        
        // Update product images
        product.images = existingImages;
      } catch (parseError) {
        console.error('Error parsing existing images:', parseError);
        return res.status(400).json({
          success: false,
          message: 'Invalid existing images format',
          error: parseError.message
        });
      }
    }
    
    // Save the updated product
    await product.save();
    
    console.log('Product updated successfully');
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};
