/**
 * Final Contact Save Utility
 * 
 * This utility provides a direct MongoDB connection for saving contact messages,
 * completely bypassing Mongoose to avoid buffering timeout issues.
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
 * Save a contact message directly to MongoDB using a standalone connection
 * @param {Object} contactData - The contact message data to save
 * @returns {Promise<Object>} - The saved contact message
 */
const saveContactFinal = async (contactData) => {
  let client = null;
  
  try {
    // Get MongoDB URI
    const uri = getMongoURI();
    
    if (!uri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    console.log('Creating standalone MongoDB connection for contact save');
    
    // Create a new MongoDB client with minimal options
    client = new MongoClient(uri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 1
    });
    
    // Connect to MongoDB
    await client.connect();
    console.log('Standalone MongoDB connection established');
    
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
    
    // Insert document with minimal options
    console.log('Inserting contact document into MongoDB');
    const result = await contactsCollection.insertOne(contactDoc);
    
    console.log('Contact saved successfully with standalone connection:', result.insertedId);
    
    // Return the saved contact with ID
    return {
      _id: result.insertedId,
      ...contactDoc
    };
  } catch (error) {
    console.error('Error in saveContactFinal:', error);
    throw error;
  } finally {
    // Always close the connection
    if (client) {
      try {
        await client.close();
        console.log('Standalone MongoDB connection closed');
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }
    }
  }
};

// Save contact message to a local file as fallback
const saveContactToFile = async (contactData) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Create a unique filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `contact_${timestamp}_${Math.random().toString(36).substring(2, 15)}.json`;
    
    // Determine file path
    const filePath = path.join(__dirname, '..', '..', 'contact_backup', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Prepare contact document with proper timestamps
    const contactDoc = {
      ...contactData,
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(contactDoc, null, 2));
    
    console.log(`Contact saved to file: ${filePath}`);
    
    // Return the saved contact with a mock ID
    return {
      _id: `file_${timestamp}`,
      ...contactDoc,
      _filePath: filePath
    };
  } catch (fileError) {
    console.error('Error saving contact to file:', fileError);
    throw fileError;
  }
};

module.exports = {
  saveContactFinal,
  saveContactToFile
};
