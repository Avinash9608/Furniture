/**
 * Script to fix categories with null slugs in the database
 * Run with: node server/scripts/fixCategorySlugs.js
 */

// Import required modules
const { MongoClient } = require("mongodb");
require("dotenv").config();

// Try to require slugify, but provide a fallback if it's not available
let slugify;
try {
  slugify = require("slugify");
} catch (error) {
  console.warn("Slugify package not found, using fallback implementation");
  // Simple fallback implementation of slugify
  slugify = (text, options = {}) => {
    if (!text) return "";

    // Convert to lowercase if specified in options
    let result = options.lower ? text.toLowerCase() : text;

    // Replace spaces with hyphens
    result = result.replace(/\s+/g, "-");

    // Remove special characters if strict mode is enabled
    if (options.strict) {
      result = result.replace(/[^a-zA-Z0-9-]/g, "");
    }

    // Remove specific characters if provided in options
    if (options.remove && options.remove instanceof RegExp) {
      result = result.replace(options.remove, "");
    }

    return result;
  };
}

// Get MongoDB URI from environment variables
const getMongoURI = () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI environment variable is not set");
  }
  return uri;
};

// Fix categories with null slugs
const fixNullSlugs = async () => {
  console.log("Starting to fix categories with null slugs...");

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
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    // Get database name from connection string
    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);
    console.log(`Using database: ${dbName}`);

    // Get the categories collection
    const categoriesCollection = db.collection("categories");

    // Find categories with null or undefined slugs
    const categoriesWithNullSlugs = await categoriesCollection
      .find({
        $or: [{ slug: null }, { slug: { $exists: false } }],
      })
      .toArray();

    console.log(
      `Found ${categoriesWithNullSlugs.length} categories with null slugs`
    );

    // Fix each category
    for (const category of categoriesWithNullSlugs) {
      try {
        // Generate a slug from the category name
        let slug = "";

        if (category.name) {
          // Generate base slug from name using slugify
          slug = slugify(category.name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g,
          });

          // If slug is empty after processing, use a fallback
          if (!slug || slug.trim() === "") {
            slug = `category-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          }
        } else {
          // If no name, generate a random slug
          slug = `category-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        // Check if the slug already exists
        let finalSlug = slug;
        let counter = 1;
        let slugExists = true;

        while (slugExists) {
          const existingCategory = await categoriesCollection.findOne({
            slug: finalSlug,
            _id: { $ne: category._id },
          });

          if (!existingCategory) {
            // Slug is unique
            slugExists = false;
          } else {
            // Slug exists, try with counter
            finalSlug = `${slug}-${counter}`;
            counter++;
          }
        }

        // Update the category with the new slug
        const result = await categoriesCollection.updateOne(
          { _id: category._id },
          { $set: { slug: finalSlug } }
        );

        if (result.modifiedCount === 1) {
          console.log(
            `Fixed category ${category._id}: "${category.name}" -> slug: "${finalSlug}"`
          );
        } else {
          console.warn(`Failed to update category ${category._id}`);
        }
      } catch (error) {
        console.error(`Error fixing category ${category._id}:`, error);
      }
    }

    console.log("Finished fixing categories with null slugs");

    // Check if there are still categories with null slugs
    const remainingNullSlugs = await categoriesCollection.countDocuments({
      $or: [{ slug: null }, { slug: { $exists: false } }],
    });

    if (remainingNullSlugs > 0) {
      console.warn(
        `There are still ${remainingNullSlugs} categories with null slugs`
      );
    } else {
      console.log("All categories now have valid slugs");
    }
  } catch (error) {
    console.error("Error fixing null slugs:", error);
  } finally {
    // Close the MongoDB connection
    await client.close();
    console.log("MongoDB connection closed");
  }
};

// Run the script
fixNullSlugs()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
