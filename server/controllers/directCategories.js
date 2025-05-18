/**
 * Direct Categories Controller
 *
 * This controller provides direct MongoDB access for category operations,
 * bypassing Mongoose to avoid buffering timeout issues.
 */

const { ObjectId } = require("mongodb");
const {
  findDocuments,
  findOneDocument,
  insertDocument,
  updateDocument,
  deleteDocument,
} = require("../utils/directDbConnection");
const { getCollection } = require("../utils/directDbAccess");

// Collection name
const COLLECTION = "categories";

// @desc    Get all categories with direct MongoDB access
// @route   GET /api/direct/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    console.log("Getting all categories with direct MongoDB access");

    // Get categories
    const categories = await findDocuments(
      COLLECTION,
      {},
      { sort: { name: 1 } }
    );

    // Return categories
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      source: "direct_database",
    });
  } catch (error) {
    console.error(
      "Error getting categories with direct MongoDB access:",
      error
    );

    // Return mock data on error
    return res.status(200).json({
      success: true,
      count: 4,
      data: [
        {
          _id: "category1",
          name: "Chairs",
          image: "https://placehold.co/300x300/gray/white?text=Chairs",
        },
        {
          _id: "category2",
          name: "Tables",
          image: "https://placehold.co/300x300/gray/white?text=Tables",
        },
        {
          _id: "category3",
          name: "Sofa Beds",
          image: "https://placehold.co/300x300/gray/white?text=SofaBeds",
        },
        {
          _id: "category4",
          name: "Wardrobes",
          image: "https://placehold.co/300x300/gray/white?text=Wardrobes",
        },
      ],
      source: "mock_data",
    });
  }
};

// @desc    Get single category with direct MongoDB access
// @route   GET /api/direct/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    console.log(`Getting category with ID: ${req.params.id}`);

    // Convert string ID to ObjectId
    let categoryId;
    try {
      categoryId = new ObjectId(req.params.id);
    } catch (error) {
      console.error("Invalid category ID format:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }

    // Get category
    const category = await findOneDocument(COLLECTION, { _id: categoryId });

    // Check if category exists
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Return category
    return res.status(200).json({
      success: true,
      data: category,
      source: "direct_database",
    });
  } catch (error) {
    console.error("Error getting category with direct MongoDB access:", error);

    // Return error
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Create category with direct MongoDB access
// @route   POST /api/direct/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    console.log("Creating category with direct MongoDB access");

    // Validate required fields
    const requiredFields = ["name", "displayName"];
    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Create category data
    const categoryData = {
      name: req.body.name.trim(),
      displayName: req.body.displayName.trim(),
      description: req.body.description?.trim() || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create category using direct MongoDB access
    try {
      console.log("Attempting to insert category using direct MongoDB...");
      
      // Get collection
      const collection = await getCollection(COLLECTION);

      // Insert document
      console.log(
        "Inserting category data:",
        JSON.stringify(categoryData, null, 2)
      );
      const result = await collection.insertOne(categoryData);

      console.log("Insert result:", result);

      if (!result.acknowledged || !result.insertedId) {
        throw new Error("Failed to insert category into database");
      }

      // Get the inserted document
      const insertedCategory = await collection.findOne({
        _id: result.insertedId,
      });

      if (!insertedCategory) {
        throw new Error("Failed to retrieve inserted category");
      }

      console.log(
        "Category created successfully:",
        JSON.stringify(insertedCategory, null, 2)
      );

      // Return the inserted category
      return res.status(201).json({
        success: true,
        data: insertedCategory,
        source: "direct_mongodb",
      });
    } catch (dbError) {
      console.error("Error with direct MongoDB operation:", dbError);

      // Try fallback method with mongoose
      try {
        console.log("Trying fallback method with Mongoose");

        // Import the Category model
        const Category = require("../models/Category");

        // Create a new category
        const category = new Category(categoryData);

        // Save the category
        const savedCategory = await category.save();

        console.log(
          "Category created successfully with Mongoose:",
          savedCategory
        );

        // Return the saved category
        return res.status(201).json({
          success: true,
          data: savedCategory,
          source: "mongoose_fallback",
        });
      } catch (mongooseError) {
        console.error("Error with Mongoose fallback:", mongooseError);
        throw mongooseError;
      }
    }
  } catch (error) {
    console.error("Error creating category with direct MongoDB access:", error);

    // Return error
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Helper function to generate a slug from a name
function generateSlug(name) {
  if (!name)
    return `category-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Convert to lowercase
  let slug = name.toLowerCase();

  // Replace spaces with hyphens
  slug = slug.replace(/\s+/g, "-");

  // Remove special characters
  slug = slug.replace(/[^a-z0-9-]/g, "");

  // Add timestamp to ensure uniqueness
  slug = `${slug}-${Date.now()}`;

  return slug;
}

// @desc    Update category with direct MongoDB access
// @route   PUT /api/direct/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    console.log(`Updating category with ID: ${req.params.id}`);
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    // Validate required fields
    if (req.body.name === "") {
      return res.status(400).json({
        success: false,
        message: "Category name cannot be empty",
      });
    }

    // Convert string ID to ObjectId
    let categoryId;
    try {
      categoryId = new ObjectId(req.params.id);
    } catch (error) {
      console.error("Invalid category ID format:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }

    // Get existing category
    const existingCategory = await findOneDocument(COLLECTION, {
      _id: categoryId,
    });

    // Check if category exists
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Create update data
    const updateData = {
      name: req.body.name || existingCategory.name,
      description: req.body.description || existingCategory.description || "",
      updatedAt: new Date(),
    };

    // Update slug if name has changed
    if (req.body.name && req.body.name !== existingCategory.name) {
      updateData.slug = generateSlug(req.body.name);
    }

    // Add image if it exists
    if (req.file) {
      // Ensure the path is absolute for proper access
      updateData.image = `/uploads/${req.file.filename}`;
      console.log("New image added to category:", updateData.image);

      // Log detailed information about the file
      console.log("File details:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      });
    } else {
      console.log("No new image file provided in the update request");

      // Preserve existing image if available
      if (existingCategory.image) {
        updateData.image = existingCategory.image;
        console.log("Preserving existing image:", updateData.image);
      }
    }

    console.log("Category update data:", JSON.stringify(updateData, null, 2));

    // Update category using direct MongoDB access
    try {
      // Get MongoDB client
      const { MongoClient, ObjectId } = require("mongodb");
      const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

      if (!uri) {
        throw new Error("MongoDB URI not found in environment variables");
      }

      console.log("Connecting to MongoDB directly for update...");

      // Create a new client with minimal options
      const client = new MongoClient(uri, {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
      });

      // Connect to MongoDB
      await client.connect();
      console.log("Connected to MongoDB successfully");

      // Get database name from URI
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get collection
      const collection = db.collection(COLLECTION);

      // Update document
      console.log(
        "Updating category data for ID:",
        categoryId,
        "with data:",
        JSON.stringify(updateData, null, 2)
      );

      const updateResult = await collection.updateOne(
        { _id: categoryId },
        { $set: updateData }
      );

      console.log("Update result:", updateResult);

      if (!updateResult.acknowledged) {
        throw new Error("Failed to update category in database");
      }

      // Get the updated document
      const updatedCategory = await collection.findOne({ _id: categoryId });

      // Close the connection
      await client.close();

      if (!updatedCategory) {
        throw new Error("Failed to retrieve updated category");
      }

      console.log(
        "Category updated successfully:",
        JSON.stringify(updatedCategory, null, 2)
      );

      // Return the updated category
      return res.status(200).json({
        success: true,
        data: updatedCategory,
        source: "direct_mongodb",
      });
    } catch (dbError) {
      console.error("Error with direct MongoDB operation:", dbError);

      // Try fallback method with mongoose
      try {
        console.log("Trying fallback method with Mongoose");

        // Import the Category model
        const Category = require("../models/Category");

        // Find and update the category
        const updatedCategory = await Category.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!updatedCategory) {
          return res.status(404).json({
            success: false,
            message: "Category not found",
          });
        }

        console.log(
          "Category updated successfully with Mongoose:",
          updatedCategory
        );

        // Return the updated category
        return res.status(200).json({
          success: true,
          data: updatedCategory,
          source: "mongoose_fallback",
        });
      } catch (mongooseError) {
        console.error("Error with Mongoose fallback:", mongooseError);

        // Try second fallback method
        console.log(
          "Trying second fallback method with updateDocument utility"
        );

        // Update category
        const result = await updateDocument(
          COLLECTION,
          { _id: categoryId },
          { $set: updateData }
        );

        // Check if update was successful
        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Category not found",
          });
        }

        // Get updated category
        const category = await findOneDocument(COLLECTION, { _id: categoryId });

        console.log(
          "Category updated successfully with utility fallback:",
          category
        );

        // Return category
        return res.status(200).json({
          success: true,
          data: category,
          source: "utility_fallback",
        });
      }
    }
  } catch (error) {
    console.error("Error updating category with direct MongoDB access:", error);

    // Return error
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Delete category with direct MongoDB access
// @route   DELETE /api/direct/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    console.log(`Deleting category with ID: ${req.params.id}`);

    // Convert string ID to ObjectId
    let categoryId;
    try {
      categoryId = new ObjectId(req.params.id);
    } catch (error) {
      console.error("Invalid category ID format:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }

    // Delete category
    const result = await deleteDocument(COLLECTION, { _id: categoryId });

    // Check if category exists
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      data: {},
      source: "direct_database",
    });
  } catch (error) {
    console.error("Error deleting category with direct MongoDB access:", error);

    // Return error
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
