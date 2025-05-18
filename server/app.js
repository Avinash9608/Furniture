const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error");

// Load env vars
require("dotenv").config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://furniture-q3nb.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Test route for image serving
app.get("/test-image/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, "uploads", filename);

  console.log("Test image request for:", filename);
  console.log("Looking for file at:", imagePath);

  if (fs.existsSync(imagePath)) {
    console.log("File exists, sending...");
    res.sendFile(imagePath);
  } else {
    console.log("File not found");
    res.status(404).send("Image not found");
  }
});

// Serve static files from uploads directory
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Cache-Control", "public, max-age=3600");
    next();
  },
  express.static(path.join(__dirname, "uploads"), {
    fallthrough: false, // Return 404 if file doesn't exist
    extensions: ["jpg", "jpeg", "png"], // Only allow image files
    index: false, // Disable directory listing
    maxAge: "1h", // Cache for 1 hour
  })
);

// Mount routers
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/payment-settings", require("./routes/paymentSettings"));
app.use("/api/payment-requests", require("./routes/paymentRequests"));
app.use("/api/contact", require("./routes/contact"));

// For direct access without /api prefix
app.use("/products", require("./routes/products"));
app.use("/categories", require("./routes/categories"));
app.use("/orders", require("./routes/orders"));
app.use("/users", require("./routes/users"));
app.use("/auth", require("./routes/auth"));
app.use("/payment-settings", require("./routes/paymentSettings"));
app.use("/payment-requests", require("./routes/paymentRequests"));
app.use("/contact", require("./routes/contact"));

// Error handler
app.use(errorHandler);

// Create uploads directory if it doesn't exist
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
}

// Handle production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // Handle SPA
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
  });
}

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
