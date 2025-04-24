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
    features: {
      auth: true,
      products: mongoStatus === 1,
      orders: mongoStatus === 1,
      payments: mongoStatus === 1,
      fileUploads: cloudinaryStatus === "connected",
    },
  });
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

// SIMPLIFIED CONTACT FORM HANDLERS - Using a direct approach without database
app.post("/contact", (req, res) => {
  console.log("Received contact form submission via /contact route:", req.body);

  // Just return success without trying to save to database
  res.status(200).json({
    success: true,
    message: "Contact form received (test mode - not saved to database)",
    receivedData: req.body,
  });
});

app.post("/api/contact", (req, res) => {
  console.log(
    "Received contact form submission via /api/contact route:",
    req.body
  );

  // Just return success without trying to save to database
  res.status(200).json({
    success: true,
    message: "Contact form received (test mode - not saved to database)",
    receivedData: req.body,
  });
});

app.post("/api/api/contact", (req, res) => {
  console.log(
    "Received contact form submission via /api/api/contact route:",
    req.body
  );

  // Just return success without trying to save to database
  res.status(200).json({
    success: true,
    message: "Contact form received (test mode - not saved to database)",
    receivedData: req.body,
  });
});

// Log all routes for debugging
console.log("Contact form routes registered:");
console.log("- POST /contact");
console.log("- POST /api/contact");
console.log("- POST /api/api/contact");

// Use routes from server
app.use("/api", routes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/dist")));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
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
});
