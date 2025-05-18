const { ObjectId } = require("mongodb");
const { getCollection, findOneDocument, insertDocument } = require("../utils/directDbAccess");

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

// @desc    Get payment settings with direct MongoDB access
// @route   GET /api/direct/payment-settings
// @access  Public
exports.getPaymentSettings = async (req, res) => {
  try {
    console.log("Getting payment settings with direct MongoDB access");
    
    // Find active payment settings
    let paymentSettings = await findOneDocument(COLLECTION, { isActive: true });
    
    // If no active settings found, try to find any settings
    if (!paymentSettings) {
      console.log("No active payment settings found, looking for any settings");
      paymentSettings = await findOneDocument(COLLECTION, {});
    }
    
    // If still no settings found, create default settings
    if (!paymentSettings) {
      console.log("No payment settings found, creating default settings");
      
      // Insert default payment settings
      const result = await insertDocument(COLLECTION, DEFAULT_PAYMENT_SETTINGS);
      
      if (!result.acknowledged || !result.insertedId) {
        throw new Error("Failed to insert default payment settings");
      }
      
      // Get the inserted document
      paymentSettings = await findOneDocument(COLLECTION, { _id: result.insertedId });
      
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
    console.error("Error getting payment settings:", error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get all payment settings with direct MongoDB access
// @route   GET /api/direct/payment-settings/all
// @access  Private/Admin
exports.getAllPaymentSettings = async (req, res) => {
  try {
    console.log("Getting all payment settings with direct MongoDB access");
    
    // Get collection
    const collection = await getCollection(COLLECTION);
    
    // Find all payment settings
    const paymentSettings = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    // If no settings found, create default settings
    if (paymentSettings.length === 0) {
      console.log("No payment settings found, creating default settings");
      
      // Insert default payment settings
      const result = await insertDocument(COLLECTION, DEFAULT_PAYMENT_SETTINGS);
      
      if (!result.acknowledged || !result.insertedId) {
        throw new Error("Failed to insert default payment settings");
      }
      
      // Get the inserted document
      const defaultSettings = await findOneDocument(COLLECTION, { _id: result.insertedId });
      
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
    console.error("Error getting all payment settings:", error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
