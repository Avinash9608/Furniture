const Category = require("../models/Category");
const Product = require("../models/Product");
const path = require("path");
const fs = require("fs");

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found with id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
// exports.createCategory = async (req, res) => {
//   try {
//     // Handle file upload
//     if (req.file) {
//       req.body.image = `/uploads/${req.file.filename}`;
//     }

//     const category = await Category.create(req.body);

//     res.status(201).json({
//       success: true,
//       data: category
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
exports.createCategory = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
exports.updateCategory = async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found with id of ${req.params.id}`,
      });
    }

    // Handle file upload
    if (req.file) {
      // Delete old image
      if (category.image && category.image !== "no-image.jpg") {
        const imagePath = path.join(__dirname, "..", category.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      req.body.image = `/uploads/${req.file.filename}`;
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found with id of ${req.params.id}`,
      });
    }

    // Check if category has products
    const products = await Product.find({ category: req.params.id });

    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category because it has ${products.length} products`,
      });
    }

    // Delete category image
    if (category.image && category.image !== "no-image.jpg") {
      const imagePath = path.join(__dirname, "..", category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
