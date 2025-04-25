/**
 * Centralized model loader for the application
 * This utility handles loading models with proper error handling and path resolution
 */

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Cache for loaded models
const modelCache = {};

/**
 * Load a model by name with robust error handling
 * @param {string} modelName - The name of the model to load
 * @returns {mongoose.Model|null} - The loaded model or null if it couldn't be loaded
 */
function loadModel(modelName) {
  // If model is already in cache, return it
  if (modelCache[modelName]) {
    return modelCache[modelName];
  }

  console.log(`Attempting to load model: ${modelName}`);

  // Try different paths to load the model
  const possiblePaths = [
    // Standard path
    path.join(__dirname, "..", "models", `${modelName}.js`),
    // Path with lowercase first letter
    path.join(
      __dirname,
      "..",
      "models",
      `${modelName.charAt(0).toLowerCase() + modelName.slice(1)}.js`
    ),
    // Path with 's' at the end
    path.join(__dirname, "..", "models", `${modelName}s.js`),
    // Path without 's' at the end
    path.join(__dirname, "..", "models", `${modelName.replace(/s$/, "")}.js`),
    // Root server directory
    path.join(__dirname, "..", "..", "server", "models", `${modelName}.js`),
    // Root server directory with lowercase first letter
    path.join(
      __dirname,
      "..",
      "..",
      "server",
      "models",
      `${modelName.charAt(0).toLowerCase() + modelName.slice(1)}.js`
    ),
    // Root server directory with 's' at the end
    path.join(__dirname, "..", "..", "server", "models", `${modelName}s.js`),
    // Root server directory without 's' at the end
    path.join(
      __dirname,
      "..",
      "..",
      "server",
      "models",
      `${modelName.replace(/s$/, "")}.js`
    ),
    // Special case for PaymentSetting/PaymentSettings
    path.join(__dirname, "..", "models", "PaymentSetting.js"),
    path.join(__dirname, "..", "models", "PaymentSettings.js"),
    path.join(__dirname, "..", "models", "paymentSetting.js"),
    path.join(__dirname, "..", "models", "paymentSettings.js"),
    path.join(__dirname, "..", "..", "server", "models", "PaymentSetting.js"),
    path.join(__dirname, "..", "..", "server", "models", "PaymentSettings.js"),
    path.join(__dirname, "..", "..", "server", "models", "paymentSetting.js"),
    path.join(__dirname, "..", "..", "server", "models", "paymentSettings.js"),
    // Special case for PaymentRequest/PaymentRequests
    path.join(__dirname, "..", "models", "PaymentRequest.js"),
    path.join(__dirname, "..", "models", "PaymentRequests.js"),
    path.join(__dirname, "..", "models", "paymentRequest.js"),
    path.join(__dirname, "..", "models", "paymentRequests.js"),
    path.join(__dirname, "..", "..", "server", "models", "PaymentRequest.js"),
    path.join(__dirname, "..", "..", "server", "models", "PaymentRequests.js"),
    path.join(__dirname, "..", "..", "server", "models", "paymentRequest.js"),
    path.join(__dirname, "..", "..", "server", "models", "paymentRequests.js"),
  ];

  // Try each path
  for (const modelPath of possiblePaths) {
    try {
      // Check if file exists
      if (fs.existsSync(modelPath)) {
        console.log(`Found model file at: ${modelPath}`);

        // Try to require the model
        try {
          const model = require(modelPath);
          modelCache[modelName] = model;
          console.log(`Successfully loaded model: ${modelName}`);
          return model;
        } catch (requireError) {
          console.error(
            `Error requiring model from ${modelPath}:`,
            requireError.message
          );
        }
      }
    } catch (fsError) {
      console.error(
        `Error checking file existence for ${modelPath}:`,
        fsError.message
      );
    }
  }

  // If model is already registered with mongoose, return it
  try {
    if (mongoose.models[modelName]) {
      console.log(`Found model in mongoose registry: ${modelName}`);
      modelCache[modelName] = mongoose.models[modelName];
      return mongoose.models[modelName];
    }
  } catch (mongooseError) {
    console.error(
      `Error checking mongoose models for ${modelName}:`,
      mongooseError.message
    );
  }

  console.error(`Failed to load model: ${modelName}`);
  return null;
}

/**
 * Get all loaded models
 * @returns {Object} - Object containing all loaded models
 */
function getLoadedModels() {
  return { ...modelCache };
}

/**
 * Load all models from the models directory
 * @returns {Object} - Object containing all loaded models
 */
function loadAllModels() {
  const modelNames = [
    "Category",
    "Contact",
    "Order",
    "PaymentRequest",
    "PaymentSetting",
    "Product",
    "User",
  ];

  modelNames.forEach((modelName) => {
    loadModel(modelName);
  });

  return getLoadedModels();
}

module.exports = {
  loadModel,
  getLoadedModels,
  loadAllModels,
};
