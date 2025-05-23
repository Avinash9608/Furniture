const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

/**
 * Direct MongoDB access controller for emergency situations
 * This controller provides direct access to MongoDB without using Mongoose
 * It's used as a fallback when the regular controllers fail
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `product-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;
    cb(null, `${uniquePrefix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error("Only image files are allowed!"));
  },
});

// Helper function to connect to MongoDB
const connectToMongoDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
    });

    await client.connect();
    console.log("Connected to MongoDB directly");

    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);

    return { client, db };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

// @desc    Get all products directly from MongoDB
// @route   GET /api/direct/products
// @access  Public
exports.getProducts = async (req, res) => {
  let client;

  try {
    const { client: mongoClient, db } = await connectToMongoDB();
    client = mongoClient;

    const productsCollection = db.collection("products");
    const products = await productsCollection.find({}).toArray();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error getting products directly from MongoDB:", error);
    res.status(200).json({
      success: false,
      message: "Error getting products",
      error: error.message,
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// @desc    Get a product by ID directly from MongoDB
// @route   GET /api/direct/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  let client;

  try {
    const { client: mongoClient, db } = await connectToMongoDB();
    client = mongoClient;

    const productsCollection = db.collection("products");

    // Convert string ID to ObjectId
    const objectId = new ObjectId(req.params.id);

    // Find the product
    const product = await productsCollection.findOne({ _id: objectId });

    if (!product) {
      return res.status(200).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error getting product directly from MongoDB:", error);
    res.status(200).json({
      success: false,
      message: "Error getting product",
      error: error.message,
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// @desc    Update a product directly in MongoDB
// @route   PUT /api/direct/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  let client;
  try {
    console.log("\n=== UPDATE PRODUCT REQUEST START ===");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Params:", req.params);
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("Files:", req.files);

    // Connect to MongoDB
    const connection = await connectToMongoDB();
    client = connection.client;
    const db = client.db();
    const productsCollection = db.collection("products");

    // Validate ID
    if (!ObjectId.isValid(req.params.id)) {
      console.error("Invalid ID format:", req.params.id);
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
        receivedId: req.params.id,
      });
    }
    const objectId = new ObjectId(req.params.id);

    // Fetch existing product
    const existingProduct = await productsCollection.findOne({ _id: objectId });
    if (!existingProduct) {
      console.error("Product not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Product not found",
        productId: req.params.id,
      });
    }
    console.log("Existing product:", JSON.stringify(existingProduct, null, 2));

    // Build update object only with provided fields
    const updateData = { $set: { updatedAt: new Date() } };
    const standardFields = [
      "name",
      "description",
      "category",
      "material",
      "color",
      "dimensions",
      "price",
      "stock",
    ];

    // Handle standard fields
    standardFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData.$set[field] = req.body[field];
      }
    });

    // Handle nested documents
    Object.entries(req.body).forEach(([key, value]) => {
      if (typeof value === "object" && !Array.isArray(value)) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          updateData.$set[`${key}.${subKey}`] = subValue;
        });
      }
    });

    // Handle numeric conversions
    numericFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const val = parseFloat(req.body[field]);
        if (!isNaN(val)) updateData.$set[field] = val;
      }
    });
    const numericFields = ["price", "discountPrice", "stock"];
    numericFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const val = parseFloat(req.body[field]);
        if (!isNaN(val)) updateData.$set[field] = val;
      }
    });
    if (req.body.featured !== undefined) {
      updateData.$set.featured =
        req.body.featured === "true" || req.body.featured === true;
    }
    // Dimensions
    if (req.body.dimensions) {
      try {
        const dimensions =
          typeof req.body.dimensions === "string"
            ? JSON.parse(req.body.dimensions)
            : req.body.dimensions;
        updateData.$set.dimensions = {
          length:
            dimensions.length !== undefined
              ? parseFloat(dimensions.length)
              : existingProduct.dimensions?.length,
          width:
            dimensions.width !== undefined
              ? parseFloat(dimensions.width)
              : existingProduct.dimensions?.width,
          height:
            dimensions.height !== undefined
              ? parseFloat(dimensions.height)
              : existingProduct.dimensions?.height,
        };
      } catch (e) {
        console.warn("Error parsing dimensions:", e);
      }
    }
    // Images
    let newImages = undefined;
    if (req.files && req.files.length > 0) {
      newImages = req.files.map((file) => {
        const filename =
          file.filename || (file.path && file.path.split("/").pop());
        return `/uploads/${filename}`;
      });
    } else if (req.body.images) {
      try {
        newImages = Array.isArray(req.body.images)
          ? req.body.images
          : JSON.parse(req.body.images);
      } catch (e) {
        newImages = [req.body.images];
      }
    }
    // Merge or replace images
    if (newImages !== undefined) {
      if (Array.isArray(newImages) && newImages.length > 0) {
        updateData.images = newImages;
      } else if (Array.isArray(newImages) && newImages.length === 0) {
        updateData.images = existingProduct.images || [];
      }
    }
    // Only update if there is something to update
    if (Object.keys(updateData.$set).length === 1) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }
    // Update product
    const result = await productsCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!result.value) {
      return res.status(500).json({
        success: false,
        message: "Failed to update product",
      });
    }
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: result.value,
    });
  } catch (error) {
    console.error("Error updating product directly in MongoDB:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// Middleware for handling file uploads
exports.uploadProductImages = upload.array("images", 5);
