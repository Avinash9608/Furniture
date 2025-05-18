const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/directProducts');
const { protect, authorize } = require('../middleware/auth');
const { handleMultipleFiles } = require('../middleware/upload');

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes
router.use(protect); // Apply authentication middleware to all routes below

// Admin routes
router.post('/', authorize('admin'), handleMultipleFiles, createProduct);
router.put('/:id', authorize('admin'), handleMultipleFiles, updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

// Export the router
module.exports = router;
