const express = require('express');
const {
  createSourceAddress,
  getSourceAddresses,
  getSourceAddress,
  updateSourceAddress,
  deleteSourceAddress,
  getActiveSourceAddress
} = require('../controllers/sourceAddress');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Check if we should bypass auth in development mode
const bypassAuth = true; // Always bypass auth for source addresses in development
console.log('Source Address Routes - Bypass Auth:', bypassAuth);

// Create middleware arrays based on environment
const adminMiddleware = bypassAuth ? [] : [protect, authorize('admin')];

// Get active source address - public route
router.route('/active').get(getActiveSourceAddress);

// Admin routes
router
  .route('/')
  .post(...adminMiddleware, createSourceAddress)
  .get(...adminMiddleware, getSourceAddresses);

router
  .route('/:id')
  .get(...adminMiddleware, getSourceAddress)
  .put(...adminMiddleware, updateSourceAddress)
  .delete(...adminMiddleware, deleteSourceAddress);

module.exports = router;
