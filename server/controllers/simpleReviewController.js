const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// Path to the reviews data file for fallback
const dataDir = path.join(__dirname, '..', '..', 'data');
const reviewsFilePath = path.join(dataDir, 'reviews.json');

// Ensure the data directory exists
const ensureDataDirectory = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load reviews from file
const loadReviews = () => {
  ensureDataDirectory();
  
  try {
    if (fs.existsSync(reviewsFilePath)) {
      const data = fs.readFileSync(reviewsFilePath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading reviews:', error);
    return {};
  }
};

// Save reviews to file
const saveReviews = (reviews) => {
  ensureDataDirectory();
  
  try {
    fs.writeFileSync(reviewsFilePath, JSON.stringify(reviews, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving reviews:', error);
    return false;
  }
};

// @desc    Create a new review
// @route   POST /api/products/:id/reviews
// @access  Public (no auth required for simplicity)
exports.createReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, userName, userEmail } = req.body;
    
    console.log(`Creating review for product with ID: ${id}`);
    console.log('Review data:', req.body);
    
    // Validate required fields
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both rating and comment',
      });
    }
    
    // Always use file-based storage for reliability
    // Load existing reviews
    const allReviews = loadReviews();
    
    // Initialize reviews for this product if they don't exist
    if (!allReviews[id]) {
      allReviews[id] = [];
    }
    
    // Create a unique ID for the review
    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the review object
    const review = {
      _id: reviewId,
      name: userName || 'Anonymous User',
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString(),
    };
    
    // Add the review
    allReviews[id].push(review);
    
    // Save the reviews
    if (saveReviews(allReviews)) {
      // Try to update the product in the database (but don't wait for it)
      try {
        // Find the product
        const product = await Product.findById(id);
        
        if (product) {
          // Add the review to the product
          if (!product.reviews) {
            product.reviews = [];
          }
          
          product.reviews.push(review);
          
          // Update product ratings
          product.numReviews = product.reviews.length;
          product.ratings = product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.reviews.length;
          
          // Save the product (don't await to avoid blocking)
          product.save().catch(err => console.error('Error saving product:', err));
        }
      } catch (dbError) {
        console.error('Database error (non-blocking):', dbError);
        // Continue with the response regardless of database error
      }
      
      return res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: review,
      });
    } else {
      throw new Error('Failed to save review');
    }
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error adding review',
    });
  }
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Getting reviews for product with ID: ${id}`);
    
    // Always use file-based storage for reliability
    // Load existing reviews
    const allReviews = loadReviews();
    
    // Try to get reviews from database as well
    let dbReviews = [];
    try {
      const product = await Product.findById(id);
      if (product && product.reviews) {
        dbReviews = product.reviews;
      }
    } catch (dbError) {
      console.error('Database error (non-blocking):', dbError);
      // Continue with file-based reviews
    }
    
    // Combine file-based and database reviews
    const fileReviews = allReviews[id] || [];
    
    // Create a map of existing review IDs to avoid duplicates
    const reviewMap = new Map();
    
    // Add file-based reviews first
    fileReviews.forEach(review => {
      reviewMap.set(review._id, review);
    });
    
    // Add database reviews if they don't exist in the file
    dbReviews.forEach(review => {
      if (!reviewMap.has(review._id.toString())) {
        reviewMap.set(review._id.toString(), {
          _id: review._id.toString(),
          name: review.name || 'Anonymous',
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt || new Date().toISOString(),
        });
      }
    });
    
    // Convert map to array
    const combinedReviews = Array.from(reviewMap.values());
    
    // Sort by date (newest first)
    combinedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return res.status(200).json({
      success: true,
      data: combinedReviews,
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting reviews',
    });
  }
};
