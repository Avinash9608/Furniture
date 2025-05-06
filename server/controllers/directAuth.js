/**
 * Direct Auth Controller
 * 
 * This controller provides robust authentication functionality with direct MongoDB access
 * and multiple fallback mechanisms to ensure it works even when Mongoose has connection issues.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const User = require("../models/User");

// Helper function to get MongoDB connection
async function getMongoClient() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI not defined");
  }
  
  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 5000, // Short timeout to fail fast
    socketTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  };
  
  const client = new MongoClient(uri, options);
  await client.connect();
  
  // Get database name from connection string
  const dbName = uri.split("/").pop().split("?")[0];
  const db = client.db(dbName);
  
  return { client, db };
}

// Helper function to generate JWT token
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
}

// Helper function to hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// @desc    Register a user with robust fallback
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  let client = null;
  
  try {
    const { name, email, password, phone, address } = req.body;
    
    console.log("Registration request received for:", email);
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }
    
    // Try using Mongoose first
    try {
      console.log("Trying to register user using Mongoose");
      
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
      
      console.log("User registered successfully using Mongoose:", user._id);
      
      // Return token
      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (mongooseError) {
      console.error("Mongoose registration error:", mongooseError);
      console.log("Falling back to direct MongoDB connection");
      
      // If Mongoose fails, try direct MongoDB connection
      try {
        // Get MongoDB connection
        const connection = await getMongoClient();
        client = connection.client;
        const db = connection.db;
        
        // Get users collection
        const usersCollection = db.collection("users");
        
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "User already exists with this email",
          });
        }
        
        // Hash password
        const hashedPassword = await hashPassword(password);
        
        // Create user document
        const newUser = {
          name,
          email,
          password: hashedPassword,
          phone: phone || "",
          address: address || "",
          role: "user",
          createdAt: new Date(),
        };
        
        // Insert user
        const result = await usersCollection.insertOne(newUser);
        
        if (!result.insertedId) {
          throw new Error("Failed to insert user");
        }
        
        // Get the inserted user
        const insertedUser = await usersCollection.findOne({ _id: result.insertedId });
        
        // Generate JWT token
        const token = generateToken(insertedUser._id.toString());
        
        console.log("User registered successfully using direct MongoDB:", insertedUser._id);
        
        // Return token
        return res.status(201).json({
          success: true,
          token,
          user: {
            _id: insertedUser._id,
            name: insertedUser.name,
            email: insertedUser.email,
            role: insertedUser.role,
          },
        });
      } catch (directDbError) {
        console.error("Direct MongoDB registration error:", directDbError);
        throw directDbError; // Re-throw to be caught by outer catch
      }
    }
  } catch (err) {
    console.error("Registration error:", err);
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: err.message || "Server error during registration",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  } finally {
    // Close MongoDB connection if it was opened
    if (client) {
      try {
        await client.close();
        console.log("MongoDB connection closed");
      } catch (closeError) {
        console.error("Error closing MongoDB connection:", closeError);
      }
    }
  }
};

// @desc    Login user with robust fallback
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  let client = null;
  
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }
    
    // Try using Mongoose first
    try {
      console.log("Trying to login user using Mongoose");
      
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
      
      console.log("User logged in successfully using Mongoose:", user._id);
      
      return res.status(200).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (mongooseError) {
      console.error("Mongoose login error:", mongooseError);
      console.log("Falling back to direct MongoDB connection");
      
      // If Mongoose fails, try direct MongoDB connection
      try {
        // Get MongoDB connection
        const connection = await getMongoClient();
        client = connection.client;
        const db = connection.db;
        
        // Get users collection
        const usersCollection = db.collection("users");
        
        // Find user
        const user = await usersCollection.findOne({ email });
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }
        
        // Generate token
        const token = generateToken(user._id.toString());
        
        console.log("User logged in successfully using direct MongoDB:", user._id);
        
        return res.status(200).json({
          success: true,
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || "user",
          },
        });
      } catch (directDbError) {
        console.error("Direct MongoDB login error:", directDbError);
        throw directDbError; // Re-throw to be caught by outer catch
      }
    }
  } catch (err) {
    console.error("Login error:", err);
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: err.message || "Server error during login",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  } finally {
    // Close MongoDB connection if it was opened
    if (client) {
      try {
        await client.close();
        console.log("MongoDB connection closed");
      } catch (closeError) {
        console.error("Error closing MongoDB connection:", closeError);
      }
    }
  }
};
