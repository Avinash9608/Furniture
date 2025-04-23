const express = require('express');
const router = express.Router();

// Get all payments
router.get('/', (req, res) => {
  res.json({ message: 'Get all payments' });
});

// Get a single payment
router.get('/:id', (req, res) => {
  res.json({ message: `Get payment with id ${req.params.id}` });
});

// Create a payment
router.post('/', (req, res) => {
  res.json({ message: 'Create a payment' });
});

// Update a payment
router.put('/:id', (req, res) => {
  res.json({ message: `Update payment with id ${req.params.id}` });
});

// Delete a payment
router.delete('/:id', (req, res) => {
  res.json({ message: `Delete payment with id ${req.params.id}` });
});

module.exports = router;
