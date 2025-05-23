/**
 * Fixed utility function for updating products
 */

const { MongoClient, ObjectId } = require("mongodb");
const mongoose = require("mongoose");

// Update a product document directly using MongoDB
const updateProductDocument = async (id, updates) => {
  let client = null;
  try {
    console.log(`[updateProductDocument] Updating product with ID: ${id}`);
    
    // Get MongoDB URI from environment variables
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MongoDB URI not found in environment variables");
    }
    
    // Create MongoDB client
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB successfully");
    
    // Get the database name from the URI
    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);
    
    // Get the products collection
    const productsCollection = db.collection("products");
    
    // Create query for finding the product
    let query = {};
    
    // Try to convert to ObjectId if it looks like one
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        query = { _id: new ObjectId(id) };
        console.log("Using ObjectId query:", id);
      } catch (error) {
        console.warn("Could not convert to ObjectId, using string ID");
        query = { _id: id };
      }
    } else {
      // Use string ID
      query = { _id: id };
      console.log("Using string ID query:", id);
    }
    
    // Make sure updates has $set operator
    if (!updates.$set) {
      updates = { $set: updates };
    }
    
    // Add updatedAt timestamp
    updates.$set.updatedAt = new Date();
    
    console.log("Update query:", JSON.stringify(query));
    console.log("Update operation:", JSON.stringify(updates));
    
    // Perform the update
    const updateResult = await productsCollection.updateOne(query, updates);
    console.log("Update result:", updateResult);
    
    if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
      throw new Error("Product not found or update failed");
    }
    
    // Get the updated product
    const updatedProduct = await productsCollection.findOne(query);
    
    if (!updatedProduct) {
      throw new Error("Failed to retrieve updated product");
    }
    
    console.log("Updated product:", updatedProduct.name);
    
    return {
      success: true,
      product: updatedProduct
    };
  } catch (error) {
    console.error("[updateProductDocument] Error:", error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Close the client connection
    if (client) {
      try {
        await client.close();
        console.log("MongoDB connection closed");
      } catch (error) {
        console.error("Error closing MongoDB connection:", error);
      }
    }
  }
};

module.exports = {
  updateProductDocument
};