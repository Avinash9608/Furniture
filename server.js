// Load environment variables
require("dotenv").config();

// Import required modules
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");

// Create Express app
const app = express();

// Import routes from server directory
const routes = require("./server/routes");

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    console.log("MongoDB URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Use routes from server
app.use("/api", routes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/dist")));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
