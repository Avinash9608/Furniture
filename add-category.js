/**
 * Script to add a category directly to MongoDB
 */

require("dotenv").config();
const { MongoClient } = require("mongodb");

// Get MongoDB URI from environment variables
const getMongoURI = () => process.env.MONGO_URI;

// Simple slugify function
const slugify = (text) => {
  if (!text) return "";

  // Convert to lowercase
  let result = text.toLowerCase();

  // Replace spaces with hyphens
  result = result.replace(/\s+/g, "-");

  // Remove special characters
  result = result.replace(/[^a-zA-Z0-9-]/g, "");

  return result;
};

// Add a category
const addCategory = async () => {
  console.log("Starting to add a category...");

  // Create a new MongoDB client
  const uri = getMongoURI();
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 30000,
    maxPoolSize: 5,
  };

  const client = new MongoClient(uri, options);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Get database name from connection string
    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);
    console.log(`Using database: ${dbName}`);

    // Create category data
    const categoryName = "New Test Category";
    const categoryDescription = "This is a new test category";
    const slug = slugify(categoryName);

    const categoryData = {
      name: categoryName,
      description: categoryDescription,
      slug: slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Category data to be saved:", categoryData);

    // Insert the category into the categories collection
    const categoriesCollection = db.collection("categories");

    // Check if category with same name already exists
    const existingCategory = await categoriesCollection.findOne({
      name: { $regex: new RegExp(`^${categoryData.name}$`, "i") },
    });

    if (existingCategory) {
      console.log("Category with this name already exists:", existingCategory);
      return;
    }

    // Insert the category
    const result = await categoriesCollection.insertOne(categoryData);

    if (result.acknowledged) {
      console.log("Category created successfully:", result);

      // Verify the category was saved by fetching it back
      const savedCategory = await categoriesCollection.findOne({
        _id: result.insertedId,
      });

      if (savedCategory) {
        console.log("Category verified in database:", savedCategory);
      } else {
        console.error("Category verification failed");
      }
    } else {
      console.error("Insert operation not acknowledged");
    }
  } catch (error) {
    console.error("Error adding category:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
};

// Run the function
addCategory().catch(console.error);
