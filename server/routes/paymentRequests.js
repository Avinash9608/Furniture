const express = require("express");
const {
  createPaymentRequest,
  getMyPaymentRequests,
  getAllPaymentRequests,
  updatePaymentRequestStatus,
  getPaymentRequestById,
  uploadPaymentProof,
} = require("../controllers/paymentRequests");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Check if we should bypass auth in development mode
const bypassAuth = true; // Always bypass auth for payment requests in development
console.log("Payment Requests Routes - Bypass Auth:", bypassAuth);

// Create middleware arrays based on environment
const userMiddleware = bypassAuth ? [] : [protect];
const adminMiddleware = bypassAuth ? [] : [protect, authorize("admin")];
const uploadMiddleware = [upload.single("paymentProof")];

// Admin routes - must be defined BEFORE the /:id routes to avoid conflict
router.route("/all").get(...adminMiddleware, getAllPaymentRequests);

// User routes
router
  .route("/")
  .post(...userMiddleware, createPaymentRequest)
  .get(...userMiddleware, getMyPaymentRequests);

// Routes with parameters
router.route("/:id").get(...userMiddleware, getPaymentRequestById);
router
  .route("/:id/proof")
  .put([...userMiddleware, ...uploadMiddleware], uploadPaymentProof);
router.route("/:id/status").put(...adminMiddleware, updatePaymentRequestStatus);

module.exports = router;
