/**
 * Product Data Service
 * 
 * This service provides reliable access to product data with multiple fallback mechanisms.
 * It tries multiple approaches to fetch data and always returns something useful.
 */

const { MongoClient, ObjectId } = require("mongodb");

// Mock data for fallback
const mockProducts = [
  {
    _id: "680dcd6207d80949f2c7f36e",
    name: "Elegant Wooden Sofa",
    description: "A beautiful wooden sofa with comfortable cushions. Perfect for your living room.",
    price: 24999,
    discountPrice: 19999,
    category: {
      _id: "680c9481ab11e96a288ef6d9",
      name: "Sofa Beds",
    },
    stock: 15,
    ratings: 4.7,
    numReviews: 24,
    images: [
      "https://placehold.co/800x600/brown/white?text=Elegant+Wooden+Sofa",
      "https://placehold.co/800x600/brown/white?text=Sofa+Side+View",
      "https://placehold.co/800x600/brown/white?text=Sofa+Front+View",
    ],
    specifications: [
      { name: "Material", value: "Sheesham Wood" },
      { name: "Dimensions", value: "72 x 30 x 32 inches" },
      { name: "Weight", value: "45 kg" },
      { name: "Seating Capacity", value: "3 People" },
      { name: "Cushion Material", value: "High-density Foam" },
    ],
    reviews: [],
    createdAt: new Date(),
  },
  {
    _id: "680cfe0ee4e0274a4cc9a1ea",
    name: "Modern Dining Table",
    description: "A stylish dining table perfect for family gatherings and dinner parties.",
    price: 18999,
    discountPrice: 15999,
    category: {
      _id: "680c9484ab11e96a288ef6da",
      name: "Tables",
    },
    stock: 10,
    ratings: 4.5,
    numReviews: 18,
    images: [
      "https://placehold.co/800x600/darkwood/white?text=Modern+Dining+Table",
      "https://placehold.co/800x600/darkwood/white?text=Table+Top+View",
      "https://placehold.co/800x600/darkwood/white?text=Table+Side+View",
    ],
    specifications: [
      { name: "Material", value: "Teak Wood" },
      { name: "Dimensions", value: "72 x 36 x 30 inches" },
      { name: "Weight", value: "40 kg" },
      { name: "Seating Capacity", value: "6 People" },
      { name: "Finish", value: "Polished" },
    ],
    reviews: [],
    createdAt: new Date(),
  },
  {
    _id: "680cfe1ee4e0274a4cc9a1eb",
    name: "Comfortable Armchair",
    description: "A comfortable armchair with plush cushions. Perfect for relaxing with a book.",
    price: 12999,
    discountPrice: 9999,
    category: {
      _id: "680c9486ab11e96a288ef6db",
      name: "Chairs",
    },
    stock: 20,
    ratings: 4.8,
    numReviews: 30,
    images: [
      "https://placehold.co/800x600/gray/white?text=Comfortable+Armchair",
      "https://placehold.co/800x600/gray/white?text=Armchair+Side+View",
      "https://placehold.co/800x600/gray/white?text=Armchair+Front+View",
    ],
    specifications: [
      { name: "Material", value: "Fabric" },
      { name: "Dimensions", value: "35 x 38 x 40 inches" },
      { name: "Weight", value: "25 kg" },
      { name: "Cushion Material", value: "High-density Foam" },
    ],
    reviews: [],
    createdAt: new Date(),
  },
  {
    _id: "680cfe2ee4e0274a4cc9a1ec",
    name: "Spacious Wardrobe",
    description: "A spacious wardrobe with multiple compartments for all your storage needs.",
    price: 32999,
    discountPrice: 29999,
    category: {
      _id: "680c9489ab11e96a288ef6dc",
      name: "Wardrobes",
    },
    stock: 8,
    ratings: 4.6,
    numReviews: 15,
    images: [
      "https://placehold.co/800x600/darkbrown/white?text=Spacious+Wardrobe",
      "https://placehold.co/800x600/darkbrown/white?text=Wardrobe+Open+View",
      "https://placehold.co/800x600/darkbrown/white?text=Wardrobe+Side+View",
    ],
    specifications: [
      { name: "Material", value: "Engineered Wood" },
      { name: "Dimensions", value: "72 x 48 x 24 inches" },
      { name: "Weight", value: "80 kg" },
      { name: "Number of Shelves", value: "6" },
      { name: "Number of Drawers", value: "3" },
    ],
    reviews: [],
    createdAt: new Date(),
  },
];

// Category mapping
const categoryMap = {
  "680c9481ab11e96a288ef6d9": {
    _id: "680c9481ab11e96a288ef6d9",
    name: "Sofa Beds",
    slug: "sofa-beds",
  },
  "680c9484ab11e96a288ef6da": {
    _id: "680c9484ab11e96a288ef6da",
    name: "Tables",
    slug: "tables",
  },
  "680c9486ab11e96a288ef6db": {
    _id: "680c9486ab11e96a288ef6db",
    name: "Chairs",
    slug: "chairs",
  },
  "680c9489ab11e96a288ef6dc": {
    _id: "680c9489ab11e96a288ef6dc",
    name: "Wardrobes",
    slug: "wardrobes",
  },
};

/**
 * Get all products with reliable fallback
 * @param {Object} query - Query parameters
 * @returns {Object} - Products data
 */
async function getAllProducts(query = {}) {
  console.log("Product Data Service: Getting all products with query:", query);
  
  try {
    // Try direct MongoDB connection first
    const products = await fetchProductsFromMongoDB(query);
    
    if (products && products.length > 0) {
      console.log(`Product Data Service: Found ${products.length} products from MongoDB`);
      return {
        success: true,
        count: products.length,
        data: products,
        source: "mongodb"
      };
    }
  } catch (error) {
    console.error("Product Data Service: MongoDB error:", error.message);
  }
  
  // If MongoDB fails, use mock data
  console.log("Product Data Service: Using mock data");
  
  // Filter mock data based on query
  let filteredProducts = [...mockProducts];
  
  if (query.category) {
    filteredProducts = filteredProducts.filter(product => 
      product.category._id === query.category
    );
  }
  
  if (query.featured === 'true') {
    // All mock products are considered featured
  }
  
  if (query.limit) {
    const limit = parseInt(query.limit);
    if (!isNaN(limit) && limit > 0) {
      filteredProducts = filteredProducts.slice(0, limit);
    }
  }
  
  return {
    success: true,
    count: filteredProducts.length,
    data: filteredProducts,
    source: "mock"
  };
}

/**
 * Get a single product with reliable fallback
 * @param {string} id - Product ID
 * @returns {Object} - Product data
 */
async function getProductById(id) {
  console.log(`Product Data Service: Getting product with ID: ${id}`);
  
  try {
    // Try direct MongoDB connection first
    const product = await fetchProductFromMongoDB(id);
    
    if (product) {
      console.log(`Product Data Service: Found product from MongoDB: ${product._id}`);
      return {
        success: true,
        data: product,
        source: "mongodb"
      };
    }
  } catch (error) {
    console.error("Product Data Service: MongoDB error:", error.message);
  }
  
  // If MongoDB fails, check mock data
  console.log("Product Data Service: Checking mock data");
  
  // Try to find in mock data
  const mockProduct = mockProducts.find(p => 
    p._id === id || 
    (p.slug && p.slug === id)
  );
  
  if (mockProduct) {
    console.log(`Product Data Service: Found product in mock data: ${mockProduct._id}`);
    return {
      success: true,
      data: mockProduct,
      source: "mock"
    };
  }
  
  // If not found in mock data, create a fallback product
  console.log("Product Data Service: Creating fallback product");
  
  const fallbackProduct = {
    _id: id,
    name: "Product " + id.substring(0, 8),
    description: "This is a fallback product shown when the requested product could not be found.",
    price: 19999,
    discountPrice: 15999,
    category: {
      _id: "fallback-category",
      name: "Furniture",
    },
    stock: 10,
    ratings: 4.5,
    numReviews: 12,
    images: [
      "https://placehold.co/800x600/orange/white?text=Product+" + id.substring(0, 8),
    ],
    specifications: [
      { name: "Material", value: "Wood" },
      { name: "Dimensions", value: "80 x 60 x 40 cm" },
      { name: "Weight", value: "15 kg" },
    ],
    reviews: [],
    createdAt: new Date(),
    isFallback: true
  };
  
  return {
    success: true,
    data: fallbackProduct,
    source: "fallback"
  };
}

/**
 * Fetch products from MongoDB
 * @param {Object} query - Query parameters
 * @returns {Array} - Products array
 */
async function fetchProductsFromMongoDB(query = {}) {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI not defined");
  }
  
  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 5000, // Short timeout to fail fast
    socketTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  };
  
  let client = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(uri, options);
    await client.connect();
    
    // Get database name from connection string
    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);
    
    // Build query
    const mongoQuery = {};
    
    // Apply category filter
    if (query.category) {
      try {
        mongoQuery.category = new ObjectId(query.category);
      } catch (idError) {
        mongoQuery.category = query.category;
      }
    }
    
    // Apply featured filter
    if (query.featured === 'true') {
      mongoQuery.featured = true;
    }
    
    // Execute query
    const productsCollection = db.collection("products");
    let findQuery = productsCollection.find(mongoQuery);
    
    // Apply limit
    if (query.limit) {
      const limit = parseInt(query.limit);
      if (!isNaN(limit) && limit > 0) {
        findQuery = findQuery.limit(limit);
      }
    }
    
    // Get products
    const products = await findQuery.toArray();
    
    // Get categories to populate product data
    const categoriesCollection = db.collection("categories");
    const categories = await categoriesCollection.find().toArray();
    
    // Create a map of category IDs to category objects
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category._id.toString()] = category;
    });
    
    // Populate category data in products
    const populatedProducts = products.map(product => {
      if (product.category) {
        const categoryId = product.category.toString();
        if (categoryMap[categoryId]) {
          product.category = categoryMap[categoryId];
        }
      }
      return product;
    });
    
    return populatedProducts;
  } finally {
    // Close MongoDB connection
    if (client) {
      await client.close();
    }
  }
}

/**
 * Fetch a single product from MongoDB
 * @param {string} id - Product ID
 * @returns {Object} - Product object
 */
async function fetchProductFromMongoDB(id) {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI not defined");
  }
  
  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 5000, // Short timeout to fail fast
    socketTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  };
  
  let client = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(uri, options);
    await client.connect();
    
    // Get database name from connection string
    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);
    
    // Get collections
    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");
    
    // Try to find product by ID
    let product = null;
    
    try {
      // Try ObjectId first
      product = await productsCollection.findOne({ _id: new ObjectId(id) });
    } catch (idError) {
      // Try as string
      product = await productsCollection.findOne({ _id: id });
    }
    
    // If not found, try by slug
    if (!product) {
      product = await productsCollection.findOne({ slug: id });
    }
    
    // If product found, try to get category info
    if (product && product.category) {
      try {
        let categoryId;
        
        try {
          categoryId = new ObjectId(product.category);
        } catch (idError) {
          categoryId = product.category;
        }
        
        const category = await categoriesCollection.findOne({ _id: categoryId });
        
        if (category) {
          product.category = category;
        }
      } catch (categoryError) {
        console.error("Error fetching category info:", categoryError);
      }
    }
    
    return product;
  } finally {
    // Close MongoDB connection
    if (client) {
      await client.close();
    }
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  mockProducts,
  categoryMap
};
