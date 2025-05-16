const { MongoClient } = require("mongodb");
const path = require("path");
const fs = require("fs");
const slugify = require("slugify");

// Collection name
const COLLECTION = "products";

// Get MongoDB URI from environment variables
const getMongoUri = () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MongoDB URI not found in environment variables");
  }
  return uri;
};

// Get database name from URI
const getDbName = (uri) => {
  return uri.split("/").pop().split("?")[0];
};

// Create a MongoDB client with high timeout values
const createMongoClient = () => {
  const uri = getMongoUri();
  return new MongoClient(uri, {
    connectTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    serverSelectionTimeoutMS: 60000,
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 120000,
  });
};

// Generate a unique slug
const generateUniqueSlug = async (name, collection) => {
  try {
    // Generate base slug
    let baseSlug = slugify(name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    
    // Add timestamp to make it unique
    const timestamp = Date.now();
    const slug = `${baseSlug}-${timestamp}`;
    
    console.log(`Generated slug: ${slug} for product: ${name}`);
    return slug;
  } catch (error) {
    console.error("Error generating slug:", error);
    // Fallback to timestamp-based slug
    return `product-${Date.now()}`;
  }
};

// @desc    Create product with direct MongoDB connection (no Mongoose)
// @route   POST /api/direct-mongo/product
// @access  Public
exports.createProduct = async (req, res) => {
  let client = null;
  
  try {
    console.log("=== Creating Product with Direct MongoDB (No Mongoose) ===");
    console.log("Request body:", req.body);
    console.log("Files received:", req.files ? req.files.length : 0);
    
    // Validate required fields
    const requiredFields = ["name", "description", "price", "category", "stock"];
    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }
    
    // Process uploaded files if any
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files`);
      imageUrls = req.files.map((file) => {
        // Convert Windows backslashes to forward slashes for URLs
        return file.path.replace(/\\/g, "/");
      });
      console.log("Uploaded image paths:", imageUrls);
    }
    
    // Process dimensions if provided
    let dimensions = {};
    if (req.body.dimensions) {
      try {
        if (typeof req.body.dimensions === "string") {
          dimensions = JSON.parse(req.body.dimensions);
          console.log("Successfully parsed dimensions JSON:", dimensions);
        } else {
          dimensions = req.body.dimensions;
          console.log("Using dimensions object directly:", dimensions);
        }
        console.log("Processed dimensions:", dimensions);
      } catch (error) {
        console.error("Error parsing dimensions:", error);
        dimensions = {}; // Default to empty object if parsing fails
      }
    }
    
    // Process category - handle offline categories
    let categoryValue = req.body.category;
    let categoryName = req.body.categoryName || "";
    
    // If it's an offline category, extract the name
    if (categoryValue && typeof categoryValue === 'string' && categoryValue.startsWith('offline_')) {
      console.log(`Detected offline category: ${categoryValue}`);
      
      // Extract category name from the offline ID if not provided
      if (!categoryName) {
        categoryName = categoryValue.replace('offline_', '');
        // Capitalize first letter
        categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        console.log(`Extracted category name: ${categoryName}`);
      }
    }
    
    // Create MongoDB client
    client = createMongoClient();
    await client.connect();
    console.log("Connected to MongoDB");
    
    // Get database and collection
    const dbName = getDbName(getMongoUri());
    const db = client.db(dbName);
    const collection = db.collection(COLLECTION);
    
    // Generate a unique slug
    const slug = await generateUniqueSlug(req.body.name, collection);
    
    // Create product data object
    const productData = {
      name: req.body.name,
      slug: slug,
      description: req.body.description || "",
      price: parseFloat(req.body.price) || 0,
      discountPrice: req.body.discountPrice ? parseFloat(req.body.discountPrice) : null,
      category: categoryValue,
      categoryName: categoryName,
      stock: parseInt(req.body.stock) || 0,
      images: imageUrls,
      featured: req.body.featured === "true" || req.body.featured === true,
      material: req.body.material || "",
      color: req.body.color || "",
      dimensions: dimensions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log("Final product data to be saved:", productData);
    
    // Insert product directly into MongoDB
    const result = await collection.insertOne(productData);
    
    if (!result.acknowledged || !result.insertedId) {
      throw new Error("Failed to insert product into database");
    }
    
    console.log("Product created successfully with ID:", result.insertedId);
    
    // Get the inserted product
    const product = await collection.findOne({ _id: result.insertedId });
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
      source: "direct_mongodb_no_mongoose",
    });
  } catch (error) {
    console.error("Error creating product with direct MongoDB:", error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product",
      error: error.toString(),
    });
  } finally {
    // Close MongoDB client if it exists
    if (client) {
      try {
        await client.close();
        console.log("MongoDB connection closed");
      } catch (closeError) {
        console.error("Error closing MongoDB connection:", closeError);
      }
    }
  }
};
