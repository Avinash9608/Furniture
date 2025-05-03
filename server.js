const express = require("express");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

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
  "http://localhost:5000",
  process.env.CLIENT_URL,
  // Allow the current origin in production
  process.env.NODE_ENV === "production" ? process.env.BASE_URL : null,
].filter(Boolean); // Remove any undefined values

console.log("Allowed CORS origins:", allowedOrigins);

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

// Connect to MongoDB with retry mechanism and fallback data
const connectDB = async (retryCount = 0, maxRetries = 5) => {
  try {
    const uri = process.env.MONGO_URI;
    console.log(
      `Connecting to MongoDB Atlas... (Attempt ${retryCount + 1}/${
        maxRetries + 1
      })`
    );

    // Log a redacted version of the URI for debugging
    const redactedUri = uri.replace(
      /\/\/([^:]+):([^@]+)@/,
      (_, username) => `\/\/${username}:****@`
    );
    console.log("Using connection string:", redactedUri);

    // Close any existing connection first
    if (mongoose.connection.readyState !== 0) {
      console.log("Closing existing MongoDB connection before reconnecting...");
      await mongoose.connection.close();
    }

    // Configure mongoose before connecting
    mongoose.set("strictQuery", false);

    // Disable buffering globally - VERY IMPORTANT to prevent timeout errors
    mongoose.set("bufferCommands", false);

    // Set global timeout for all operations
    mongoose.set("maxTimeMS", 60000);

    // Significantly increased timeouts for Render deployment
    const connectionOptions = {
      serverSelectionTimeoutMS: 120000, // 120 seconds (2 minutes)
      socketTimeoutMS: 120000, // 120 seconds (2 minutes)
      connectTimeoutMS: 120000, // 120 seconds (2 minutes)
      heartbeatFrequencyMS: 30000, // 30 seconds
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
      bufferCommands: false, // Disable command buffering
      autoIndex: true, // Build indexes
      family: 4, // Use IPv4, skip trying IPv6
    };

    console.log(
      "Connection options:",
      JSON.stringify(connectionOptions, null, 2)
    );

    // Connect with the options
    const connection = await mongoose.connect(uri, connectionOptions);

    // Verify connection by accessing the database directly
    const db = connection.connection.db;
    if (!db) {
      throw new Error("Failed to get database reference after connection");
    }

    // Store the database reference globally for direct access
    global.mongoDb = db;
    console.log("Database reference stored globally as mongoDb");

    // Set up connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      // Don't exit the process, just log the error
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected, attempting to reconnect...");
      setTimeout(() => connectDB(0, maxRetries), 5000);
    });

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });

    // Test the connection by running a simple query
    try {
      const adminDb = mongoose.connection.db.admin();
      const result = await adminDb.ping();
      console.log("MongoDB ping result:", result);

      // List all collections to verify access
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      console.log(
        `Available collections (${collections.length}):`,
        collections.map((c) => c.name).join(", ")
      );
    } catch (pingError) {
      console.error("Error pinging MongoDB:", pingError);
    }

    console.log("✅ MongoDB Atlas connected successfully");

    // Load all models to ensure they're registered
    console.log("Loading models...");

    // Function to safely load a model
    const safelyLoadModel = (modelPath, modelName) => {
      try {
        const model = require(modelPath);
        console.log(`✅ Successfully loaded ${modelName} model`);
        return model;
      } catch (error) {
        console.error(`❌ Error loading ${modelName} model:`, error.message);
        return null;
      }
    };

    // Load each model individually with error handling
    const ContactModel = safelyLoadModel("./server/models/Contact", "Contact");
    const ProductModel = safelyLoadModel("./server/models/Product", "Product");
    const OrderModel = safelyLoadModel("./server/models/Order", "Order");
    const UserModel = safelyLoadModel("./server/models/User", "User");
    const CategoryModel = safelyLoadModel(
      "./server/models/Category",
      "Category"
    );
    const PaymentRequestModel = safelyLoadModel(
      "./server/models/PaymentRequest",
      "PaymentRequest"
    );
    // Try to load PaymentSettings model, but don't worry if it fails
    let PaymentSettingsModel = safelyLoadModel(
      "./server/models/PaymentSettings",
      "PaymentSettings"
    );

    // If PaymentSettings model failed to load, try with the ensure utility
    if (!PaymentSettingsModel) {
      try {
        console.log("Trying to ensure PaymentSettings model exists...");
        const ensureModels = require("./server/utils/ensureModels");
        PaymentSettingsModel = ensureModels.ensurePaymentSettingsModel();
        if (PaymentSettingsModel) {
          console.log("✅ Successfully ensured PaymentSettings model");
        } else {
          console.error("❌ Failed to ensure PaymentSettings model");
        }
      } catch (ensureError) {
        console.error(
          "❌ Error ensuring PaymentSettings model:",
          ensureError.message
        );
      }
    }

    // Log summary of loaded models
    const loadedModels = [
      ContactModel,
      ProductModel,
      OrderModel,
      UserModel,
      CategoryModel,
      PaymentRequestModel,
      PaymentSettingsModel,
    ].filter(Boolean);

    console.log(`Successfully loaded ${loadedModels.length} out of 7 models`);

    // Check if critical models are loaded
    if (!ContactModel || !ProductModel || !OrderModel) {
      console.warn(
        "⚠️ Some critical models failed to load, application may not function correctly"
      );
    }

    // Create mock data for development/fallback
    createMockData();

    return true;
  } catch (error) {
    console.error(
      `❌ MongoDB connection failed (Attempt ${retryCount + 1}/${
        maxRetries + 1
      }):`,
      error.message
    );
    console.error("Error stack:", error.stack);

    if (retryCount < maxRetries) {
      console.log(
        `Retrying connection in 5 seconds... (${retryCount + 1}/${maxRetries})`
      );
      // Wait 5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectDB(retryCount + 1, maxRetries);
    } else {
      console.error(
        "❌ All MongoDB connection attempts failed. Using fallback data."
      );
      console.log("Please verify:");
      console.log("- IP is whitelisted in Atlas (current IP must be allowed)");
      console.log(
        "- Connection string is correct (no spaces in username/password)"
      );
      console.log("- Database user exists and has correct permissions");
      console.log("- Network connectivity to MongoDB Atlas is available");

      // Create mock data for fallback
      createMockData();

      return false;
    }
  }
};

// Function to create mock data for fallback
const createMockData = () => {
  // Only create mock data if we're not connected to MongoDB
  if (mongoose.connection.readyState !== 1) {
    console.log("Creating mock data for fallback...");

    // Create mock schemas if needed
    if (!mongoose.models.Contact) {
      const contactSchema = new mongoose.Schema({
        name: String,
        email: String,
        message: String,
        createdAt: { type: Date, default: Date.now },
      });

      // Create the model
      const ContactModel = mongoose.model("Contact", contactSchema);

      // Add mock methods for fallback
      ContactModel.mockFind = () => {
        return Promise.resolve([
          {
            _id: "mock1",
            name: "John Doe",
            email: "john@example.com",
            message: "I'm interested in your furniture",
            createdAt: new Date(),
          },
          {
            _id: "mock2",
            name: "Jane Smith",
            email: "jane@example.com",
            message: "Do you deliver to my area?",
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
          },
        ]);
      };
    }

    if (!mongoose.models.Order) {
      const orderSchema = new mongoose.Schema({
        orderNumber: String,
        customer: {
          name: String,
          email: String,
          phone: String,
        },
        items: [
          {
            product: String,
            quantity: Number,
            price: Number,
          },
        ],
        total: Number,
        status: String,
        createdAt: { type: Date, default: Date.now },
      });

      // Create the model
      const OrderModel = mongoose.model("Order", orderSchema);

      // Add mock methods for fallback
      OrderModel.mockFind = () => {
        return Promise.resolve([
          {
            _id: "mock-order-1",
            orderNumber: "ORD-001",
            customer: {
              name: "John Doe",
              email: "john@example.com",
              phone: "1234567890",
            },
            items: [
              {
                product: "Sofa",
                quantity: 1,
                price: 12000,
              },
            ],
            total: 12000,
            status: "Delivered",
            createdAt: new Date(),
          },
          {
            _id: "mock-order-2",
            orderNumber: "ORD-002",
            customer: {
              name: "Jane Smith",
              email: "jane@example.com",
              phone: "9876543210",
            },
            items: [
              {
                product: "Chair",
                quantity: 2,
                price: 3000,
              },
              {
                product: "Table",
                quantity: 1,
                price: 8000,
              },
            ],
            total: 14000,
            status: "Processing",
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
          },
        ]);
      };
    }

    // Create User model if needed
    if (!mongoose.models.User) {
      const userSchema = new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        role: String,
        createdAt: { type: Date, default: Date.now },
      });

      // Create the model
      const UserModel = mongoose.model("User", userSchema);

      // Add mock methods for fallback
      UserModel.mockFindOne = () => {
        return Promise.resolve({
          _id: "mock-user-1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
          createdAt: new Date(),
        });
      };
    }

    console.log("Mock data schemas and methods created for fallback");
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

  // Health check endpoint with detailed information
  app.get("/api/health", (_req, res) => {
    // Get MongoDB connection status
    const mongoStatus = mongoose.connection.readyState;
    const mongoStatusText =
      {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
        99: "uninitialized",
      }[mongoStatus] || "unknown";

    // Get environment information
    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      BASE_URL: process.env.BASE_URL || "not set",
      MONGO_URI: process.env.MONGO_URI ? "set (hidden)" : "not set",
      JWT_SECRET: process.env.JWT_SECRET ? "set (hidden)" : "not set",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ? "set (hidden)" : "not set",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? "set (hidden)" : "not set",
      ADMIN_NAME: process.env.ADMIN_NAME ? "set (hidden)" : "not set",
    };

    // Get system information
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };

    res.json({
      status: "healthy",
      message: "Server is running",
      timestamp: new Date().toISOString(),
      staticPath: staticPath,
      database: {
        status: mongoStatus,
        statusText: mongoStatusText,
        connected: mongoStatus === 1,
      },
      environment,
      system: systemInfo,
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
    const { getAllMessages } = require("./server/controllers/adminMessages");
    const { getAllProducts } = require("./server/controllers/adminProducts");

    // API routes are now set up

    // Add auth route patch for logout to handle MongoDB connection issues
    app.get("/api/auth/logout", (_req, res) => {
      console.log("Using patched logout route to avoid MongoDB timeout");
      res
        .status(200)
        .json({ success: true, message: "Logged out successfully" });
    });

    // Add direct admin login route that bypasses MongoDB for reliability
    app.post("/api/auth/admin/direct-login", (req, res) => {
      try {
        console.log("Direct admin login attempt");
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: "Please provide email and password",
          });
        }

        // Get admin credentials from environment variables
        const ADMIN_EMAIL =
          process.env.ADMIN_EMAIL || "avinashmadhukar4@gmail.com";
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";
        const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";

        console.log("Checking admin credentials...");
        console.log("Expected admin email:", ADMIN_EMAIL);
        console.log("Provided email:", email);

        // Compare with environment variable credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          console.log("Admin credentials validated successfully");

          // Create a JWT token manually
          const token = jwt.sign(
            { id: "admin-user-id", role: "admin" },
            process.env.JWT_SECRET || "fallback_jwt_secret",
            { expiresIn: process.env.JWT_EXPIRE || "30d" }
          );

          // Return success response
          return res.status(200).json({
            success: true,
            token,
            user: {
              _id: "admin-user-id",
              name: ADMIN_NAME,
              email: ADMIN_EMAIL,
              role: "admin",
            },
          });
        } else {
          console.log("Invalid admin credentials provided");
          return res.status(401).json({
            success: false,
            message: "Invalid admin credentials",
          });
        }
      } catch (error) {
        console.error("Direct admin login error:", error);
        return res.status(500).json({
          success: false,
          message: "Server error during admin login",
        });
      }
    });

    // Mount API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/contact", contactRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/payment-settings", paymentSettingsRoutes);
    app.use("/api/payment-requests", paymentRequestsRoutes);

    // Import direct database access controllers
    const {
      getAllMessagesDirectDb,
    } = require("./server/controllers/directDbAdminMessages");
    const {
      getAllProductsDirectDb,
    } = require("./server/controllers/directDbAdminProducts");

    // Direct admin routes
    app.get("/admin/payment-requests", getAllPaymentRequests);
    app.get("/api/admin/payment-requests", getAllPaymentRequests);
    app.get("/admin/orders", getOrders);
    app.get("/api/admin/orders", getOrders);

    // Admin messages routes - try both regular and direct DB access
    app.get("/admin/messages", async (req, res, next) => {
      try {
        // First try direct DB access
        await getAllMessagesDirectDb(req, res);
      } catch (error) {
        console.error(
          "Direct DB access failed for messages, falling back to regular controller:",
          error
        );
        // Fall back to regular controller
        getAllMessages(req, res, next);
      }
    });
    app.get("/api/admin/messages", async (req, res, next) => {
      try {
        // First try direct DB access
        await getAllMessagesDirectDb(req, res);
      } catch (error) {
        console.error(
          "Direct DB access failed for messages, falling back to regular controller:",
          error
        );
        // Fall back to regular controller
        getAllMessages(req, res, next);
      }
    });

    // Admin products routes - try both regular and direct DB access
    app.get("/admin/products", async (req, res, next) => {
      try {
        // First try direct DB access
        await getAllProductsDirectDb(req, res);
      } catch (error) {
        console.error(
          "Direct DB access failed for products, falling back to regular controller:",
          error
        );
        // Fall back to regular controller
        getAllProducts(req, res, next);
      }
    });
    app.get("/api/admin/products", async (req, res, next) => {
      try {
        // First try direct DB access
        await getAllProductsDirectDb(req, res);
      } catch (error) {
        console.error(
          "Direct DB access failed for products, falling back to regular controller:",
          error
        );
        // Fall back to regular controller
        getAllProducts(req, res, next);
      }
    });

    // Direct contact form handlers
    app.post("/contact", contactController.createContact);
    app.post("/api/contact", contactController.createContact);
    app.post("/api/api/contact", contactController.createContact);

    // Add direct route for getting contacts
    const Contact = require("./server/models/Contact");

    // Direct route for contacts (mentioned in your error)
    app.get("/api/direct/contacts", async (_req, res) => {
      try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
          console.log("MongoDB not connected, returning mock contacts data");
          // Return mock data
          return res.json([
            {
              _id: "mock1",
              name: "John Doe",
              email: "john@example.com",
              message: "I'm interested in your furniture",
              createdAt: new Date(),
            },
            {
              _id: "mock2",
              name: "Jane Smith",
              email: "jane@example.com",
              message: "Do you deliver to my area?",
              createdAt: new Date(Date.now() - 86400000), // 1 day ago
            },
          ]);
        }

        // If connected, try to get real data
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);

        // Return mock data on error
        console.log("Returning mock contacts data due to error");
        res.json([
          {
            _id: "mock1",
            name: "John Doe",
            email: "john@example.com",
            message: "I'm interested in your furniture",
            createdAt: new Date(),
          },
          {
            _id: "mock2",
            name: "Jane Smith",
            email: "jane@example.com",
            message: "Do you deliver to my area?",
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
          },
        ]);
      }
    });

    // Direct route for admin messages is now handled by the adminMessages controller

    // DB test route with detailed information
    app.get("/api/db-test", async (_req, res) => {
      try {
        // Get connection status
        const connectionState = mongoose.connection.readyState;
        const connectionStates = {
          0: "disconnected",
          1: "connected",
          2: "connecting",
          3: "disconnecting",
          99: "uninitialized",
        };

        // Get models and collections
        const models = Object.keys(mongoose.models);
        const collections =
          mongoose.connection.readyState === 1
            ? Object.keys(mongoose.connection.collections)
            : [];

        // Get connection details
        const connectionDetails = {
          host: mongoose.connection.host || "not connected",
          port: mongoose.connection.port || "not connected",
          name: mongoose.connection.name || "not connected",
          readyState: connectionState,
          status: connectionStates[connectionState] || "unknown",
        };

        // Try to fetch a sample from each collection to verify database access
        const sampleData = {};
        if (mongoose.connection.readyState === 1) {
          try {
            // Try to get a sample contact
            if (mongoose.models.Contact) {
              const contactSample = await mongoose.models.Contact.findOne()
                .lean()
                .maxTimeMS(5000);
              sampleData.contact = contactSample
                ? { found: true, _id: contactSample._id }
                : { found: false };
            }

            // Try to get a sample product
            if (mongoose.models.Product) {
              const productSample = await mongoose.models.Product.findOne()
                .lean()
                .maxTimeMS(5000);
              sampleData.product = productSample
                ? { found: true, _id: productSample._id }
                : { found: false };
            }

            // Try to get a sample order
            if (mongoose.models.Order) {
              const orderSample = await mongoose.models.Order.findOne()
                .lean()
                .maxTimeMS(5000);
              sampleData.order = orderSample
                ? { found: true, _id: orderSample._id }
                : { found: false };
            }
          } catch (sampleError) {
            sampleData.error = sampleError.message;
          }
        }

        // Create response object
        const dbStatus = {
          connection: connectionDetails,
          models: models,
          collections: collections,
          sampleData: sampleData,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        };

        // Return status
        res.json(dbStatus);
      } catch (error) {
        console.error("Error testing database:", error);

        // Return basic status on error
        res.json({
          error: error.message,
          connection: {
            readyState: mongoose.connection.readyState,
            status:
              mongoose.connection.readyState === 1
                ? "connected"
                : "disconnected",
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Direct test route for contacts collection
    app.get("/api/test/contacts", async (_req, res) => {
      try {
        console.log("Testing direct access to contacts collection");

        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
          return res.json({
            success: false,
            message: "MongoDB not connected",
            connectionState: mongoose.connection.readyState,
          });
        }

        // Try to get contacts directly
        const Contact =
          mongoose.models.Contact || require("./server/models/Contact");
        const contacts = await Contact.find().limit(5).lean().maxTimeMS(10000);

        return res.json({
          success: true,
          count: contacts.length,
          data: contacts,
          connectionState: mongoose.connection.readyState,
        });
      } catch (error) {
        console.error("Error in direct contacts test:", error);
        return res.json({
          success: false,
          error: error.message,
          stack: error.stack,
          connectionState: mongoose.connection.readyState,
        });
      }
    });

    // Direct test route for products collection
    app.get("/api/test/products", async (_req, res) => {
      try {
        console.log("Testing direct access to products collection");

        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
          return res.json({
            success: false,
            message: "MongoDB not connected",
            connectionState: mongoose.connection.readyState,
          });
        }

        // Try to get products directly
        const Product =
          mongoose.models.Product || require("./server/models/Product");
        const products = await Product.find().limit(5).lean().maxTimeMS(10000);

        return res.json({
          success: true,
          count: products.length,
          data: products,
          connectionState: mongoose.connection.readyState,
        });
      } catch (error) {
        console.error("Error in direct products test:", error);
        return res.json({
          success: false,
          error: error.message,
          stack: error.stack,
          connectionState: mongoose.connection.readyState,
        });
      }
    });

    // Direct database access test route
    app.get("/api/test/direct-db", async (_req, res) => {
      try {
        console.log("Testing direct database access");

        // Check if we have a global database reference
        if (!global.mongoDb) {
          console.log(
            "No global database reference available, trying to get one"
          );

          // Check MongoDB connection
          if (mongoose.connection.readyState !== 1) {
            return res.json({
              success: false,
              message: "MongoDB not connected",
              connectionState: mongoose.connection.readyState,
            });
          }

          // Try to get database reference
          global.mongoDb = mongoose.connection.db;
        }

        // Check if we have a database reference now
        if (!global.mongoDb) {
          return res.json({
            success: false,
            message: "Failed to get database reference",
            connectionState: mongoose.connection.readyState,
          });
        }

        // List all collections
        const collections = await global.mongoDb.listCollections().toArray();

        // Try to get some data from each collection
        const collectionData = {};
        for (const collection of collections) {
          try {
            const data = await global.mongoDb
              .collection(collection.name)
              .find()
              .limit(1)
              .toArray();

            collectionData[collection.name] = {
              count: data.length,
              sample: data.length > 0 ? { _id: data[0]._id.toString() } : null,
            };
          } catch (collectionError) {
            collectionData[collection.name] = {
              error: collectionError.message,
            };
          }
        }

        return res.json({
          success: true,
          message: "Direct database access successful",
          collections: collections.map((c) => c.name),
          collectionData,
          connectionState: mongoose.connection.readyState,
        });
      } catch (error) {
        console.error("Error in direct database access test:", error);
        return res.json({
          success: false,
          error: error.message,
          stack: error.stack,
          connectionState: mongoose.connection.readyState,
        });
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
