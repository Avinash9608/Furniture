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
  // Check if we have a frontend build
  const indexPath = path.join(__dirname, "client/dist/index.html");
  if (fs.existsSync(indexPath)) {
    // If index.html exists, serve it
    console.log("Serving index.html for root path");
    res.sendFile(indexPath);
  } else {
    // If no frontend build, show API status
    console.warn("No frontend build found, showing API status");
    res.send(`
      <html>
        <head>
          <title>Shyam Furnitures API</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .status { padding: 15px; background-color: #f0f0f0; border-radius: 5px; margin-bottom: 20px; }
            .status.ok { background-color: #d4edda; color: #155724; }
            .status.warning { background-color: #fff3cd; color: #856404; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
            pre { background-color: #f8f9fa; padding: 10px; border-radius: 5px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>Shyam Furnitures API</h1>
          <div class="status ok">
            <strong>API Status:</strong> Running
          </div>
          <div class="status warning">
            <strong>Frontend Status:</strong> Not Found
            <p>The frontend build files were not found. This means the React application is not available.</p>
          </div>
          <h2>Available Endpoints:</h2>
          <ul>
            <li><a href="/api/health">/api/health</a> - Detailed API health status</li>
            <li><a href="/api/products">/api/products</a> - List all products</li>
            <li><a href="/api/categories">/api/categories</a> - List all categories</li>
          </ul>
          <h2>Troubleshooting:</h2>
          <p>If you're seeing this page instead of the Shyam Furnitures website, it means the frontend build is missing or not properly configured.</p>
          <p>Check the build process in your deployment settings to ensure the frontend is being built correctly.</p>
        </body>
      </html>
    `);
  }
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

// Import the centralized model loader
const { loadModel, loadAllModels } = require("./server/utils/modelLoader");

// Load all models
console.log("Loading all models...");
loadAllModels();

// Get references to models
let Contact = loadModel("Contact");
let Product = loadModel("Product");
let Category = loadModel("Category");
let Order = loadModel("Order");
let PaymentSettings = loadModel("PaymentSetting");
let PaymentRequest = loadModel("PaymentRequest");

// Log model loading status
console.log("Model loading status:");
console.log(`- Contact: ${Contact ? "Loaded" : "Not loaded"}`);
console.log(`- Product: ${Product ? "Loaded" : "Not loaded"}`);
console.log(`- Category: ${Category ? "Loaded" : "Not loaded"}`);
console.log(`- Order: ${Order ? "Loaded" : "Not loaded"}`);
console.log(`- PaymentSettings: ${PaymentSettings ? "Loaded" : "Not loaded"}`);
console.log(`- PaymentRequest: ${PaymentRequest ? "Loaded" : "Not loaded"}`);

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
    // Try to load the Contact model if it's not available
    if (!Contact) {
      Contact = loadModel("Contact");
      console.log(
        "Attempted to load Contact model:",
        Contact ? "Success" : "Failed"
      );
    }

    // If Contact model is still not available, return an empty array
    if (!Contact) {
      console.warn("Contact model not available, returning empty array");
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "Contact model not available, returning empty array",
      });
    }

    try {
      const contacts = await Contact.find().sort({ createdAt: -1 });
      console.log(`Successfully fetched ${contacts.length} contact messages`);

      return res.status(200).json({
        success: true,
        count: contacts.length,
        data: contacts,
      });
    } catch (dbError) {
      console.error("Database error fetching contacts:", dbError);

      // Return empty array to prevent client-side errors
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "Error fetching contacts from database, returning empty array",
      });
    }
  } catch (error) {
    console.error("Unexpected error in contact messages route:", error);

    // Return empty array to prevent client-side errors
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Unexpected error, returning empty array",
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
    // Try to load the Category model if it's not available
    if (!Category) {
      Category = loadModel("Category");
      console.log(
        "Attempted to load Category model:",
        Category ? "Success" : "Failed"
      );
    }

    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Create a slug if not provided
    if (!req.body.slug) {
      req.body.slug = req.body.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
    }

    // If Category model is still not available, return a fake success response
    if (!Category) {
      console.warn("Category model not available, returning fake success");
      const fakeCategory = {
        ...req.body,
        _id: `temp_${Date.now()}`,
        slug: req.body.slug,
        createdAt: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        data: fakeCategory,
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

      // For validation errors
      if (dbError.name === "ValidationError") {
        const validationErrors = {};
        for (const field in dbError.errors) {
          validationErrors[field] = dbError.errors[field].message;
        }
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationErrors,
        });
      }

      // Create a fallback category object for the client
      const fallbackCategory = {
        ...req.body,
        _id: `temp_${Date.now()}`,
        slug: req.body.slug,
        createdAt: new Date().toISOString(),
      };

      // Return success with fallback data to prevent client-side errors
      return res.status(200).json({
        success: true,
        data: fallbackCategory,
        message: "Error saving to database, returning temporary data",
      });
    }
  } catch (error) {
    console.error("Unexpected error in create category route:", error);

    // Create a fallback category object for the client
    const fallbackCategory = {
      ...req.body,
      _id: `temp_${Date.now()}`,
      slug:
        req.body.slug ||
        req.body.name?.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-") ||
        `category-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // Return success with fallback data to prevent client-side errors
    return res.status(200).json({
      success: true,
      data: fallbackCategory,
      message: "Unexpected error, returning temporary data",
    });
  }
});

// ===== PAYMENT SETTINGS ROUTES =====
// Get all payment settings
app.get("/api/payment-settings", async (req, res) => {
  console.log("Fetching payment settings");
  try {
    // Try to load the PaymentSettings model if it's not available
    if (!PaymentSettings) {
      PaymentSettings = loadModel("PaymentSetting");
      console.log(
        "Attempted to load PaymentSettings model:",
        PaymentSettings ? "Success" : "Failed"
      );
    }

    // If PaymentSettings model is still not available, return an empty array
    if (!PaymentSettings) {
      console.warn(
        "PaymentSettings model not available, returning empty array"
      );
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "PaymentSettings model not available, returning empty array",
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

// Get all payment settings (alternative endpoint)
app.get("/api/payment-settings/all", async (req, res) => {
  console.log("Fetching all payment settings (alternative endpoint)");
  try {
    // Try to load the PaymentSettings model if it's not available
    if (!PaymentSettings) {
      PaymentSettings = loadModel("PaymentSetting");
      console.log(
        "Attempted to load PaymentSettings model:",
        PaymentSettings ? "Success" : "Failed"
      );
    }

    // If PaymentSettings model is still not available, return an empty array
    if (!PaymentSettings) {
      console.warn(
        "PaymentSettings model not available, returning empty array"
      );
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "PaymentSettings model not available, returning empty array",
      });
    }

    // Try-catch block specifically for the database operation
    try {
      // Get all payment settings (not just active ones)
      const paymentSettings = await PaymentSettings.find();
      console.log(
        `Successfully fetched ${paymentSettings.length} payment settings (all)`
      );

      return res.status(200).json({
        success: true,
        count: paymentSettings.length,
        data: paymentSettings,
      });
    } catch (dbError) {
      console.error("Database error fetching all payment settings:", dbError);

      // Return empty array instead of error to prevent client-side crashes
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message:
          "Error fetching all payment settings from database, returning empty array",
      });
    }
  } catch (error) {
    console.error("Unexpected error in all payment settings route:", error);

    // Return empty array instead of error to prevent client-side crashes
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Unexpected error, returning empty array",
    });
  }
});

// ===== PAYMENT REQUESTS ROUTES =====
// Get all payment requests
app.get("/api/payment-requests/all", async (req, res) => {
  console.log("Fetching all payment requests");
  try {
    // Try to load the PaymentRequest model if it's not available
    if (!PaymentRequest) {
      PaymentRequest = loadModel("PaymentRequest");
      console.log(
        "Attempted to load PaymentRequest model:",
        PaymentRequest ? "Success" : "Failed"
      );
    }

    // If PaymentRequest model is still not available, return an empty array
    if (!PaymentRequest) {
      console.warn("PaymentRequest model not available, returning empty array");
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "PaymentRequest model not available, returning empty array",
      });
    }

    // Try-catch block specifically for the database operation
    try {
      // First try with full population
      try {
        // Make sure the User and Order models are loaded
        const User = loadModel("User");
        const Order = loadModel("Order");

        console.log("Models for population:", {
          User: !!User,
          Order: !!Order,
          PaymentRequest: !!PaymentRequest,
        });

        const paymentRequests = await PaymentRequest.find()
          .populate("user", "name email")
          .populate("order")
          .sort({ createdAt: -1 });

        console.log(
          `Successfully fetched ${paymentRequests.length} payment requests with population`
        );

        return res.status(200).json({
          success: true,
          count: paymentRequests.length,
          data: paymentRequests,
        });
      } catch (populateError) {
        console.error("Error populating payment requests:", populateError);

        // Try without population if population fails
        const paymentRequests = await PaymentRequest.find().sort({
          createdAt: -1,
        });
        console.log(
          `Successfully fetched ${paymentRequests.length} payment requests without population`
        );

        return res.status(200).json({
          success: true,
          count: paymentRequests.length,
          data: paymentRequests,
          message: "Fetched without population due to error",
        });
      }
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
console.log("- GET /api/payment-settings/all");
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
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return res
      .status(404)
      .json({ success: false, message: "API endpoint not found" });
  }

  // Check if the file exists before sending
  const indexPath = path.join(__dirname, "client/dist/index.html");
  if (fs.existsSync(indexPath)) {
    console.log(`Serving index.html for path: ${req.path}`);
    res.sendFile(indexPath);
  } else {
    console.warn("index.html not found!");
    // Try to provide more helpful information
    try {
      const rootDir = fs.readdirSync(__dirname);
      const clientDir = fs.existsSync(path.join(__dirname, "client"))
        ? fs.readdirSync(path.join(__dirname, "client"))
        : "client directory not found";
      const distDir = fs.existsSync(path.join(__dirname, "client/dist"))
        ? fs.readdirSync(path.join(__dirname, "client/dist"))
        : "dist directory not found";

      res.status(404).send(`
        <h1>Frontend build not found</h1>
        <p>The index.html file could not be found. This usually means the frontend build is missing.</p>
        <h2>Debugging Information:</h2>
        <pre>
Root directory: ${JSON.stringify(rootDir, null, 2)}
Client directory: ${JSON.stringify(clientDir, null, 2)}
Dist directory: ${JSON.stringify(distDir, null, 2)}
        </pre>
        <p>API is running. <a href="/api/health">Check API health</a></p>
      `);
    } catch (error) {
      res
        .status(404)
        .send(
          `index.html not found. Build may be missing. Error: ${error.message}`
        );
    }
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
