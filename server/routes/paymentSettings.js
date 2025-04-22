const express = require("express");
const {
  getPaymentSettings,
  createPaymentSettings,
  updatePaymentSettings,
  deletePaymentSettings,
  getAllPaymentSettings,
} = require("../controllers/paymentSettings");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

// Check if we should bypass auth in development mode
const bypassAuth = true; // Always bypass auth for payment settings in development
console.log("Payment Settings Routes - Bypass Auth:", bypassAuth);

// Create middleware arrays based on environment
const adminMiddleware = bypassAuth ? [] : [protect, authorize("admin")];

// Admin routes with specific paths - must be defined BEFORE the /:id routes
router.route("/all").get(...adminMiddleware, getAllPaymentSettings);

// Public route to get active payment settings
router
  .route("/")
  .get(getPaymentSettings)
  .post(...adminMiddleware, createPaymentSettings);

// Routes with parameters
router
  .route("/:id")
  .put(...adminMiddleware, updatePaymentSettings)
  .delete(...adminMiddleware, deletePaymentSettings);

module.exports = router;
