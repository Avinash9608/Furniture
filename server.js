// Load environment variables
require("dotenv").config();

// Import required modules
const express = require("express");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
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

// Import custom middleware
const enhancedUploadMiddleware = require("./server/middleware/uploadMiddleware");

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

// Ensure uploads directory exists
const { uploadsDir, imagesDir } = require("./server/utils/ensureUploads");

// Serve static files from the uploads directory with CORS headers and caching
app.use(
  "/uploads",
  (req, res, next) => {
    // Set CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    // Add caching headers for images
    if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year
      res.setHeader(
        "Expires",
        new Date(Date.now() + 31536000000).toUTCString()
      );
    }

    next();
  },
  express.static(uploadsDir, {
    maxAge: "1d", // Default max age for non-image files
    etag: true,
    lastModified: true,
  })
);
console.log("Serving static files from uploads directory:", uploadsDir);

// Add a test endpoint to verify uploads
app.get("/api/test-uploads", (req, res) => {
  try {
    const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    res.json({
      message: "Uploads endpoint working",
      uploadsDirectory: uploadsDir,
      exists: fs.existsSync(uploadsDir),
      files: files,
      baseUrl: `${req.protocol}://${req.get("host")}/uploads/`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error checking uploads directory",
      error: error.message,
    });
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  console.log(`Creating uploads directory: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
  console.log(`Creating images directory: ${imagesDir}`);
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Log the contents of the uploads directory
try {
  const uploadsFiles = fs.readdirSync(uploadsDir);
  console.log("Files in uploads directory:", uploadsFiles);

  if (fs.existsSync(imagesDir)) {
    const imagesFiles = fs.readdirSync(imagesDir);
    console.log("Files in images directory:", imagesFiles);
  }
} catch (error) {
  console.error("Error reading uploads directory:", error);
}

// Configure Mongoose globally to prevent buffering timeout issues
mongoose.set("bufferTimeoutMS", 30000); // Set to 30 seconds - lower is better for deployment
mongoose.set("bufferCommands", false); // Disable command buffering - critical for deployment

// Set additional Mongoose options for better stability
mongoose.set("autoIndex", false); // Don't build indexes automatically in production
mongoose.set("strictQuery", false); // Less strict query filters for better compatibility

// Add event listeners for connection issues
mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

// Direct MongoDB connection client
let directClient = null;
let directDb = null;

// Connect to MongoDB with retry logic
const MAX_RETRIES = 5;
let retryCount = 0;

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

    // Force disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected existing MongoDB connection");
    }

    // CRITICAL: Disable buffering before connecting - this is key to fixing the timeout issues
    mongoose.set("bufferCommands", false); // Disable command buffering
    mongoose.set("bufferTimeoutMS", 10000); // 10 seconds timeout is enough when buffering is disabled

    // First, try to establish a direct connection to verify the server is reachable
    try {
      console.log(
        "Testing direct MongoDB connection before Mongoose connection..."
      );
      const testClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
        connectTimeoutMS: 5000, // 5 seconds timeout for connection
      });

      await testClient.connect();
      console.log("Direct MongoDB connection test successful");
      await testClient.close();
    } catch (directError) {
      console.error(
        "Direct MongoDB connection test failed:",
        directError.message
      );
      console.log("Will still attempt Mongoose connection...");
    }

    // Simplified connection options for better reliability in deployment
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for initial connection
      socketTimeoutMS: 30000, // 30 seconds timeout for queries
      connectTimeoutMS: 10000, // 10 seconds timeout for initial connection
      heartbeatFrequencyMS: 10000, // Check server status every 10 seconds
      retryWrites: true, // Retry write operations
      w: "majority", // Write concern
      maxPoolSize: 10, // Reduced pool size for better stability
      minPoolSize: 1, // Minimum connections
      bufferCommands: false, // CRITICAL: Disable command buffering
      autoIndex: false, // Don't build indexes automatically in production
      family: 4, // Use IPv4, skip trying IPv6
    });

    // Keep the buffer timeout low
    mongoose.set("bufferTimeoutMS", 10000); // 10 seconds timeout

    // Verify the buffer timeout setting
    console.log("Mongoose buffer timeout:", mongoose.get("bufferTimeoutMS"));

    // Log connection details for debugging
    console.log("MongoDB Atlas connected successfully");
    console.log("MongoDB Connection State:", mongoose.connection.readyState);
    console.log("MongoDB Connection Details:", {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.models),
    });

    // Reset retry count on successful connection
    retryCount = 0;

    // Also establish a direct MongoDB connection as a fallback
    try {
      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 60000, // 60 seconds
        socketTimeoutMS: 90000, // 90 seconds
        serverSelectionTimeoutMS: 60000, // 60 seconds
        maxPoolSize: 5,
        retryWrites: true,
        w: "majority",
      };

      directClient = new MongoClient(uri, options);
      await directClient.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      directDb = directClient.db(dbName);

      console.log(
        `Direct MongoDB connection successful to database: ${dbName}`
      );
    } catch (directError) {
      console.error("Direct MongoDB connection failed:", directError);
    }

    return true;
  } catch (error) {
    console.error(
      `MongoDB Connection failed (Attempt ${retryCount + 1}):`,
      error.message
    );

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(
        `Retrying connection in 5 seconds... (${retryCount}/${MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectDB();
    }

    console.error("MongoDB Connection failed:", error.message);
    console.log("Please verify:");
    console.log("- IP is whitelisted in Atlas (current IP must be allowed)");
    console.log(
      "- Connection string is correct (no spaces in username/password)"
    );
    console.log("- Database user exists and has correct permissions");
    console.log("- Network connectivity to MongoDB Atlas is available");

    // Log more detailed error information
    if (error.name === "MongoServerSelectionError") {
      console.error(
        "MongoDB Server Selection Error - Check network connectivity and MongoDB Atlas status"
      );
    } else if (error.name === "MongoNetworkError") {
      console.error(
        "MongoDB Network Error - Check firewall settings and network connectivity"
      );
    }

    // Don't exit the process in development mode
    if (process.env.NODE_ENV === "production") {
      // Don't exit in production either, just log the error and continue with degraded functionality
      console.error("Running with degraded database functionality");
    }
    console.log("Running in offline mode - some features may not work");
    return false;
  }
};

// Function to get direct MongoDB connection
const getDirectDb = () => {
  return directDb;
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
let ShippingAddress = loadModel("ShippingAddress");

// Log model loading status
console.log("Model loading status:");
console.log(`- Contact: ${Contact ? "Loaded" : "Not loaded"}`);
console.log(`- Product: ${Product ? "Loaded" : "Not loaded"}`);
console.log(`- Category: ${Category ? "Loaded" : "Not loaded"}`);
console.log(`- Order: ${Order ? "Loaded" : "Not loaded"}`);
console.log(`- PaymentSettings: ${PaymentSettings ? "Loaded" : "Not loaded"}`);
console.log(`- PaymentRequest: ${PaymentRequest ? "Loaded" : "Not loaded"}`);

// Use API routes
app.use("/api", routes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/dist")));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "client/dist/index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Not found - Frontend not built");
  }
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});
