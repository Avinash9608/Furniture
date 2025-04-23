const express = require('express');
const router = express.Router();

// Get all orders
router.get('/', (req, res) => {
  res.json({ message: 'Get all orders' });
});

// Get a single order
router.get('/:id', (req, res) => {
  res.json({ message: `Get order with id ${req.params.id}` });
});

// Create an order
router.post('/', (req, res) => {
  res.json({ message: 'Create an order' });
});

// Update an order
router.put('/:id', (req, res) => {
  res.json({ message: `Update order with id ${req.params.id}` });
});

// Delete an order
router.delete('/:id', (req, res) => {
  res.json({ message: `Delete order with id ${req.params.id}` });
});

module.exports = router;
