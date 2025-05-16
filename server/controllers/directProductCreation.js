const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const slugify = require("slugify");

// Collection name
const COLLECTION = "products";

// Helper function to get MongoDB client
const getMongoClient = async () => {
  try {
    // Get MongoDB URI from environment variables
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error("MongoDB URI not found in environment variables");
    }
    
    // Create a new client with extended timeout settings
    const client = new MongoClient(uri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000,
    });
    
    // Connect to MongoDB
    await client.connect();
    
    // Get database name from URI
    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);
    
    return { client, db };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

// Helper function to generate a unique slug
const generateUniqueSlug = async (name, db) => {
  try {
    // Generate base slug
    let baseSlug = slugify(name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    
    // Check if slug already exists
    let slug = baseSlug;
    let counter = 1;
    let exists = true;
    
    while (exists) {
      const product = await db.collection(COLLECTION).findOne({ slug });
      
      if (!product) {
        exists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    
    return slug;
  } catch (error) {
    console.error("Error generating unique slug:", error);
    // Fallback to timestamp-based slug
    return `${slugify(name, { lower: true })}-${Date.now()}`;
  }
};

// Helper function to get proper image URL
const getProperImageUrl = (imagePath) => {
  // Check if it's already a full URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  
  // Determine base URL based on environment
  const isProduction = process.env.NODE_ENV === "production";
  const baseUrl = isProduction
    ? process.env.BASE_URL || "https://furniture-q3nb.onrender.com"
    : "http://localhost:5000";
  
  // Ensure path starts with a slash
  const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${normalizedPath}`;
};

// @desc    Create product with direct MongoDB access and enhanced error handling
// @route   POST /api/direct/product-create
// @access  Public (for testing) / Private (in production)
exports.createProduct = async (req, res) => {
  let client = null;
  
  try {
    console.log("\n=== Creating Product with Enhanced Direct Method ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Files received:", req.files ? req.files.length : 0);
    
    // Validate required fields
    const requiredFields = ["name", "price", "category"];
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
    
    // Process images
    let imageUrls = [];
    
    // Handle file uploads
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files`);
      
      // Try to upload to Cloudinary first
      try {
        if (
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        ) {
          // Configure Cloudinary
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
          });
          
          for (const file of req.files) {
            try {
              const result = await cloudinary.uploader.upload(file.path, {
                folder: "furniture_products",
                resource_type: "image",
              });
              
              console.log("Cloudinary upload result:", result.secure_url);
              imageUrls.push(result.secure_url);
              
              // Remove the local file after successful Cloudinary upload
              fs.unlinkSync(file.path);
            } catch (singleUploadError) {
              console.error("Error uploading single file to Cloudinary:", singleUploadError);
              
              // Fallback to local file path for this specific file
              const localPath = getProperImageUrl(
                file.path.replace(/\\/g, "/").replace("uploads/", "/uploads/")
              );
              imageUrls.push(localPath);
            }
          }
        } else {
          throw new Error("Cloudinary credentials not configured");
        }
      } catch (cloudinaryError) {
        console.error("Error with Cloudinary:", cloudinaryError);
        
        // Fallback to local file paths
        imageUrls = req.files.map((file) =>
          getProperImageUrl(
            file.path.replace(/\\/g, "/").replace("uploads/", "/uploads/")
          )
        );
        
        console.log("Using local file paths:", imageUrls);
      }
    }
    
    // Connect to MongoDB
    const { client: mongoClient, db } = await getMongoClient();
    client = mongoClient;
    
    // Generate a unique slug
    const slug = await generateUniqueSlug(req.body.name, db);
    
    // Create product object
    const productData = {
      name: req.body.name,
      slug: slug,
      description: req.body.description || "",
      price: parseFloat(req.body.price) || 0,
      discountPrice: req.body.discountPrice ? parseFloat(req.body.discountPrice) : null,
      category: req.body.category,
      stock: parseInt(req.body.stock) || 0,
      images: imageUrls,
      featured: req.body.featured === "true" || req.body.featured === true,
      material: req.body.material || "",
      color: req.body.color || "",
      dimensions: req.body.dimensions
        ? typeof req.body.dimensions === "string"
          ? JSON.parse(req.body.dimensions)
          : req.body.dimensions
        : {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log("Final product data:", productData);
    
    // Insert product into database
    const result = await db.collection(COLLECTION).insertOne(productData);
    
    if (!result.acknowledged || !result.insertedId) {
      throw new Error("Failed to insert product into database");
    }
    
    // Get the inserted product
    const product = await db.collection(COLLECTION).findOne({
      _id: result.insertedId,
    });
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
      source: "direct_mongodb",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product",
      error: error.toString(),
    });
  } finally {
    // Close MongoDB client
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
