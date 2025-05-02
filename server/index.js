const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Ensure uploads directory exists
require("./utils/ensureUploads");

// Environment configuration
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  process.env.BYPASS_AUTH = "true";
  console.log("Development mode - Bypassing authentication");
}

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
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, "../client/dist")));

  console.log(
    "Serving static files from:",
    path.join(__dirname, "../client/dist")
  );
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
// Import contact controller directly for special handling
const contactController = require("./controllers/contact");

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

// Log all routes for debugging
console.log("Direct routes registered:");
console.log("Admin routes:");
console.log("- GET /admin/payment-requests");
console.log("- GET /api/admin/payment-requests");
console.log("- GET /admin/orders");
console.log("- GET /api/admin/orders");
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

// Client Routing (Production only)
if (process.env.NODE_ENV === "production") {
  // Important: This should come AFTER all API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
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
