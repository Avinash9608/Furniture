/**
 * Direct MongoDB Contact Save Utility
 * 
 * This utility provides a direct MongoDB connection for saving contact messages,
 * bypassing Mongoose to avoid buffering timeout issues.
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment variables
const getMongoURI = () => {
  return process.env.MONGO_URI || process.env.MONGODB_URI;
};

/**
 * Save a contact message directly to MongoDB
 * @param {Object} contactData - The contact message data to save
 * @returns {Promise<Object>} - The saved contact message
 */
const saveContactDirect = async (contactData) => {
  // Create a new MongoDB client with increased timeouts
  const uri = getMongoURI();
  
  if (!uri) {
    throw new Error('MongoDB URI not found in environment variables');
  }
  
  console.log('Creating direct MongoDB connection for contact save');
  
  const client = new MongoClient(uri, {
    connectTimeoutMS: 300000, // 5 minutes
    socketTimeoutMS: 300000,  // 5 minutes
    serverSelectionTimeoutMS: 300000, // 5 minutes
    maxPoolSize: 1, // Use a small connection pool for this specific operation
    retryWrites: true,
    w: 1, // Write acknowledgment from primary only
    wtimeoutMS: 300000 // 5 minutes write timeout
  });
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Direct MongoDB connection established');
    
    // Get database name from URI
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    
    // Get contacts collection
    const contactsCollection = db.collection('contacts');
    
    // Prepare contact document with proper timestamps
    const contactDoc = {
      ...contactData,
      status: 'unread',
      createdAt: new Date()
    };
    
    // Insert with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let result = null;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Direct MongoDB insert attempt ${retryCount + 1}/${maxRetries}`);
        
        // Use insertOne with write concern options
        result = await contactsCollection.insertOne(contactDoc, {
          w: 1,
          wtimeoutMS: 300000
        });
        
        console.log('Contact saved successfully with direct MongoDB connection:', result.insertedId);
        break; // Success, exit the retry loop
      } catch (insertError) {
        retryCount++;
        console.error(`Insert attempt ${retryCount} failed:`, insertError);
        
        if (retryCount >= maxRetries) {
          throw insertError; // Rethrow the error after all retries fail
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
        console.log(`Waiting ${waitTime}ms before retry ${retryCount + 1}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Return the saved contact with ID
    return {
      _id: result.insertedId,
      ...contactDoc
    };
  } finally {
    // Always close the connection
    await client.close();
    console.log('Direct MongoDB connection closed');
  }
};

module.exports = {
  saveContactDirect
};
