/**
 * Direct database access controller for admin products
 * This controller bypasses Mongoose and accesses MongoDB directly
 */

// Mock data for fallback
const mockProducts = [
  {
    _id: "mock-product-1",
    name: "Luxury Sofa",
    slug: "luxury-sofa",
    description: "A comfortable luxury sofa for your living room",
    price: 12999,
    category: {
      _id: "mock-category-1",
      name: "Sofa"
    },
    stock: 10,
    images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc"],
    featured: true,
    dimensions: {
      length: 200,
      width: 90,
      height: 85
    },
    material: "Leather",
    color: "Brown",
    ratings: 4.5,
    numReviews: 12,
    createdAt: new Date()
  },
  {
    _id: "mock-product-2",
    name: "Wooden Dining Table",
    slug: "wooden-dining-table",
    description: "A sturdy wooden dining table for your family",
    price: 8999,
    category: {
      _id: "mock-category-2",
      name: "Tables"
    },
    stock: 5,
    images: ["https://images.unsplash.com/photo-1533090161767-e6ffed986c88"],
    featured: false,
    dimensions: {
      length: 180,
      width: 90,
      height: 75
    },
    material: "Wood",
    color: "Natural",
    ratings: 4.2,
    numReviews: 8,
    createdAt: new Date(Date.now() - 86400000) // 1 day ago
  },
  {
    _id: "mock-product-3",
    name: "Executive Office Chair",
    slug: "executive-office-chair",
    description: "A comfortable office chair with ergonomic design",
    price: 5999,
    category: {
      _id: "mock-category-3",
      name: "Chairs"
    },
    stock: 15,
    images: ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8"],
    featured: true,
    dimensions: {
      length: 70,
      width: 70,
      height: 120
    },
    material: "Mesh and Metal",
    color: "Black",
    ratings: 4.8,
    numReviews: 20,
    createdAt: new Date(Date.now() - 172800000) // 2 days ago
  }
];

// @desc    Get all products for admin using direct database access
// @route   GET /api/admin/products/direct
// @access  Private/Admin
exports.getAllProductsDirectDb = async (req, res) => {
  try {
    console.log("🔍 getAllProductsDirectDb called - fetching products directly from MongoDB");
    console.log("Request URL:", req.originalUrl);
    
    // Check if we have a global database reference
    if (!global.mongoDb) {
      console.error("No global database reference available");
      return res.status(200).json({
        success: true,
        count: mockProducts.length,
        data: mockProducts,
        source: "mock_products_no_global_db"
      });
    }
    
    // Try to get products directly from the database
    try {
      console.log("Attempting to fetch products directly from MongoDB...");
      
      // Get the products collection
      const productsCollection = global.mongoDb.collection('products');
      
      // Find all products
      const products = await productsCollection.find({}).sort({ createdAt: -1 }).toArray();
      
      console.log(`Found ${products.length} products directly from MongoDB`);
      
      // Try to populate category information
      if (products && products.length > 0) {
        try {
          // Get all category IDs
          const categoryIds = products
            .map(p => p.category)
            .filter(id => id && typeof id !== 'object')
            .map(id => {
              try {
                const { ObjectId } = require('mongodb');
                return new ObjectId(id);
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean);
          
          if (categoryIds.length > 0) {
            // Get the categories collection
            const categoriesCollection = global.mongoDb.collection('categories');
            
            // Find all categories
            const categories = await categoriesCollection.find({ _id: { $in: categoryIds } }).toArray();
            
            // Create a map of category ID to category
            const categoryMap = {};
            categories.forEach(cat => {
              categoryMap[cat._id.toString()] = cat;
            });
            
            // Populate category information
            products.forEach(product => {
              if (product.category && typeof product.category !== 'object') {
                const categoryId = product.category.toString();
                if (categoryMap[categoryId]) {
                  product.category = categoryMap[categoryId];
                }
              }
            });
          }
        } catch (categoryError) {
          console.error("Error populating category information:", categoryError);
        }
      }
      
      // If we have real products, return them
      if (products && products.length > 0) {
        console.log("✅ Successfully fetched real products directly from MongoDB");
        return res.status(200).json({
          success: true,
          count: products.length,
          data: products,
          source: "direct_database"
        });
      }
      
      // If no products found, return mock products
      console.log("No products found in database, returning mock products");
      return res.status(200).json({
        success: true,
        count: mockProducts.length,
        data: mockProducts,
        source: "mock_products_empty_result_direct"
      });
    } catch (dbError) {
      console.error("❌ Error fetching products directly from MongoDB:", dbError);
      
      // Return mock products on error
      return res.status(200).json({
        success: true,
        count: mockProducts.length,
        data: mockProducts,
        source: "mock_products_db_error_direct",
        error: dbError.message
      });
    }
  } catch (error) {
    console.error("❌ Unexpected error in getAllProductsDirectDb:", error);
    
    // Return mock products on error
    return res.status(200).json({
      success: true,
      count: mockProducts.length,
      data: mockProducts,
      source: "mock_products_unexpected_error_direct",
      error: error.message
    });
  }
};
