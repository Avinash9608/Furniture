const mongoose = require('mongoose');

const PaymentSettingsSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: [true, 'Please add an account number'],
    trim: true
  },
  ifscCode: {
    type: String,
    required: [true, 'Please add an IFSC code'],
    trim: true
  },
  accountHolder: {
    type: String,
    required: [true, 'Please add account holder name'],
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  branchName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
PaymentSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PaymentSettings', PaymentSettingsSchema);
