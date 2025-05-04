const Product = require("../models/Product");
const mongoose = require("mongoose");
const { MongoClient, ObjectId } = require("mongodb");

// Get the MongoDB URI from environment variables
const getMongoURI = () => process.env.MONGO_URI;

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Public
exports.addReview = async (req, res) => {
  try {
    console.log("Adding review for product ID:", req.params.id);
    console.log("Review data:", req.body);

    const { rating, comment, userName } = req.body;

    // Validate required fields
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required",
      });
    }

    // Create a new direct MongoDB connection specifically for this operation
    let client = null;

    try {
      console.log("Attempting to add review using direct MongoDB driver");

      // Get the MongoDB URI
      const uri = getMongoURI();

      // Direct connection options with increased timeouts for Render deployment
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 600000, // 10 minutes
        socketTimeoutMS: 600000, // 10 minutes
        serverSelectionTimeoutMS: 600000, // 10 minutes
        maxPoolSize: 10,
        bufferCommands: false, // Disable command buffering to prevent timeouts
      };

      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      console.log(`MongoDB connection established to database: ${dbName}`);

      // Get the products collection
      const productsCollection = db.collection("products");

      // Find the product by ID
      let productId;
      try {
        productId = new ObjectId(req.params.id);
      } catch (idError) {
        productId = req.params.id;
      }

      const product = await productsCollection.findOne({ _id: productId });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Create the review object
      const review = {
        _id: new mongoose.Types.ObjectId(),
        name: userName || "Anonymous User",
        rating: Number(rating),
        comment,
        createdAt: new Date(),
      };

      // Initialize reviews array if it doesn't exist
      if (!product.reviews) {
        product.reviews = [];
      }

      // Add the review to the product
      product.reviews.push(review);

      // Update product ratings
      product.numReviews = product.reviews.length;
      product.ratings =
        product.reviews.reduce((acc, item) => acc + item.rating, 0) /
        product.reviews.length;

      // Update the product in the database
      const updateResult = await productsCollection.updateOne(
        { _id: productId },
        {
          $set: {
            reviews: product.reviews,
            numReviews: product.numReviews,
            ratings: product.ratings,
          },
        }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error("Failed to update product with review");
      }

      return res.status(201).json({
        success: true,
        message: "Review added successfully",
        data: review,
      });
    } catch (error) {
      console.error("Error in direct MongoDB operation:", error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
    }
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error adding review",
    });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    console.log("Getting reviews for product ID:", req.params.id);

    // Create a new direct MongoDB connection specifically for this operation
    let client = null;

    try {
      console.log("Attempting to get reviews using direct MongoDB driver");

      // Get the MongoDB URI
      const uri = getMongoURI();

      // Direct connection options with increased timeouts for Render deployment
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 600000, // 10 minutes
        socketTimeoutMS: 600000, // 10 minutes
        serverSelectionTimeoutMS: 600000, // 10 minutes
        maxPoolSize: 10,
        bufferCommands: false, // Disable command buffering to prevent timeouts
      };

      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      console.log(`MongoDB connection established to database: ${dbName}`);

      // Get the products collection
      const productsCollection = db.collection("products");

      // Find the product by ID
      let productId;
      try {
        productId = new ObjectId(req.params.id);
      } catch (idError) {
        productId = req.params.id;
      }

      const product = await productsCollection.findOne({ _id: productId });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Return the reviews
      return res.status(200).json({
        success: true,
        data: product.reviews || [],
      });
    } catch (error) {
      console.error("Error in direct MongoDB operation:", error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
    }
  } catch (error) {
    console.error("Error getting reviews:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error getting reviews",
    });
  }
};
