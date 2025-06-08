const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Database Connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log("Connecting to MongoDB...");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://furniture-q3nb.onrender.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// File Upload Configuration
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "uploads");
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
}

// Serve static files
// app.use(
//   "/uploads",
//   express.static(uploadsDir, {
//     setHeaders: (res) => {
//       res.set("Access-Control-Allow-Origin", "*");
//       res.set("Cache-Control", "public, max-age=31536000");
//     },
//   })
// );

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// API Routes
const apiRoutes = [
  { path: "/api/products", router: require("./routes/products") },
  { path: "/api/categories", router: require("./routes/categories") },
  { path: "/api/orders", router: require("./routes/orders") },
  { path: "/api/users", router: require("./routes/users") },
  { path: "/api/auth", router: require("./routes/auth") },
  {
    path: "/api/payment-settings",
    router: require("./routes/paymentSettings"),
  },
  {
    path: "/api/payment-requests",
    router: require("./routes/paymentRequests"),
  },
  { path: "/api/contact", router: require("./routes/contact") },
];

apiRoutes.forEach((route) => {
  app.use(route.path, route.router);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: "File upload error",
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Production Configuration
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/dist");

  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });

    console.log("Serving React app from:", clientBuildPath);
  } else {
    console.error("Client build directory not found:", clientBuildPath);
  }
}

// Start Server
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5001;
  const server = app.listen(PORT, () => {
    console.log(`
      Server running in ${process.env.NODE_ENV} mode
      Listening on port ${PORT}
      Database: ${
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
      }
    `);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log("Server and database connections closed");
        process.exit(0);
      });
    });
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

module.exports = app;
