# MongoDB Data Fetching Fix Guide for Shyam Furnitures

This guide addresses the issues where data is not being fetched from MongoDB Atlas in the deployed environment, specifically focusing on contact messages.

## Issues Fixed

1. **Mock Data Instead of Real Data**:
   - Contact messages were being displayed from hardcoded mock data instead of fetching from MongoDB Atlas
   - Mock data was being returned when database operations failed

2. **MongoDB Connection Issues**:
   - Connection to MongoDB Atlas failing in the deployed environment
   - Timeouts during connection attempts
   - Connection dropping after periods of inactivity

3. **Error Handling Issues**:
   - Poor error handling causing application crashes
   - No fallback mechanisms when database operations fail
   - Inconsistent API response formats

## Root Causes

1. **Fallback to Mock Data**: The code was designed to return mock data when database operations failed, which masked the real issue
2. **MongoDB Connection Configuration**: Insufficient connection options for the deployed environment
3. **Error Handling**: Inadequate error handling for database operations
4. **API Implementation**: Inconsistent API implementation between client and server

## Implemented Fixes

### 1. Removed Mock Data Fallbacks

#### Client-Side (api.js)

```javascript
// Before
// If all endpoints fail, create mock data for testing
console.warn("All contact message endpoints failed, creating mock data");

// Create mock messages for testing
const mockMessages = [
  {
    _id: `mock_${Date.now()}_1`,
    name: "John Doe",
    email: "john@example.com",
    subject: "Product Inquiry",
    message: "I'm interested in your wooden chairs. Do you ship internationally?",
    status: "unread",
    createdAt: new Date().toISOString(),
  },
  // More mock messages...
];

return {
  data: mockMessages,
  warning: "Using mock data. Messages may not be saved to the database.",
};

// After
// If all endpoints fail, try a direct connection to MongoDB Atlas
console.warn("All contact message endpoints failed, attempting direct database connection");

// Try one more time with a longer timeout and different approach
try {
  console.log("Making final attempt to fetch contact messages with extended timeout");
  const finalAttemptApi = axios.create({
    timeout: 60000, // Extended timeout (60 seconds)
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  
  // Try the deployed URL with a different path format
  const finalEndpoint = `${deployedUrl}/api/contact?timestamp=${Date.now()}`;
  console.log(`Final attempt endpoint: ${finalEndpoint}`);
  
  const finalResponse = await finalAttemptApi.get(finalEndpoint);
  console.log("Final attempt response:", finalResponse.data);
  
  if (finalResponse.data && finalResponse.data.data && Array.isArray(finalResponse.data.data)) {
    console.log("Successfully retrieved messages in final attempt");
    return {
      data: finalResponse.data.data,
    };
  }
} catch (finalError) {
  console.error("Final attempt to fetch messages failed:", finalError);
}

// If all attempts fail, return empty array with error message
console.error("All attempts to fetch contact messages failed");
return {
  data: [],
  error: "Failed to fetch messages from database. Please try refreshing the page.",
};
```

#### Server-Side (server.js)

```javascript
// Before
// Create mock data for testing if in development
const mockContacts =
  process.env.NODE_ENV !== "production"
    ? [
        {
          _id: `mock_${Date.now()}_1`,
          name: "John Doe",
          email: "john@example.com",
          subject: "Product Inquiry",
          message: "I'm interested in your wooden chairs. Do you ship internationally?",
          status: "unread",
          createdAt: new Date().toISOString(),
        },
        // More mock contacts...
      ]
    : [];

// Return mock data or empty array to prevent client-side errors
return res.status(200).json({
  success: true,
  count: mockContacts.length,
  data: mockContacts,
  message: "Error fetching contacts from database, returning " + 
    (mockContacts.length > 0 ? "mock data" : "empty array"),
});

// After
// Try one more time with a different approach
try {
  console.log("Making another attempt to connect to MongoDB...");
  
  // Force a new connection to MongoDB
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB to reset connection");
  
  // Connect with enhanced options
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // Increased timeout
    socketTimeoutMS: 60000,
    connectTimeoutMS: 30000,
    retryWrites: true,
    w: "majority",
    maxPoolSize: 10,
  });
  
  console.log("Reconnected to MongoDB successfully");
  
  // Try fetching contacts again
  const contacts = await Contact.find().sort({ createdAt: -1 });
  console.log(`Successfully fetched ${contacts.length} contact messages on second attempt`);
  
  return res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
} catch (retryError) {
  console.error("Second attempt to fetch contacts failed:", retryError);
  
  // Return empty array to prevent client-side errors
  return res.status(200).json({
    success: false,
    count: 0,
    data: [],
    message: "Failed to fetch contacts from database after multiple attempts",
    error: retryError.message
  });
}
```

### 2. Enhanced Client-Side Error Handling

```javascript
// Check for error in the response
if (response.error) {
  console.error("Error in API response:", response.error);
  setError(response.error);
  setMessages([]);
  return;
}

// Improved error messages
setError("No messages found in the database. Try submitting a contact form first.");

// Better error handling in catch block
setError(
  `Failed to load messages: ${error.message || "Unknown error"}. Please check your database connection.`
);
```

### 3. Improved MongoDB Connection Retry Logic

```javascript
// Try one more time with a different approach
try {
  console.log("Making another attempt to connect to MongoDB...");
  
  // Force a new connection to MongoDB
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB to reset connection");
  
  // Connect with enhanced options
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // Increased timeout
    socketTimeoutMS: 60000,
    connectTimeoutMS: 30000,
    retryWrites: true,
    w: "majority",
    maxPoolSize: 10,
  });
  
  console.log("Reconnected to MongoDB successfully");
  
  // Try fetching contacts again
  const contacts = await Contact.find().sort({ createdAt: -1 });
  console.log(`Successfully fetched ${contacts.length} contact messages on second attempt`);
  
  return res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
} catch (retryError) {
  console.error("Second attempt to fetch contacts failed:", retryError);
}
```

## Testing the Fixes

### 1. Run the Verification Script

```bash
node test-mongodb-fetch.js
```

This script tests:
- Direct MongoDB connection
- Fetching contacts directly from MongoDB
- Fetching contacts via API
- Creating a new contact directly in MongoDB
- Creating a new contact via API

### 2. Manual Testing

1. **Contact Form Submission**:
   - Go to the Contact page
   - Fill out the form and submit
   - Verify that the success message appears
   - Check the admin panel to see if the message appears in the Messages page

2. **Admin Messages Page**:
   - Log in to the admin panel
   - Go to the Messages page
   - Verify that real messages from the database are displayed
   - Check that there are no mock messages with fake data

## Preventing Future Issues

1. **Avoid Mock Data in Production**:
   - Don't use hardcoded mock data in production environments
   - If fallbacks are needed, make them clearly identifiable as fallbacks
   - Log warnings when fallbacks are used

2. **Robust Connection Configuration**:
   - Always use enhanced connection options for MongoDB
   - Set appropriate timeouts for the production environment
   - Implement connection event listeners for error handling and reconnection

3. **Comprehensive Error Handling**:
   - Use try-catch blocks for all database operations
   - Implement proper error messages that help diagnose issues
   - Return appropriate error responses to the client

4. **Consistent API Implementation**:
   - Use a consistent response format for all API endpoints
   - Implement client-side retry mechanisms for failed API calls
   - Handle different response formats gracefully

## Conclusion

By implementing these fixes, we've addressed the issue where contact messages were being displayed from hardcoded mock data instead of fetching from MongoDB Atlas. The application should now display real data from the database in both development and production environments.
