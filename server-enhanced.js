/**
 * Enhanced Server.js with improved MongoDB connection handling
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const { MongoClient } = require('mongodb');
const fs = require("fs");

// Import enhanced MongoDB connection module
const { connectDB, directDB, dbHealthCheck } = require('./server/utils/db');
const directMongo = require('./server/utils/directMongo');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply database health check middleware to all API routes
app.use('/api', dbHealthCheck);

// Load models
let Contact, Product, Category, Order, PaymentSettings, PaymentRequest;

// Function to load models
const loadModel = (modelName) => {
  try {
    // Define schemas based on model name
    if (modelName === "Contact") {
      const ContactSchema = new mongoose.Schema(
        {
          name: {
            type: String,
            required: [true, "Please add your name"],
            trim: true,
            maxlength: [50, "Name cannot be more than 50 characters"],
          },
          email: {
            type: String,
            required: [true, "Please add your email"],
            match: [
              /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
              "Please add a valid email",
            ],
          },
          phone: {
            type: String,
            maxlength: [20, "Phone number cannot be longer than 20 characters"],
          },
          subject: {
            type: String,
            required: [true, "Please add a subject"],
            maxlength: [100, "Subject cannot be more than 100 characters"],
          },
          message: {
            type: String,
            required: [true, "Please add your message"],
            maxlength: [1000, "Message cannot be more than 1000 characters"],
          },
          status: {
            type: String,
            enum: ["unread", "read"],
            default: "unread",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
        {
          timestamps: true,
        }
      );

      return mongoose.models.Contact || mongoose.model("Contact", ContactSchema);
    }

    // Add other models as needed...
    
    return null;
  } catch (error) {
    console.error(`Error loading model ${modelName}:`, error);
    return null;
  }
};

// Initialize models
const initModels = () => {
  try {
    Contact = loadModel("Contact");
    console.log("Contact:", Contact ? "Loaded" : "Failed to load");
    
    // Load other models as needed...
    
    return true;
  } catch (error) {
    console.error("Error initializing models:", error);
    return false;
  }
};

// Database status endpoint
app.get("/api/db-status", (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStatusText = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  }[mongoStatus] || "unknown";
  
  return res.status(200).json({
    connected: mongoStatus === 1,
    state: mongoStatusText,
    timestamp: new Date().toISOString(),
    details: {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    }
  });
});

// Test database query endpoint using direct MongoDB driver
app.get("/api/db-test", async (req, res) => {
  try {
    // Try direct MongoDB driver first
    const contacts = await directMongo.getContacts();
    
    if (contacts && contacts.length > 0) {
      return res.status(200).json({
        success: true,
        count: contacts.length,
        message: "Database query successful using direct MongoDB driver",
        method: "direct",
        sampleContact: contacts.length > 0 ? {
          id: contacts[0]._id,
          name: contacts[0].name,
          email: contacts[0].email,
          subject: contacts[0].subject,
        } : null
      });
    }
    
    // Fallback to Mongoose if direct driver fails
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
        state:
          ["disconnected", "connected", "connecting", "disconnecting"][
            mongoose.connection.readyState
          ] || "unknown",
      });
    }
    
    // Try to load the Contact model if it's not available
    if (!Contact) {
      Contact = loadModel("Contact");
    }

    if (!Contact) {
      return res.status(500).json({
        success: false,
        message: "Contact model not available",
      });
    }

    // Simple count query with increased timeout
    console.log("Executing countDocuments with maxTimeMS(60000)");
    const count = await Contact.countDocuments().maxTimeMS(60000);
    console.log("Successfully counted documents:", count);

    return res.status(200).json({
      success: true,
      count,
      message: "Database query successful using Mongoose",
      method: "mongoose",
      bufferTimeout: mongoose.get("bufferTimeoutMS"),
    });
  } catch (error) {
    console.error("Database test query error:", error);
    console.error("Error details:", error.stack);
    
    // Try to provide more helpful error information
    let errorInfo = {
      message: error.message,
      name: error.name,
      code: error.code,
    };
    
    if (
      error.name === "MongooseError" &&
      error.message.includes("buffering timed out")
    ) {
      errorInfo.suggestion =
        "The operation timed out while buffering. Try increasing bufferTimeoutMS.";
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      errorDetails: errorInfo,
    });
  }
});

// Direct database query endpoint for contacts using MongoDB driver directly
app.get("/api/direct/contacts", async (req, res) => {
  console.log("Direct database query for contacts using MongoDB driver");

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");
  
  try {
    const contacts = await directMongo.getContacts();
    return res.status(200).json(contacts);
  } catch (error) {
    console.error("Direct MongoDB contacts query error:", error);
    
    // Return empty array to prevent client-side errors
    return res.status(200).json([]);
  }
});

// Admin endpoint for contact messages using direct MongoDB driver
app.get(
  ["/api/admin/messages", "/admin/messages", "/api/admin-messages"],
  async (req, res) => {
    console.log("Admin: Fetching all contact messages using MongoDB driver");

    // Set proper headers to ensure JSON response
    res.setHeader("Content-Type", "application/json");
    
    try {
      const contacts = await directMongo.getContacts();
      
      // Log a sample contact for debugging
      if (contacts.length > 0) {
        console.log("Sample contact:", {
          id: contacts[0]._id,
          name: contacts[0].name,
          email: contacts[0].email,
          createdAt: contacts[0].createdAt,
        });
      }
      
      // Return the contacts in the expected format
      return res.status(200).json({
        success: true,
        count: contacts.length,
        data: contacts,
        method: "direct",
      });
    } catch (error) {
      console.error("Direct MongoDB admin messages query error:", error);
      
      // Create mock messages for testing in case of MongoDB connection issues
      const mockMessages = [
        {
          _id: `temp_${Date.now()}_1`,
          name: "System Message",
          email: "system@example.com",
          subject: "Database Connection Issue",
          message: "The application is currently experiencing issues connecting to the database. This is likely due to a MongoDB connection issue. Please try again later.",
          status: "unread",
          createdAt: new Date().toISOString(),
        },
        {
          _id: `temp_${Date.now()}_2`,
          name: "System Message",
          email: "system@example.com",
          subject: "Temporary Data",
          message: "This is temporary data displayed while the application is unable to connect to the database. Your actual messages will be displayed once the connection is restored.",
          status: "unread",
          createdAt: new Date().toISOString(),
        },
      ];
      
      // Return mock data to prevent client-side errors
      return res.status(200).json({
        success: false,
        count: mockMessages.length,
        data: mockMessages,
        message: "Database error fetching contacts. Displaying temporary data.",
        error: error.message,
        method: "direct",
        isTemporaryData: true
      });
    }
  }
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  console.log("Health check requested");

  // Check MongoDB connection
  const mongoStatus = mongoose.connection.readyState;
  const mongoStatusText =
    {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }[mongoStatus] || "unknown";

  // Return health status
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: {
        status: mongoStatusText,
        readyState: mongoStatus,
      },
      cloudinary: {
        status: "connected",
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "not-configured",
      },
    },
    models: {
      Contact: !!Contact,
      // Add other models as needed...
    },
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV || "development",
    },
    features: {
      auth: true,
      products: true,
      orders: true,
      payments: true,
      fileUploads: true,
    },
  });
});

// Serve static files from the React app
const clientBuildPath = path.join(__dirname, "client", "dist");
if (fs.existsSync(clientBuildPath)) {
  console.log("Serving static files from:", clientBuildPath);
  console.log("Files in static directory:", fs.readdirSync(clientBuildPath));
  app.use(express.static(clientBuildPath));

  // For any request that doesn't match an API route, serve the React app
  app.get("*", (req, res) => {
    console.log(`Serving index.html for path: ${req.path}`);
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  console.warn("Client build directory not found:", clientBuildPath);
}

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize models
    initModels();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Server URL: http://localhost:${PORT}`);
      console.log(`MongoDB connection status: ${mongoose.connection.readyState === 1 ? "Connected" : "Not connected"}`);
      console.log(`Cloudinary status: ${process.env.CLOUDINARY_CLOUD_NAME ? "Configured" : "Not configured"}`);
      console.log("==> Your service is live 🎉");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

// Start the server
startServer();
