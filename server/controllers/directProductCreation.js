const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const slugify = require("slugify");
const DirectProduct = require("../models/DirectProduct");
const mongoose = require("mongoose");
const { getCollection } = require("../utils/directDbAccess");

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
const generateUniqueSlug = async (name) => {
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

    const collection = await getCollection(COLLECTION);

    while (exists) {
      const product = await collection.findOne({ slug });

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

// @desc    Create product with direct MongoDB access
// @route   POST /api/direct/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    console.log("\n=== Creating Product ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Files received:", req.files ? req.files.length : 0);

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "price",
      "category",
      "stock",
    ];
    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Handle image files
    const images = [];
    if (req.files && req.files.length > 0) {
      console.log("Processing uploaded files...", req.files);

      for (const file of req.files) {
        if (!file.path) {
          console.warn("File missing path:", file);
          continue;
        }

        // Get the absolute file path
        const absolutePath = file.path;
        console.log("Absolute file path:", absolutePath);

        // Make sure the file exists
        if (!fs.existsSync(absolutePath)) {
          console.warn(`File does not exist at path: ${absolutePath}`);
          continue;
        }

        // Format the image path correctly for storage
        const filename = path.basename(file.path);
        console.log("Extracted filename:", filename);

        try {
          // Create a URL that will work in both development and production
          const isProduction = process.env.NODE_ENV === "production";
          const baseUrl = isProduction
            ? process.env.BASE_URL || "https://furniture-q3nb.onrender.com"
            : "http://localhost:5000";

          const imagePath = `${baseUrl}/uploads/${filename}`;
          console.log("Generated image URL:", imagePath);

          // Add to images array
          images.push(imagePath);
          console.log("Added image path:", imagePath);
        } catch (error) {
          console.error("Error processing image:", error);
          // If there's an error, still try to save a relative path
          const fallbackPath = `/uploads/${filename}`;
          images.push(fallbackPath);
          console.log("Added fallback image path:", fallbackPath);
        }
      }
    }

    // Add default image if no images were uploaded
    if (images.length === 0) {
      images.push("https://placehold.co/800x600/gray/white?text=No+Image");
      console.log("No images uploaded, using default image");
    }

    console.log("Final images array:", images);

    // Parse numeric fields
    const price = parseFloat(req.body.price);
    const stock = parseInt(req.body.stock);
    const discountPrice = req.body.discountPrice
      ? parseFloat(req.body.discountPrice)
      : undefined;

    // Validate numeric fields
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price value",
      });
    }

    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock value",
      });
    }

    // Create a slug from the product name
    const slug = await generateUniqueSlug(req.body.name.trim());

    // Parse dimensions if it's a string
    let dimensions = {};
    if (req.body.dimensions) {
      try {
        dimensions =
          typeof req.body.dimensions === "string"
            ? JSON.parse(req.body.dimensions)
            : req.body.dimensions;
      } catch (e) {
        console.warn("Error parsing dimensions:", e);
      }
    }

    // Handle category value
    let categoryValue = req.body.category;
    if (categoryValue && categoryValue.startsWith("offline_")) {
      console.log(`Detected offline category ID: ${categoryValue}`);

      // Try to find a real category with a similar name
      try {
        const categoryName = categoryValue.replace("offline_", "");
        const categoriesCollection = await getCollection("categories");
        const realCategory = await categoriesCollection.findOne({
          $or: [
            { name: { $regex: new RegExp(categoryName, "i") } },
            { displayName: { $regex: new RegExp(categoryName, "i") } },
          ],
        });

        if (realCategory && realCategory._id) {
          console.log(
            `Found matching real category: ${realCategory.name} (${realCategory._id})`
          );
          categoryValue = realCategory._id;
        } else {
          console.log(
            `No matching real category found for ${categoryName}, using default category`
          );

          // Try to find any category to use as default
          const anyCategory = await categoriesCollection.findOne({});
          if (anyCategory && anyCategory._id) {
            console.log(
              `Using default category: ${anyCategory.name} (${anyCategory._id})`
            );
            categoryValue = anyCategory._id;
          }
        }
      } catch (categoryError) {
        console.error("Error handling category:", categoryError);
      }
    }

    // Create the product object
    const productData = {
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      slug,
      price,
      stock,
      category: categoryValue,
      images,
      material: req.body.material?.trim() || "",
      color: req.body.color?.trim() || "",
      dimensions: dimensions,
      featured: req.body.featured === "true",
      discountPrice,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Final product data:", JSON.stringify(productData, null, 2));

    // Try to insert product into database using direct MongoDB
    try {
      console.log("Attempting to insert product using direct MongoDB...");
      const collection = await getCollection(COLLECTION);
      const result = await collection.insertOne(productData);

      if (!result.acknowledged || !result.insertedId) {
        throw new Error("Failed to insert product into database");
      }

      // Get the inserted product
      const product = await collection.findOne({
        _id: result.insertedId,
      });

      // Return success response
      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
        source: "direct_mongodb",
      });
    } catch (directDbError) {
      console.error(
        "Error inserting product with direct MongoDB:",
        directDbError
      );

      // Try to save using Mongoose model as fallback
      try {
        console.log("Attempting to save using Mongoose model...");
        const directProduct = new DirectProduct(productData);
        const savedProduct = await directProduct.save();

        return res.status(201).json({
          success: true,
          message: "Product created successfully (Mongoose fallback)",
          data: savedProduct,
          source: "mongoose_fallback",
        });
      } catch (mongooseError) {
        console.error("Error saving with Mongoose:", mongooseError);
        throw mongooseError;
      }
    }
  } catch (error) {
    console.error("Error in createProduct:", error);

    // Send formatted error response
    return res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};
