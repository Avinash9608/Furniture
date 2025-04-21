// Simple request logger middleware
const logger = (req, res, next) => {
  console.log(`\n🔍 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Log request body for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture the original send function
  const originalSend = res.send;
  
  // Override the send function to log the response
  res.send = function(body) {
    console.log(`📤 Response: ${res.statusCode}`);
    // Call the original send function
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = logger;
