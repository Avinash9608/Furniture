// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");

// // Ensure uploads directory exists
// require("./ensure-uploads");

// // Load environment variables
// dotenv.config();

// // Force BYPASS_AUTH to true for development
// if (process.env.NODE_ENV === "development") {
//   process.env.BYPASS_AUTH = "true";
//   console.log("Forcing BYPASS_AUTH to true for development");
// }

// // Ensure BYPASS_AUTH is set correctly
// if (process.env.BYPASS_AUTH === undefined) {
//   process.env.BYPASS_AUTH = "true";
//   console.log("Setting BYPASS_AUTH to true as it was undefined");
// }

// // Set default environment variables if not set
// if (!process.env.NODE_ENV) {
//   process.env.NODE_ENV = "development";
// }

// if (process.env.JWT_SECRET === undefined) {
//   process.env.JWT_SECRET = "shyam_furnitures_jwt_secret_key_2023";
//   console.warn(
//     "JWT_SECRET not found in .env, using default value (not secure for production)"
//   );
// }

// // Log environment variables for debugging
// console.log("Environment variables loaded:");
// console.log("NODE_ENV:", process.env.NODE_ENV);
// console.log("BYPASS_AUTH:", process.env.BYPASS_AUTH);
// console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");

// // Import routes
// const authRoutes = require("./routes/auth");
// const productRoutes = require("./routes/products");
// const categoryRoutes = require("./routes/categories");
// const contactRoutes = require("./routes/contact");
// const orderRoutes = require("./routes/orders");
// const paymentSettingsRoutes = require("./routes/paymentSettings");
// const paymentRequestsRoutes = require("./routes/paymentRequests");

// // Log bypass auth status for each route
// console.log(
//   "Products Routes - Bypass Auth:",
//   process.env.BYPASS_AUTH === "true"
// );
// console.log(
//   "Categories Routes - Bypass Auth:",
//   process.env.BYPASS_AUTH === "true"
// );
// console.log(
//   "Contact Routes - Bypass Auth:",
//   process.env.BYPASS_AUTH === "true"
// );
// console.log("Orders Routes - Bypass Auth:", process.env.BYPASS_AUTH === "true");

// // Initialize express app
// const app = express();

// // Import custom middleware
// const logger = require("./middleware/logger");

// // Middleware
// // Configure CORS with specific settings
// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

//   // Handle preflight requests
//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }

//   next();
// });
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(logger); // Add request logger

// // Serve static files from uploads directory
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // API routes
// app.use("/api/auth", authRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/payment-settings", paymentSettingsRoutes);
// app.use("/api/payment-requests", paymentRequestsRoutes);

// // Root route
// app.get("/", (_req, res) => {
//   res.send("Shyam Furnitures API is running...");
// });

// // Test route - no authentication required
// app.get("/api/test", (_req, res) => {
//   console.log("Test route accessed");
//   res.json({
//     success: true,
//     message: "Test API is working",
//     timestamp: new Date().toISOString(),
//   });
// });

// // Connect to MongoDB
// const connectDB = async () => {
//   try {
//     const mongoURI =
//       process.env.MONGO_URI || "mongodb://localhost:27017/shyam_furnitures";
//     console.log("Connecting to MongoDB at:", mongoURI);
//     await mongoose.connect(mongoURI);
//     console.log("MongoDB connected successfully");
//   } catch (error) {
//     console.error("MongoDB connection error:", error.message);
//     process.exit(1);
//   }
// };

// // Connect to MongoDB
// connectDB();

// // Export the Express app
// module.exports = app;
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Ensure uploads directory exists
require("./ensure-uploads");

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

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment-settings", paymentSettingsRoutes);
app.use("/api/payment-requests", paymentRequestsRoutes);

// Note: The apiPrefixFix middleware now handles all duplicate /api prefixes automatically

// Direct route handler for contact form (backup in case the regular route doesn't work)
app.post("/contact", (req, res) => {
  console.log("Received contact form submission via direct /contact route");
  // Forward to the contact controller
  const { createContact } = require("./controllers/contact");
  createContact(req, res);
});

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

// Database Connection
// const connectDB = async () => {
//   try {
//     const mongoURI =
//       process.env.MONGO_URI || "mongodb://localhost:27017/shyam_furnitures";
//     await mongoose.connect(mongoURI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("MongoDB connected successfully");
//   } catch (error) {
//     console.error("MongoDB connection error:", error.message);
//     process.exit(1);
//   }
// };
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
