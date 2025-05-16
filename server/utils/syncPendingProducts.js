const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Collection name
const COLLECTION = 'products';

// Get MongoDB URI from environment variables
const getMongoUri = () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MongoDB URI not found in environment variables');
  }
  return uri;
};

// Get database name from URI
const getDbName = (uri) => {
  return uri.split('/').pop().split('?')[0];
};

// Create a MongoDB client with high timeout values
const createMongoClient = () => {
  const uri = getMongoUri();
  return new MongoClient(uri, {
    connectTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    serverSelectionTimeoutMS: 60000,
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 120000,
  });
};

// Sync pending products to the database
const syncPendingProducts = async () => {
  let client = null;
  
  try {
    console.log('=== SYNCING PENDING PRODUCTS ===');
    
    // Get pending products directory
    const pendingProductsDir = path.join(__dirname, '..', 'pending_products');
    
    // Check if directory exists
    if (!fs.existsSync(pendingProductsDir)) {
      console.log('No pending products directory found');
      return;
    }
    
    // Get all pending product files
    const files = fs.readdirSync(pendingProductsDir);
    
    if (files.length === 0) {
      console.log('No pending product files found');
      return;
    }
    
    console.log(`Found ${files.length} pending product files`);
    
    // Create MongoDB client
    client = createMongoClient();
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database and collection
    const dbName = getDbName(getMongoUri());
    const db = client.db(dbName);
    const collection = db.collection(COLLECTION);
    
    // Process each file
    for (const file of files) {
      try {
        // Read file
        const filePath = path.join(pendingProductsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const productData = JSON.parse(fileContent);
        
        console.log(`Processing product: ${productData.name}`);
        
        // Remove temporary ID if it exists
        if (productData._id && productData._id.startsWith('temp_')) {
          delete productData._id;
        }
        
        // Insert product into database
        const result = await collection.insertOne(productData);
        
        if (result.acknowledged && result.insertedId) {
          console.log(`Successfully synced product: ${productData.name} with ID: ${result.insertedId}`);
          
          // Delete file after successful sync
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } else {
          console.error(`Failed to sync product: ${productData.name}`);
        }
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
        // Continue with next file
      }
    }
    
    console.log('Finished syncing pending products');
  } catch (error) {
    console.error('Error syncing pending products:', error);
  } finally {
    // Close MongoDB client if it exists
    if (client) {
      try {
        await client.close();
        console.log('MongoDB connection closed');
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }
    }
  }
};

// Export the sync function
module.exports = {
  syncPendingProducts,
};
