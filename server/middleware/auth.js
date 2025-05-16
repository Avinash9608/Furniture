const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    console.log("🔍 Auth check for", req.method, req.originalUrl);
    
    let token;
    let decoded;
    
    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token from Authorization header:", token);
    }
    // Check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log("Token from cookies:", token);
    }
    // Check body for adminToken
    else if (req.body && req.body.adminToken) {
      token = req.body.adminToken;
      console.log("Token from request body:", token);
    }

    // If no token found
    if (!token) {
      console.log("❌ No token found");
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route"
      });
    }

    try {
      // Verify token
      console.log("Verifying token...");
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully:", decoded);

      // Find user with timeout handling
      const user = await Promise.race([
        User.findById(decoded.id).select("-password").exec(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database operation timed out")), 5000)
        )
      ]);

      if (!user) {
        console.log("❌ No user found with decoded ID");
        return res.status(401).json({
          success: false,
          message: "User no longer exists"
        });
      }

      // Add user to request object
      req.user = user;
      console.log("✅ User authenticated:", user._id);
      next();
    } catch (error) {
      if (error.message === "Database operation timed out") {
        console.log("⏱️ Database operation timed out, proceeding with token data");
        // If DB times out, proceed with just the token data
        req.user = {
          _id: decoded.id,
          role: decoded.role
        };
        return next();
      }
      
      console.error("Auth middleware error:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route"
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in authentication"
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};
