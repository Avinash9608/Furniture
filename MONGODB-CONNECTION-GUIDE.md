# MongoDB Connection Guide for Render Deployment

This guide provides instructions for implementing the enhanced MongoDB connection solution for the Furniture Shop application deployed on Render.

## Overview

The solution addresses MongoDB connection issues in the Render deployment environment by:

1. Implementing a robust MongoDB connection with retry logic
2. Using the direct MongoDB driver as a fallback for critical operations
3. Adding comprehensive error handling and fallback mechanisms
4. Providing detailed logging and diagnostics

## Files Included

- `server/utils/db.js` - Enhanced MongoDB connection module
- `server/utils/directMongo.js` - Direct MongoDB driver implementation
- `server-enhanced.js` - Enhanced server with improved MongoDB connection handling
- `client/src/utils/api-enhanced.js` - Enhanced client-side API implementation
- `client/src/pages/admin/Messages-enhanced.jsx` - Enhanced Messages component

## Implementation Steps

### 1. Update MongoDB Connection

Replace your current MongoDB connection code with the enhanced version:

```javascript
// In your server.js file
const { connectDB, directDB, dbHealthCheck } = require('./server/utils/db');

// Apply database health check middleware to all API routes
app.use('/api', dbHealthCheck);

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

// Start the server
startServer();
```

### 2. Use Direct MongoDB Driver for Critical Endpoints

For critical endpoints that need reliable database access, use the direct MongoDB driver:

```javascript
const directMongo = require('./server/utils/directMongo');

app.get("/api/admin/messages", async (req, res) => {
  try {
    const contacts = await directMongo.getContacts();
    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
      method: "direct",
    });
  } catch (error) {
    // Handle error and return fallback data
  }
});
```

### 3. Update Client-Side API Implementation

Replace your current API implementation with the enhanced version:

```javascript
// In your client-side code
import { fetchContactMessages } from "./utils/api-enhanced";

// Use the enhanced API function
const response = await fetchContactMessages();
```

### 4. Update Components to Handle Temporary Data

Update your components to handle temporary data and connection issues:

```javascript
// In your component
const [isTemporaryData, setIsTemporaryData] = useState(false);

// When fetching data
if (response.isTemporaryData) {
  setIsTemporaryData(true);
  setError(response.error);
  setMessages(response.data || []);
}

// In your render method
{isTemporaryData && (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
    <p>Displaying temporary data due to database connection issues.</p>
  </div>
)}
```

## Render Configuration

### Environment Variables

Add these environment variables in your Render dashboard:

- `MONGO_URI` - Your MongoDB Atlas connection string
- `NODE_ENV` - Set to `production`

### Build Command

Update your build command to include the environment variables:

```
NODE_ENV=production npm run build
```

## MongoDB Atlas Configuration

1. **Whitelist Render IP Addresses**:
   - Go to MongoDB Atlas > Network Access
   - Add `0.0.0.0/0` to allow all IP addresses (for testing)
   - For production, add specific Render IP addresses

2. **Check Database User**:
   - Ensure your database user has the correct permissions
   - Verify the username and password in your connection string

## Troubleshooting

### Check Connection Status

Use the `/api/db-status` endpoint to check the MongoDB connection status:

```
GET /api/db-status
```

Expected response:
```json
{
  "connected": true,
  "state": "connected",
  "timestamp": "2023-04-25T10:00:49.931Z",
  "details": {
    "host": "ac-6ug6cpq-shard-00-02.dpeo7nm.mongodb.net",
    "port": 27017,
    "name": "shyam_furnitures"
  }
}
```

### Test Database Query

Use the `/api/db-test` endpoint to test a simple database query:

```
GET /api/db-test
```

Expected response:
```json
{
  "success": true,
  "count": 2,
  "message": "Database query successful using direct MongoDB driver",
  "method": "direct",
  "sampleContact": {
    "id": "680b472d61813d32067e6ec5",
    "name": "Avinash Kumar",
    "email": "avinashmadhukar4@gmail.com",
    "subject": "Enquiry about the sofa cum bed"
  }
}
```

### Run Test Scripts

Run the included test scripts to verify the MongoDB connection:

```bash
node test-mongodb-direct.js
node test-mongodb-minimal.js
```

## Additional Recommendations

1. **Upgrade MongoDB Atlas Tier**:
   - If you're using a free tier (M0), consider upgrading to a paid tier for better performance

2. **Implement Caching**:
   - Consider implementing a caching layer to reduce the number of direct database queries

3. **Monitor Connection Events**:
   - Implement logging for all connection events
   - Set up alerts for prolonged disconnections

4. **Connection Pooling**:
   - Consider using a connection pool manager
   - Implement graceful shutdown handling
