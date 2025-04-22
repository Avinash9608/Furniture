const mongoose = require("mongoose");
const Category = require("../models/Category");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/shyam_furnitures"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Define the required categories
const requiredCategories = [
  {
    name: "Sofa Beds",
    description: "Convertible sofas that can be used as beds",
  },
  {
    name: "Tables",
    description: "Dining tables, coffee tables, side tables and more",
  },
  {
    name: "Chairs",
    description: "Dining chairs, armchairs, recliners and more",
  },
  { name: "Wardrobes", description: "Storage solutions for bedrooms" },
];

// Update categories in the database
const updateCategories = async () => {
  try {
    console.log("Updating categories...");

    // First, get all existing categories
    const existingCategories = await Category.find({});
    console.log(`Found ${existingCategories.length} existing categories`);

    // Keep track of which required categories already exist
    const existingCategoryNames = existingCategories.map((cat) =>
      cat.name.toLowerCase()
    );

    // Process each required category individually
    for (const category of requiredCategories) {
      if (!existingCategoryNames.includes(category.name.toLowerCase())) {
        console.log(`Adding new category: ${category.name}`);

        // Create slug from name
        const slug = category.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");

        // Create the category with slug
        const newCategory = new Category({
          name: category.name,
          description: category.description,
          slug: slug,
        });

        await newCategory.save();
        console.log(`Added category: ${category.name} with slug: ${slug}`);
      } else {
        console.log(`Category "${category.name}" already exists`);
      }
    }

    // Get the final list of categories
    const updatedCategories = await Category.find({});
    console.log("Updated categories:");
    updatedCategories.forEach((cat) => {
      console.log(`- ${cat.name} (${cat._id})`);
    });

    console.log("Category update completed");
    process.exit(0);
  } catch (error) {
    console.error("Error updating categories:", error);
    process.exit(1);
  }
};

// Run the script
updateCategories();
