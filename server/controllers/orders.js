const Order = require("../models/Order");
const Product = require("../models/Product");
const PaymentRequest = require("../models/PaymentRequest");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order items",
      });
    }

    // Check if req.user exists, if not in development mode, find or create a default user
    let userId;
    if (!req.user) {
      console.warn(
        "Warning: req.user is undefined. Using default user for development."
      );
      if (process.env.NODE_ENV === "development") {
        // Find or create a default user
        const User = require("../models/User");
        let defaultUser = await User.findOne({ email: "admin@example.com" });

        if (!defaultUser) {
          defaultUser = await User.create({
            name: "Admin User",
            email: "admin@example.com",
            password: "admin123",
            role: "admin",
          });
        }

        userId = defaultUser._id;
      } else {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }
    } else {
      userId = req.user.id;
    }

    // Create order
    const order = await Order.create({
      orderItems,
      user: userId,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // Automatically create payment request for UPI and RuPay payments
    if (paymentMethod === "upi" || paymentMethod === "rupay") {
      try {
        console.log(
          `Auto-creating payment request for ${paymentMethod} order: ${order._id}`
        );

        // Check if payment request already exists
        const existingRequest = await PaymentRequest.findOne({
          order: order._id,
          status: { $in: ["pending", "completed"] },
        });

        if (!existingRequest) {
          const paymentRequest = await PaymentRequest.create({
            user: userId,
            order: order._id,
            amount: totalPrice,
            paymentMethod,
            notes: `Auto-generated payment request for ${paymentMethod} payment`,
            status: "pending",
          });

          console.log(`Payment request created: ${paymentRequest._id}`);
        } else {
          console.log(`Payment request already exists for order: ${order._id}`);
        }
      } catch (paymentRequestError) {
        console.error(
          "Error creating automatic payment request:",
          paymentRequestError
        );
        // Don't fail the order creation if payment request creation fails
      }
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${req.params.id}`,
      });
    }

    // Check if req.user exists
    if (!req.user) {
      console.warn("Warning: req.user is undefined in getOrderById");
      if (process.env.NODE_ENV === "development") {
        // In development mode, allow access without authentication
        return res.status(200).json({
          success: true,
          data: order,
        });
      }

      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Make sure user is order owner or admin
    if (
      order.user._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this order`,
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${req.params.id}`,
      });
    }

    order.status = req.body.status;

    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
exports.updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${req.params.id}`,
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    // Check if req.user exists
    if (!req.user) {
      console.warn("Warning: req.user is undefined in getMyOrders");
      if (process.env.NODE_ENV === "development") {
        // Find a default user
        const User = require("../models/User");
        const defaultUser = await User.findOne({ email: "admin@example.com" });

        if (defaultUser) {
          const orders = await Order.find({ user: defaultUser._id });
          return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
          });
        }
      }

      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const orders = await Order.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id name");

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
