/**
 * Direct database access utility for emergency use when Mongoose models fail
 * This provides a fallback mechanism to access MongoDB collections directly
 */

const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");

// Cache for MongoDB client
let cachedClient = null;
let cachedDb = null;

// Get a reference to the database
const getDb = async () => {
  try {
    // Return cached database if available
    if (cachedDb) {
      return cachedDb;
    }

    // Try to use mongoose connection first
    if (mongoose.connection.readyState === 1) {
      cachedDb = mongoose.connection.db;
      return cachedDb;
    }

    // If mongoose connection is not available, create direct connection
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    // Create new client if not cached
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
        maxPoolSize: 20,
        minPoolSize: 5,
      });
    }

    // Connect to MongoDB
    await cachedClient.connect();
    console.log("Connected to MongoDB successfully");

    // Get database name from URI
    const dbName = uri.split("/").pop().split("?")[0];
    cachedDb = cachedClient.db(dbName);

    return cachedDb;
  } catch (error) {
    console.error("Error getting database reference:", error.message);
    throw error;
  }
};

// Get a collection by name
const getCollection = async (collectionName) => {
  try {
    const db = await getDb();
    return db.collection(collectionName);
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error.message);
    throw error;
  }
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

// Delete a document from a collection
const deleteDocument = async (collectionName, query) => {
  const collection = await getCollection(collectionName);
  return collection.deleteOne(query);
};

// Update a document in a collection
const updateDocument = async (collectionName, query, update) => {
  try {
    console.log(
      `[updateDocument] Updating document in ${collectionName} with query:`,
      query
    );
    console.log("[updateDocument] Update operation:", update);

    const collection = await getCollection(collectionName);

    // If update doesn't use operators ($set, $unset, etc.), wrap it in $set
    const hasOperators = Object.keys(update).some((key) => key.startsWith("$"));
    const finalUpdate = hasOperators ? update : { $set: update };

    // Always add updatedAt timestamp to $set
    if (!finalUpdate.$set) {
      finalUpdate.$set = {};
    }
    finalUpdate.$set.updatedAt = new Date();

    console.log("[updateDocument] Final update operation:", finalUpdate);

    try {
      // Use updateOne instead of findOneAndUpdate for more reliability
      const updateResult = await collection.updateOne(query, finalUpdate);
      console.log("[updateDocument] Update result:", updateResult);

      if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
        console.error("[updateDocument] Document not found or update failed");
        throw new Error("Document not found or update failed");
      }

      // Fetch the updated document
      const updatedDoc = await collection.findOne(query);
      if (!updatedDoc) {
        console.error("[updateDocument] Could not fetch updated document");
        throw new Error("Could not fetch updated document");
      }

      console.log("[updateDocument] Update successful:", {
        documentId: updatedDoc._id,
        acknowledged: true,
      });

      return updatedDoc;
    } catch (error) {
      console.error(
        `[updateDocument] Error updating document in ${collectionName}:`,
        error
      );
      throw error;
    }
  } catch (outerError) {
    console.error(
      `[updateDocument] Outer error updating document in ${collectionName}:`,
      outerError
    );
    throw outerError;
  }
};

// Get all collection names
const getCollectionNames = async () => {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    return collections.map((c) => c.name);
  } catch (error) {
    console.error("Error getting collection names:", error.message);
    return [];
  }
};

// Cleanup function to close connections
const cleanup = async () => {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
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
  cleanup,
};
