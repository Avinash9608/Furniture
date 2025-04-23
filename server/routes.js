const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Import other routes
try {
  const productRoutes = require('./routes/productRoutes');
  const userRoutes = require('./routes/userRoutes');
  const categoryRoutes = require('./routes/categoryRoutes');
  const orderRoutes = require('./routes/orderRoutes');
  const messageRoutes = require('./routes/messageRoutes');
  const paymentRoutes = require('./routes/paymentRoutes');

  // Use routes
  router.use('/products', productRoutes);
  router.use('/users', userRoutes);
  router.use('/categories', categoryRoutes);
  router.use('/orders', orderRoutes);
  router.use('/messages', messageRoutes);
  router.use('/payments', paymentRoutes);
} catch (error) {
  console.error('Error loading routes:', error.message);
}

module.exports = router;
