const express = require("express");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Force production mode for Render
process.env.NODE_ENV = "production";

// Create Express app
const app = express();

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
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      environment: process.env.NODE_ENV,
      staticPath: staticPath,
      timestamp: new Date().toISOString(),
    });
  });

  // Debug endpoint
  app.get("/api/debug", (req, res) => {
    const fileStructure = {
      environment: process.env.NODE_ENV,
      currentDirectory: __dirname,
      staticPath: staticPath,
      availableFiles: fs.readdirSync(__dirname),
      staticFiles: fs.existsSync(staticPath) ? fs.readdirSync(staticPath) : [],
    };
    res.json(fileStructure);
  });

  // API routes - redirect to server/index.js
  app.use("/api", (req, res) => {
    console.log(`API request: ${req.method} ${req.url}`);

    // Import the server app
    const serverApp = require("./server/index.js");

    // Forward the request to the server app
    serverApp(req, res);
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
  });
}
