const express = require('express');
const router = express.Router();

// Get all messages
router.get('/', (req, res) => {
  res.json({ message: 'Get all messages' });
});

// Get a single message
router.get('/:id', (req, res) => {
  res.json({ message: `Get message with id ${req.params.id}` });
});

// Create a message
router.post('/', (req, res) => {
  res.json({ message: 'Create a message' });
});

// Update a message
router.put('/:id', (req, res) => {
  res.json({ message: `Update message with id ${req.params.id}` });
});

// Delete a message
router.delete('/:id', (req, res) => {
  res.json({ message: `Delete message with id ${req.params.id}` });
});

module.exports = router;
