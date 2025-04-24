/**
 * API Router Middleware
 * 
 * This middleware handles all API routes in a unified way, ensuring they work
 * correctly in both development and production environments.
 * 
 * It handles:
 * 1. Regular API routes (/api/*)
 * 2. Direct routes without the /api prefix (for backward compatibility)
 * 3. Routes with duplicate /api prefixes (/api/api/*)
 */

const express = require('express');
const router = express.Router();

// Import all route handlers
const authRoutes = require('../routes/auth');
const productRoutes = require('../routes/products');
const categoryRoutes = require('../routes/categories');
const contactRoutes = require('../routes/contact');
const orderRoutes = require('../routes/orders');
const paymentSettingsRoutes = require('../routes/paymentSettings');
const paymentRequestsRoutes = require('../routes/paymentRequests');

// Define route mappings - each entry maps a route path to its handler
const routeMappings = [
  { path: '/auth', handler: authRoutes },
  { path: '/products', handler: productRoutes },
  { path: '/categories', handler: categoryRoutes },
  { path: '/contact', handler: contactRoutes },
  { path: '/orders', handler: orderRoutes },
  { path: '/payment-settings', handler: paymentSettingsRoutes },
  { path: '/payment-requests', handler: paymentRequestsRoutes },
];

// Register all routes with the /api prefix (standard API routes)
routeMappings.forEach(({ path, handler }) => {
  router.use(`/api${path}`, handler);
  console.log(`Registered API route: /api${path}`);
});

// Register direct routes without the /api prefix (for backward compatibility)
// This ensures that requests to /contact will work even if the client doesn't use the /api prefix
routeMappings.forEach(({ path, handler }) => {
  router.use(path, handler);
  console.log(`Registered direct route: ${path}`);
});

// Health Check endpoint
router.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Export the router
module.exports = router;
