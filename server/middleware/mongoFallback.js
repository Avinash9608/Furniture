/**
 * MongoDB Fallback Middleware
 * 
 * This middleware provides fallback handling for MongoDB connection issues.
 * It catches MongoDB connection errors and tries alternative approaches.
 */

// Fallback middleware for registration
exports.registerFallback = (req, res, next) => {
  const originalSend = res.send;
  let responseHandled = false;
  
  // Override the send method to check for MongoDB errors
  res.send = function(data) {
    // If it's a string, try to parse it as JSON
    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data);
        
        // Check if it's a MongoDB error response
        if (
          !parsedData.success && 
          (
            (parsedData.message && parsedData.message.includes('timed out')) ||
            (parsedData.error && parsedData.error.includes('timed out'))
          )
        ) {
          console.log('MongoDB timeout detected in registration, using fallback');
          responseHandled = true;
          
          // Use the direct auth controller as fallback
          const directAuth = require('../controllers/directAuth');
          return directAuth.register(req, res);
        }
      } catch (e) {
        // Not JSON or other parsing error, continue with original response
      }
    }
    
    // If we haven't handled the response with our fallback, use the original send
    if (!responseHandled) {
      return originalSend.apply(res, arguments);
    }
  };
  
  next();
};

// Fallback middleware for login
exports.loginFallback = (req, res, next) => {
  const originalSend = res.send;
  let responseHandled = false;
  
  // Override the send method to check for MongoDB errors
  res.send = function(data) {
    // If it's a string, try to parse it as JSON
    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data);
        
        // Check if it's a MongoDB error response
        if (
          !parsedData.success && 
          (
            (parsedData.message && parsedData.message.includes('timed out')) ||
            (parsedData.error && parsedData.error.includes('timed out'))
          )
        ) {
          console.log('MongoDB timeout detected in login, using fallback');
          responseHandled = true;
          
          // Use the direct auth controller as fallback
          const directAuth = require('../controllers/directAuth');
          return directAuth.login(req, res);
        }
      } catch (e) {
        // Not JSON or other parsing error, continue with original response
      }
    }
    
    // If we haven't handled the response with our fallback, use the original send
    if (!responseHandled) {
      return originalSend.apply(res, arguments);
    }
  };
  
  next();
};

// General MongoDB error handler middleware
exports.mongoErrorHandler = (err, req, res, next) => {
  // Check if it's a MongoDB connection error
  if (
    err.name === 'MongooseError' || 
    err.name === 'MongoError' || 
    err.name === 'MongoServerError' ||
    (err.message && err.message.includes('timed out'))
  ) {
    console.error('MongoDB error caught in middleware:', err.message);
    
    // For registration endpoint
    if (req.path === '/api/auth/register') {
      console.log('Using fallback for registration');
      const directAuth = require('../controllers/directAuth');
      return directAuth.register(req, res);
    }
    
    // For login endpoint
    if (req.path === '/api/auth/login') {
      console.log('Using fallback for login');
      const directAuth = require('../controllers/directAuth');
      return directAuth.login(req, res);
    }
    
    // For other endpoints, return a generic error
    return res.status(500).json({
      success: false,
      message: 'Database connection error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // Not a MongoDB error, pass to next error handler
  next(err);
};
