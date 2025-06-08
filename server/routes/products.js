const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../utils/cloudinaryUpload");

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Protected admin routes
router.post("/", protect, authorize("admin"), upload.array("images"), createProduct);
router.put("/:id", protect, authorize("admin"), upload.array("images"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
