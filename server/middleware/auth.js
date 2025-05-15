const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  // Log the request for debugging
  console.log(`🔍 Auth check for ${req.method} ${req.originalUrl}`);
  console.log("Authorization header:", req.headers.authorization);
  console.log("Cookies:", req.cookies);
  console.log("Request body adminToken:", req.body?.adminToken);

  try {
    // Get token from multiple sources
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token from Authorization header:", token);
    } else if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
      console.log("Token from cookies:", token);
    } else if (req.body?.adminToken) {
      token = req.body.adminToken;
      console.log("Token from request body:", token);
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
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully:", decoded);
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      
      // Clear invalid tokens from cookies
      res.clearCookie('adminToken');
      
      return res.status(401).json({
        success: false,
        message: jwtError.name === 'TokenExpiredError' 
          ? "Session expired. Please log in again."
          : "Invalid token. Please log in again.",
      });
    }

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
    
    console.log("Route check:", {
      path: req.originalUrl,
      isAdminRoute,
      userRole: user.role,
      isAdmin: user.role === 'admin'
    });

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
    console.log("Authentication successful for user:", {
      email: user.email,
      role: user.role,
      id: user._id
    });
    
    // Set a new cookie with the verified token and extended expiration
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Send token in response header for client-side storage
    res.setHeader('X-Auth-Token', token);
    
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    
    return res.status(500).json({
      success: false,
      message: "Authentication error. Please try again.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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

    if (!req.user) {
      console.log("No user found in request");
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    if (!roles.includes(req.user.role)) {
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
