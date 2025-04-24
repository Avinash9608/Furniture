// Load environment variables
require("dotenv").config();

// Import required modules
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");

// Import Cloudinary configuration
const {
  cloudinary,
  testCloudinaryConfig,
} = require("./server/config/cloudinary");

// Create Express app
const app = express();

// Import routes from server directory
const routes = require("./server/routes");

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // For POST/PUT requests, log the body (but sanitize sensitive data)
  if (req.method === "POST" || req.method === "PUT") {
    const sanitizedBody = { ...req.body };

    // Sanitize sensitive fields if they exist
    if (sanitizedBody.password) sanitizedBody.password = "[REDACTED]";
    if (sanitizedBody.token) sanitizedBody.token = "[REDACTED]";

    console.log("Request body:", sanitizedBody);
  }

  // Log query parameters if they exist
  if (Object.keys(req.query).length > 0) {
    console.log("Query params:", req.query);
  }

  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
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

    // Connect with options suitable for Atlas
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
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
    console.log("Running in offline mode - some features may not work");
    return false;
  }
};

// Connect to database and test Cloudinary
(async () => {
  try {
    const dbConnected = await connectDB();
    const cloudinaryConfigured = await testCloudinaryConfig();
    console.log("Services initialization status:", {
      database: dbConnected ? "connected" : "offline",
      cloudinary: cloudinaryConfigured ? "configured" : "misconfigured",
    });
  } catch (error) {
    console.error("Error during services initialization:", error.message);
  }
})();

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStatusText =
    {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }[mongoStatus] || "unknown";

  // Test Cloudinary connection
  let cloudinaryStatus = "unknown";
  try {
    const result = await cloudinary.api.ping();
    cloudinaryStatus = result.status === "ok" ? "connected" : "error";
  } catch (error) {
    cloudinaryStatus = "disconnected";
    console.error("Cloudinary health check error:", error.message);
  }

  // Check if models are loaded
  const modelsStatus = {
    Contact: !!Contact,
    Product: !!Product,
    Category: !!Category,
    Order: !!Order,
    PaymentSettings: !!PaymentSettings,
    PaymentRequest: !!PaymentRequest,
  };

  // Get server information
  const serverInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  };

  res.json({
    status:
      mongoStatus === 1 && cloudinaryStatus === "connected"
        ? "healthy"
        : "degraded",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      mongodb: {
        status: mongoStatusText,
        readyState: mongoStatus,
      },
      cloudinary: {
        status: cloudinaryStatus,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      },
    },
    models: modelsStatus,
    server: serverInfo,
    features: {
      auth: true,
      products: mongoStatus === 1,
      orders: mongoStatus === 1,
      payments: mongoStatus === 1,
      fileUploads: cloudinaryStatus === "connected",
    },
  });
});

// Simple root health check for Render
app.get("/", (req, res) => {
  res.send(
    "Shyam Furnitures API is running. Go to /api/health for detailed status."
  );
});

// DIRECT TEST ROUTES - These are simple routes to test basic functionality
app.get("/test", (req, res) => {
  console.log("Test route hit");
  res.json({ message: "Test route working!" });
});

app.post("/test", (req, res) => {
  console.log("Test POST route hit with body:", req.body);
  res.json({ message: "Test POST route working!", receivedData: req.body });
});

// DIRECT API ROUTE HANDLERS - These ensure all API routes work in all environments

// Import models with error handling
let Contact, Product, Category, Order, PaymentSettings, PaymentRequest;

// Helper function to safely require models
const safeRequire = (path) => {
  try {
    return require(path);
  } catch (error) {
    console.warn(`Warning: Could not load model from ${path}`, error.message);
    return null;
  }
};

// Load models
Contact = safeRequire("./server/models/Contact");
Product = safeRequire("./server/models/Product");
Category = safeRequire("./server/models/Category");
Order = safeRequire("./server/models/Order");
PaymentSettings = safeRequire("./server/models/PaymentSettings"); // Note the 's' at the end
PaymentRequest = safeRequire("./server/models/PaymentRequest");

// ===== CONTACT ROUTES =====
// Create contact message
app.post("/contact", async (req, res) => {
  console.log("Received contact form submission via /contact route:", req.body);
  try {
    // Check if Contact model is available
    if (!Contact) {
      console.warn(
        "Contact model not available, returning success without saving"
      );
      return res.status(200).json({
        success: true,
        message: "Contact form received (model not available)",
        receivedData: req.body,
      });
    }

    const contact = await Contact.create(req.body);
    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/contact", async (req, res) => {
  console.log(
    "Received contact form submission via /api/contact route:",
    req.body
  );
  try {
    // Check if Contact model is available
    if (!Contact) {
      console.warn(
        "Contact model not available, returning success without saving"
      );
      return res.status(200).json({
        success: true,
        message: "Contact form received (model not available)",
        receivedData: req.body,
      });
    }

    const contact = await Contact.create(req.body);
    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/api/contact", async (req, res) => {
  console.log(
    "Received contact form submission via /api/api/contact route:",
    req.body
  );
  try {
    // Check if Contact model is available
    if (!Contact) {
      console.warn(
        "Contact model not available, returning success without saving"
      );
      return res.status(200).json({
        success: true,
        message: "Contact form received (model not available)",
        receivedData: req.body,
      });
    }

    const contact = await Contact.create(req.body);
    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== ADDITIONAL API ROUTES =====

// Get all contact messages
app.get("/api/contact", async (req, res) => {
  console.log("Fetching all contact messages");
  try {
    // Check if Contact model is available
    if (!Contact) {
      console.warn("Contact model not available, returning empty array");
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "Contact model not available",
      });
    }

    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== PRODUCT ROUTES =====
// Get all products
app.get("/api/products", async (req, res) => {
  console.log("Fetching all products");
  try {
    // Check if Product model is available
    if (!Product) {
      console.warn("Product model not available, returning empty array");
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "Product model not available",
      });
    }

    const products = await Product.find().populate("category");
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ===== CATEGORY ROUTES =====
// Get all categories
app.get("/api/categories", async (req, res) => {
  console.log("Fetching all categories");
  try {
    // Check if Category model is available
    if (!Category) {
      console.warn("Category model not available, returning empty array");
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "Category model not available",
      });
    }

    // Try-catch block specifically for the database operation
    try {
      const categories = await Category.find();
      console.log(`Successfully fetched ${categories.length} categories`);

      return res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (dbError) {
      console.error("Database error fetching categories:", dbError);

      // Return empty array instead of error to prevent client-side crashes
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message:
          "Error fetching categories from database, returning empty array",
      });
    }
  } catch (error) {
    console.error("Unexpected error in categories route:", error);

    // Return empty array instead of error to prevent client-side crashes
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Unexpected error, returning empty array",
    });
  }
});

// Create category
app.post("/api/categories", async (req, res) => {
  console.log("Creating category with data:", req.body);
  try {
    // Check if Category model is available
    if (!Category) {
      console.warn("Category model not available, returning fake success");
      return res.status(200).json({
        success: true,
        data: {
          ...req.body,
          _id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        message: "Category model not available, returning fake success",
      });
    }

    // Try-catch block specifically for the database operation
    try {
      // Create the category
      const category = await Category.create(req.body);
      console.log("Category created successfully:", category);

      return res.status(201).json({
        success: true,
        data: category,
      });
    } catch (dbError) {
      console.error("Database error creating category:", dbError);

      // Return a more specific error message
      if (dbError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A category with this name already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: dbError.message || "Error creating category",
      });
    }
  } catch (error) {
    console.error("Unexpected error in create category route:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unexpected error creating category",
    });
  }
});

// ===== PAYMENT SETTINGS ROUTES =====
// Get all payment settings
app.get("/api/payment-settings", async (req, res) => {
  console.log("Fetching payment settings");
  try {
    // Check if PaymentSettings model is available
    if (!PaymentSettings) {
      console.warn(
        "PaymentSettings model not available, returning empty array"
      );
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "PaymentSettings model not available",
      });
    }

    // Try-catch block specifically for the database operation
    try {
      const paymentSettings = await PaymentSettings.find({ isActive: true });
      console.log(
        `Successfully fetched ${paymentSettings.length} payment settings`
      );

      return res.status(200).json({
        success: true,
        count: paymentSettings.length,
        data: paymentSettings,
      });
    } catch (dbError) {
      console.error("Database error fetching payment settings:", dbError);

      // Return empty array instead of error to prevent client-side crashes
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message:
          "Error fetching payment settings from database, returning empty array",
      });
    }
  } catch (error) {
    console.error("Unexpected error in payment settings route:", error);

    // Return empty array instead of error to prevent client-side crashes
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Unexpected error, returning empty array",
    });
  }
});

// Create payment settings
app.post("/api/payment-settings", async (req, res) => {
  console.log("Creating payment settings with data:", req.body);
  try {
    // Check if PaymentSettings model is available
    if (!PaymentSettings) {
      console.warn(
        "PaymentSettings model not available, returning fake success"
      );
      return res.status(200).json({
        success: true,
        data: {
          ...req.body,
          _id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        message: "PaymentSettings model not available, returning fake success",
      });
    }

    // Try-catch block specifically for the database operation
    try {
      // If we're creating a new active setting, deactivate all others
      if (req.body.isActive) {
        await PaymentSettings.updateMany({}, { isActive: false });
      }

      // Create the payment settings
      const paymentSettings = await PaymentSettings.create(req.body);
      console.log("Payment settings created successfully:", paymentSettings);

      return res.status(201).json({
        success: true,
        data: paymentSettings,
      });
    } catch (dbError) {
      console.error("Database error creating payment settings:", dbError);

      // Return a more specific error message
      if (dbError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A payment setting with this account number already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: dbError.message || "Error creating payment settings",
      });
    }
  } catch (error) {
    console.error("Unexpected error in create payment settings route:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unexpected error creating payment settings",
    });
  }
});

// ===== PAYMENT REQUESTS ROUTES =====
// Get all payment requests
app.get("/api/payment-requests/all", async (req, res) => {
  console.log("Fetching all payment requests");
  try {
    // Check if PaymentRequest model is available
    if (!PaymentRequest) {
      console.warn("PaymentRequest model not available, returning empty array");
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "PaymentRequest model not available",
      });
    }

    // Try-catch block specifically for the database operation
    try {
      const paymentRequests = await PaymentRequest.find()
        .populate("user", "name email")
        .populate("order")
        .sort({ createdAt: -1 });

      console.log(
        `Successfully fetched ${paymentRequests.length} payment requests`
      );

      return res.status(200).json({
        success: true,
        count: paymentRequests.length,
        data: paymentRequests,
      });
    } catch (dbError) {
      console.error("Database error fetching payment requests:", dbError);

      // Return empty array instead of error to prevent client-side crashes
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message:
          "Error fetching payment requests from database, returning empty array",
      });
    }
  } catch (error) {
    console.error("Unexpected error in payment requests route:", error);

    // Return empty array instead of error to prevent client-side crashes
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Unexpected error, returning empty array",
    });
  }
});

// Log all direct API routes for debugging
console.log("Direct API routes registered:");
console.log("- POST /contact");
console.log("- POST /api/contact");
console.log("- POST /api/api/contact");
console.log("- GET /api/contact");
console.log("- GET /api/products");
console.log("- GET /api/categories");
console.log("- POST /api/categories");
console.log("- GET /api/payment-settings");
console.log("- POST /api/payment-settings");
console.log("- GET /api/payment-requests/all");

// Use routes from server
app.use("/api", routes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/dist")));

// Log static file directory for debugging
console.log("Serving static files from:", path.join(__dirname, "client/dist"));
// Check if the directory exists
const fs = require("fs");
if (fs.existsSync(path.join(__dirname, "client/dist"))) {
  console.log("Static file directory exists");
  // List files in the directory
  try {
    const files = fs.readdirSync(path.join(__dirname, "client/dist"));
    console.log("Files in static directory:", files);
  } catch (error) {
    console.error("Error reading static directory:", error);
  }
} else {
  console.warn("Static file directory does not exist!");
}

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  // Check if the file exists before sending
  const indexPath = path.join(__dirname, "client/dist/index.html");
  if (fs.existsSync(indexPath)) {
    console.log(`Serving index.html for path: ${req.path}`);
    res.sendFile(indexPath);
  } else {
    console.warn("index.html not found!");
    res.status(404).send("index.html not found. Build may be missing.");
  }
});

// Global error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);

  // Send appropriate response based on error type
  if (err.name === "ValidationError") {
    // Mongoose validation error
    const validationErrors = {};
    for (const field in err.errors) {
      validationErrors[field] = err.errors[field].message;
    }

    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: validationErrors,
    });
  } else if (err.name === "CastError") {
    // Mongoose cast error (invalid ID, etc.)
    return res.status(400).json({
      success: false,
      message: "Invalid data format",
      error: err.message,
    });
  } else if (err.code === 11000) {
    // Mongoose duplicate key error
    return res.status(400).json({
      success: false,
      message: "Duplicate data error",
      error: err.message,
    });
  } else {
    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "production" ? "Server error" : err.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(
    `MongoDB connection status: ${
      mongoose.connection.readyState === 1 ? "Connected" : "Not connected"
    }`
  );
  console.log(
    `Cloudinary status: ${cloudinary ? "Configured" : "Not configured"}`
  );
});
