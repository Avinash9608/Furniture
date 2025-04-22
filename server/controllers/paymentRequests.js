const PaymentRequest = require("../models/PaymentRequest");
const Order = require("../models/Order");

// @desc    Create payment request
// @route   POST /api/payment-requests
// @access  Private
exports.createPaymentRequest = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, notes } = req.body;

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${orderId}`,
      });
    }

    // Handle missing user information in development mode
    let userId;
    if (!req.user) {
      console.warn("Warning: req.user is undefined in createPaymentRequest");
      if (process.env.NODE_ENV === "development") {
        // In development mode, use the order's user
        userId = order.user;
        console.log(`Using order's user ID: ${userId} for payment request`);
      } else {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }
    } else {
      userId = req.user.id;

      // Check if user owns the order (skip in development mode)
      if (order.user.toString() !== userId && req.user.role !== "admin") {
        return res.status(401).json({
          success: false,
          message: "Not authorized to create payment request for this order",
        });
      }
    }

    // Check if payment request already exists for this order
    const existingRequest = await PaymentRequest.findOne({
      order: orderId,
      status: { $in: ["pending", "completed"] },
    });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "A payment request already exists for this order",
      });
    }

    // Create payment request
    const paymentRequest = await PaymentRequest.create({
      user: userId,
      order: orderId,
      amount,
      paymentMethod,
      notes,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      data: paymentRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user payment requests
// @route   GET /api/payment-requests
// @access  Private
exports.getMyPaymentRequests = async (req, res) => {
  try {
    // Handle missing user information in development mode
    if (!req.user) {
      console.warn("Warning: req.user is undefined in getMyPaymentRequests");
      if (process.env.NODE_ENV === "development") {
        // In development mode, return all payment requests
        const paymentRequests = await PaymentRequest.find()
          .populate("order")
          .sort({ createdAt: -1 });

        console.log(
          `Returning ${paymentRequests.length} payment requests in development mode`
        );
        return res.status(200).json({
          success: true,
          count: paymentRequests.length,
          data: paymentRequests,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }
    }

    // Normal flow with authenticated user
    const paymentRequests = await PaymentRequest.find({ user: req.user.id })
      .populate("order")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: paymentRequests.length,
      data: paymentRequests,
    });
  } catch (error) {
    console.error("Error in getMyPaymentRequests:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all payment requests
// @route   GET /api/payment-requests/all
// @access  Private/Admin
exports.getAllPaymentRequests = async (req, res) => {
  try {
    console.log("Getting all payment requests");

    const paymentRequests = await PaymentRequest.find()
      .populate({
        path: "user",
        select: "name email",
      })
      .populate("order")
      .sort({ createdAt: -1 });

    console.log(`Found ${paymentRequests.length} payment requests`);

    res.status(200).json({
      success: true,
      count: paymentRequests.length,
      data: paymentRequests,
    });
  } catch (error) {
    console.error("Error getting payment requests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payment requests",
    });
  }
};

// @desc    Update payment request status
// @route   PUT /api/payment-requests/:id/status
// @access  Private/Admin
exports.updatePaymentRequestStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    console.log(
      `Updating payment request ${req.params.id} status to ${status}`
    );

    let paymentRequest = await PaymentRequest.findById(req.params.id);

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: `Payment request not found with id of ${req.params.id}`,
      });
    }

    // Handle missing user information in development mode
    if (!req.user) {
      console.warn(
        "Warning: req.user is undefined in updatePaymentRequestStatus"
      );
      if (process.env.NODE_ENV !== "development") {
        return res.status(401).json({
          success: false,
          message: "Admin authentication required",
        });
      }
      console.log(
        "Development mode: Bypassing authentication for payment status update"
      );
    } else if (req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Admin access required to update payment status",
      });
    }

    // Update payment request
    paymentRequest = await PaymentRequest.findByIdAndUpdate(
      req.params.id,
      { status, notes, updatedAt: Date.now() },
      {
        new: true,
        runValidators: true,
      }
    );

    console.log(
      `Payment request updated: ${paymentRequest._id}, status: ${paymentRequest.status}`
    );

    // If status is completed, update the order payment status
    if (status === "completed") {
      const order = await Order.findById(paymentRequest.order);
      if (order) {
        console.log(`Updating order ${order._id} payment status to paid`);
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: paymentRequest._id,
          status: "completed",
          update_time: new Date().toISOString(),
        };
        await order.save();
        console.log(`Order ${order._id} marked as paid`);
      }
    }

    res.status(200).json({
      success: true,
      data: paymentRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get payment request by ID
// @route   GET /api/payment-requests/:id
// @access  Private
exports.getPaymentRequestById = async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findById(req.params.id)
      .populate({
        path: "user",
        select: "name email",
      })
      .populate("order");

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: `Payment request not found with id of ${req.params.id}`,
      });
    }

    // Handle missing user information in development mode
    if (!req.user) {
      console.warn("Warning: req.user is undefined in getPaymentRequestById");
      if (process.env.NODE_ENV === "development") {
        // In development mode, allow access without authentication
        return res.status(200).json({
          success: true,
          data: paymentRequest,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }
    }

    // Check if user owns the payment request or is admin
    if (
      paymentRequest.user._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this payment request",
      });
    }

    res.status(200).json({
      success: true,
      data: paymentRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Upload payment proof
// @route   PUT /api/payment-requests/:id/proof
// @access  Private
exports.uploadPaymentProof = async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findById(req.params.id);

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: `Payment request not found with id of ${req.params.id}`,
      });
    }

    // Handle missing user information in development mode
    if (!req.user) {
      console.warn("Warning: req.user is undefined in uploadPaymentProof");
      if (process.env.NODE_ENV === "development") {
        // In development mode, allow access without authentication
        console.log(
          "Development mode: Bypassing authentication for payment proof upload"
        );
      } else {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }
    } else {
      // Check if user owns the payment request
      if (
        paymentRequest.user.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(401).json({
          success: false,
          message: "Not authorized to update this payment request",
        });
      }
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    // Update payment proof
    paymentRequest.paymentProof = `/uploads/${req.file.filename}`;
    paymentRequest.updatedAt = Date.now();
    await paymentRequest.save();

    res.status(200).json({
      success: true,
      data: paymentRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
