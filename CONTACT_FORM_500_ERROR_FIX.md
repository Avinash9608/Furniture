# Fixing 500 Internal Server Error for Contact Form

This document explains how to fix the 500 Internal Server Error in the Shyam Furnitures application's contact form when deployed to Render.

## Problem

After implementing the direct route handlers for the contact form, the form is now receiving 500 Internal Server Error responses. The error shows:

```
POST https://furniture-q3nb.onrender.com/api/contact 500 (Internal Server Error)
```

This indicates that the server is receiving the request but failing to process it correctly.

## Solution

We've implemented a comprehensive solution with robust error handling and debugging capabilities:

### 1. Improved Contact Form Handler

We created a common handler function with detailed validation and error handling:

```javascript
// Common contact form handler function with robust error handling
const handleContactForm = async (req, res, routeName) => {
  console.log(`Received contact form submission via ${routeName} route:`, req.body);
  
  try {
    // Validate required fields
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      console.error(`Missing required fields in ${routeName} request:`, req.body);
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, email, subject, and message"
      });
    }
    
    // Log database connection state
    console.log("MongoDB connection state:", mongoose.connection.readyState);
    
    // Create contact with explicit fields to avoid schema validation issues
    const contactData = {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      phone: req.body.phone ? req.body.phone.trim() : "",
      status: "unread"
    };
    
    console.log(`Creating contact with data (${routeName}):`, contactData);
    
    // Create the contact document
    const contact = await Contact.create(contactData);
    
    console.log(`Contact created successfully (${routeName}):`, contact._id);
    
    // Return success response
    return res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error(`Error creating contact (${routeName}):`, error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      // Extract validation error messages
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors
      });
    }
    
    // Handle other errors
    return res.status(500).json({
      success: false,
      message: "Server error while processing contact form",
      error: error.message
    });
  }
};
```

### 2. Global Error Handler Middleware

We added a global error handler to catch any unhandled errors:

```javascript
// Global error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);
  
  // Send appropriate response based on error type
  if (err.name === "ValidationError") {
    // Mongoose validation error
    const validationErrors = {};
    for (const field in err.errors) {
      validationErrors[field] = err.errors[field].message;
    }
    
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: validationErrors
    });
  } else if (err.name === "CastError") {
    // Mongoose cast error (invalid ID, etc.)
    return res.status(400).json({
      success: false,
      message: "Invalid data format",
      error: err.message
    });
  } else if (err.code === 11000) {
    // Mongoose duplicate key error
    return res.status(400).json({
      success: false,
      message: "Duplicate data error",
      error: err.message
    });
  } else {
    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "production" ? "Server error" : err.message
    });
  }
});
```

### 3. Request Logging Middleware

We added request logging middleware to help with debugging:

```javascript
// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // For POST/PUT requests, log the body (but sanitize sensitive data)
  if (req.method === 'POST' || req.method === 'PUT') {
    const sanitizedBody = { ...req.body };
    
    // Sanitize sensitive fields if they exist
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    
    console.log('Request body:', sanitizedBody);
  }
  
  // Log query parameters if they exist
  if (Object.keys(req.query).length > 0) {
    console.log('Query params:', req.query);
  }
  
  next();
});
```

## How It Works

This solution provides multiple layers of error handling and debugging:

1. **Input Validation**: The contact form handler validates all required fields before attempting to create a contact
2. **Explicit Data Handling**: We explicitly create the contact data object to avoid schema validation issues
3. **Detailed Error Handling**: We handle different types of errors (validation, cast, duplicate key, etc.) with appropriate responses
4. **Global Error Handler**: We catch any unhandled errors with a global error handler middleware
5. **Request Logging**: We log all requests with detailed information to help with debugging

## Deployment Instructions

1. Update `server.js` with the improved contact form handler, global error handler, and request logging middleware
2. Deploy to Render
3. Check the Render logs for detailed error information

## Testing

After deployment, test the contact form on the live site. The improved error handling should provide detailed error messages if there are any issues.

## Common Issues and Solutions

1. **Database Connection Issues**: Check the MongoDB connection state in the logs
2. **Validation Errors**: Check for validation errors in the response
3. **Missing Required Fields**: Make sure all required fields are provided in the request
4. **Schema Validation Issues**: Check the Contact model schema for any validation issues

## Long-Term Improvements

For a more maintainable solution in the future, consider:

1. **Centralized Error Handling**: Create a centralized error handling module
2. **Input Validation Middleware**: Use a validation library like Joi or express-validator
3. **Structured Logging**: Use a structured logging library like Winston or Bunyan
4. **API Documentation**: Create API documentation with Swagger or similar tools
