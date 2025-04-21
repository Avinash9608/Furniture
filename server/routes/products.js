const express = require("express");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} = require("../controllers/products");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Force bypass auth in development mode
const bypassAuth = true;
console.log("Products Routes - Bypass Auth:", bypassAuth);

// Create middleware arrays based on environment
const adminMiddleware = [upload.array("images", 5)];

const userMiddleware = bypassAuth ? [] : [protect];

// Define routes with conditional middleware
router
  .route("/")
  .get(getProducts)
  .post(...adminMiddleware, createProduct);

router
  .route("/:id")
  .get(getProduct)
  .put(...adminMiddleware, updateProduct)
  .delete(...adminMiddleware, deleteProduct);

router.route("/:id/reviews").post(...userMiddleware, createProductReview);

module.exports = router;
