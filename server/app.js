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
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://furniture-q3nb.onrender.com",
    "https://furniture-q3nb.onrender.com"
  ],
  credentials: true
}));

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Set static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 