const mongoose = require('mongoose');
const PaymentSettings = require('../models/PaymentSettings');
const connectDB = require('../config/db');

// Connect to database
connectDB();

// Create default payment settings
const createDefaultPaymentSettings = async () => {
  try {
    // Check if payment settings already exist
    const existingSettings = await PaymentSettings.findOne();
    
    if (existingSettings) {
      console.log('Payment settings already exist. Skipping seeder.');
      process.exit(0);
    }
    
    // Create default payment settings
    const paymentSettings = await PaymentSettings.create({
      accountNumber: '42585534295',
      ifscCode: 'SBIN0030442',
      accountHolder: 'Avinash Kumar',
      bankName: 'State Bank of India',
      isActive: true
    });
    
    console.log('Default payment settings created:', paymentSettings);
    process.exit(0);
  } catch (error) {
    console.error('Error creating default payment settings:', error);
    process.exit(1);
  }
};

// Run the seeder
createDefaultPaymentSettings();
