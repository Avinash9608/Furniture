const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categories");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public routes
router.route("/").get(getCategories);
router.route("/:id").get(getCategory);

// Protected routes
router.use(protect);

// Admin only routes
router.use(authorize("admin"));

router
  .route("/")
  .post(upload.single("image"), createCategory);

router
  .route("/:id")
  .put(upload.single("image"), updateCategory)
  .delete(deleteCategory);

module.exports = router;
