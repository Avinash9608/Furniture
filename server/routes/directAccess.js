const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  updateProduct,
  uploadProductImages
} = require('../controllers/directAccess');

// Get all products
router.get('/products', getProducts);

// Get a product by ID
router.get('/products/:id', getProduct);

// Update a product
router.put('/products/:id', uploadProductImages, updateProduct);

module.exports = router;
