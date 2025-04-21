const express = require('express');
const {
  createOrder,
  getOrderById,
  updateOrderStatus,
  updateOrderToPaid,
  getMyOrders,
  getOrders
} = require('../controllers/orders');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .post(protect, createOrder)
  .get(protect, authorize('admin'), getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id').get(protect, getOrderById);

router.route('/:id/status').put(protect, authorize('admin'), updateOrderStatus);

router.route('/:id/pay').put(protect, authorize('admin'), updateOrderToPaid);

module.exports = router;
