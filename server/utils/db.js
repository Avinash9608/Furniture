/**
 * Enhanced MongoDB Connection Module
 * 
 * This module provides a robust MongoDB connection with retry logic,
 * event handlers, and production-specific settings.
 */

const mongoose = require('mongoose');

const MAX_CONNECTION_RETRIES = 5;
let connectionRetries = 0;

// Set global Mongoose options
mongoose.set('bufferTimeoutMS', 60000); // 60 seconds buffer timeout

// Connection event handlers
mongoose.connection.on('connecting', () => {
  console.log('Mongoose connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('Mongoose successfully connected');
  connectionRetries = 0; // Reset retry counter on successful connection
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected - attempting reconnect...');
  // Don't reconnect here - let the error handler handle it
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

/**
 * Connect to MongoDB with enhanced settings and retry logic
 */
const connectDB = async () => {
  try {
    // Get the MongoDB URI from environment variables
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MongoDB URI not found in environment variables');
      return null;
    }
    
    // Log a redacted version of the URI for debugging
    const redactedUri = uri.replace(
      /\/\/([^:]+):([^@]+)@/,
      (_, username) => `\/\/${username}:****@`
    );
    console.log("Using connection string:", redactedUri);
    
    // Enhanced connection options for production environments
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds for initial selection
      socketTimeoutMS: 60000, // 60 seconds for operations
      connectTimeoutMS: 30000, // 30 seconds for initial connection
      maxPoolSize: 10, // Maximum number of sockets in the connection pool
      minPoolSize: 2, // Minimum number of sockets
      retryWrites: true,
      w: 'majority'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);
    console.log(`Connection state: ${conn.connection.readyState}`);
    
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error (Attempt ${connectionRetries + 1}):`, error.message);
    
    if (connectionRetries < MAX_CONNECTION_RETRIES) {
      connectionRetries++;
      console.log(`Retrying connection in 5 seconds... (${connectionRetries}/${MAX_CONNECTION_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB();
    }
    
    console.error('Max connection retries reached. Running in degraded mode.');
    return null;
  }
};

/**
 * Direct MongoDB driver connection (fallback)
 */
const { MongoClient } = require('mongodb');

const directDB = {
  client: null,
  db: null,
  
  connect: async () => {
    try {
      const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
      
      if (!uri) {
        console.error('MongoDB URI not found in environment variables');
        return null;
      }
      
      // Direct connection options
      const options = {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5
      };
      
      directDB.client = new MongoClient(uri, options);
      await directDB.client.connect();
      
      // Get database name from connection string
      const dbName = uri.split('/').pop().split('?')[0];
      directDB.db = directDB.client.db(dbName);
      
      console.log(`Direct MongoDB connection successful to database: ${dbName}`);
      return directDB.db;
    } catch (error) {
      console.error('Direct MongoDB connection failed:', error);
      return null;
    }
  },
  
  getDB: () => {
    if (directDB.db) return directDB.db;
    return null;
  },
  
  close: async () => {
    if (directDB.client) {
      await directDB.client.close();
      directDB.client = null;
      directDB.db = null;
      console.log('Direct MongoDB connection closed');
    }
  }
};

/**
 * Database health check middleware
 */
const dbHealthCheck = (req, res, next) => {
  const dbState = mongoose.connection.readyState;
  
  if (dbState !== 1) { // 1 = connected
    console.warn(`Database not connected. Current state: ${dbState}`);
    
    // Try to reconnect if disconnected
    if (dbState === 0) {
      console.log('Attempting to reconnect to MongoDB...');
      connectDB().catch(err => console.error('Reconnection failed:', err));
    }
    
    // Continue anyway - we'll use fallback mechanisms in the routes
  }
  
  next();
};

module.exports = {
  connectDB,
  directDB,
  dbHealthCheck
};
