const Product = require("../models/Product");
const mongoose = require("mongoose");
const { getCollection } = require("../utils/directDbAccess");

// Collection names
const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";

// @desc    Get all products for admin
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = async (req, res) => {
  try {
    console.log("Getting all products for admin");
    let products = [];

    // Try to get products using Mongoose model
    try {
      console.log("Attempting to fetch products using Product model");

      // Set longer timeout for MongoDB operations
      products = await Product.find()
        .populate("category")
        .sort({ createdAt: -1 })
        .maxTimeMS(30000) // 30 seconds timeout
        .lean(); // Use lean for better performance

      console.log(`Found ${products.length} products using Product model`);
    } catch (modelError) {
      console.error("Error using Product model:", modelError);

      // If model approach fails, try direct database access
      try {
        console.log("Trying direct database access for products collection");

        // Get products collection
        const productsCollection = await getCollection(PRODUCTS_COLLECTION);

        // Get products
        products = await productsCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();

        console.log(`Found ${products.length} products using direct database access`);

        // Try to populate category information
        if (products.length > 0) {
          const categoryIds = products
            .map((p) => p.category)
            .filter((id) => id && typeof id !== "object")
            .map((id) => {
              try {
                return new mongoose.Types.ObjectId(id);
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean);

          if (categoryIds.length > 0) {
            // Get categories collection
            const categoriesCollection = await getCollection(CATEGORIES_COLLECTION);

            // Find all categories
            const categories = await categoriesCollection
              .find({ _id: { $in: categoryIds } })
              .toArray();

            // Create a map of category id to category
            const categoryMap = {};
            categories.forEach((cat) => {
              categoryMap[cat._id.toString()] = cat;
            });

            // Populate category information
            products = products.map((product) => {
              if (
                product.category &&
                categoryMap[product.category.toString()]
              ) {
                product.category = categoryMap[product.category.toString()];
              }
              return product;
            });
          }
        }
      } catch (dbError) {
        console.error("Error with direct database access:", dbError);
        throw dbError;
      }
    }

    // Return products
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error getting products:", error);

    return res.status(500).json({
      success: false,
      message: "Error getting products",
      error: error.message,
    });
  }
};
