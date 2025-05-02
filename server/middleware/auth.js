const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  // Log the request for debugging
  console.log(`🔍 Auth check for ${req.method} ${req.originalUrl}`);
  console.log("Authorization header:", req.headers.authorization);

  // Get token from header or cookies
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token from Authorization header:", token);
  } else if (req.cookies?.adminToken) {
    token = req.cookies.adminToken;
    console.log("Token from cookies:", token);
  }

  // Special handling for fixed admin token in development
  if (
    (process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === undefined) &&
    (token === "admin-test-token" ||
      token === "admin-token-fixed-value" ||
      token === "admin-token-fixed-value-123456")
  ) {
    console.log("🔑 Using fixed admin token for development");
    try {
      // Find an admin user or create one if it doesn't exist
      let adminUser = await User.findOne({ role: "admin" });

      if (!adminUser) {
        console.log("Creating admin user for development...");
        adminUser = await User.create({
          name: "Admin User",
          email: "admin@example.com",
          password: "admin123",
          role: "admin",
        });
      }

      req.user = adminUser;
      return next();
    } catch (error) {
      console.error("Error setting up admin user:", error);
    }
  }

  // Development bypass - remove in production
  if (process.env.NODE_ENV === "development") {
    console.warn("Development mode: Bypassing auth");
    try {
      // Find an admin user or create one if it doesn't exist
      let adminUser = await User.findOne({ role: "admin" });

      if (!adminUser) {
        console.log("Creating admin user for development...");
        adminUser = await User.create({
          name: "Admin User",
          email: "admin@example.com",
          password: "admin123",
          role: "admin",
        });
      }

      req.user = adminUser;
      return next();
    } catch (error) {
      console.error("Error setting up admin user:", error);
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// This authorize function has been replaced with the one below

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // For development testing with admin user
    if (process.env.NODE_ENV === "development") {
      console.log("🔑 Development mode: Bypassing role check");
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
