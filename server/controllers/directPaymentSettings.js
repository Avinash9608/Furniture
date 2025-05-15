const { MongoClient, ObjectId } = require("mongodb");
const PaymentSettings = require("../models/PaymentSettings");

// Collection name
const COLLECTION = "paymentsettings";

// Default payment settings
const DEFAULT_PAYMENT_SETTINGS = {
  accountNumber: "42585534295",
  ifscCode: "SBIN0030442",
  accountHolder: "Avinash Kumar",
  bankName: "State Bank of India",
  branchName: "",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper function to get MongoDB client
const getMongoClient = async () => {
  try {
    // Get MongoDB URI from environment variables
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error("MongoDB URI not found in environment variables");
    }
    
    // Create a new client with extended timeout settings
    const client = new MongoClient(uri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000,
    });
    
    // Connect to MongoDB
    await client.connect();
    
    // Get database name from URI
    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);
    
    return { client, db };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

// @desc    Get payment settings with direct MongoDB access
// @route   GET /api/direct/payment-settings
// @access  Public
exports.getPaymentSettings = async (req, res) => {
  let client;
  
  try {
    console.log("Getting payment settings with direct MongoDB access");
    
    // Get MongoDB client
    const { client: mongoClient, db } = await getMongoClient();
    client = mongoClient;
    
    // Get collection
    const collection = db.collection(COLLECTION);
    
    // Find active payment settings
    let paymentSettings = await collection.findOne({ isActive: true });
    
    // If no active settings found, try to find any settings
    if (!paymentSettings) {
      console.log("No active payment settings found, looking for any settings");
      paymentSettings = await collection.findOne({});
    }
    
    // If still no settings found, create default settings
    if (!paymentSettings) {
      console.log("No payment settings found, creating default settings");
      
      // Insert default payment settings
      const result = await collection.insertOne(DEFAULT_PAYMENT_SETTINGS);
      
      if (!result.acknowledged || !result.insertedId) {
        throw new Error("Failed to insert default payment settings");
      }
      
      // Get the inserted document
      paymentSettings = await collection.findOne({ _id: result.insertedId });
      
      if (!paymentSettings) {
        throw new Error("Failed to retrieve inserted payment settings");
      }
      
      console.log("Default payment settings created:", paymentSettings);
    }
    
    // Return payment settings
    return res.status(200).json({
      success: true,
      data: paymentSettings,
      source: "direct_database",
    });
  } catch (error) {
    console.error("Error getting payment settings with direct MongoDB access:", error);
    
    // Try fallback with Mongoose
    try {
      console.log("Trying fallback with Mongoose");
      
      // Get payment settings with Mongoose
      let paymentSettings = await PaymentSettings.findOne({ isActive: true });
      
      // If no active settings found, try to find any settings
      if (!paymentSettings) {
        console.log("No active payment settings found, looking for any settings");
        paymentSettings = await PaymentSettings.findOne({});
      }
      
      // If still no settings found, create default settings
      if (!paymentSettings) {
        console.log("No payment settings found, creating default settings");
        paymentSettings = await PaymentSettings.create(DEFAULT_PAYMENT_SETTINGS);
        console.log("Default payment settings created:", paymentSettings);
      }
      
      // Return payment settings
      return res.status(200).json({
        success: true,
        data: paymentSettings,
        source: "mongoose_fallback",
      });
    } catch (fallbackError) {
      console.error("Error with Mongoose fallback:", fallbackError);
      
      // Return default payment settings as last resort
      return res.status(200).json({
        success: true,
        data: DEFAULT_PAYMENT_SETTINGS,
        source: "default_fallback",
        message: "Using default payment settings due to database error",
      });
    }
  } finally {
    // Close MongoDB client if it exists
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

// @desc    Get all payment settings with direct MongoDB access
// @route   GET /api/direct/payment-settings/all
// @access  Private/Admin
exports.getAllPaymentSettings = async (req, res) => {
  let client;
  
  try {
    console.log("Getting all payment settings with direct MongoDB access");
    
    // Get MongoDB client
    const { client: mongoClient, db } = await getMongoClient();
    client = mongoClient;
    
    // Get collection
    const collection = db.collection(COLLECTION);
    
    // Find all payment settings
    const paymentSettings = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    // If no settings found, create default settings
    if (paymentSettings.length === 0) {
      console.log("No payment settings found, creating default settings");
      
      // Insert default payment settings
      const result = await collection.insertOne(DEFAULT_PAYMENT_SETTINGS);
      
      if (!result.acknowledged || !result.insertedId) {
        throw new Error("Failed to insert default payment settings");
      }
      
      // Get the inserted document
      const defaultSettings = await collection.findOne({ _id: result.insertedId });
      
      if (!defaultSettings) {
        throw new Error("Failed to retrieve inserted payment settings");
      }
      
      console.log("Default payment settings created:", defaultSettings);
      
      // Return default settings
      return res.status(200).json({
        success: true,
        count: 1,
        data: [defaultSettings],
        source: "direct_database",
      });
    }
    
    // Return payment settings
    return res.status(200).json({
      success: true,
      count: paymentSettings.length,
      data: paymentSettings,
      source: "direct_database",
    });
  } catch (error) {
    console.error("Error getting all payment settings with direct MongoDB access:", error);
    
    // Try fallback with Mongoose
    try {
      console.log("Trying fallback with Mongoose");
      
      // Get all payment settings with Mongoose
      let paymentSettings = await PaymentSettings.find().sort({ createdAt: -1 });
      
      // If no settings found, create default settings
      if (paymentSettings.length === 0) {
        console.log("No payment settings found, creating default settings");
        const defaultSettings = await PaymentSettings.create(DEFAULT_PAYMENT_SETTINGS);
        console.log("Default payment settings created:", defaultSettings);
        paymentSettings = [defaultSettings];
      }
      
      // Return payment settings
      return res.status(200).json({
        success: true,
        count: paymentSettings.length,
        data: paymentSettings,
        source: "mongoose_fallback",
      });
    } catch (fallbackError) {
      console.error("Error with Mongoose fallback:", fallbackError);
      
      // Return default payment settings as last resort
      return res.status(200).json({
        success: true,
        count: 1,
        data: [DEFAULT_PAYMENT_SETTINGS],
        source: "default_fallback",
        message: "Using default payment settings due to database error",
      });
    }
  } finally {
    // Close MongoDB client if it exists
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
