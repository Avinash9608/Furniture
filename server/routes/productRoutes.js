const express = require('express');
const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  res.json({ message: 'Get all products' });
});

// Get a single product
router.get('/:id', (req, res) => {
  res.json({ message: `Get product with id ${req.params.id}` });
});

// Create a product
router.post('/', (req, res) => {
  res.json({ message: 'Create a product' });
});

// Update a product
router.put('/:id', (req, res) => {
  res.json({ message: `Update product with id ${req.params.id}` });
});

// Delete a product
router.delete('/:id', (req, res) => {
  res.json({ message: `Delete product with id ${req.params.id}` });
});

module.exports = router;
