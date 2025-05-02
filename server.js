const express = require("express");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Force production mode for Render
process.env.NODE_ENV = "production";

// Create Express app
const app = express();

// Configure CORS
const allowedOrigins = [
  "https://furniture-q3nb.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean); // Remove any undefined values

console.log("CORS allowed origins:", allowedOrigins);

// Configure CORS middleware
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

// Add middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add middleware to fix duplicate API prefixes
const apiPrefixFix = (req, _res, next) => {
  // Check if the URL has a duplicate /api prefix
  if (req.originalUrl.startsWith("/api/api/")) {
    // Log the fix for debugging
    console.log(
      `Fixing duplicate API prefix: ${
        req.originalUrl
      } -> ${req.originalUrl.replace("/api/api/", "/api/")}`
    );

    // Modify the URL to remove the duplicate prefix
    req.url = req.url.replace("/api/", "/");
  }

  // Continue to the next middleware
  next();
};

app.use(apiPrefixFix);

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
      serverSelectionTimeoutMS: 30000, // Increased timeout for Render
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
    });

    console.log("MongoDB Atlas connected successfully");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.log("Please verify:");
    console.log("- IP is whitelisted in Atlas (current IP must be allowed)");
    console.log(
      "- Connection string is correct (no spaces in username/password)"
    );
    console.log("- Database user exists and has correct permissions");
    return false;
  }
};

// Connect to MongoDB
connectDB();

// Log environment info
console.log("Starting server.js in root directory");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Current directory: ${__dirname}`);
console.log(`Available files: ${fs.readdirSync(__dirname).join(", ")}`);

// Define possible static file paths (in order of preference)
const possiblePaths = [
  path.join(__dirname, "client/dist"),
  path.join(__dirname, "dist"),
  path.join(__dirname, "client/build"),
  path.join(__dirname, "build"),
];

// Try each path until we find one that exists
let staticPath = null;
for (const testPath of possiblePaths) {
  try {
    if (fs.existsSync(testPath)) {
      console.log(`✅ Static directory found at: ${testPath}`);

      // Check if index.html exists in this directory
      const indexPath = path.join(testPath, "index.html");
      if (fs.existsSync(indexPath)) {
        console.log(`✅ index.html found at: ${indexPath}`);
        staticPath = testPath;
        break;
      } else {
        console.log(`❌ index.html NOT found at: ${indexPath}`);
      }
    } else {
      console.log(`❌ Static directory NOT found at: ${testPath}`);
    }
  } catch (err) {
    console.error(`Error checking static directory ${testPath}:`, err);
  }
}

if (!staticPath) {
  console.error(
    "❌ No valid static directory found! Falling back to server/index.js"
  );
  // Import and run the actual server code
  require("./server/index.js");
} else {
  // Serve static files
  app.use(express.static(staticPath));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      environment: process.env.NODE_ENV,
      staticPath: staticPath,
      timestamp: new Date().toISOString(),
      mongoConnection:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  // Debug endpoint
  app.get("/api/debug", (_req, res) => {
    const fileStructure = {
      environment: process.env.NODE_ENV,
      currentDirectory: __dirname,
      staticPath: staticPath,
      availableFiles: fs.readdirSync(__dirname),
      staticFiles: fs.existsSync(staticPath) ? fs.readdirSync(staticPath) : [],
      mongoConnection: {
        readyState: mongoose.connection.readyState,
        status:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        host: mongoose.connection.host || "not connected",
      },
    };
    res.json(fileStructure);
  });

  // Import routes from server/index.js
  try {
    // Import all route modules directly
    const authRoutes = require("./server/routes/auth");
    const productRoutes = require("./server/routes/products");
    const categoryRoutes = require("./server/routes/categories");
    const contactRoutes = require("./server/routes/contact");
    const orderRoutes = require("./server/routes/orders");
    const paymentSettingsRoutes = require("./server/routes/paymentSettings");
    const paymentRequestsRoutes = require("./server/routes/paymentRequests");

    // Import contact controller directly for special handling
    const contactController = require("./server/controllers/contact");

    // Import admin controllers directly
    const {
      getAllPaymentRequests,
    } = require("./server/controllers/paymentRequests");
    const { getOrders } = require("./server/controllers/orders");

    // API routes are now set up

    // Mount API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/contact", contactRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/payment-settings", paymentSettingsRoutes);
    app.use("/api/payment-requests", paymentRequestsRoutes);

    // Direct admin routes
    app.get("/admin/payment-requests", getAllPaymentRequests);
    app.get("/api/admin/payment-requests", getAllPaymentRequests);
    app.get("/admin/orders", getOrders);
    app.get("/api/admin/orders", getOrders);

    // Direct contact form handlers
    app.post("/contact", contactController.createContact);
    app.post("/api/contact", contactController.createContact);
    app.post("/api/api/contact", contactController.createContact);

    // Add direct route for getting contacts
    const Contact = require("./server/models/Contact");

    // Direct route for contacts (mentioned in your error)
    app.get("/api/direct/contacts", async (_req, res) => {
      try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        res
          .status(500)
          .json({ message: "Error fetching contacts", error: error.message });
      }
    });

    // Direct route for admin messages
    app.get("/api/admin/messages", async (_req, res) => {
      try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res
          .status(500)
          .json({ message: "Error fetching messages", error: error.message });
      }
    });

    // DB test route
    app.get("/api/db-test", async (_req, res) => {
      try {
        const dbStatus = {
          mongoConnection: mongoose.connection.readyState,
          status:
            mongoose.connection.readyState === 1 ? "connected" : "disconnected",
          collections: Object.keys(mongoose.connection.collections),
          models: Object.keys(mongoose.models),
        };
        res.json(dbStatus);
      } catch (error) {
        console.error("Error testing database:", error);
        res
          .status(500)
          .json({ message: "Error testing database", error: error.message });
      }
    });

    console.log("✅ API routes mounted successfully");
  } catch (error) {
    console.error("❌ Error setting up API routes:", error);
  }

  // Add error handling middleware
  app.use((err, _req, res, _next) => {
    console.error("Global error handler caught:", err);
    res.status(500).json({
      message: "Server error",
      error:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : err.message,
    });
  });

  // Catch-all route for client-side routing
  app.get("*", (req, res) => {
    console.log(`Serving index.html for: ${req.url}`);
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Start server
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB connection state: ${mongoose.connection.readyState}`);
  });
}
