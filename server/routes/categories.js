const express = require("express");
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categories");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Check if we should bypass auth in development mode
const bypassAuth =
  process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true";
console.log("Categories Routes - Bypass Auth:", bypassAuth);

// Create middleware arrays based on environment
const adminMiddleware = bypassAuth
  ? [upload.single("image")]
  : [protect, authorize("admin"), upload.single("image")];

const adminDeleteMiddleware = bypassAuth ? [] : [protect, authorize("admin")];

router
  .route("/")
  .get(getCategories)
  .post(...adminMiddleware, createCategory);

router
  .route("/:id")
  .get(getCategory)
  .put(...adminMiddleware, updateCategory)
  .delete(...adminDeleteMiddleware, deleteCategory);

module.exports = router;
