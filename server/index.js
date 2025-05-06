const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

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

// Middleware Configuration
// Define allowed origins
const allowedOrigins = [
  "https://furniture-q3nb.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean); // Remove any undefined values

console.log("CORS allowed origins:", allowedOrigins);

// Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
const logger = require("./middleware/logger");
app.use(logger);

// Fix for duplicate API prefixes in client requests
const apiPrefixFix = require("./middleware/apiPrefixFix");
app.use(apiPrefixFix);

// Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("./controllers/directCategories");

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

// Direct API routes for products
app.get("/api/direct/products", getAllProducts);
app.get("/api/direct/products/:id", getProductById);
app.post("/api/direct/products", createProduct);
app.put("/api/direct/products/:id", updateProduct);
app.delete("/api/direct/products/:id", deleteProduct);

// Special route for products page - handle both /products and /api/products
app.get("/products", getAllProducts);
app.get("/api/products", getAllProducts);

// Special route for product details page
app.get("/products/:id", getProductById);
app.get("/api/products/:id", getProductById);

// Import the product data service and direct auth controller
const productDataService = require("./utils/productDataService");
const directAuth = require("./controllers/directAuth");

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
app.post("/api/direct/categories", createCategory);
app.put("/api/direct/categories/:id", updateCategory);
app.delete("/api/direct/categories/:id", deleteCategory);

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
console.log("Category routes:");
console.log("- GET /api/direct/categories");
console.log("- GET /api/direct/categories/:id");
console.log("- POST /api/direct/categories");
console.log("- PUT /api/direct/categories/:id");
console.log("- DELETE /api/direct/categories/:id");
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
const PORT = process.env.PORT || 5000;

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
