const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  // Log the request for debugging
  console.log(`🔍 Auth check for ${req.method} ${req.originalUrl}`);
  console.log("Authorization header:", req.headers.authorization);
  console.log("Cookies:", req.cookies);

  try {
    // Get token from multiple sources
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

    // Development mode bypass
    if (process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true") {
      console.log("🔑 Development mode - Bypassing auth checks");
      req.user = { role: "admin", _id: "dev-admin-id", email: "dev@admin.com" };
      return next();
    }

    // Check for token
    if (!token) {
      console.log("No token found");
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

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
        message: "User not found. Please log in again.",
      });
    }

    // Check if user is admin for admin routes
    const isAdminRoute = req.originalUrl.includes('/admin') || 
                        req.originalUrl.includes('/api/admin');
    
    if (isAdminRoute && user.role !== 'admin') {
      console.log("Non-admin user attempting to access admin route");
      return res.status(403).json({
        success: false,
        message: "Admin access required. Please log in as an administrator.",
      });
    }

    // Add user and token info to request
    req.user = user;
    req.token = token;
    console.log("Authentication successful for user:", user.email);
    
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    
    // Handle different types of errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Authentication error. Please try again.",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log("🔒 Checking role authorization");
    console.log("Required roles:", roles);
    console.log("User role:", req.user?.role);

    // Development mode bypass
    if (process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true") {
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
