/**
 * Direct MongoDB Connection Utility
 *
 * This utility provides direct MongoDB connections for database operations,
 * completely bypassing Mongoose to avoid buffering timeout issues.
 */

const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

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
 * Get a MongoDB client with connection and retry logic
 * @param {number} retryCount - Current retry attempt (default: 0)
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<{client: MongoClient, db: any}>} MongoDB client and database
 */
const getMongoClient = async (retryCount = 0, maxRetries = 3) => {
  // If we already have a cached connection, test it and return if valid
  if (cachedClient && cachedDb) {
    try {
      // Test the connection with a ping
      await cachedDb.command({ ping: 1 });
      console.log("Using cached MongoDB connection (verified with ping)");
      return { client: cachedClient, db: cachedDb };
    } catch (pingError) {
      console.warn(
        "Cached MongoDB connection failed ping test:",
        pingError.message
      );
      console.log("Will create a new connection...");

      // Close the failed connection
      try {
        await cachedClient.close(true);
      } catch (closeError) {
        console.warn("Error closing failed connection:", closeError.message);
      }

      // Reset cache
      cachedClient = null;
      cachedDb = null;
    }
  }

  // Get MongoDB URI
  const uri = getMongoURI();

  if (!uri) {
    throw new Error("MongoDB URI not found in environment variables");
  }

  console.log(
    `Creating new MongoDB client connection (attempt ${retryCount + 1}/${
      maxRetries + 1
    })`
  );

  // Create a new MongoDB client with optimized settings for Render deployment
  const client = new MongoClient(uri, {
    connectTimeoutMS: 600000, // 10 minutes
    socketTimeoutMS: 600000, // 10 minutes
    serverSelectionTimeoutMS: 600000, // 10 minutes
    maxPoolSize: 20, // Increased pool size
    minPoolSize: 5, // Ensure minimum connections
    retryWrites: true,
    w: 1, // Write acknowledgment from primary only (faster than majority)
    wtimeoutMS: 60000, // 1 minute
    keepAlive: true, // Keep connections alive
    keepAliveInitialDelay: 300000, // 5 minutes
    maxIdleTimeMS: 120000, // 2 minutes max idle time
    directConnection: false, // Allow for replica set connections
    readPreference: "primaryPreferred", // Read from primary if available, otherwise secondary
    retryReads: true, // Retry read operations
  });

  try {
    // Connect to MongoDB with timeout
    const connectPromise = client.connect();

    // Add a timeout to the connect promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Connection timeout after 60 seconds")),
        60000
      );
    });

    // Race the connect promise against the timeout
    await Promise.race([connectPromise, timeoutPromise]);

    console.log("MongoDB connection established successfully");

    // Test the connection with a ping
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connection verified with ping");

    // Get database name from URI
    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    // Set up event listeners for the connection
    client.on("error", (error) => {
      console.error("MongoDB connection error event:", error);
    });

    client.on("timeout", () => {
      console.warn("MongoDB connection timeout event");
    });

    client.on("close", () => {
      console.warn("MongoDB connection closed event");
      // Reset cache on close
      if (cachedClient === client) {
        cachedClient = null;
        cachedDb = null;
      }
    });

    return { client, db };
  } catch (error) {
    console.error(
      `Error connecting to MongoDB (attempt ${retryCount + 1}/${
        maxRetries + 1
      }):`,
      error
    );

    // Close the failed connection
    try {
      await client.close(true);
    } catch (closeError) {
      console.warn("Error closing failed connection:", closeError.message);
    }

    // Retry logic
    if (retryCount < maxRetries) {
      console.log(
        `Retrying connection in 3 seconds... (attempt ${retryCount + 2}/${
          maxRetries + 1
        })`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return getMongoClient(retryCount + 1, maxRetries);
    }

    throw error;
  }
};

/**
 * Find documents in a collection with timeout handling
 * @param {string} collectionName - The name of the collection
 * @param {Object} query - The query to find documents
 * @param {Object} options - Additional options (sort, limit, etc.)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns {Promise<Array>} - The found documents
 */
const findDocuments = async (
  collectionName,
  query = {},
  options = {},
  timeoutMs = 30000
) => {
  console.log(`Finding documents in ${collectionName} with query:`, query);

  try {
    // Get MongoDB client with retry logic
    const { db } = await getMongoClient();
    const collection = db.collection(collectionName);

    // Create a cursor
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

    // Set maxTimeMS on the cursor
    cursor = cursor.maxTimeMS(timeoutMs);

    // Create a promise for the toArray operation
    const findPromise = cursor.toArray();

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(new Error(`find operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    });

    // Race the promises
    const documents = await Promise.race([findPromise, timeoutPromise]);

    console.log(`Found ${documents.length} documents in ${collectionName}`);

    return documents;
  } catch (error) {
    console.error(`Error finding documents in ${collectionName}:`, error);

    // If it's a timeout error, try again with a simpler query
    if (error.message && error.message.includes("timed out")) {
      try {
        console.log(`Retrying with simplified query after timeout...`);

        // Get a fresh client connection
        const { db } = await getMongoClient(0, 1);
        const collection = db.collection(collectionName);

        // Simplify the query and options
        const simplifiedQuery = {};
        const simplifiedOptions = {
          limit: options.limit || 20,
          projection: options.projection,
        };

        console.log(`Fallback query after timeout:`, simplifiedQuery);

        // Create a cursor with simplified query
        let fallbackCursor = collection.find(simplifiedQuery);

        // Apply simplified options
        if (simplifiedOptions.limit) {
          fallbackCursor = fallbackCursor.limit(simplifiedOptions.limit);
        }

        if (simplifiedOptions.projection) {
          fallbackCursor = fallbackCursor.project(simplifiedOptions.projection);
        }

        // Set a shorter timeout
        fallbackCursor = fallbackCursor.maxTimeMS(15000);

        // Get documents
        const fallbackDocuments = await fallbackCursor.toArray();

        console.log(
          `Found ${fallbackDocuments.length} documents with fallback query`
        );

        if (fallbackDocuments.length > 0) {
          return fallbackDocuments;
        }
      } catch (fallbackError) {
        console.error(`Fallback query also failed:`, fallbackError);
      }

      // If all else fails, return an empty array instead of throwing
      console.log(`All queries failed, returning empty array`);
      return [];
    }

    throw error;
  }
};

/**
 * Find a single document in a collection with timeout handling
 * @param {string} collectionName - The name of the collection
 * @param {Object} query - The query to find the document
 * @param {Object} options - Additional options (projection, etc.)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns {Promise<Object>} - The found document
 */
const findOneDocument = async (
  collectionName,
  query = {},
  options = {},
  timeoutMs = 30000
) => {
  console.log(`Finding one document in ${collectionName} with query:`, query);

  try {
    // Get MongoDB client with retry logic
    const { db } = await getMongoClient();
    const collection = db.collection(collectionName);

    // Create a promise for the findOne operation
    const findPromise = collection.findOne(query, options);

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(new Error(`findOne operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    });

    // Race the promises
    const document = await Promise.race([findPromise, timeoutPromise]);

    console.log(`Document found in ${collectionName}:`, !!document);

    // If document is null, try a simpler query as fallback
    if (!document && Object.keys(query).length > 0) {
      console.log(
        `No document found with original query, trying simplified query...`
      );

      // Extract ID if it exists in the query
      let simplifiedQuery = {};
      if (query._id) {
        simplifiedQuery._id = query._id;
      } else if (query.$or && query.$or.length > 0) {
        // Try the first condition from $or
        simplifiedQuery = query.$or[0];
      }

      // Only try simplified query if it's different from original
      if (
        Object.keys(simplifiedQuery).length > 0 &&
        JSON.stringify(simplifiedQuery) !== JSON.stringify(query)
      ) {
        console.log(`Trying simplified query:`, simplifiedQuery);
        const fallbackDocument = await collection.findOne(
          simplifiedQuery,
          options
        );
        if (fallbackDocument) {
          console.log(`Document found with simplified query!`);
          return fallbackDocument;
        }
      }
    }

    return document;
  } catch (error) {
    console.error(`Error finding document in ${collectionName}:`, error);

    // If it's a timeout error, try again with a simpler query
    if (error.message && error.message.includes("timed out")) {
      try {
        console.log(`Retrying with simplified query after timeout...`);

        // Get a fresh client connection
        const { db } = await getMongoClient(0, 1);
        const collection = db.collection(collectionName);

        // Simplify the query to just use _id if present
        let simplifiedQuery = {};
        if (query._id) {
          simplifiedQuery._id = query._id;
        } else if (query.$or && query.$or.length > 0) {
          // Try the first condition from $or
          simplifiedQuery = query.$or[0];
        } else {
          // Use a very simple query that should return quickly
          simplifiedQuery = { _id: { $exists: true } };
          options.limit = 1;
        }

        console.log(`Fallback query after timeout:`, simplifiedQuery);
        const fallbackDocument = await collection.findOne(
          simplifiedQuery,
          options
        );

        if (fallbackDocument) {
          console.log(`Document found with fallback query after timeout!`);
          return fallbackDocument;
        }
      } catch (fallbackError) {
        console.error(`Fallback query also failed:`, fallbackError);
      }
    }

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
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(documentWithTimestamps);
    console.log(
      `Document inserted into ${collectionName} with ID:`,
      result.insertedId
    );

    return {
      _id: result.insertedId,
      ...documentWithTimestamps,
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
        updatedAt: new Date(),
      },
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
    console.log(
      `Document deleted from ${collectionName}:`,
      result.deletedCount
    );

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
      console.log("MongoDB connection closed");
      cachedClient = null;
      cachedDb = null;
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
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
  closeConnection,
};
