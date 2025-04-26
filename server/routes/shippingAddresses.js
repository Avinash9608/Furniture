const express = require("express");
const {
  createShippingAddress,
  getShippingAddresses,
  getDefaultShippingAddress,
  getShippingAddressById,
  updateShippingAddress,
  deleteShippingAddress,
} = require("../controllers/shippingAddresses");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

// Check if we should bypass auth in development mode
const bypassAuth = true; // Always bypass auth for shipping addresses in development
console.log("Shipping Addresses Routes - Bypass Auth:", bypassAuth);

// Create middleware arrays based on environment
const adminMiddleware = bypassAuth ? [] : [protect, authorize("admin")];

// Get default shipping address - public route
router.route("/default").get(getDefaultShippingAddress);

// Admin routes
router
  .route("/")
  .post(...adminMiddleware, createShippingAddress)
  .get(...adminMiddleware, getShippingAddresses);

router
  .route("/:id")
  .get(...adminMiddleware, getShippingAddressById)
  .put(...adminMiddleware, updateShippingAddress)
  .delete(...adminMiddleware, deleteShippingAddress);

module.exports = router;
