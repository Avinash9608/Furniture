/**
 * Direct database access utility for emergency use when Mongoose models fail
 * This provides a fallback mechanism to access MongoDB collections directly
 */

const mongoose = require("mongoose");

// Get a reference to the database
const getDb = () => {
  try {
    // Check connection state
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "MongoDB not connected, connection state:",
        mongoose.connection.readyState
      );
      throw new Error("MongoDB not connected");
    }

    // Get database reference
    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database reference is null or undefined");
      throw new Error("Database reference is null or undefined");
    }

    return db;
  } catch (error) {
    console.error("Error getting database reference:", error.message);
    throw error; // Re-throw the error after logging
  }
};

// Get a collection by name
const getCollection = async (collectionName) => {
  const db = getDb();

  // Check if collection exists
  const collections = await db
    .listCollections({ name: collectionName })
    .toArray();
  if (collections.length === 0) {
    console.warn(
      `Collection ${collectionName} not found, but returning a reference anyway`
    );
    // Return a reference to the collection even if it doesn't exist yet
    // This allows for operations that might create the collection
  }

  return db.collection(collectionName);
};

// Find documents in a collection
const findDocuments = async (collectionName, query = {}, options = {}) => {
  try {
    const collection = await getCollection(collectionName);
    const result = await collection.find(query, options).toArray();
    console.log(
      `Successfully found ${result.length} documents in ${collectionName}`
    );
    return result;
  } catch (error) {
    console.error(
      `Error finding documents in ${collectionName}:`,
      error.message
    );
    // Return empty array instead of throwing
    return [];
  }
};

// Find a single document in a collection
const findOneDocument = async (collectionName, query = {}, options = {}) => {
  try {
    const collection = await getCollection(collectionName);
    const result = await collection.findOne(query, options);
    if (result) {
      console.log(`Successfully found document in ${collectionName}`);
    } else {
      console.log(`No document found in ${collectionName} matching query`);
    }
    return result;
  } catch (error) {
    console.error(
      `Error finding document in ${collectionName}:`,
      error.message
    );
    // Return null instead of throwing
    return null;
  }
};

// Count documents in a collection
const countDocuments = async (collectionName, query = {}) => {
  try {
    const collection = await getCollection(collectionName);
    const count = await collection.countDocuments(query);
    console.log(`Count in ${collectionName}: ${count}`);
    return count;
  } catch (error) {
    console.error(
      `Error counting documents in ${collectionName}:`,
      error.message
    );
    // Return 0 instead of throwing
    return 0;
  }
};

// Insert a document into a collection
const insertDocument = async (collectionName, document) => {
  const collection = await getCollection(collectionName);
  return collection.insertOne(document);
};

// Update a document in a collection
const updateDocument = async (collectionName, query, update) => {
  const collection = await getCollection(collectionName);
  return collection.updateOne(query, update);
};

// Delete a document from a collection
const deleteDocument = async (collectionName, query) => {
  const collection = await getCollection(collectionName);
  return collection.deleteOne(query);
};

// Get all collection names
const getCollectionNames = async () => {
  const db = getDb();
  const collections = await db.listCollections().toArray();
  return collections.map((c) => c.name);
};

module.exports = {
  getDb,
  getCollection,
  findDocuments,
  findOneDocument,
  countDocuments,
  insertDocument,
  updateDocument,
  deleteDocument,
  getCollectionNames,
};
