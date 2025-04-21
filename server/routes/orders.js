const express = require("express");
const {
  createOrder,
  getOrderById,
  updateOrderStatus,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
} = require("../controllers/orders");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

// Check if we should bypass auth in development mode
const bypassAuth =
  process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true";
console.log("Orders Routes - Bypass Auth:", bypassAuth);

// Create middleware arrays based on environment
const userMiddleware = bypassAuth ? [] : [protect];
const adminMiddleware = bypassAuth ? [] : [protect, authorize("admin")];

router
  .route("/")
  .post(...userMiddleware, createOrder)
  .get(...adminMiddleware, getOrders);

router.route("/myorders").get(...userMiddleware, getMyOrders);

router.route("/:id").get(...userMiddleware, getOrderById);

router.route("/:id/status").put(...adminMiddleware, updateOrderStatus);

router.route("/:id/pay").put(...adminMiddleware, updateOrderToPaid);

module.exports = router;
