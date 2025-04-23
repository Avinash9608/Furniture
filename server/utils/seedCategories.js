const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Category = require("../models/Category");

// Load environment variables
dotenv.config();

// Default categories for the furniture shop
const defaultCategories = [
  {
    name: "Sofa Beds",
    description: "Convertible sofas that can be used as beds",
    slug: "sofa-beds",
  },
  {
    name: "Tables",
    description: "Dining tables, coffee tables, side tables and more",
    slug: "tables",
  },
  {
    name: "Chairs",
    description: "Dining chairs, armchairs, recliners and more",
    slug: "chairs",
  },
  {
    name: "Wardrobes",
    description: "Storage solutions for bedrooms",
    slug: "wardrobes",
  },
  {
    name: "Beds",
    description: "Single beds, double beds, king size beds and more",
    slug: "beds",
  },
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Seed categories
const seedCategories = async () => {
  try {
    await connectDB();

    console.log("Checking existing categories...");
    const existingCategories = await Category.find();
    console.log(`Found ${existingCategories.length} existing categories`);

    // Get existing category names
    const existingNames = existingCategories.map((cat) => cat.name);
    console.log("Existing category names:", existingNames);

    // Filter out categories that already exist
    const categoriesToAdd = defaultCategories.filter(
      (cat) => !existingNames.includes(cat.name)
    );

    if (categoriesToAdd.length === 0) {
      console.log(
        "All required categories already exist. No new categories to add."
      );
    } else {
      console.log(`Adding ${categoriesToAdd.length} new categories...`);

      // Create new categories one by one to avoid duplicate key errors
      for (const category of categoriesToAdd) {
        try {
          const newCategory = new Category(category);
          await newCategory.save();
          console.log(`Added category: ${category.name} (${newCategory._id})`);
        } catch (err) {
          console.error(
            `Failed to add category ${category.name}:`,
            err.message
          );
        }
      }
    }

    // Verify all required categories exist
    const requiredNames = defaultCategories.map((cat) => cat.name);
    const finalCategories = await Category.find({
      name: { $in: requiredNames },
    });

    console.log("\nFinal categories in database:");
    finalCategories.forEach((category) => {
      console.log(
        `- ${category.name} (${category._id}) [slug: ${category.slug}]`
      );
    });

    const missingCategories = requiredNames.filter(
      (name) => !finalCategories.map((cat) => cat.name).includes(name)
    );

    if (missingCategories.length > 0) {
      console.warn(
        "\nWARNING: Some required categories are still missing:",
        missingCategories
      );
    } else {
      console.log("\nAll required categories are now in the database!");
    }

    console.log("\nCategories seeding process completed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error.message);
    process.exit(1);
  }
};

// Run the seeder
seedCategories();
