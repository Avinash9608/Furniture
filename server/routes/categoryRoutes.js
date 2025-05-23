const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");

// Get all categories with proper error handling and pagination
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Get MongoDB client
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    const db = client.db();
    const collection = db.collection("categories");

    // Get categories with pagination
    const categories = await collection
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await collection.countDocuments();

    await client.close();

    res.json({
      success: true,
      data: categories,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// Get a single category
router.get("/:id", async (req, res) => {
  try {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });

    await client.connect();
    const db = client.db();
    const collection = db.collection("categories");

    const category = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    await client.close();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching category",
      error: error.message,
    });
  }
});

// Create a category
router.post("/", async (req, res) => {
  try {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });

    await client.connect();
    const db = client.db();
    const collection = db.collection("categories");

    const result = await collection.insertOne(req.body);

    await client.close();

    res.status(201).json({
      success: true,
      data: result.ops[0],
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Error creating category",
      error: error.message,
    });
  }
});

// Update a category
router.put("/:id", async (req, res) => {
  try {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });

    await client.connect();
    const db = client.db();
    const collection = db.collection("categories");

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { returnOriginal: false }
    );

    await client.close();

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: result.value,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message,
    });
  }
});

// Delete a category
router.delete("/:id", async (req, res) => {
  try {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });

    await client.connect();
    const db = client.db();
    const collection = db.collection("categories");

    const result = await collection.findOneAndDelete({
      _id: new ObjectId(req.params.id),
    });

    await client.close();

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
});

module.exports = router;
