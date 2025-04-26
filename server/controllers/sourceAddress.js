const SourceAddress = require('../models/SourceAddress');

// @desc    Create new source address
// @route   POST /api/source-address
// @access  Private/Admin
exports.createSourceAddress = async (req, res) => {
  try {
    console.log('Creating source address with data:', req.body);
    
    // If this is set as active, unset any existing active address
    if (req.body.isActive) {
      await SourceAddress.updateMany(
        { isActive: true },
        { isActive: false }
      );
    }
    
    const sourceAddress = await SourceAddress.create(req.body);

    res.status(201).json({
      success: true,
      data: sourceAddress
    });
  } catch (error) {
    console.error('Error creating source address:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all source addresses
// @route   GET /api/source-address
// @access  Private/Admin
exports.getSourceAddresses = async (req, res) => {
  try {
    const sourceAddresses = await SourceAddress.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      count: sourceAddresses.length,
      data: sourceAddresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get active source address
// @route   GET /api/source-address/active
// @access  Public
exports.getActiveSourceAddress = async (req, res) => {
  try {
    const sourceAddress = await SourceAddress.findOne({ isActive: true });

    if (!sourceAddress) {
      return res.status(404).json({
        success: false,
        message: 'No active source address found'
      });
    }

    res.status(200).json({
      success: true,
      data: sourceAddress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get source address by ID
// @route   GET /api/source-address/:id
// @access  Private/Admin
exports.getSourceAddress = async (req, res) => {
  try {
    const sourceAddress = await SourceAddress.findById(req.params.id);

    if (!sourceAddress) {
      return res.status(404).json({
        success: false,
        message: `Source address not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: sourceAddress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update source address
// @route   PUT /api/source-address/:id
// @access  Private/Admin
exports.updateSourceAddress = async (req, res) => {
  try {
    // If this is set as active, unset any existing active address
    if (req.body.isActive) {
      await SourceAddress.updateMany(
        { isActive: true },
        { isActive: false }
      );
    }
    
    const sourceAddress = await SourceAddress.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!sourceAddress) {
      return res.status(404).json({
        success: false,
        message: `Source address not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: sourceAddress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete source address
// @route   DELETE /api/source-address/:id
// @access  Private/Admin
exports.deleteSourceAddress = async (req, res) => {
  try {
    const sourceAddress = await SourceAddress.findById(req.params.id);

    if (!sourceAddress) {
      return res.status(404).json({
        success: false,
        message: `Source address not found with id of ${req.params.id}`
      });
    }

    await sourceAddress.deleteOne();

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
