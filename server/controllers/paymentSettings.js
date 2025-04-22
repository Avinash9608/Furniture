const PaymentSettings = require("../models/PaymentSettings");

// @desc    Get payment settings
// @route   GET /api/payment-settings
// @access  Public
exports.getPaymentSettings = async (req, res) => {
  try {
    // Get the active payment settings
    const paymentSettings = await PaymentSettings.findOne({ isActive: true });

    if (!paymentSettings) {
      return res.status(404).json({
        success: false,
        message: "No payment settings found",
      });
    }

    res.status(200).json({
      success: true,
      data: paymentSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create payment settings
// @route   POST /api/payment-settings
// @access  Private/Admin
exports.createPaymentSettings = async (req, res) => {
  try {
    console.log("Creating payment settings with data:", req.body);

    // If we're creating a new active setting, deactivate all others
    if (req.body.isActive) {
      await PaymentSettings.updateMany({}, { isActive: false });
    }

    const paymentSettings = await PaymentSettings.create(req.body);
    console.log("Payment settings created successfully:", paymentSettings);

    res.status(201).json({
      success: true,
      data: paymentSettings,
    });
  } catch (error) {
    console.error("Error creating payment settings:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment settings",
    });
  }
};

// @desc    Update payment settings
// @route   PUT /api/payment-settings/:id
// @access  Private/Admin
exports.updatePaymentSettings = async (req, res) => {
  try {
    let paymentSettings = await PaymentSettings.findById(req.params.id);

    if (!paymentSettings) {
      return res.status(404).json({
        success: false,
        message: `Payment settings not found with id of ${req.params.id}`,
      });
    }

    // If we're setting this to active, deactivate all others
    if (req.body.isActive) {
      await PaymentSettings.updateMany({}, { isActive: false });
    }

    paymentSettings = await PaymentSettings.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: paymentSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete payment settings
// @route   DELETE /api/payment-settings/:id
// @access  Private/Admin
exports.deletePaymentSettings = async (req, res) => {
  try {
    const paymentSettings = await PaymentSettings.findById(req.params.id);

    if (!paymentSettings) {
      return res.status(404).json({
        success: false,
        message: `Payment settings not found with id of ${req.params.id}`,
      });
    }

    await paymentSettings.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all payment settings
// @route   GET /api/payment-settings/all
// @access  Private/Admin
exports.getAllPaymentSettings = async (req, res) => {
  try {
    const paymentSettings = await PaymentSettings.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: paymentSettings.length,
      data: paymentSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
