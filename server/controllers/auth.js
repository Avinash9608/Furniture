const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      phone,
      address,
    });

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Return token
    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Admin login request received:", { email });

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Get admin credentials from environment variables with fallbacks
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "avinashmadhukar4@gmail.com";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";
    const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";

    console.log("Checking admin credentials...");
    console.log("Expected admin email:", ADMIN_EMAIL);
    console.log("Provided email:", email);
    console.log("Email match:", email === ADMIN_EMAIL ? "Yes" : "No");
    // Don't log actual password comparison for security

    // Compare with environment variable credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log("Admin credentials validated successfully");
    } else {
      console.log("Invalid admin credentials provided");
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Find or create admin user
    let user = await User.findOne({ email, role: "admin" });

    if (!user) {
      // Create admin user if it doesn't exist
      user = await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // Will be hashed by the pre-save hook
        role: "admin",
      });
      console.log("Created new admin user:", user.email);
    }

    // Generate token
    const token = user.getSignedJwtToken();

    // Set cookie for admin token
    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") {
      options.secure = true;
    }

    res
      .status(200)
      .cookie("adminToken", token, options)
      .json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie("adminToken", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};
