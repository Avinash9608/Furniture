const express = require('express');
const router = express.Router();

// Get all users
router.get('/', (req, res) => {
  res.json({ message: 'Get all users' });
});

// Get a single user
router.get('/:id', (req, res) => {
  res.json({ message: `Get user with id ${req.params.id}` });
});

// Create a user
router.post('/', (req, res) => {
  res.json({ message: 'Create a user' });
});

// Update a user
router.put('/:id', (req, res) => {
  res.json({ message: `Update user with id ${req.params.id}` });
});

// Delete a user
router.delete('/:id', (req, res) => {
  res.json({ message: `Delete user with id ${req.params.id}` });
});

module.exports = router;
