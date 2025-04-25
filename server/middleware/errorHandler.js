/**
 * Global error handling middleware
 * Handles all uncaught errors in the application
 */

const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Handle protocol errors specifically
  if (err.code === 'ERR_HTTP2_PROTOCOL_ERROR' || err.code === 'ERR_QUIC_PROTOCOL_ERROR') {
    return res.status(500).json({
      success: false,
      message: 'Network protocol error',
      suggestion: 'Please try again or contact support'
    });
  }

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File is too large. Maximum size is 5MB.',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file upload. Please check your form fields.',
    });
  }

  // Handle MongoDB timeout errors
  if (err.name === 'MongoTimeoutError' || err.message?.includes('timed out')) {
    return res.status(500).json({
      success: false,
      message: 'Database connection timed out',
      suggestion: 'Please try again later'
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = {};
    for (const field in err.errors) {
      validationErrors[field] = err.errors[field].message;
    }

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: validationErrors,
    });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate data error',
      error: err.message,
      duplicateField: Object.keys(err.keyValue || {})[0] || 'unknown',
    });
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;
