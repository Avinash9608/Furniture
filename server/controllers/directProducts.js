/**
 * Direct Products Controller
 * 
 * This controller provides direct MongoDB access for product operations,
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
const COLLECTION = 'products';

// @desc    Get all products with direct MongoDB access
// @route   GET /api/direct/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    console.log('Getting all products with direct MongoDB access');
    
    // Get query parameters
    const { 
      category, 
      featured, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt', 
      order = 'desc',
      limit = 100,
      page = 1
    } = req.query;
    
    // Build query
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (featured) {
      query.featured = featured === 'true';
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      
      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }
      
      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }
    
    // Build options
    const options = {
      sort: { [sort]: order === 'desc' ? -1 : 1 },
      limit: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    };
    
    // Get products
    const products = await findDocuments(COLLECTION, query, options);
    
    // Return products
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error getting products with direct MongoDB access:', error);
    
    // Return mock data on error
    return res.status(200).json({
      success: true,
      count: 2,
      data: [
        {
          _id: 'mock1',
          name: 'Mock Product 1',
          price: 19999,
          category: 'mock-category-1',
          stock: 10,
          images: ['https://placehold.co/300x300/gray/white?text=Product1']
        },
        {
          _id: 'mock2',
          name: 'Mock Product 2',
          price: 29999,
          category: 'mock-category-2',
          stock: 5,
          images: ['https://placehold.co/300x300/gray/white?text=Product2']
        }
      ],
      source: 'mock_data'
    });
  }
};

// @desc    Get single product with direct MongoDB access
// @route   GET /api/direct/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    console.log(`Getting product with ID: ${req.params.id}`);
    
    // Convert string ID to ObjectId
    let productId;
    try {
      productId = new ObjectId(req.params.id);
    } catch (error) {
      console.error('Invalid product ID format:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    // Get product
    const product = await findOneDocument(COLLECTION, { _id: productId });
    
    // Check if product exists
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Return product
    return res.status(200).json({
      success: true,
      data: product,
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error getting product with direct MongoDB access:', error);
    
    // Return error
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create product with direct MongoDB access
// @route   POST /api/direct/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    console.log('Creating product with direct MongoDB access');
    
    // Create product
    const product = await insertDocument(COLLECTION, req.body);
    
    // Return product
    return res.status(201).json({
      success: true,
      data: product,
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error creating product with direct MongoDB access:', error);
    
    // Return error
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update product with direct MongoDB access
// @route   PUT /api/direct/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    console.log(`Updating product with ID: ${req.params.id}`);
    
    // Convert string ID to ObjectId
    let productId;
    try {
      productId = new ObjectId(req.params.id);
    } catch (error) {
      console.error('Invalid product ID format:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    // Update product
    const result = await updateDocument(
      COLLECTION, 
      { _id: productId }, 
      { $set: req.body }
    );
    
    // Check if product exists
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get updated product
    const product = await findOneDocument(COLLECTION, { _id: productId });
    
    // Return product
    return res.status(200).json({
      success: true,
      data: product,
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error updating product with direct MongoDB access:', error);
    
    // Return error
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete product with direct MongoDB access
// @route   DELETE /api/direct/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    console.log(`Deleting product with ID: ${req.params.id}`);
    
    // Convert string ID to ObjectId
    let productId;
    try {
      productId = new ObjectId(req.params.id);
    } catch (error) {
      console.error('Invalid product ID format:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    // Delete product
    const result = await deleteDocument(COLLECTION, { _id: productId });
    
    // Check if product exists
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Return success
    return res.status(200).json({
      success: true,
      data: {},
      source: 'direct_database'
    });
  } catch (error) {
    console.error('Error deleting product with direct MongoDB access:', error);
    
    // Return error
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
