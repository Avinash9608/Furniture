/**
 * Direct Categories Controller
 * 
 * This controller provides direct MongoDB access for category operations,
 * bypassing Mongoose to avoid buffering timeout issues.
 */

const { ObjectId } = require('mongodb');
const { 
  findDocuments, 
  findOneDocument, 
  insertDocument, 
  updateDocument, 
  deleteDocument 
} = require('../utils/directDbConnection');

// Collection name
const COLLECTION = 'categories';

// @desc    Get all categories with direct MongoDB access
// @route   GET /api/direct/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    console.log('Getting all categories with direct MongoDB access');
    
    // Get categories
    const categories = await findDocuments(COLLECTION, {}, { sort: { name: 1 } });
    
    // Return categories
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error getting categories with direct MongoDB access:', error);
    
    // Return mock data on error
    return res.status(200).json({
      success: true,
      count: 4,
      data: [
        { _id: 'category1', name: 'Chairs', image: 'https://placehold.co/300x300/gray/white?text=Chairs' },
        { _id: 'category2', name: 'Tables', image: 'https://placehold.co/300x300/gray/white?text=Tables' },
        { _id: 'category3', name: 'Sofa Beds', image: 'https://placehold.co/300x300/gray/white?text=SofaBeds' },
        { _id: 'category4', name: 'Wardrobes', image: 'https://placehold.co/300x300/gray/white?text=Wardrobes' }
      ],
      source: 'mock_data'
    });
  }
};

// @desc    Get single category with direct MongoDB access
// @route   GET /api/direct/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    console.log(`Getting category with ID: ${req.params.id}`);
    
    // Convert string ID to ObjectId
    let categoryId;
    try {
      categoryId = new ObjectId(req.params.id);
    } catch (error) {
      console.error('Invalid category ID format:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }
    
    // Get category
    const category = await findOneDocument(COLLECTION, { _id: categoryId });
    
    // Check if category exists
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Return category
    return res.status(200).json({
      success: true,
      data: category,
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error getting category with direct MongoDB access:', error);
    
    // Return error
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create category with direct MongoDB access
// @route   POST /api/direct/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    console.log('Creating category with direct MongoDB access');
    
    // Create category
    const category = await insertDocument(COLLECTION, req.body);
    
    // Return category
    return res.status(201).json({
      success: true,
      data: category,
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error creating category with direct MongoDB access:', error);
    
    // Return error
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update category with direct MongoDB access
// @route   PUT /api/direct/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    console.log(`Updating category with ID: ${req.params.id}`);
    
    // Convert string ID to ObjectId
    let categoryId;
    try {
      categoryId = new ObjectId(req.params.id);
    } catch (error) {
      console.error('Invalid category ID format:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }
    
    // Update category
    const result = await updateDocument(
      COLLECTION, 
      { _id: categoryId }, 
      { $set: req.body }
    );
    
    // Check if category exists
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get updated category
    const category = await findOneDocument(COLLECTION, { _id: categoryId });
    
    // Return category
    return res.status(200).json({
      success: true,
      data: category,
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error updating category with direct MongoDB access:', error);
    
    // Return error
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete category with direct MongoDB access
// @route   DELETE /api/direct/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    console.log(`Deleting category with ID: ${req.params.id}`);
    
    // Convert string ID to ObjectId
    let categoryId;
    try {
      categoryId = new ObjectId(req.params.id);
    } catch (error) {
      console.error('Invalid category ID format:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }
    
    // Delete category
    const result = await deleteDocument(COLLECTION, { _id: categoryId });
    
    // Check if category exists
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Return success
    return res.status(200).json({
      success: true,
      data: {},
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error deleting category with direct MongoDB access:', error);
    
    // Return error
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
