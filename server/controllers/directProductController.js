/**
 * Direct product controller that bypasses Mongoose validation
 * This ensures all fields are properly saved to the database
 */

const mongoose = require("mongoose");
const slugify = require("slugify");
const Category = require("../models/Category");

// Create a product directly in the database
exports.createProduct = async (req, res) => {
  try {
    console.log("=== DIRECT PRODUCT CONTROLLER ===");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: "Database connection is not established",
        connectionState: mongoose.connection.readyState,
      });
    }

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "price",
      "category",
      "stock",
    ];
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Generate a unique slug
    const timestamp = Date.now();
    let baseSlug = slugify(req.body.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    if (!baseSlug || baseSlug.trim() === "") {
      baseSlug = "product";
    }

    const uniqueSlug = `${baseSlug}-${timestamp}`;
    console.log("Generated unique slug:", uniqueSlug);

    // Process images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `/uploads/images/${file.filename}`);
      console.log("Uploaded images:", images);
    } else {
      // Default image
      images = ["https://placehold.co/300x300/gray/white?text=Product"];
      console.log("Using default image");
    }

    // Process dimensions
    let dimensions = { length: 0, width: 0, height: 0 };
    if (req.body.dimensions) {
      try {
        if (typeof req.body.dimensions === "string") {
          dimensions = JSON.parse(req.body.dimensions);
          console.log("Successfully parsed dimensions JSON:", dimensions);
        } else {
          dimensions = req.body.dimensions;
        }
      } catch (error) {
        console.error("Error parsing dimensions:", error);
      }
    }

    // Process category
    let categoryId;

    if (req.body.category && req.body.category.startsWith("standard_")) {
      // Handle standard category
      const categoryMap = {
        standard_sofa_beds: "Sofa Beds",
        standard_tables: "Tables",
        standard_chairs: "Chairs",
        standard_wardrobes: "Wardrobes",
        standard_beds: "Beds",
      };

      const categoryName = categoryMap[req.body.category] || "Other";

      try {
        // Find or create category
        let category = await Category.findOne({ name: categoryName });

        if (!category) {
          category = new Category({
            name: categoryName,
            description: `${categoryName} furniture items`,
            slug: slugify(categoryName, { lower: true }),
          });

          await category.save();
          console.log(`Created new category: ${categoryName}`);
        }

        categoryId = category._id;
        console.log(`Using category: ${categoryName} (${categoryId})`);
      } catch (error) {
        console.error("Error handling category:", error);

        // Create a default category
        const defaultCategory = new Category({
          name: "Default Category",
          description: "Default category created due to error",
          slug: "default-category",
        });

        const savedCategory = await defaultCategory.save();
        categoryId = savedCategory._id;
        console.log(`Using fallback category: ${savedCategory._id}`);
      }
    } else if (req.body.category) {
      // Try to use provided category ID
      try {
        categoryId = new mongoose.Types.ObjectId(req.body.category);

        // Check if category exists
        const categoryExists = await Category.exists({ _id: categoryId });

        if (!categoryExists) {
          // Create a default category
          const defaultCategory = new Category({
            name: "Other",
            description: "Other furniture items",
            slug: "other",
          });

          const savedCategory = await defaultCategory.save();
          categoryId = savedCategory._id;
          console.log(
            `Category not found, using default: ${savedCategory._id}`
          );
        }
      } catch (error) {
        console.error("Error processing category ID:", error);

        // Create a default category
        const defaultCategory = new Category({
          name: "Fallback",
          description: "Fallback category",
          slug: "fallback",
        });

        const savedCategory = await defaultCategory.save();
        categoryId = savedCategory._id;
        console.log(`Using fallback category: ${savedCategory._id}`);
      }
    } else {
      // Create a default category
      const defaultCategory = new Category({
        name: "Uncategorized",
        description: "Uncategorized items",
        slug: "uncategorized",
      });

      const savedCategory = await defaultCategory.save();
      categoryId = savedCategory._id;
      console.log(`No category provided, using default: ${savedCategory._id}`);
    }

    // Create product document with all fields from the Product model
    const productData = {
      // Required fields
      name: req.body.name,
      slug: uniqueSlug,
      description: req.body.description,
      price: parseFloat(req.body.price) || 0,
      stock: parseInt(req.body.stock) || 0,
      category: categoryId,

      // Optional fields with defaults
      images: images,
      featured: req.body.featured === "true" || req.body.isFeatured === "true",
      dimensions: dimensions,
      material: req.body.material || "",
      color: req.body.color || "",

      // Review-related fields
      ratings: 0,
      numReviews: 0,
      reviews: [],

      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Handle discount price separately to avoid saving 0 when it's not provided
    if (req.body.discountPrice) {
      productData.discountPrice = parseFloat(req.body.discountPrice);
    }

    // Remove undefined/null values to avoid MongoDB issues
    Object.keys(productData).forEach((key) => {
      if (productData[key] === undefined || productData[key] === null) {
        delete productData[key];
      }
    });

    console.log("Final product data:", JSON.stringify(productData, null, 2));

    // Get direct access to the collection
    const db = mongoose.connection.db;
    const productsCollection = db.collection("products");

    // Insert the document
    const result = await productsCollection.insertOne(productData);

    if (result.acknowledged) {
      console.log("Product created successfully:", result.insertedId);

      // Fetch the inserted product to confirm
      const insertedProduct = await productsCollection.findOne({
        _id: result.insertedId,
      });

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: insertedProduct,
      });
    } else {
      throw new Error("Failed to insert product");
    }
  } catch (error) {
    console.error("Error in direct product creation:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const productsCollection = db.collection("products");

    const products = await productsCollection.find({}).toArray();

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get a single product
exports.getProduct = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const productsCollection = db.collection("products");

    let productId;
    try {
      productId = new mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await productsCollection.findOne({ _id: productId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};
