const express = require('express');
const router = express.Router();

// Get all categories
router.get('/', (req, res) => {
  res.json({ message: 'Get all categories' });
});

// Get a single category
router.get('/:id', (req, res) => {
  res.json({ message: `Get category with id ${req.params.id}` });
});

// Create a category
router.post('/', (req, res) => {
  res.json({ message: 'Create a category' });
});

// Update a category
router.put('/:id', (req, res) => {
  res.json({ message: `Update category with id ${req.params.id}` });
});

// Delete a category
router.delete('/:id', (req, res) => {
  res.json({ message: `Delete category with id ${req.params.id}` });
});

module.exports = router;
