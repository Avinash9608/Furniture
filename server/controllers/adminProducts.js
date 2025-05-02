const Product = require("../models/Product");
const mongoose = require("mongoose");

// @desc    Get all products for admin
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = async (req, res) => {
  try {
    console.log(
      "🔍 getAllProducts called - fetching all products from MongoDB Atlas"
    );
    console.log("Request URL:", req.originalUrl);
    console.log("Request query params:", req.query);
    console.log("MongoDB connection state:", mongoose.connection.readyState);

    // Define mock products for fallback
    const mockProducts = [
      {
        _id: "mock1",
        name: "Luxury Sofa",
        description: "A comfortable luxury sofa",
        price: 12999,
        category: {
          _id: "cat1",
          name: "Sofa",
        },
        stock: 10,
        images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc"],
        createdAt: new Date(),
      },
      {
        _id: "mock2",
        name: "Wooden Dining Table",
        description: "A sturdy wooden dining table",
        price: 8999,
        category: {
          _id: "cat2",
          name: "Tables",
        },
        stock: 5,
        images: [
          "https://images.unsplash.com/photo-1533090161767-e6ffed986c88",
        ],
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        _id: "mock3",
        name: "Executive Office Chair",
        description: "A comfortable office chair",
        price: 5999,
        category: {
          _id: "cat3",
          name: "Chairs",
        },
        stock: 15,
        images: [
          "https://images.unsplash.com/photo-1580480055273-228ff5388ef8",
        ],
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
      },
    ];

    // First try to get real products from the database
    try {
      console.log("Attempting to fetch products from MongoDB Atlas...");

      // Check if Product model is available
      if (!Product) {
        console.error("Product model is not defined!");
        console.log("Returning mock products instead");
        return res.status(200).json({
          success: true,
          count: mockProducts.length,
          data: mockProducts,
          source: "mock_products_model_not_defined",
        });
      }

      console.log(
        "Product model is available, attempting to fetch real products"
      );

      // Set longer timeout for MongoDB operations
      const products = await Product.find()
        .populate("category")
        .sort({ createdAt: -1 })
        .maxTimeMS(30000) // 30 seconds timeout
        .lean(); // Use lean for better performance

      console.log(`Found ${products.length} products in database`);

      // If we have real products, return them
      if (products && products.length > 0) {
        console.log("✅ Successfully fetched real products from database");
        return res.status(200).json({
          success: true,
          count: products.length,
          data: products,
          source: "database",
        });
      }

      // If no products found in database, return the mock products
      console.log("No products found in database, returning mock products");
      return res.status(200).json({
        success: true,
        count: mockProducts.length,
        data: mockProducts,
        source: "mock_products_empty_result",
      });
    } catch (dbError) {
      console.error("❌ Error fetching products from database:", dbError);
      console.error("Error stack:", dbError.stack);

      // Return the mock products if database fetch fails
      console.log("Database error, returning mock products");
      return res.status(200).json({
        success: true,
        count: mockProducts.length,
        data: mockProducts,
        source: "mock_products_db_error",
        error: dbError.message,
      });
    }
  } catch (error) {
    console.error("❌ Unexpected error in getAllProducts:", error);
    console.error("Error stack:", error.stack);

    // Even on error, return the mock products
    const fallbackProducts = [
      {
        _id: "mock1",
        name: "Luxury Sofa",
        description: "A comfortable luxury sofa",
        price: 12999,
        category: {
          _id: "cat1",
          name: "Sofa",
        },
        stock: 10,
        images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc"],
        createdAt: new Date(),
      },
      {
        _id: "mock2",
        name: "Wooden Dining Table",
        description: "A sturdy wooden dining table",
        price: 8999,
        category: {
          _id: "cat2",
          name: "Tables",
        },
        stock: 5,
        images: [
          "https://images.unsplash.com/photo-1533090161767-e6ffed986c88",
        ],
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
    ];

    console.log("Error occurred, returning fallback products");

    return res.status(200).json({
      success: true,
      count: fallbackProducts.length,
      data: fallbackProducts,
      source: "fallback_mock_data_error",
      error: error.message,
    });
  }
};
