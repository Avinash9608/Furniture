const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Public
exports.addReview = async (req, res) => {
  try {
    console.log('Adding review for product ID:', req.params.id);
    console.log('Review data:', req.body);
    
    const { rating, comment, userName } = req.body;
    
    // Validate required fields
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating and comment are required'
      });
    }
    
    // Find the product by ID
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Create the review object
    const review = {
      _id: new mongoose.Types.ObjectId(),
      name: userName || 'Anonymous User',
      rating: Number(rating),
      comment,
      createdAt: new Date()
    };
    
    // Initialize reviews array if it doesn't exist
    if (!product.reviews) {
      product.reviews = [];
    }
    
    // Add the review to the product
    product.reviews.push(review);
    
    // Update product ratings
    product.numReviews = product.reviews.length;
    product.ratings = product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.reviews.length;
    
    // Save the product
    await product.save();
    
    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error adding review'
    });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    console.log('Getting reviews for product ID:', req.params.id);
    
    // Find the product by ID
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Return the reviews
    return res.status(200).json({
      success: true,
      data: product.reviews || []
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting reviews'
    });
  }
};
