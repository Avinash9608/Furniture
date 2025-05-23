const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const { protect } = require("../middleware/auth");
const { createProductReview } = require("../controllers/productController");
const { getCollection } = require("../utils/directDbAccess");

// Get the Product model
let Product;
try {
  Product = mongoose.model("Product");
} catch (error) {
  const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: Number,
    category: { type: mongoose.Schema.Types.Mixed, required: true },
    stock: { type: Number, required: true, default: 0 },
    images: [String],
    featured: { type: Boolean, default: false },
    material: String,
    color: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  Product = mongoose.model("Product", productSchema);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "image-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});
// Public routes
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Admin routes for product management
router.post("/", upload.array("images", 10), async (req, res) => {
  try {
    const { name, description, price, category, stock, featured } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Process images
    const images = req.files.map(
      (file) => `/uploads/${path.basename(file.path)}`
    );

    // Create new product
    const product = new Product({
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock) || 0,
      images,
      featured: featured === "true",
      // Add other fields if provided
      ...(req.body.material && { material: req.body.material }),
      ...(req.body.color && { color: req.body.color }),
      ...(req.body.discountPrice && {
        discountPrice: Number(req.body.discountPrice),
      }),
    });

    // Save product
    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
});

router.put("/:id", upload.array("images", 10), async (req, res) => {
  try {
    console.log("Updating product with ID:", req.params.id);
    console.log("Request body:", req.body);
    console.log("Files received:", req.files ? req.files.length : 0);

    // Find product by ID
    let product;
    try {
      product = await Product.findById(req.params.id);
    } catch (error) {
      console.error("Error finding product:", error);
      // Try direct MongoDB access as fallback
      try {
        const collection = await getCollection("products");
        let query = {};

        // Try to convert to ObjectId if it looks like one
        if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
          try {
            query = { _id: new ObjectId(req.params.id) };
          } catch (error) {
            query = { _id: req.params.id }; // Fallback to string ID if ObjectId conversion fails
          }
        } else {
          query = { _id: req.params.id };
        }

        product = await collection.findOne(query);

        // If found, convert to Mongoose document
        if (product && !product.toObject) {
          // Ensure it's a plain object before converting
          const tempProduct = new Product(product);
          product = tempProduct;
        }
      } catch (directError) {
        console.error(
          "Error with direct MongoDB access using getCollection:",
          directError
        );
      }
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update basic fields
    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price) product.price = Number(req.body.price);
    if (req.body.discountPrice)
      product.discountPrice = Number(req.body.discountPrice);
    if (req.body.stock) product.stock = Number(req.body.stock);
    if (req.body.category) product.category = req.body.category;
    if (req.body.featured !== undefined)
      product.featured = req.body.featured === "true";
    if (req.body.material) product.material = req.body.material;
    if (req.body.color) product.color = req.body.color;

    // Process dimensions if provided
    if (req.body.dimensions) {
      try {
        let dimensionsData;
        if (typeof req.body.dimensions === "string") {
          dimensionsData = JSON.parse(req.body.dimensions);
        } else {
          dimensionsData = req.body.dimensions;
        }

        product.dimensions = {
          length: Number(dimensionsData.length) || 0,
          width: Number(dimensionsData.width) || 0,
          height: Number(dimensionsData.height) || 0,
        };
      } catch (error) {
        console.error("Error processing dimensions:", error);
      }
    }

    // Handle new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(
        (file) => `/uploads/${path.basename(file.path)}`
      );

      if (req.body.replaceImages === "true") {
        // Replace all images
        product.images = newImages;
      } else {
        // Append to existing images
        product.images = [...(product.images || []), ...newImages];
      }
    }

    // Handle existing images from form data
    else if (req.body.existingImages) {
      try {
        let existingImages;

        if (typeof req.body.existingImages === "string") {
          // Try to parse as JSON
          try {
            existingImages = JSON.parse(req.body.existingImages);
          } catch (parseError) {
            // If not JSON, treat as comma-separated list
            existingImages = req.body.existingImages
              .split(",")
              .map((url) => url.trim());
          }
        } else if (Array.isArray(req.body.existingImages)) {
          existingImages = req.body.existingImages;
        } else {
          existingImages = [req.body.existingImages];
        }

        product.images = existingImages;
      } catch (error) {
        console.error("Error processing existing images:", error);
      }
    }

    // Update timestamp
    product.updatedAt = new Date();

    // Try direct MongoDB update first - more reliable
    try {
      const collection = await getCollection("products");
      let query = {};

      // Try to convert to ObjectId if it looks like one
      if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        try {
          query = { _id: new ObjectId(req.params.id) };
        } catch (error) {
          query = { _id: req.params.id }; // Fallback to string ID
        }
      } else {
        query = { _id: req.params.id };
      }

      // Convert product to plain object
      const productData = product.toObject
        ? product.toObject()
        : { ...product }; // Ensure plain object

      // Remove _id from update data as it should not be in $set
      if (productData._id) {
        delete productData._id;
      }
      // Remove __v if it exists
      if (productData.__v !== undefined) {
        delete productData.__v;
      }

      // Perform update
      const updateResult = await collection.updateOne(query, {
        $set: productData,
      });

      console.log("Update result:", updateResult);

      if (updateResult.matchedCount === 0) {
        // If no document matched, it means the product wasn't found with that ID
        // This could happen if the ID format was string but no direct match,
        // or ObjectId conversion failed and string ID also didn't match.
        return res.status(404).json({
          success: false,
          message: "Product not found for update (direct access).",
        });
      }

      // Fetch updated product
      const updatedProduct = await collection.findOne(query);

      return res.status(200).json({
        success: true,
        message: "Product updated successfully (direct access)",
        data: updatedProduct,
      });
    } catch (directError) {
      console.error("Error with direct MongoDB update:", directError);

      // Fallback to mongoose save
      try {
        await product.save();

        return res.status(200).json({
          success: true,
          message: "Product updated successfully",
          data: product,
        });
      } catch (saveError) {
        console.error("Error saving product:", saveError);
        return res.status(500).json({
          success: false,
          message: "Error updating product",
          error: saveError.message,
        });
      }
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Server error during product update",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    await product.remove();
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Review route
router.post("/:id/reviews", protect, createProductReview);

module.exports = router;
