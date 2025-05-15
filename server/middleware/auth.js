const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  // Log the request for debugging
  console.log(`🔍 Auth check for ${req.method} ${req.originalUrl}`);
  console.log("Authorization header:", req.headers.authorization);
  console.log("Cookies:", req.cookies);

  // Get token from header, cookies, or query string
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token from Authorization header:", token);
  } else if (req.cookies?.adminToken) {
    token = req.cookies.adminToken;
    console.log("Token from cookies:", token);
  } else if (req.query.token) {
    token = req.query.token;
    console.log("Token from query string:", token);
  }

  // Special handling for development and testing
  if (process.env.NODE_ENV !== "production") {
    console.log("🔑 Development mode - Bypassing strict auth checks");
    
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

  // Check for token
  if (!token) {
    console.log("No token found");
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  try {
    // Verify token
    console.log("Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded:", decoded);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("User not found for token");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is admin for admin routes
    if (req.originalUrl.includes('/admin') && user.role !== 'admin') {
      console.log("Non-admin user attempting to access admin route");
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    console.log("Authentication successful for user:", user.email);
    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log("🔒 Checking role authorization");
    console.log("Required roles:", roles);
    console.log("User role:", req.user?.role);

    // For development testing with admin user
    if (process.env.NODE_ENV !== "production") {
      console.log("🔑 Development mode: Bypassing role check");
      return next();
    }

    if (!req.user || !roles.includes(req.user.role)) {
      console.log("Unauthorized role access attempt");
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    console.log("Role authorization successful");
    next();
  };
};
