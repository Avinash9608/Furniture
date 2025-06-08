const { getCollection } = require("../utils/directDbAccess");

// Collection name
const COLLECTION = "products";

// @desc    Get all products for admin using direct database access
// @route   GET /api/admin/products/direct
// @access  Private/Admin
exports.getAllProductsDirectDb = async (req, res) => {
  try {
    console.log(
      "🔍 getAllProductsDirectDb called - fetching products directly from MongoDB"
    );
    console.log("Request URL:", req.originalUrl);

    // Get the products collection
    const collection = await getCollection(COLLECTION);
    console.log("Attempting to fetch products directly from MongoDB...");

    const products = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    console.log(`Found ${products.length} products directly from MongoDB`);

    if (products.length > 0) {
      console.log(
        "✅ Successfully fetched real products directly from MongoDB"
      );
      return res.status(200).json({
        success: true,
        count: products.length,
        data: products,
        source: "direct_database",
      });
    }

    console.warn("⚠️ No products found in database");
    return res.status(404).json({
      success: false,
      message: "No products found",
      count: 0,
      data: [],
      source: "direct_database",
    });
  } catch (dbError) {
    console.error("❌ Error fetching products from MongoDB:", dbError);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching products",
    });
  }
};
