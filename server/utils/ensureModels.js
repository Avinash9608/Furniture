/**
 * Utility to ensure all required models exist
 * This script checks if models exist and creates them if they don't
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Function to check if a model exists
const modelExists = (modelName) => {
  return !!mongoose.models[modelName];
};

// Function to create a model from a schema file
const createModelFromFile = (modelName, schemaPath) => {
  try {
    // Check if the file exists
    if (!fs.existsSync(schemaPath)) {
      console.error(`Schema file ${schemaPath} does not exist`);
      return null;
    }
    
    // Require the model file
    const model = require(schemaPath);
    console.log(`Successfully created model ${modelName} from ${schemaPath}`);
    return model;
  } catch (error) {
    console.error(`Error creating model ${modelName} from ${schemaPath}:`, error.message);
    return null;
  }
};

// Function to ensure PaymentSettings model exists
const ensurePaymentSettingsModel = () => {
  if (modelExists('PaymentSettings')) {
    console.log('PaymentSettings model already exists');
    return mongoose.models.PaymentSettings;
  }
  
  // Try to create the model from the file
  const schemaPath = path.join(__dirname, '..', 'models', 'PaymentSettings');
  const model = createModelFromFile('PaymentSettings', schemaPath);
  
  if (!model) {
    // If the model couldn't be created from the file, create it manually
    console.log('Creating PaymentSettings model manually');
    
    const PaymentSettingsSchema = new mongoose.Schema({
      accountNumber: {
        type: String,
        required: [true, 'Please add an account number'],
        trim: true
      },
      accountName: {
        type: String,
        required: [true, 'Please add an account name'],
        trim: true
      },
      bankName: {
        type: String,
        required: [true, 'Please add a bank name'],
        trim: true
      },
      ifscCode: {
        type: String,
        required: [true, 'Please add an IFSC code'],
        trim: true
      },
      upiId: {
        type: String,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    });
    
    return mongoose.model('PaymentSettings', PaymentSettingsSchema);
  }
  
  return model;
};

// Function to ensure all models exist
const ensureAllModels = () => {
  console.log('Ensuring all models exist...');
  
  // Ensure PaymentSettings model exists
  const PaymentSettings = ensurePaymentSettingsModel();
  
  // Add more models here as needed
  
  console.log('All models ensured');
  
  return {
    PaymentSettings
  };
};

module.exports = {
  ensureAllModels,
  ensurePaymentSettingsModel
};
