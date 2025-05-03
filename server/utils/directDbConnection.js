/**
 * Direct MongoDB Connection Utility
 * 
 * This utility provides direct MongoDB connections for database operations,
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

// Global connection cache
let cachedClient = null;
let cachedDb = null;

/**
 * Get a MongoDB client with connection
 * @returns {Promise<{client: MongoClient, db: any}>} MongoDB client and database
 */
const getMongoClient = async () => {
  // If we already have a cached connection, return it
  if (cachedClient && cachedDb) {
    console.log('Using cached MongoDB connection');
    return { client: cachedClient, db: cachedDb };
  }

  // Get MongoDB URI
  const uri = getMongoURI();
  
  if (!uri) {
    throw new Error('MongoDB URI not found in environment variables');
  }
  
  console.log('Creating new MongoDB client connection');
  
  // Create a new MongoDB client with optimized settings
  const client = new MongoClient(uri, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 30000,
    maxPoolSize: 10,
    minPoolSize: 1,
    retryWrites: true,
    w: 1,
    wtimeoutMS: 30000
  });
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('MongoDB connection established successfully');
    
    // Get database name from URI
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

/**
 * Find documents in a collection
 * @param {string} collectionName - The name of the collection
 * @param {Object} query - The query to find documents
 * @param {Object} options - Additional options (sort, limit, etc.)
 * @returns {Promise<Array>} - The found documents
 */
const findDocuments = async (collectionName, query = {}, options = {}) => {
  console.log(`Finding documents in ${collectionName} with query:`, query);
  
  try {
    const { db } = await getMongoClient();
    const collection = db.collection(collectionName);
    
    let cursor = collection.find(query);
    
    // Apply options
    if (options.sort) {
      cursor = cursor.sort(options.sort);
    }
    
    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }
    
    if (options.skip) {
      cursor = cursor.skip(options.skip);
    }
    
    if (options.projection) {
      cursor = cursor.project(options.projection);
    }
    
    // Convert cursor to array
    const documents = await cursor.toArray();
    console.log(`Found ${documents.length} documents in ${collectionName}`);
    
    return documents;
  } catch (error) {
    console.error(`Error finding documents in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Find a single document in a collection
 * @param {string} collectionName - The name of the collection
 * @param {Object} query - The query to find the document
 * @param {Object} options - Additional options (projection, etc.)
 * @returns {Promise<Object>} - The found document
 */
const findOneDocument = async (collectionName, query = {}, options = {}) => {
  console.log(`Finding one document in ${collectionName} with query:`, query);
  
  try {
    const { db } = await getMongoClient();
    const collection = db.collection(collectionName);
    
    const document = await collection.findOne(query, options);
    console.log(`Document found in ${collectionName}:`, !!document);
    
    return document;
  } catch (error) {
    console.error(`Error finding document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Insert a document into a collection
 * @param {string} collectionName - The name of the collection
 * @param {Object} document - The document to insert
 * @returns {Promise<Object>} - The inserted document
 */
const insertDocument = async (collectionName, document) => {
  console.log(`Inserting document into ${collectionName}`);
  
  try {
    const { db } = await getMongoClient();
    const collection = db.collection(collectionName);
    
    // Add timestamps
    const documentWithTimestamps = {
      ...document,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(documentWithTimestamps);
    console.log(`Document inserted into ${collectionName} with ID:`, result.insertedId);
    
    return {
      _id: result.insertedId,
      ...documentWithTimestamps
    };
  } catch (error) {
    console.error(`Error inserting document into ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update a document in a collection
 * @param {string} collectionName - The name of the collection
 * @param {Object} query - The query to find the document
 * @param {Object} update - The update to apply
 * @returns {Promise<Object>} - The update result
 */
const updateDocument = async (collectionName, query, update) => {
  console.log(`Updating document in ${collectionName} with query:`, query);
  
  try {
    const { db } = await getMongoClient();
    const collection = db.collection(collectionName);
    
    // Add updatedAt timestamp
    const updateWithTimestamp = {
      ...update,
      $set: {
        ...(update.$set || {}),
        updatedAt: new Date()
      }
    };
    
    const result = await collection.updateOne(query, updateWithTimestamp);
    console.log(`Document updated in ${collectionName}:`, result.modifiedCount);
    
    return result;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete a document from a collection
 * @param {string} collectionName - The name of the collection
 * @param {Object} query - The query to find the document
 * @returns {Promise<Object>} - The delete result
 */
const deleteDocument = async (collectionName, query) => {
  console.log(`Deleting document from ${collectionName} with query:`, query);
  
  try {
    const { db } = await getMongoClient();
    const collection = db.collection(collectionName);
    
    const result = await collection.deleteOne(query);
    console.log(`Document deleted from ${collectionName}:`, result.deletedCount);
    
    return result;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Close the MongoDB connection
 * @returns {Promise<void>}
 */
const closeConnection = async () => {
  if (cachedClient) {
    try {
      await cachedClient.close();
      console.log('MongoDB connection closed');
      cachedClient = null;
      cachedDb = null;
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }
};

// Export the functions
module.exports = {
  getMongoClient,
  findDocuments,
  findOneDocument,
  insertDocument,
  updateDocument,
  deleteDocument,
  closeConnection
};
