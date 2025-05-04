const fs = require('fs');
const path = require('path');

// Path to store reviews
const dataDir = path.join(__dirname, '..', '..', 'data');
const reviewsFile = path.join(dataDir, 'reviews.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize reviews file if it doesn't exist
if (!fs.existsSync(reviewsFile)) {
  fs.writeFileSync(reviewsFile, JSON.stringify({}), 'utf8');
}

// Load reviews from file
const loadReviews = () => {
  try {
    const data = fs.readFileSync(reviewsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading reviews:', error);
    return {};
  }
};

// Save reviews to file
const saveReviews = (reviews) => {
  try {
    fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving reviews:', error);
    return false;
  }
};

// Add a review
exports.addReview = (req, res) => {
  try {
    console.log('Review submission received:', req.body);
    console.log('Product ID:', req.params.id);
    
    // Get product ID from params
    const productId = req.params.id;
    
    // Get review data from request body
    const { rating, comment, userName } = req.body;
    
    // Validate required fields
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating and comment are required'
      });
    }
    
    // Load existing reviews
    const allReviews = loadReviews();
    
    // Initialize reviews for this product if they don't exist
    if (!allReviews[productId]) {
      allReviews[productId] = [];
    }
    
    // Create a new review
    const newReview = {
      _id: `review_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: userName || 'Anonymous User',
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString()
    };
    
    // Add the review to the product's reviews
    allReviews[productId].push(newReview);
    
    // Save the updated reviews
    if (saveReviews(allReviews)) {
      return res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: newReview
      });
    } else {
      throw new Error('Failed to save review');
    }
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error adding review'
    });
  }
};

// Get reviews for a product
exports.getReviews = (req, res) => {
  try {
    // Get product ID from params
    const productId = req.params.id;
    
    // Load reviews
    const allReviews = loadReviews();
    
    // Get reviews for this product
    const productReviews = allReviews[productId] || [];
    
    return res.status(200).json({
      success: true,
      data: productReviews
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting reviews'
    });
  }
};
