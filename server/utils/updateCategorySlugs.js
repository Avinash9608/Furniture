const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Category = require("../models/Category");

// Load environment variables
dotenv.config();

// Category mappings
const categoryMappings = [
  { name: "Sofa", slug: "sofa" },
  { name: "Beds", slug: "beds" },
  { name: "Tables", slug: "tables" },
  { name: "Chairs", slug: "chairs" },
  { name: "Wardrobes", slug: "wardrobes" },
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

// Update category slugs
const updateCategorySlugs = async () => {
  try {
    await connectDB();

    console.log("Checking existing categories...");
    const existingCategories = await Category.find();
    console.log(`Found ${existingCategories.length} existing categories`);

    // Update or create categories
    for (const mapping of categoryMappings) {
      const existingCategory = existingCategories.find(
        (cat) => cat.name.toLowerCase() === mapping.name.toLowerCase()
      );

      if (existingCategory) {
        // Update existing category
        existingCategory.slug = mapping.slug;
        await existingCategory.save();
        console.log(
          `Updated category: ${mapping.name} with slug: ${mapping.slug}`
        );
      } else {
        // Create new category
        const newCategory = new Category({
          name: mapping.name,
          slug: mapping.slug,
          description: `${mapping.name} furniture items`,
        });
        await newCategory.save();
        console.log(
          `Created new category: ${mapping.name} with slug: ${mapping.slug}`
        );
      }
    }

    // We'll skip the Sofa Beds check since we've already created the individual categories

    // Verify all categories exist with correct slugs
    const updatedCategories = await Category.find();

    console.log("\nFinal categories in database:");
    updatedCategories.forEach((category) => {
      console.log(
        `- ${category.name} (${category._id}) [slug: ${category.slug}]`
      );
    });

    console.log("\nCategory slug update completed");
    process.exit(0);
  } catch (error) {
    console.error("Error updating category slugs:", error.message);
    process.exit(1);
  }
};

// Run the updater
updateCategorySlugs();
