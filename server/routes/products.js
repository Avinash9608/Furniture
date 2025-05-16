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
const { upload } = require("../middleware/upload");

// Public routes
router.route("/").get(getProducts);
router.route("/:id").get(getProduct);

// Protected routes
router.use(protect); // Apply protection middleware to all routes below

// Admin only routes
router.use(authorize("admin")); // Apply admin authorization to all routes below

router
  .route("/")
  .post(upload.array("images", 5), createProduct); // Allow up to 5 images

router
  .route("/:id")
  .put(upload.array("images", 5), updateProduct)
  .delete(deleteProduct);

// Review routes
router.route("/:id/reviews").post(createProductReview);

module.exports = router;
