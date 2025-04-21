const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Force BYPASS_AUTH to true for development
if (process.env.NODE_ENV === "development") {
  process.env.BYPASS_AUTH = "true";
  console.log("Forcing BYPASS_AUTH to true for development");
}

// Set default environment variables if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

if (process.env.JWT_SECRET === undefined) {
  process.env.JWT_SECRET = "shyam_furnitures_jwt_secret_key_2023";
  console.warn(
    "JWT_SECRET not found in .env, using default value (not secure for production)"
  );
}

// Log environment variables for debugging
console.log("Environment variables loaded:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("BYPASS_AUTH:", process.env.BYPASS_AUTH);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");

// Import routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const contactRoutes = require("./routes/contact");
const orderRoutes = require("./routes/orders");

// Log bypass auth status for each route
console.log(
  "Products Routes - Bypass Auth:",
  process.env.BYPASS_AUTH === "true"
);
console.log(
  "Categories Routes - Bypass Auth:",
  process.env.BYPASS_AUTH === "true"
);
console.log(
  "Contact Routes - Bypass Auth:",
  process.env.BYPASS_AUTH === "true"
);
console.log("Orders Routes - Bypass Auth:", process.env.BYPASS_AUTH === "true");

// Initialize express app
const app = express();

// Import custom middleware
const logger = require("./middleware/logger");

// Middleware
// Configure CORS with specific settings
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger); // Add request logger

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/orders", orderRoutes);

// Root route
app.get("/", (_req, res) => {
  res.send("Shyam Furnitures API is running...");
});

// Test route - no authentication required
app.get("/api/test", (_req, res) => {
  console.log("Test route accessed");
  res.json({
    success: true,
    message: "Test API is working",
    timestamp: new Date().toISOString(),
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://localhost:27017/shyam_furnitures";
    console.log("Connecting to MongoDB at:", mongoURI);
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
