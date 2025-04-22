const mongoose = require('mongoose');

const PaymentRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add the payment amount'],
    min: [0, 'Amount must be a positive number']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal', 'upi', 'rupay', 'bank_transfer', 'cod']
  },
  transactionId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  paymentProof: {
    type: String // URL to uploaded payment proof image
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
PaymentRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PaymentRequest', PaymentRequestSchema);
