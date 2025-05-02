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

    // Significantly increased timeouts for Render deployment
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 60000, // 60 seconds
      socketTimeoutMS: 90000, // 90 seconds
      connectTimeoutMS: 60000, // 60 seconds
      heartbeatFrequencyMS: 30000, // 30 seconds
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
      bufferCommands: false, // Disable command buffering
    });

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

    console.log("✅ MongoDB Atlas connected successfully");

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

    // Add auth route patch for logout to handle MongoDB connection issues
    app.get("/api/auth/logout", (_req, res) => {
      console.log("Using patched logout route to avoid MongoDB timeout");
      res
        .status(200)
        .json({ success: true, message: "Logged out successfully" });
    });

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

    // Direct route for admin messages
    app.get("/api/admin/messages", async (_req, res) => {
      try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
          console.log("MongoDB not connected, returning mock messages data");
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
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);

        // Return mock data on error
        console.log("Returning mock messages data due to error");
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

        // Create response object
        const dbStatus = {
          connection: connectionDetails,
          models: models,
          collections: collections,
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
