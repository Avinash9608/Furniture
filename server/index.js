const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { protect, authorize } = require("./middleware/auth");
const { handleMultipleFiles } = require("./middleware/upload");
const {
  getCollection,
  findDocuments,
  findOneDocument,
  insertDocument,
  updateDocument,
  deleteDocument,
} = require("./utils/directDbAccess");
const { v4: uuidv4 } = require("uuid");

// Import other controllers
const productDataService = require("./utils/productDataService");
const directAuth = require("./controllers/directAuth");

// Load environment variables
dotenv.config();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure uploads directory exists before saving
    const uploadsDir = path.join(__dirname, "uploads");
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "images-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Create upload middleware with file filter and limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure uploads directory exists
require("./utils/ensureUploads");

// Environment configuration
if (process.env.FORCE_PRODUCTION === "true") {
  process.env.NODE_ENV = "production";
  console.log("FORCE_PRODUCTION is set - Forcing production mode");
} else if (process.env.NODE_ENV !== "production") {
  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  process.env.BYPASS_AUTH = "true";
  console.log("Development mode - Bypassing authentication");
}

// Log the environment for debugging
console.log(`Current NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Current PORT: ${process.env.PORT}`);
console.log(`FORCE_PRODUCTION: ${process.env.FORCE_PRODUCTION || "not set"}`);
console.log(`Current directory: ${__dirname}`);

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET =
    "dev_secret_" + Math.random().toString(36).substring(2);
  console.warn("Using development JWT secret - not secure for production");
}

// Initialize express app
const app = express();

// Get allowed origins for CORS
const getAllowedOrigins = () => {
  // List of allowed origins
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://furniture-q3nb.onrender.com",
    "https://furniture-admin.onrender.com",
    process.env.FRONTEND_URL, // Add this if you have a custom domain
  ].filter(Boolean); // Remove any undefined values

  console.log("Allowed CORS origins:", allowedOrigins);
  return allowedOrigins;
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = getAllowedOrigins();
    console.log("CORS allowed origins:", allowedOrigins);

    // Check if the origin is allowed
    if (
      allowedOrigins.includes(origin) ||
      origin.match(/^https?:\/\/localhost(:\d+)?$/) ||
      origin.match(/\.onrender\.com$/) ||
      origin.match(/\.vercel\.app$/)
    ) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // Cache preflight requests for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Logging middleware
const logger = require("./middleware/logger");
app.use(logger);

// Fix for duplicate API prefixes in client requests
const apiPrefixFix = require("./middleware/apiPrefixFix");
app.use(apiPrefixFix);

// Static Files
// Serve uploaded files with enhanced logging and error handling
app.use(
  "/uploads",
  (req, res, next) => {
    console.log(`Uploads request received: ${req.url}`);
    next();
  },
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      console.log(`Serving file: ${filePath}`);
      res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Origin, X-Requested-With, Content-Type, Accept",
        "Cache-Control": "public, max-age=31557600", // Cache for 1 year
      });
    },
    fallthrough: false, // Return 404 for files that don't exist
  }),
  (err, req, res, next) => {
    if (err.status === 404) {
      console.error(`File not found: ${req.url}`);
      // Return a default image instead of 404
      res.redirect("https://placehold.co/300x300/e2e8f0/1e293b?text=No+Image");
    } else {
      console.error(`Error serving file: ${req.url}`, err);
      next(err);
    }
  }
);

// Add CORS headers for image files
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Add a special route to check if uploads directory exists and list files
app.get("/api/check-uploads", (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "uploads");
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      res.json({
        success: true,
        message: "Uploads directory exists",
        directory: uploadsDir,
        files: files,
        count: files.length,
      });
    } else {
      res.json({
        success: false,
        message: "Uploads directory does not exist",
        directory: uploadsDir,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking uploads directory",
      error: error.message,
    });
  }
});

// Production static files
if (process.env.NODE_ENV === "production") {
  // Log the environment for debugging
  console.log("Running in PRODUCTION mode");

  // Define possible static file paths (in order of preference)
  const possiblePaths = [
    path.join(__dirname, "../client/dist"),
    path.join(__dirname, "../dist"),
    path.join(__dirname, "../../client/dist"),
    path.join(process.cwd(), "client/dist"),
    path.join(process.cwd(), "dist"),
  ];

  let staticPathFound = false;

  // Try each path until we find one that exists
  for (const staticPath of possiblePaths) {
    try {
      if (fs.existsSync(staticPath)) {
        console.log(`✅ Static directory found at: ${staticPath}`);

        // Check if index.html exists in this directory
        const indexPath = path.join(staticPath, "index.html");
        if (fs.existsSync(indexPath)) {
          console.log(`✅ index.html found at: ${indexPath}`);

          // Serve static files from this directory
          app.use(express.static(staticPath));
          console.log(`✅ Serving static files from: ${staticPath}`);

          staticPathFound = true;
          break;
        } else {
          console.log(`❌ index.html NOT found at: ${indexPath}`);
        }
      } else {
        console.log(`❌ Static directory NOT found at: ${staticPath}`);
      }
    } catch (err) {
      console.error(`Error checking static directory ${staticPath}:`, err);
    }
  }

  if (!staticPathFound) {
    console.error(
      "❌ No valid static directory found! The app may not work correctly."
    );
    console.log("Current directory:", __dirname);
    console.log("Working directory:", process.cwd());

    try {
      console.log(
        "Root directory contents:",
        fs.readdirSync(path.join(__dirname, ".."))
      );
    } catch (err) {
      console.error("Error listing root directory:", err);
    }
  }
}

// API Routes
const productFixRoute = require('./routes/productFixRoute');
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const contactRoutes = require("./routes/contact");
const orderRoutes = require("./routes/orders");
const paymentSettingsRoutes = require("./routes/paymentSettings");
const paymentRequestsRoutes = require("./routes/paymentRequests");
// const authRoutes = require("./routes/authRoutes");
// Import simplified contact controller for standalone MongoDB connection
const contactController = require("./controllers/simplifiedContactController");

app.use("/api/auth", authRoutes);
app.use("/api/fix/products", productFixRoute);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment-settings", paymentSettingsRoutes);
app.use("/api/payment-requests", paymentRequestsRoutes);

// DIRECT ADMIN ROUTES - These ensure admin pages work in all environments
// Import controllers directly
const { getAllPaymentRequests } = require("./controllers/paymentRequests");
const { getOrders } = require("./controllers/orders");

// Import direct controllers for products and categories
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("./controllers/directProducts");

// Import direct categories controller
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("./controllers/directCategories");

// Import direct payment settings controller
const {
  getPaymentSettings,
  getAllPaymentSettings: getAllPaymentSettingsDirect,
} = require("./controllers/directPaymentSettings");

// Import direct admin auth controller
const { loginAdmin } = require("./controllers/directAdminAuth");

// Admin payment requests routes
app.get("/admin/payment-requests", getAllPaymentRequests);
app.get("/api/admin/payment-requests", getAllPaymentRequests);

// Admin orders routes
app.get("/admin/orders", getOrders);
app.get("/api/admin/orders", getOrders);

// DIRECT CONTACT FORM HANDLERS - These ensure the contact form works in all environments
// Handle all possible URL patterns for the contact form
app.post("/contact", contactController.createContact);
app.post("/api/contact", contactController.createContact);
app.post("/api/api/contact", contactController.createContact);
// app.use("/api/auth", authRoutes);

// Direct API routes for products with enhanced error handling
app.get("/api/direct/products", getAllProducts);
app.get("/api/direct/products/:id", getProductById);

// Special middleware to set admin user for direct product routes
const setAdminForDirectRoutes = (req, res, next) => {
  // Set admin user in the request
  req.user = {
    _id: process.env.ADMIN_ID || "admin-user",
    name: process.env.ADMIN_NAME || "Admin User",
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    role: "admin",
    isAdmin: true,
  };

  console.log("Admin user set for direct product route:", req.path);
  next();
};

// Direct product creation with file upload (with admin bypass)
app.post(
  "/api/direct/products",
  setAdminForDirectRoutes,
  upload.array("images", 10),
  createProduct
);

// Direct product update with file upload (with admin bypass)
app.put(
  "/api/direct/products/:id",
  setAdminForDirectRoutes,
  upload.array("images", 10),
  updateProduct
);

// Direct product deletion (with admin bypass)
app.delete("/api/direct/products/:id", setAdminForDirectRoutes, deleteProduct);

// Special routes for admin product editing
app.get("/admin/products/edit/:id", (req, res) => {
  res.redirect(`/api/direct/products/${req.params.id}`);
});

// Dedicated endpoint for image uploads only
app.post("/api/images/upload", upload.array("images", 10), async (req, res) => {
  try {
    console.log("Image upload endpoint called");

    // Add CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
    );
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    console.log("Files received:", req.files.length);

    // Process the uploaded files
    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    }));

    console.log("Processed files:", uploadedFiles);

    // Return the file information
    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Error in image upload endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during file upload",
      error: error.message,
    });
  }
});

// Dedicated endpoint for product image update
app.put("/api/images/product/:id", async (req, res) => {
  try {
    console.log("Product image update endpoint called for ID:", req.params.id);

    // Add CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
    );
    res.header("Access-Control-Allow-Methods", "PUT, OPTIONS");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Check if image paths were provided
    if (!req.body.imagePaths) {
      return res.status(400).json({
        success: false,
        message: "No image paths provided",
      });
    }

    console.log("Image paths received:", req.body.imagePaths);

    // Parse the image paths
    let imagePaths;
    try {
      imagePaths =
        typeof req.body.imagePaths === "string"
          ? JSON.parse(req.body.imagePaths)
          : req.body.imagePaths;
    } catch (parseError) {
      console.error("Error parsing image paths:", parseError);
      imagePaths = [req.body.imagePaths];
    }

    console.log("Parsed image paths:", imagePaths);

    // Import MongoDB client
    const { MongoClient, ObjectId } = require("mongodb");

    // Get MongoDB URI
    const uri = process.env.MONGO_URI;

    console.log("Connecting to MongoDB directly...");

    // Create a new client with minimal options
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });

    try {
      // Connect to MongoDB
      await client.connect();
      console.log("Connected to MongoDB for product image update");

      // Get database name from URI
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get products collection
      const productsCollection = db.collection("products");

      // Update only the images field
      const updateResult = await productsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            images: imagePaths,
            updatedAt: new Date(),
          },
        }
      );

      console.log("Update result:", updateResult);

      if (updateResult.matchedCount === 0) {
        console.log("No document matched the ID, trying with string ID");
        // Try with string ID
        const stringUpdateResult = await productsCollection.updateOne(
          { _id: req.params.id },
          {
            $set: {
              images: imagePaths,
              updatedAt: new Date(),
            },
          }
        );

        console.log("String ID update result:", stringUpdateResult);

        if (stringUpdateResult.matchedCount === 0) {
          await client.close();
          return res.status(404).json({
            success: false,
            message: "Product not found with any ID format",
          });
        }
      }

      // Get the updated product
      let updatedProduct;
      try {
        updatedProduct = await productsCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
      } catch (findError) {
        updatedProduct = await productsCollection.findOne({
          _id: req.params.id,
        });
      }

      // Close the client
      await client.close();

      return res.status(200).json({
        success: true,
        message: "Product images updated successfully",
        data: updatedProduct,
      });
    } catch (mongoError) {
      console.error("Error in MongoDB operation:", mongoError);
      await client.close();
      return res.status(500).json({
        success: false,
        message: "Database operation failed",
        error: mongoError.message,
      });
    }
  } catch (error) {
    console.error("Error in product image update endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during product image update",
      error: error.message,
    });
  }
});

// Special route for direct product access without authentication
app.get("/api/direct-product/:id", async (req, res) => {
  try {
    console.log("Direct product endpoint called for ID:", req.params.id);

    // Add CORS headers for this specific endpoint
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
    );
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Set admin user in the request
    req.user = {
      _id: process.env.ADMIN_ID || "admin-user",
      name: process.env.ADMIN_NAME || "Admin User",
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      role: "admin",
      isAdmin: true,
    };

    // Add cache control headers
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");

    // Call the getProductById function directly
    await getProductById(req, res);
  } catch (error) {
    console.error("Error in direct product endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
});

// Emergency route for product updates - absolute minimal implementation
app.put(
  "/api/emergency/products/:id",
  upload.array("images", 10),
  async (req, res) => {
    try {
      console.log(
        "EMERGENCY product update endpoint called for ID:",
        req.params.id
      );

      // Add CORS headers for this specific endpoint
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      );
      res.header("Access-Control-Allow-Methods", "PUT, OPTIONS");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }

      // Add cache control headers
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      res.header("Pragma", "no-cache");
      res.header("Expires", "0");

      console.log("Request body:", req.body);
      console.log("Files received:", req.files ? req.files.length : 0);

      // Import MongoDB client
      const { MongoClient, ObjectId } = require("mongodb");

      // Get MongoDB URI
      const uri = process.env.MONGO_URI;

      console.log("Connecting to MongoDB directly...");

      // Create a new client with minimal options
      const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
      });

      try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB for emergency product update");

        // Get database name from URI
        const dbName = uri.split("/").pop().split("?")[0];
        const db = client.db(dbName);

        // Get products collection
        const productsCollection = db.collection("products");

        // Prepare update object with minimal fields
        const updates = {
          $set: {
            updatedAt: new Date(),
          },
        };

        // Add basic fields with minimal processing
        if (req.body.name) updates.$set.name = req.body.name;
        if (req.body.description)
          updates.$set.description = req.body.description;
        if (req.body.price) updates.$set.price = Number(req.body.price);
        if (req.body.stock) updates.$set.stock = Number(req.body.stock);
        if (req.body.category) updates.$set.category = req.body.category;

        // Handle images with minimal processing
        if (req.files && req.files.length > 0) {
          const newImages = req.files.map(
            (file) => `/uploads/${file.filename}`
          );
          updates.$set.images = newImages;
        }

        console.log("Emergency update object:", updates);

        // Try to update with ObjectId first
        let updateResult;
        try {
          updateResult = await productsCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            updates
          );
        } catch (idError) {
          // If ObjectId fails, try with string ID
          updateResult = await productsCollection.updateOne(
            { _id: req.params.id },
            updates
          );
        }

        console.log("Emergency update result:", updateResult);

        // Close the client
        await client.close();

        return res.status(200).json({
          success: true,
          message: "Product updated successfully via emergency endpoint",
          updateResult,
        });
      } catch (mongoError) {
        console.error("Error in emergency MongoDB update:", mongoError);
        try {
          await client.close();
        } catch (closeError) {
          console.error("Error closing MongoDB client:", closeError);
        }
        return res.status(500).json({
          success: false,
          message: "Emergency database operation failed",
          error: mongoError.message,
        });
      }
    } catch (error) {
      console.error("Error in emergency product update endpoint:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during emergency product update",
        error: error.message,
      });
    }
  }
);

// Special fallback route for product updates that bypasses Mongoose
app.put(
  "/api/fallback/products/:id",
  upload.array("images", 10),
  async (req, res) => {
    try {
      console.log(
        "Fallback product update endpoint called for ID:",
        req.params.id
      );

      // Add CORS headers for this specific endpoint
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      );
      res.header("Access-Control-Allow-Methods", "PUT, OPTIONS");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }

      // Add cache control headers
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      res.header("Pragma", "no-cache");
      res.header("Expires", "0");

      // Import MongoDB client
      const { MongoClient, ObjectId } = require("mongodb");

      // Get MongoDB URI
      const uri = process.env.MONGO_URI;

      // Connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
        maxPoolSize: 20,
        minPoolSize: 5,
      };

      console.log("Connecting to MongoDB directly...");

      // Create a new client
      const client = new MongoClient(uri, options);

      try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB for fallback product update");

        // Get database name from URI
        const dbName = uri.split("/").pop().split("?")[0];
        const db = client.db(dbName);

        // Get products collection
        const productsCollection = db.collection("products");

        // Find the existing product
        let existingProduct;
        try {
          existingProduct = await productsCollection.findOne({
            _id: new ObjectId(req.params.id),
          });
        } catch (findError) {
          console.error(
            "Error finding product with ObjectId:",
            findError.message
          );
          // Try with string ID
          existingProduct = await productsCollection.findOne({
            _id: req.params.id,
          });
        }

        if (!existingProduct) {
          await client.close();
          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }

        console.log("Found existing product:", existingProduct.name);

        // Prepare update object
        const updates = {
          $set: {
            updatedAt: new Date(),
          },
        };

        // Add basic fields
        const basicFields = [
          "name",
          "description",
          "price",
          "discountPrice",
          "stock",
          "featured",
          "specifications",
        ];

        basicFields.forEach((field) => {
          if (req.body[field] !== undefined) {
            updates.$set[field] = req.body[field];
          }
        });

        // Handle numeric fields
        ["price", "discountPrice", "stock"].forEach((field) => {
          if (req.body[field] !== undefined) {
            updates.$set[field] = Number(req.body[field]);
          }
        });

        // Handle boolean fields
        if (req.body.featured !== undefined) {
          updates.$set.featured =
            req.body.featured === "true" || req.body.featured === true;
        }

        // Handle category
        if (req.body.category) {
          try {
            if (/^[0-9a-fA-F]{24}$/.test(req.body.category)) {
              updates.$set.category = new ObjectId(req.body.category);
            } else {
              updates.$set.category = req.body.category;
            }
          } catch (error) {
            console.warn(
              "Could not convert category to ObjectId, using as is:",
              error.message
            );
            updates.$set.category = req.body.category;
          }
        }

        // Handle images
        if (req.files && req.files.length > 0) {
          console.log("Processing new uploaded files:", req.files.length);
          const newImages = req.files.map(
            (file) => `/uploads/${file.filename}`
          );
          console.log("New image paths:", newImages);

          if (req.body.replaceImages === "true") {
            console.log("Replacing all images with new uploads");
            updates.$set.images = newImages;
          } else {
            // Get existing images from the product
            const existingImages = existingProduct.images || [];
            console.log("Existing images:", existingImages);

            // Combine existing and new images
            updates.$set.images = [...existingImages, ...newImages];
            console.log("Appending new images to existing ones");
          }
          console.log("Final images array:", updates.$set.images);
        }
        // Handle existing images from form data
        else if (req.body.existingImages) {
          try {
            console.log(
              "Processing existingImages from form data:",
              req.body.existingImages
            );
            let existingImages;

            // Handle different formats of existingImages
            if (typeof req.body.existingImages === "string") {
              // Try to parse as JSON first
              try {
                existingImages = JSON.parse(req.body.existingImages);
                console.log("Successfully parsed existingImages as JSON");
              } catch (parseError) {
                // If not valid JSON, treat as comma-separated list
                console.log("Treating existingImages as comma-separated list");
                existingImages = req.body.existingImages
                  .split(",")
                  .map((url) => url.trim());
              }
            } else if (Array.isArray(req.body.existingImages)) {
              // If it's already an array
              existingImages = req.body.existingImages;
              console.log("existingImages is already an array");
            } else {
              // If it's a single value
              existingImages = [req.body.existingImages];
              console.log("existingImages is a single value");
            }

            // Set the images in the update
            updates.$set.images = existingImages;
            console.log("Final existingImages array:", existingImages);
          } catch (error) {
            console.error("Error processing existing images:", error);
            await client.close();
            return res.status(400).json({
              success: false,
              message: "Invalid image data format",
              error: error.message,
            });
          }
        }

        console.log("Final update object:", updates);

        // Update the product
        const updateResult = await productsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          updates
        );

        console.log("Update result:", updateResult);

        if (updateResult.matchedCount === 0) {
          console.log("No document matched the ID, trying with string ID");
          // Try with string ID
          const stringUpdateResult = await productsCollection.updateOne(
            { _id: req.params.id },
            updates
          );

          console.log("String ID update result:", stringUpdateResult);

          if (stringUpdateResult.matchedCount === 0) {
            await client.close();
            return res.status(404).json({
              success: false,
              message: "Product not found with any ID format",
            });
          }
        }

        // Get the updated product
        let updatedProduct;
        try {
          updatedProduct = await productsCollection.findOne({
            _id: new ObjectId(req.params.id),
          });
        } catch (findError) {
          updatedProduct = await productsCollection.findOne({
            _id: req.params.id,
          });
        }

        // Close the client
        await client.close();

        if (!updatedProduct) {
          return res.status(500).json({
            success: false,
            message: "Failed to retrieve updated product",
          });
        }

        console.log("Product updated successfully with direct MongoDB");

        return res.status(200).json({
          success: true,
          message: "Product updated successfully",
          data: updatedProduct,
        });
      } catch (mongoError) {
        console.error("Error in direct MongoDB update:", mongoError);
        await client.close();
        return res.status(500).json({
          success: false,
          message: "Database operation failed",
          error: mongoError.message,
        });
      }
    } catch (error) {
      console.error("Error in fallback product update endpoint:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during product update",
        error: error.message,
      });
    }
  }
);

// Standard API routes with file upload support
app.use("/api/products", productRoutes);

// Legacy routes for backward compatibility
app.put("/products/:id", upload.array("images", 10), (req, res) => {
  console.log("Redirecting legacy product update to direct endpoint");
  res.redirect(307, `/api/direct/products/${req.params.id}`);
});

// Special route for products page - handle both /products and /api/products
app.get("/products", getAllProducts);
app.get("/api/products", getAllProducts);

// Special route for product details page
app.get("/products/:id", getProductById);
app.get("/api/products/:id", getProductById);

// Reliable product endpoints that always work
app.get("/api/reliable/products", async (req, res) => {
  try {
    const result = await productDataService.getAllProducts(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in reliable products endpoint:", error);
    return res.status(200).json({
      success: true,
      count: productDataService.mockProducts.length,
      data: productDataService.mockProducts,
      source: "error-fallback",
      error: error.message,
    });
  }
});

app.get("/api/reliable/products/:id", async (req, res) => {
  try {
    const result = await productDataService.getProductById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in reliable product endpoint:", error);

    // Find a mock product or create a fallback
    const mockProduct = productDataService.mockProducts.find(
      (p) => p._id === req.params.id
    ) || {
      _id: req.params.id,
      name: "Error Fallback Product",
      description: "This product is shown due to an error in the server.",
      price: 9999,
      category: {
        _id: "error-category",
        name: "Error",
      },
      images: ["https://placehold.co/800x600/red/white?text=Error+Product"],
      createdAt: new Date(),
      isErrorFallback: true,
    };

    return res.status(200).json({
      success: true,
      data: mockProduct,
      source: "error-fallback",
      error: error.message,
    });
  }
});

// Reliable auth endpoints that always work
app.post("/api/auth/reliable/register", directAuth.register);
app.post("/api/auth/reliable/login", directAuth.login);

// Special direct product endpoint for client fallback
app.get("/api/direct-product/:id", async (req, res) => {
  try {
    console.log("Direct product endpoint called for ID:", req.params.id);

    // Import the MongoDB client
    const { MongoClient, ObjectId } = require("mongodb");

    // Get the MongoDB URI
    const uri = process.env.MONGO_URI;

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 60000,
      maxPoolSize: 20,
      minPoolSize: 5,
      maxIdleTimeMS: 120000,
    };

    // Create a new client
    const client = new MongoClient(uri, options);

    try {
      // Connect to MongoDB
      await client.connect();
      console.log("Connected to MongoDB for direct product fetch");

      // Get the database name from the connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get the product collection
      const productsCollection = db.collection("products");

      // Try to find the product by ID
      let product = null;

      try {
        // Try ObjectId first
        product = await productsCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
      } catch (idError) {
        console.log("Not a valid ObjectId, trying as string");
        product = await productsCollection.findOne({ _id: req.params.id });
      }

      // If not found, try by slug
      if (!product) {
        console.log("Product not found by ID, trying by slug");
        product = await productsCollection.findOne({ slug: req.params.id });
      }

      // If still not found, try a more flexible approach
      if (!product) {
        console.log(
          "Product not found by ID or slug, trying flexible approach"
        );

        // Get all products
        const allProducts = await productsCollection.find({}).toArray();
        console.log(
          `Fetched ${allProducts.length} products for flexible search`
        );

        // Try to find a product with a matching ID or slug
        product = allProducts.find((p) => {
          if (!p._id) return false;
          const productId = p._id.toString();
          return (
            productId.includes(req.params.id) ||
            (p.slug && p.slug.includes(req.params.id))
          );
        });
      }

      // If product found, try to get category info
      if (product && product.category) {
        try {
          const categoriesCollection = db.collection("categories");
          let categoryId;

          try {
            categoryId = new ObjectId(product.category);
          } catch (idError) {
            categoryId = product.category;
          }

          const category = await categoriesCollection.findOne({
            _id: categoryId,
          });

          if (category) {
            product.categoryInfo = category;
          }
        } catch (categoryError) {
          console.error("Error fetching category info:", categoryError);
        }
      }

      // Return the product
      if (product) {
        console.log("Product found:", product._id);
        return res.status(200).json({
          success: true,
          data: product,
          source: "direct-mongodb",
        });
      } else {
        console.log("Product not found");
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
    } finally {
      // Close the client
      await client.close();
      console.log("MongoDB connection closed");
    }
  } catch (error) {
    console.error("Error in direct product endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
});

// Direct API routes for categories
app.get("/api/direct/categories", getAllCategories);
app.get("/api/direct/categories/:id", getCategoryById);
app.post("/api/direct/categories", upload.single("image"), createCategory);
app.put("/api/direct/categories/:id", upload.single("image"), updateCategory);
app.delete("/api/direct/categories/:id", deleteCategory);

// Additional category routes for better compatibility
app.get("/categories", getAllCategories);
app.get("/api/categories", getAllCategories);
app.get("/categories/:id", getCategoryById);
app.get("/api/categories/:id", getCategoryById);
app.post("/categories", upload.single("image"), createCategory);
app.post("/api/categories", upload.single("image"), createCategory);
app.put("/categories/:id", upload.single("image"), updateCategory);
app.put("/api/categories/:id", upload.single("image"), updateCategory);
app.delete("/categories/:id", deleteCategory);
app.delete("/api/categories/:id", deleteCategory);

// Admin category routes
app.get("/admin/categories", getAllCategories);
app.get("/api/admin/categories", getAllCategories);
app.get("/admin/categories/:id", getCategoryById);
app.get("/api/admin/categories/:id", getCategoryById);
app.post("/admin/categories", upload.single("image"), createCategory);
app.post("/api/admin/categories", upload.single("image"), createCategory);
app.put("/admin/categories/:id", upload.single("image"), updateCategory);
app.put("/api/admin/categories/:id", upload.single("image"), updateCategory);
app.delete("/admin/categories/:id", deleteCategory);
app.delete("/api/admin/categories/:id", deleteCategory);

// Direct API routes for payment settings
app.get("/api/direct/payment-settings", getPaymentSettings);
app.get("/api/direct/payment-settings/all", getAllPaymentSettingsDirect);

// Additional payment settings routes for better compatibility
app.get("/payment-settings", getPaymentSettings);
app.get("/api/payment-settings", getPaymentSettings);
app.get("/payment-settings/all", getAllPaymentSettingsDirect);
app.get("/api/payment-settings/all", getAllPaymentSettingsDirect);
app.get("/admin/payment-settings", getAllPaymentSettingsDirect);
app.get("/api/admin/payment-settings", getAllPaymentSettingsDirect);

// Direct admin login routes
app.post("/api/auth/admin/direct-login", loginAdmin);
app.post("/api/auth/admin/login", loginAdmin); // Also handle regular admin login route

// Log all routes for debugging
console.log("Direct routes registered:");
console.log("Admin routes:");
console.log("- GET /admin/payment-requests");
console.log("- GET /api/admin/payment-requests");
console.log("- GET /admin/orders");
console.log("- GET /api/admin/orders");
console.log("- POST /api/auth/admin/direct-login");
console.log("- POST /api/auth/admin/login");
console.log("Product routes:");
console.log("- GET /api/direct/products");
console.log("- GET /api/direct/products/:id");
console.log("- POST /api/direct/products");
console.log("- PUT /api/direct/products/:id");
console.log("- DELETE /api/direct/products/:id");
console.log("- POST /api/direct/product-create (Enhanced)");
console.log("- POST /api/product-create (Enhanced)");
console.log("- POST /admin/product-create (Enhanced)");
console.log("- POST /api/bypass/product (Bypass)");
console.log("- POST /bypass/product (Bypass)");
console.log("- POST /admin/bypass/product (Bypass)");
console.log("- POST /api/direct-mongo/product (Direct MongoDB)");
console.log("- POST /direct-mongo/product (Direct MongoDB)");
console.log("- POST /admin/direct-mongo/product (Direct MongoDB)");
console.log("- POST /api/emergency/product (Emergency - 2min timeout)");
console.log("- POST /emergency/product (Emergency - 2min timeout)");
console.log("- POST /admin/emergency/product (Emergency - 2min timeout)");
console.log("- POST /api/guaranteed/product (Guaranteed Success - No DB)");
console.log("- POST /guaranteed/product (Guaranteed Success - No DB)");
console.log("- POST /admin/guaranteed/product (Guaranteed Success - No DB)");
console.log("- GET /api/pending-products (Get Pending Products)");
console.log("Category routes:");
console.log("- GET /api/direct/categories");
console.log("- GET /api/direct/categories/:id");
console.log("- POST /api/direct/categories");
console.log("- PUT /api/direct/categories/:id");
console.log("- DELETE /api/direct/categories/:id");
console.log("- GET /categories");
console.log("- GET /api/categories");
console.log("- GET /categories/:id");
console.log("- GET /api/categories/:id");
console.log("- POST /categories");
console.log("- POST /api/categories");
console.log("- PUT /categories/:id");
console.log("- PUT /api/categories/:id");
console.log("- DELETE /categories/:id");
console.log("- DELETE /api/categories/:id");
console.log("- GET /admin/categories");
console.log("- GET /api/admin/categories");
console.log("- GET /admin/categories/:id");
console.log("- GET /api/admin/categories/:id");
console.log("- POST /admin/categories");
console.log("- POST /api/admin/categories");
console.log("- PUT /admin/categories/:id");
console.log("- PUT /api/admin/categories/:id");
console.log("- DELETE /admin/categories/:id");
console.log("- DELETE /api/admin/categories/:id");

console.log("Payment Settings routes:");
console.log("- GET /api/direct/payment-settings");
console.log("- GET /api/direct/payment-settings/all");
console.log("- GET /payment-settings");
console.log("- GET /api/payment-settings");
console.log("- GET /payment-settings/all");
console.log("- GET /api/payment-settings/all");
console.log("- GET /admin/payment-settings");
console.log("- GET /api/admin/payment-settings");
console.log("Contact form routes:");
console.log("- POST /contact");
console.log("- POST /api/contact");
console.log("- POST /api/api/contact");

// Note: All other contact routes (GET, PUT, DELETE) are handled by contactRoutes

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// MongoDB Connection Test
app.get("/api/test-mongodb", async (_req, res) => {
  try {
    console.log("Testing MongoDB connection...");

    // Import the direct DB connection utility
    const {
      findDocuments,
      findOneDocument,
    } = require("./utils/directDbConnection");

    // Test products collection
    const products = await findDocuments("products", {}, { limit: 5 });

    // Test categories collection
    const categories = await findDocuments("categories", {}, { limit: 5 });

    // Return the results
    return res.json({
      success: true,
      message: "MongoDB connection test successful",
      data: {
        products: {
          count: products.length,
          sample: products.slice(0, 2).map((p) => ({
            _id: p._id.toString(),
            name: p.name,
            price: p.price,
          })),
        },
        categories: {
          count: categories.length,
          sample: categories.slice(0, 2).map((c) => ({
            _id: c._id.toString(),
            name: c.name,
          })),
        },
      },
    });
  } catch (error) {
    console.error("MongoDB connection test failed:", error);
    return res.status(500).json({
      success: false,
      message: "MongoDB connection test failed",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Simplified admin products endpoint for reliable data loading
app.get("/api/admin/simple/products", async (req, res) => {
  try {
    console.log("Simplified admin products endpoint called");

    // Try to get products from the reliable service first
    try {
      const result = await productDataService.getAllProducts({});
      console.log(`Found ${result.count} products from productDataService`);
      return res.status(200).json({
        success: true,
        count: result.count,
        data: result.data,
        source: "product_service",
      });
    } catch (serviceError) {
      console.error("Error using productDataService:", serviceError);
      // Continue to direct MongoDB approach
    }

    // If service fails, try direct MongoDB connection
    const { MongoClient } = require("mongodb");
    const uri = process.env.MONGO_URI;

    // Connection options with increased timeouts
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 60000,
    };

    let client = null;

    try {
      // Connect to MongoDB
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get products collection
      const productsCollection = db.collection("products");

      // Get products
      const products = await productsCollection.find({}).toArray();

      // Get categories to populate product data
      const categoriesCollection = db.collection("categories");
      const categories = await categoriesCollection.find().toArray();

      // Create a map of category IDs to category objects
      const categoryMap = {};
      categories.forEach((category) => {
        categoryMap[category._id.toString()] = category;
      });

      // Populate category data in products
      const populatedProducts = products.map((product) => {
        if (product.category) {
          const categoryId = product.category.toString();
          if (categoryMap[categoryId]) {
            product.category = categoryMap[categoryId];
          }
        }
        return product;
      });

      console.log(
        `Found ${populatedProducts.length} products from direct MongoDB connection for admin`
      );

      return res.status(200).json({
        success: true,
        count: populatedProducts.length,
        data: populatedProducts,
        source: "direct_mongodb_admin",
      });
    } catch (directError) {
      console.error(
        "Direct MongoDB connection error for admin products:",
        directError
      );

      // Return mock data as a last resort
      const mockProducts = [
        {
          _id: "mock1",
          name: "Sample Sofa",
          price: 50000,
          stock: 5,
          category: { _id: "cat1", name: "Sofa Beds" },
          images: ["https://placehold.co/300x300/gray/white?text=Sofa"],
        },
        {
          _id: "mock2",
          name: "Sample Table",
          price: 25000,
          stock: 10,
          category: { _id: "cat2", name: "Tables" },
          images: ["https://placehold.co/300x300/gray/white?text=Table"],
        },
        {
          _id: "mock3",
          name: "Sample Chair",
          price: 15000,
          stock: 15,
          category: { _id: "cat3", name: "Chairs" },
          images: ["https://placehold.co/300x300/gray/white?text=Chair"],
        },
      ];

      return res.status(200).json({
        success: true,
        count: mockProducts.length,
        data: mockProducts,
        source: "mock_data",
        error: directError.message,
      });
    } finally {
      // Close MongoDB connection
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error("Error in simplified admin products endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching admin products",
      error: error.message,
    });
  }
});

// Direct admin products endpoint that always works
app.get("/api/admin/direct/products", async (req, res) => {
  try {
    console.log("Direct admin products endpoint called");

    // Connect directly to MongoDB
    const { MongoClient } = require("mongodb");
    const uri = process.env.MONGO_URI;

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
    };

    let client = null;

    try {
      // Connect to MongoDB
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get products collection
      const productsCollection = db.collection("products");

      // Get products
      const products = await productsCollection.find({}).toArray();

      // Get categories to populate product data
      const categoriesCollection = db.collection("categories");
      const categories = await categoriesCollection.find().toArray();

      // Create a map of category IDs to category objects
      const categoryMap = {};
      categories.forEach((category) => {
        categoryMap[category._id.toString()] = category;
      });

      // Populate category data in products
      const populatedProducts = products.map((product) => {
        if (product.category) {
          const categoryId = product.category.toString();
          if (categoryMap[categoryId]) {
            product.category = categoryMap[categoryId];
          }
        }
        return product;
      });

      console.log(
        `Found ${populatedProducts.length} products from direct MongoDB connection for admin`
      );

      return res.status(200).json({
        success: true,
        count: populatedProducts.length,
        data: populatedProducts,
        source: "direct_mongodb_admin",
      });
    } catch (directError) {
      console.error(
        "Direct MongoDB connection error for admin products:",
        directError
      );

      // Return error
      return res.status(500).json({
        success: false,
        message: "Error fetching admin products",
        error: directError.message,
      });
    } finally {
      // Close MongoDB connection
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error("Error in direct admin products endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching admin products",
      error: error.message,
    });
  }
});

// Ensure standard categories exist
app.get("/api/ensure-categories", async (req, res) => {
  try {
    console.log("Ensuring standard categories exist");

    // Define standard categories
    const standardCategories = [
      {
        name: "Sofa Beds",
        description: "Comfortable sofa beds for your living room",
      },
      {
        name: "Tables",
        description: "Stylish tables for your home",
      },
      {
        name: "Chairs",
        description: "Ergonomic chairs for comfort",
      },
      {
        name: "Wardrobes",
        description: "Spacious wardrobes for storage",
      },
      {
        name: "Beds",
        description: "Comfortable beds for a good night's sleep",
      },
    ];

    // Check which categories already exist
    const existingCategories = await Category.find({
      name: { $in: standardCategories.map((cat) => cat.name) },
    });

    console.log(
      `Found ${existingCategories.length} existing standard categories`
    );

    // Create missing categories
    const existingNames = existingCategories.map((cat) => cat.name);
    const categoriesToCreate = standardCategories.filter(
      (cat) => !existingNames.includes(cat.name)
    );

    console.log(`Creating ${categoriesToCreate.length} missing categories`);

    const createdCategories = [];

    for (const category of categoriesToCreate) {
      try {
        const newCategory = new Category(category);
        const savedCategory = await newCategory.save();
        createdCategories.push(savedCategory);
        console.log(`Created category: ${category.name}`);
      } catch (err) {
        console.error(`Error creating category ${category.name}:`, err);
      }
    }

    // Return all standard categories (existing + newly created)
    const allStandardCategories = [...existingCategories, ...createdCategories];

    return res.status(200).json({
      success: true,
      message: `Ensured ${allStandardCategories.length} standard categories exist`,
      data: allStandardCategories,
    });
  } catch (error) {
    console.error("Error ensuring categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to ensure categories",
      error: error.message,
    });
  }
});

// Mock categories endpoint that always works (no database query)
app.get("/api/mock/categories", (req, res) => {
  console.log("Mock categories endpoint called");

  // Return hardcoded categories without querying the database
  const mockCategories = [
    {
      _id: "mock_sofa_beds",
      name: "Sofa Beds",
      description: "Comfortable sofa beds for your living room",
    },
    {
      _id: "mock_tables",
      name: "Tables",
      description: "Stylish tables for your home",
    },
    {
      _id: "mock_chairs",
      name: "Chairs",
      description: "Ergonomic chairs for comfort",
    },
    {
      _id: "mock_wardrobes",
      name: "Wardrobes",
      description: "Spacious wardrobes for storage",
    },
    {
      _id: "mock_beds",
      name: "Beds",
      description: "Comfortable beds for a good night's sleep",
    },
  ];

  // Return as simple array
  return res.status(200).json(mockCategories);
});

// Direct categories endpoint that always works
app.get("/api/direct/categories", async (req, res) => {
  try {
    console.log("Direct categories endpoint called");

    // Try to get categories directly from the database
    const categories = await Category.find({}).lean();

    console.log(`Found ${categories.length} categories`);

    // Return categories as a simple array
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error in direct categories endpoint:", error);

    // Return standard categories as fallback
    const standardCategories = [
      {
        _id: "fallback_sofa_beds",
        name: "Sofa Beds",
        description: "Comfortable sofa beds for your living room",
      },
      {
        _id: "fallback_tables",
        name: "Tables",
        description: "Stylish tables for your home",
      },
      {
        _id: "fallback_chairs",
        name: "Chairs",
        description: "Ergonomic chairs for comfort",
      },
      {
        _id: "fallback_wardrobes",
        name: "Wardrobes",
        description: "Spacious wardrobes for storage",
      },
      {
        _id: "fallback_beds",
        name: "Beds",
        description: "Comfortable beds for a good night's sleep",
      },
    ];

    return res.status(200).json(standardCategories);
  }
});

// Direct product creation endpoint (no auth required)
app.post(
  "/api/direct/products",
  upload.array("images", 10),
  async (req, res) => {
    try {
      console.log("Direct product creation endpoint called");
      console.log("Request body keys:", Object.keys(req.body));
      console.log("Request files:", req.files ? req.files.length : "none");

      // Log all form data for debugging
      for (const key in req.body) {
        console.log(
          `${key}: ${
            typeof req.body[key] === "object"
              ? JSON.stringify(req.body[key])
              : req.body[key]
          }`
        );
      }

      // Validate required fields
      if (!req.body.name) {
        return res.status(400).json({
          success: false,
          message: "Product name is required",
        });
      }

      // Parse numeric values
      const price = parseFloat(req.body.price) || 0;
      const stock = parseInt(req.body.stock) || 0;

      // Validate required fields according to the Product model schema
      if (!req.body.name) {
        return res.status(400).json({
          success: false,
          message: "Product name is required",
        });
      }

      if (!req.body.description) {
        return res.status(400).json({
          success: false,
          message: "Product description is required",
        });
      }

      if (!req.body.category) {
        return res.status(400).json({
          success: false,
          message: "Product category is required",
        });
      }

      // Create a new product from the request body with all possible fields
      const productData = {
        // Required fields according to the Product model schema
        name: req.body.name,
        description: req.body.description || "No description provided",
        price: price || 0,
        stock: stock || 0,
        category: req.body.category,

        // Optional fields
        featured:
          req.body.featured === "true" || req.body.isFeatured === "true",
        material: req.body.material || "",
        color: req.body.color || "",
        dimensions: req.body.dimensions
          ? typeof req.body.dimensions === "string"
            ? JSON.parse(req.body.dimensions)
            : req.body.dimensions
          : { length: 0, width: 0, height: 0 },

        // Additional fields
        brand: req.body.brand || "",
        weight: parseFloat(req.body.weight) || 0,
        discountPrice: parseFloat(req.body.discountPrice) || undefined,
        numReviews: 0,
        ratings: 0,
        reviews: [],
      };

      console.log(
        "Creating product with data:",
        JSON.stringify(productData, null, 2)
      );

      // Create a slug from the name
      const baseSlug = slugify(productData.name, { lower: true });

      // Check if slug already exists
      const slugExists = await Product.exists({ slug: baseSlug });

      // If slug exists, add a random suffix
      const slug = slugExists
        ? `${baseSlug}-${Math.floor(Math.random() * 1000)}`
        : baseSlug;

      productData.slug = slug;

      // Handle images
      if (req.files && req.files.length > 0) {
        productData.images = req.files.map((file) => file.path);
        console.log("Using uploaded images:", productData.images);
      } else {
        // Use default image
        productData.images = [
          "https://placehold.co/300x300/gray/white?text=Product",
        ];
        console.log("Using default image");
      }

      // Handle standard categories (convert from string ID to ObjectId if needed)
      if (productData.category) {
        console.log(`Processing category: ${productData.category}`);

        // Check if it's a standard category
        if (productData.category.startsWith("standard_")) {
          console.log("Converting standard category to real category");

          // Map standard category IDs to real categories
          const categoryMap = {
            standard_sofa_beds: "Sofa Beds",
            standard_tables: "Tables",
            standard_chairs: "Chairs",
            standard_wardrobes: "Wardrobes",
            standard_beds: "Beds",
          };

          // Find or create the category
          const categoryName = categoryMap[productData.category] || "Other";

          try {
            // Try to find the category by name
            let category = await Category.findOne({ name: categoryName });

            // If category doesn't exist, create it
            if (!category) {
              console.log(`Creating category: ${categoryName}`);
              category = new Category({
                name: categoryName,
                description: `${categoryName} furniture items`,
              });
              await category.save();
            }

            // Use the real category ID
            productData.category = category._id;
            console.log(
              `Using real category: ${categoryName} (${category._id})`
            );
          } catch (categoryError) {
            console.error("Error handling category:", categoryError);
            return res.status(500).json({
              success: false,
              message: "Error processing category",
              error: categoryError.message,
            });
          }
        } else {
          // Check if the category exists
          try {
            const categoryExists = await Category.exists({
              _id: productData.category,
            });

            if (!categoryExists) {
              console.log(
                `Category with ID ${productData.category} not found, creating default category`
              );

              // Create a default category
              const defaultCategory = new Category({
                name: "Other",
                description: "Other furniture items",
              });

              const savedCategory = await defaultCategory.save();
              productData.category = savedCategory._id;
              console.log(
                `Using default category: Other (${savedCategory._id})`
              );
            } else {
              console.log(
                `Using existing category with ID: ${productData.category}`
              );
            }
          } catch (categoryError) {
            console.error("Error checking category:", categoryError);

            // Create a default category as fallback
            try {
              const defaultCategory = new Category({
                name: "Default",
                description: "Default category",
              });

              const savedCategory = await defaultCategory.save();
              productData.category = savedCategory._id;
              console.log(
                `Using fallback category: Default (${savedCategory._id})`
              );
            } catch (fallbackError) {
              console.error("Error creating fallback category:", fallbackError);
              return res.status(500).json({
                success: false,
                message: "Error processing category",
                error: fallbackError.message,
              });
            }
          }
        }
      } else {
        // If no category provided, create a default one
        try {
          console.log("No category provided, creating default category");

          const defaultCategory = new Category({
            name: "Uncategorized",
            description: "Uncategorized furniture items",
          });

          const savedCategory = await defaultCategory.save();
          productData.category = savedCategory._id;
          console.log(
            `Using default category: Uncategorized (${savedCategory._id})`
          );
        } catch (defaultCategoryError) {
          console.error(
            "Error creating default category:",
            defaultCategoryError
          );
          return res.status(500).json({
            success: false,
            message: "Error creating default category",
            error: defaultCategoryError.message,
          });
        }
      }

      // Create and save the product
      const product = new Product(productData);
      const savedProduct = await product.save();

      console.log("Product created successfully:", savedProduct._id);

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: savedProduct,
      });
    } catch (error) {
      console.error("Error in direct product creation:", error);

      // Provide more detailed error information
      let errorMessage = "Failed to create product";
      let errorDetails = error.message;

      // Check for validation errors
      if (error.name === "ValidationError") {
        errorMessage = "Validation error";
        errorDetails = Object.keys(error.errors)
          .map((field) => `${field}: ${error.errors[field].message}`)
          .join(", ");
      }

      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: errorDetails,
      });
    }
  }
);

// Test product creation endpoint for debugging
app.post("/api/test/product", async (req, res) => {
  try {
    console.log("=== TEST PRODUCT CREATION ENDPOINT CALLED ===");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Log MongoDB connection status
    console.log("MongoDB connection state:", mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

    // Create a simple product with minimal fields
    const testProduct = new Product({
      name: "Test Product " + Date.now(),
      description: "Test description",
      price: 999,
      stock: 10,
      category: "6822c5e3c9343f8816127436", // Use an existing category ID or create one
    });

    console.log("Test product before save:", testProduct);

    // Save the product
    const savedProduct = await testProduct.save();

    console.log("Test product after save:", savedProduct);

    return res.status(201).json({
      success: true,
      message: "Test product created successfully",
      data: savedProduct,
    });
  } catch (error) {
    console.error("Error in test product creation:", error);
    return res.status(500).json({
      success: false,
      message: "Test product creation failed",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Direct product creation with raw MongoDB
app.post("/api/raw/product", async (req, res) => {
  try {
    console.log("=== RAW PRODUCT CREATION ENDPOINT CALLED ===");

    // Get direct access to the MongoDB collection
    const db = mongoose.connection.db;
    const productsCollection = db.collection("products");

    // Log MongoDB connection state
    console.log("MongoDB connection state:", mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

    // Create a simple product document with all required fields
    const productDoc = {
      name: req.body.name || "Raw Product " + Date.now(),
      description: req.body.description || "Raw product description",
      price: parseFloat(req.body.price) || 999,
      stock: parseInt(req.body.stock) || 10,
      slug:
        slugify(req.body.name || "Raw Product " + Date.now(), { lower: true }) +
        "-" +
        Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Handle category - try to use a valid ObjectId
    try {
      if (req.body.category) {
        // Try to convert to ObjectId
        productDoc.category = new mongoose.Types.ObjectId(req.body.category);
      } else {
        // Find any category to use
        const categoriesCollection = db.collection("categories");
        const anyCategory = await categoriesCollection.findOne({});

        if (anyCategory) {
          productDoc.category = anyCategory._id;
          console.log(
            "Using existing category:",
            anyCategory.name,
            anyCategory._id
          );
        } else {
          // Create a new category
          const newCategory = {
            name: "Default Category",
            description: "Default category created for product",
            createdAt: new Date(),
          };

          const categoryResult = await categoriesCollection.insertOne(
            newCategory
          );
          productDoc.category = categoryResult.insertedId;
          console.log(
            "Created new category with ID:",
            categoryResult.insertedId
          );
        }
      }
    } catch (categoryError) {
      console.error("Error handling category:", categoryError);
      // Create a string ID as fallback
      productDoc.category = new mongoose.Types.ObjectId();
      console.log("Using fallback category ID:", productDoc.category);
    }

    console.log("Raw product document:", productDoc);

    // Insert directly into MongoDB
    const result = await productsCollection.insertOne(productDoc);

    console.log("Raw insert result:", result);

    return res.status(201).json({
      success: true,
      message: "Raw product created successfully",
      data: {
        _id: result.insertedId,
        ...productDoc,
      },
    });
  } catch (error) {
    console.error("Error in raw product creation:", error);
    return res.status(500).json({
      success: false,
      message: "Raw product creation failed",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Mock products endpoint that always works
app.get("/api/mock/products", (req, res) => {
  console.log("Mock products endpoint called");

  // Return mock data
  const mockProducts = [
    {
      _id: "mock1",
      name: "Sample Sofa",
      price: 50000,
      stock: 5,
      category: { _id: "cat1", name: "Sofa Beds" },
      images: ["https://placehold.co/300x300/gray/white?text=Sofa"],
    },
    {
      _id: "mock2",
      name: "Sample Table",
      price: 25000,
      stock: 10,
      category: { _id: "cat2", name: "Tables" },
      images: ["https://placehold.co/300x300/gray/white?text=Table"],
    },
    {
      _id: "mock3",
      name: "Sample Chair",
      price: 15000,
      stock: 15,
      category: { _id: "cat3", name: "Chairs" },
      images: ["https://placehold.co/300x300/gray/white?text=Chair"],
    },
    {
      _id: "mock4",
      name: "Sample Wardrobe",
      price: 35000,
      stock: 8,
      category: { _id: "cat4", name: "Wardrobes" },
      images: ["https://placehold.co/300x300/gray/white?text=Wardrobe"],
    },
    {
      _id: "mock5",
      name: "Sample Bed",
      price: 45000,
      stock: 12,
      category: { _id: "cat5", name: "Beds" },
      images: ["https://placehold.co/300x300/gray/white?text=Bed"],
    },
  ];

  // Return as simple array
  return res.status(200).json(mockProducts);
});

// Ultra-reliable products endpoint for admin panel
app.get("/api/ultra/products", async (req, res) => {
  try {
    console.log("Ultra-reliable products endpoint called");

    // Try multiple approaches to get products
    let products = [];
    let source = "";

    // Approach 1: Try using Product model
    try {
      products = await Product.find({}).populate("category").lean();
      if (products && products.length > 0) {
        console.log(`Found ${products.length} products using Product model`);
        source = "mongoose_model";
        return res.status(200).json(products);
      }
    } catch (modelError) {
      console.error("Error using Product model:", modelError);
    }

    // Approach 2: Try direct MongoDB connection
    try {
      const { MongoClient } = require("mongodb");
      const uri = process.env.MONGO_URI;

      // Connection options with increased timeouts
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
      };

      const client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get products collection
      const productsCollection = db.collection("products");

      // Get products
      products = await productsCollection.find({}).toArray();

      if (products && products.length > 0) {
        console.log(
          `Found ${products.length} products using direct MongoDB connection`
        );
        source = "direct_mongodb";
        await client.close();
        return res.status(200).json(products);
      }

      await client.close();
    } catch (mongoError) {
      console.error("Error using direct MongoDB connection:", mongoError);
    }

    // Approach 3: Return mock data as last resort
    if (products.length === 0) {
      console.log("No products found, returning mock data");
      products = [
        {
          _id: "mock1",
          name: "Sample Sofa",
          price: 50000,
          stock: 5,
          category: { _id: "cat1", name: "Sofa Beds" },
          images: ["https://placehold.co/300x300/gray/white?text=Sofa"],
        },
        {
          _id: "mock2",
          name: "Sample Table",
          price: 25000,
          stock: 10,
          category: { _id: "cat2", name: "Tables" },
          images: ["https://placehold.co/300x300/gray/white?text=Table"],
        },
        {
          _id: "mock3",
          name: "Sample Chair",
          price: 15000,
          stock: 15,
          category: { _id: "cat3", name: "Chairs" },
          images: ["https://placehold.co/300x300/gray/white?text=Chair"],
        },
      ];
      source = "mock_data";
    }

    return res.status(200).json(products);
  } catch (error) {
    console.error("Error in ultra-reliable products endpoint:", error);

    // Return empty array instead of error to avoid breaking the client
    return res.status(200).json([]);
  }
});

// Direct products endpoint that always works
app.get("/api/direct/products", async (req, res) => {
  try {
    console.log("Direct products endpoint called");

    // Connect directly to MongoDB
    const { MongoClient } = require("mongodb");
    const uri = process.env.MONGO_URI;

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    };

    let client = null;

    try {
      // Connect to MongoDB
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get products collection
      const productsCollection = db.collection("products");

      // Get products
      const products = await productsCollection.find({}).toArray();

      // Get categories to populate product data
      const categoriesCollection = db.collection("categories");
      const categories = await categoriesCollection.find().toArray();

      // Create a map of category IDs to category objects
      const categoryMap = {};
      categories.forEach((category) => {
        categoryMap[category._id.toString()] = category;
      });

      // Populate category data in products
      const populatedProducts = products.map((product) => {
        if (product.category) {
          const categoryId = product.category.toString();
          if (categoryMap[categoryId]) {
            product.category = categoryMap[categoryId];
          }
        }
        return product;
      });

      console.log(
        `Found ${populatedProducts.length} products from direct MongoDB connection`
      );

      return res.status(200).json({
        success: true,
        count: populatedProducts.length,
        data: populatedProducts,
        source: "direct_mongodb",
      });
    } catch (directError) {
      console.error("Direct MongoDB connection error:", directError);

      // Return error
      return res.status(500).json({
        success: false,
        message: "Error fetching products",
        error: directError.message,
      });
    } finally {
      // Close MongoDB connection
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error("Error in direct products endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
});

// Direct product endpoint that always works
app.get("/api/direct-product/:id", async (req, res) => {
  try {
    console.log("Direct product endpoint called for ID:", req.params.id);

    // Get the product ID from the request
    const productId = req.params.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Connect directly to MongoDB
    const { MongoClient, ObjectId } = require("mongodb");
    const uri = process.env.MONGO_URI;

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    };

    let client = null;

    try {
      // Connect to MongoDB
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get products collection
      const productsCollection = db.collection("products");

      // Try to convert the ID to ObjectId
      let query = {};
      try {
        query = { _id: new ObjectId(productId) };
      } catch (err) {
        // If not a valid ObjectId, try string match
        query = { _id: productId };
      }

      // Get the product
      const product = await productsCollection.findOne(query);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Get categories to populate product data
      const categoriesCollection = db.collection("categories");
      const categories = await categoriesCollection.find().toArray();

      // Create a map of category IDs to category objects
      const categoryMap = {};
      categories.forEach((category) => {
        categoryMap[category._id.toString()] = category;
      });

      // Populate category data in product
      if (product.category) {
        const categoryId = product.category.toString();
        if (categoryMap[categoryId]) {
          product.category = categoryMap[categoryId];
        }
      }

      return res.status(200).json({
        success: true,
        data: product,
        source: "direct_mongodb",
      });
    } catch (directError) {
      console.error("Direct MongoDB connection error:", directError);

      // Return error
      return res.status(500).json({
        success: false,
        message: "Error fetching product",
        error: directError.message,
      });
    } finally {
      // Close MongoDB connection
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error("Error in direct product endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
});

// Test endpoint for products page
app.get("/api/test/products-page", async (req, res) => {
  try {
    console.log("Test products page endpoint called");

    // Try to get products from the reliable service first
    try {
      const result = await productDataService.getAllProducts(req.query);
      console.log(`Found ${result.count} products from productDataService`);
      return res.status(200).json(result);
    } catch (serviceError) {
      console.error("Error using productDataService:", serviceError);
      // Continue to direct MongoDB approach
    }

    // If service fails, try direct MongoDB connection
    const { MongoClient } = require("mongodb");
    const uri = process.env.MONGO_URI;

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 5000,
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

      // Get products collection
      const productsCollection = db.collection("products");

      // Get products
      const products = await productsCollection.find({}).limit(10).toArray();

      // Get categories to populate product data
      const categoriesCollection = db.collection("categories");
      const categories = await categoriesCollection.find().toArray();

      // Create a map of category IDs to category objects
      const categoryMap = {};
      categories.forEach((category) => {
        categoryMap[category._id.toString()] = category;
      });

      // Populate category data in products
      const populatedProducts = products.map((product) => {
        if (product.category) {
          const categoryId = product.category.toString();
          if (categoryMap[categoryId]) {
            product.category = categoryMap[categoryId];
          }
        }
        return product;
      });

      console.log(
        `Found ${populatedProducts.length} products from direct MongoDB connection`
      );

      return res.status(200).json({
        success: true,
        count: populatedProducts.length,
        data: populatedProducts,
        source: "direct_database",
      });
    } catch (directError) {
      console.error("Direct MongoDB connection error:", directError);

      // Return mock data as a last resort
      const mockProducts = productDataService.mockProducts;

      return res.status(200).json({
        success: true,
        count: mockProducts.length,
        data: mockProducts,
        source: "mock_data",
      });
    } finally {
      // Close MongoDB connection
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error("Error in test products page endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
});

// Debug route for product data
app.get("/api/debug/product/:id", async (req, res) => {
  try {
    console.log("Debug product endpoint called for ID:", req.params.id);

    // Import the MongoDB client
    const { MongoClient, ObjectId } = require("mongodb");

    // Get the MongoDB URI
    const uri = process.env.MONGO_URI;

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 60000,
    };

    // Create a new client
    const client = new MongoClient(uri, options);

    try {
      // Connect to MongoDB
      await client.connect();
      console.log("Connected to MongoDB for debug product fetch");

      // Get the database name from the connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get the product collection
      const productsCollection = db.collection("products");

      // Get a sample of products
      const products = await productsCollection.find({}).limit(10).toArray();

      // Try to find the specific product
      let targetProduct = null;

      try {
        // Try ObjectId first
        targetProduct = await productsCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
      } catch (idError) {
        console.log("Not a valid ObjectId, trying as string");
        targetProduct = await productsCollection.findOne({
          _id: req.params.id,
        });
      }

      // Return debug information
      return res.status(200).json({
        success: true,
        message: "Debug information for product",
        mongodbConnected: true,
        databaseName: dbName,
        productCount: products.length,
        sampleProductIds: products.map((p) => p._id.toString()),
        targetProduct: targetProduct,
        requestedId: req.params.id,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    } finally {
      // Close the client
      await client.close();
      console.log("MongoDB connection closed");
    }
  } catch (error) {
    console.error("Error in debug product endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching debug information",
      error: error.message,
      stack: error.stack,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  }
});

// Debug route to check file structure (available in all environments)
app.get("/api/debug", (_req, res) => {
  const rootDir = path.join(__dirname, "..");
  const clientDir = path.join(rootDir, "client");
  const clientDistDir = path.join(clientDir, "dist");

  let fileStructure = {
    environment: process.env.NODE_ENV,
    serverDir: __dirname,
    rootDir: rootDir,
    rootFiles: [],
    clientDir: clientDir,
    clientFiles: [],
    clientDistDir: clientDistDir,
    clientDistFiles: [],
    clientDistExists: false,
    indexHtmlExists: false,
  };

  try {
    // Check root directory
    if (fs.existsSync(rootDir)) {
      fileStructure.rootFiles = fs.readdirSync(rootDir);
    }

    // Check client directory
    if (fs.existsSync(clientDir)) {
      fileStructure.clientFiles = fs.readdirSync(clientDir);
    }

    // Check client/dist directory
    if (fs.existsSync(clientDistDir)) {
      fileStructure.clientDistExists = true;
      fileStructure.clientDistFiles = fs.readdirSync(clientDistDir);

      // Check for index.html
      const indexPath = path.join(clientDistDir, "index.html");
      fileStructure.indexHtmlExists = fs.existsSync(indexPath);
    }
  } catch (err) {
    fileStructure.error = err.message;
  }

  res.json(fileStructure);
});

// Client Routing (Production only)
if (process.env.NODE_ENV === "production") {
  // Important: This should come AFTER all API routes
  app.get("*", (_req, res) => {
    // Define possible index.html paths (in order of preference)
    const possiblePaths = [
      path.join(__dirname, "../client/dist/index.html"),
      path.join(__dirname, "../dist/index.html"),
      path.join(__dirname, "../../client/dist/index.html"),
      path.join(process.cwd(), "client/dist/index.html"),
      path.join(process.cwd(), "dist/index.html"),
    ];

    // Try each path until we find one that exists
    for (const indexPath of possiblePaths) {
      try {
        if (fs.existsSync(indexPath)) {
          console.log(`✅ Serving index.html from: ${indexPath}`);
          return res.sendFile(indexPath);
        }
      } catch (err) {
        console.error(`Error checking index.html at ${indexPath}:`, err);
      }
    }

    // If we get here, we couldn't find index.html
    console.error("❌ index.html NOT FOUND in any of the expected locations");

    // List all paths we checked
    const pathsChecked = possiblePaths.join("\n");

    // Return a helpful error page
    res.status(404).send(`
      <html>
        <head><title>Error - File Not Found</title></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e53e3e;">Error: index.html not found</h1>
          <p>The application could not find the main HTML file.</p>
          <p>This is likely a deployment issue. Please check the server logs.</p>
          <h2>Paths checked:</h2>
          <pre style="background: #f7fafc; padding: 15px; border-radius: 5px; overflow-x: auto;">${pathsChecked}</pre>
          <h2>Environment:</h2>
          <pre style="background: #f7fafc; padding: 15px; border-radius: 5px; overflow-x: auto;">
NODE_ENV: ${process.env.NODE_ENV}
Current directory: ${__dirname}
Working directory: ${process.cwd()}
          </pre>
          <p>Try visiting the <a href="/api/debug">/api/debug</a> endpoint for more information.</p>
        </body>
      </html>
    `);
  });

  console.log("Catch-all route configured for React app");
}

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log("Connecting to MongoDB Atlas...");

    // Log a redacted version of the URI for debugging
    const redactedUri = uri.replace(
      /\/\/([^:]+):([^@]+)@/,
      (_, username) => `\/\/${username}:****@`
    );
    console.log("Using connection string:", redactedUri);

    // Connect with options suitable for Atlas with increased timeouts
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 300000, // 300 seconds (5 minutes)
      socketTimeoutMS: 300000, // 300 seconds (5 minutes)
      connectTimeoutMS: 300000, // 300 seconds (5 minutes)
      heartbeatFrequencyMS: 30000, // 30 seconds
      retryWrites: true,
      w: 1, // Write acknowledgment from primary only (faster than majority)
      j: false, // Don't wait for journal commit (faster)
      maxPoolSize: 10,
      bufferCommands: false, // Disable command buffering
      autoIndex: true, // Build indexes
      family: 4, // Use IPv4, skip trying IPv6
      // Note: bufferMaxEntries, useNewUrlParser, and useUnifiedTopology are no longer needed
      // in newer MongoDB driver versions and have been removed,
    });

    console.log("MongoDB Atlas connected successfully");
    return true;
  } catch (error) {
    console.error("Connection failed:", error.message);
    console.log("Please verify:");
    console.log("- IP is whitelisted in Atlas (current IP must be allowed)");
    console.log(
      "- Connection string is correct (no spaces in username/password)"
    );
    console.log("- Database user exists and has correct permissions");

    // Don't exit the process in development mode
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return false;
  }
};
connectDB();

// Server Configuration
const PORT = process.env.PORT || 5001;

// Export app for testing
module.exports = app;

// Start server if not imported
if (require.main === module) {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`
      Server running in ${process.env.NODE_ENV} mode
      Listening on port ${PORT}
      MongoDB: ${process.env.MONGO_URI ? "Connected" : "Using local database"}
      Authentication: ${
        process.env.BYPASS_AUTH === "true" ? "BYPASSED" : "ENABLED"
      }
    `);
  });

  // Error handling
  process.on("unhandledRejection", (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
}
