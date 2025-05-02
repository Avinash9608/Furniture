const Product = require("../models/Product");
const mongoose = require("mongoose");
const directDb = require("../utils/directDbAccess");

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

    // Get mock products from the model
    let mockProducts;
    try {
      // Try to use the model's getMockData method if available
      if (Product.getMockData) {
        console.log("Using Product.getMockData() for mock products");
        mockProducts = Product.getMockData();
      } else if (Product.schema.statics.mockData) {
        console.log("Using Product.schema.statics.mockData for mock products");
        mockProducts = Product.schema.statics.mockData;
      } else {
        // Fallback to hardcoded mock data
        console.log("Using hardcoded mock products");
        mockProducts = [
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
            images: [
              "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
            ],
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
      }
    } catch (mockError) {
      console.error("Error getting mock data:", mockError);
      // Fallback to hardcoded mock data
      mockProducts = [
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
    }

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

      // Try to use the model first
      let products = [];
      try {
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

          // Try using the direct database access utility
          try {
            // Get products
            products = await directDb.findDocuments(
              "products",
              {},
              { sort: { createdAt: -1 } }
            );
            console.log(
              `Found ${products.length} products using directDb utility`
            );

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
                const categories = await directDb.findDocuments("categories", {
                  _id: { $in: categoryIds },
                });

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
          } catch (utilError) {
            console.error("Error using directDb utility:", utilError);

            // Fall back to raw MongoDB driver
            const db = mongoose.connection.db;
            if (db) {
              const productsCollection = db.collection("products");
              if (productsCollection) {
                // Get products
                products = await productsCollection
                  .find()
                  .sort({ createdAt: -1 })
                  .toArray();

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
                    const categories = await db
                      .collection("categories")
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
                        product.category =
                          categoryMap[product.category.toString()];
                      }
                      return product;
                    });
                  }
                }

                console.log(
                  `Found ${products.length} products using raw MongoDB driver`
                );
              } else {
                console.error("products collection not found in database");
              }
            } else {
              console.error("Database connection not available");
            }
          }
        } catch (dbError) {
          console.error("Error with direct database access:", dbError);
        }
      }

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
