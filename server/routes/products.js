const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} = require("../controllers/products");
const { protect, authorize } = require("../middleware/auth");
const { handleMultipleFiles } = require("../middleware/upload");

// Public routes
router.get("/", getProducts);
router.get("/:id", getProduct);

// Admin routes for product management
router.post("/", protect, authorize("admin"), handleMultipleFiles, createProduct);
router.put("/:id", protect, authorize("admin"), handleMultipleFiles, updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

// Review route
router.post("/:id/reviews", protect, createProductReview);

module.exports = router;
