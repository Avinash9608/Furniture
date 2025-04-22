const mongoose = require('mongoose');
const Order = require('../models/Order');
const PaymentRequest = require('../models/PaymentRequest');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shyam_furnitures')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create payment requests for existing UPI and RuPay orders
const createMissingPaymentRequests = async () => {
  try {
    console.log('Finding UPI and RuPay orders without payment requests...');
    
    // Find all UPI and RuPay orders
    const orders = await Order.find({
      paymentMethod: { $in: ['upi', 'rupay'] },
      isPaid: false
    });
    
    console.log(`Found ${orders.length} UPI/RuPay orders`);
    
    let created = 0;
    let skipped = 0;
    
    // Process each order
    for (const order of orders) {
      // Check if payment request already exists
      const existingRequest = await PaymentRequest.findOne({
        order: order._id,
        status: { $in: ['pending', 'completed'] }
      });
      
      if (existingRequest) {
        console.log(`Payment request already exists for order: ${order._id}`);
        skipped++;
        continue;
      }
      
      // Create payment request
      const paymentRequest = await PaymentRequest.create({
        user: order.user,
        order: order._id,
        amount: order.totalPrice,
        paymentMethod: order.paymentMethod,
        notes: `Auto-generated payment request for ${order.paymentMethod} payment`,
        status: 'pending'
      });
      
      console.log(`Created payment request ${paymentRequest._id} for order ${order._id}`);
      created++;
    }
    
    console.log(`Process completed. Created ${created} payment requests, skipped ${skipped} existing requests.`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating payment requests:', error);
    process.exit(1);
  }
};

// Run the script
createMissingPaymentRequests();
