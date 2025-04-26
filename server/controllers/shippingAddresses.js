const ShippingAddress = require('../models/ShippingAddress');

// @desc    Create new shipping address
// @route   POST /api/shipping-addresses
// @access  Private/Admin
exports.createShippingAddress = async (req, res) => {
  try {
    console.log('Creating shipping address with data:', req.body);
    
    // If this is set as default, unset any existing default
    if (req.body.isDefault) {
      await ShippingAddress.updateMany(
        { isDefault: true },
        { isDefault: false }
      );
    }
    
    const shippingAddress = await ShippingAddress.create(req.body);

    res.status(201).json({
      success: true,
      data: shippingAddress
    });
  } catch (error) {
    console.error('Error creating shipping address:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all shipping addresses
// @route   GET /api/shipping-addresses
// @access  Private/Admin
exports.getShippingAddresses = async (req, res) => {
  try {
    const shippingAddresses = await ShippingAddress.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      count: shippingAddresses.length,
      data: shippingAddresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get default shipping address
// @route   GET /api/shipping-addresses/default
// @access  Public
exports.getDefaultShippingAddress = async (req, res) => {
  try {
    const shippingAddress = await ShippingAddress.findOne({ isDefault: true });

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: 'No default shipping address found'
      });
    }

    res.status(200).json({
      success: true,
      data: shippingAddress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get shipping address by ID
// @route   GET /api/shipping-addresses/:id
// @access  Private/Admin
exports.getShippingAddressById = async (req, res) => {
  try {
    const shippingAddress = await ShippingAddress.findById(req.params.id);

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: `Shipping address not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: shippingAddress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update shipping address
// @route   PUT /api/shipping-addresses/:id
// @access  Private/Admin
exports.updateShippingAddress = async (req, res) => {
  try {
    // If this is set as default, unset any existing default
    if (req.body.isDefault) {
      await ShippingAddress.updateMany(
        { isDefault: true },
        { isDefault: false }
      );
    }
    
    const shippingAddress = await ShippingAddress.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: `Shipping address not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: shippingAddress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete shipping address
// @route   DELETE /api/shipping-addresses/:id
// @access  Private/Admin
exports.deleteShippingAddress = async (req, res) => {
  try {
    const shippingAddress = await ShippingAddress.findById(req.params.id);

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: `Shipping address not found with id of ${req.params.id}`
      });
    }

    await shippingAddress.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
