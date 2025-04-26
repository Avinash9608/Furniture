/**
 * Category Controller
 *
 * Handles all category-related operations with robust error handling
 * and guaranteed persistence.
 */

const { MongoClient, ObjectId } = require("mongodb");

// Try to require slugify, but provide a fallback if it's not available
let slugify;
try {
  slugify = require("slugify");
} catch (error) {
  console.warn(
    "Slugify package not found in category controller, using fallback implementation"
  );
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

// Get the MongoDB URI from environment variables
const getMongoURI = () => process.env.MONGO_URI;

/**
 * Create a new category with guaranteed persistence
 */
const createCategory = async (req, res) => {
  console.log("Creating category with data:", req.body);

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Log request details for debugging
    console.log("Category creation request received");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    // Validate required fields
    if (!req.body.name) {
      return res.status(200).json({
        success: false,
        message: "Please provide a category name",
      });
    }

    // Check file size if a file is uploaded
    if (req.file && req.file.size > 5 * 1024 * 1024) {
      // 5MB limit
      return res.status(200).json({
        success: false,
        message: "Image file is too large. Maximum size is 5MB.",
      });
    }

    // Generate a slug from the category name
    let categoryName = req.body.name ? req.body.name.trim() : "";
    let slug = "";

    if (categoryName) {
      // Generate base slug from name using slugify
      slug = slugify(categoryName, {
        lower: true,
        strict: true, // removes special characters
        remove: /[*+~.()'"!:@]/g,
      });

      // If slug is empty after processing, use a fallback
      if (!slug || slug.trim() === "") {
        slug = `category-${Date.now()}`;
      }
    } else {
      // If no name provided, generate a random slug
      slug = `category-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    console.log(`Generated slug: ${slug} for category: ${categoryName}`);

    // Create the category data
    const categoryData = {
      name: categoryName,
      description: req.body.description || "",
      slug: slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Category data to be saved:", categoryData);

    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let savedCategory = null;

    try {
      console.log("Attempting to save category using direct MongoDB driver");

      // Get the MongoDB URI
      const uri = getMongoURI();

      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5,
      };

      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      console.log(`MongoDB connection established to database: ${dbName}`);

      // Check if category with same name already exists
      const categoriesCollection = db.collection("categories");
      const existingCategory = await categoriesCollection.findOne({
        name: { $regex: new RegExp(`^${categoryData.name}$`, "i") },
      });

      if (existingCategory) {
        return res.status(200).json({
          success: false,
          message: "Category with this name already exists",
          data: existingCategory,
        });
      }

      // Insert the category into the categories collection
      console.log("Inserting category into database");

      try {
        const result = await categoriesCollection.insertOne(categoryData);

        if (result.acknowledged) {
          console.log("Category created successfully:", result);

          // Verify the category was saved by fetching it back
          savedCategory = await categoriesCollection.findOne({
            _id: result.insertedId,
          });

          if (!savedCategory) {
            throw new Error("Category verification failed");
          }

          console.log("Category verified in database:", savedCategory._id);
        } else {
          throw new Error("Insert operation not acknowledged");
        }
      } catch (insertError) {
        console.error("Error inserting category:", insertError);

        // Check for duplicate key error
        if (insertError.code === 11000) {
          console.log("Duplicate key error:", insertError.keyValue);

          // Check if it's a duplicate slug
          if (insertError.keyValue && insertError.keyValue.slug) {
            // Try to generate a new unique slug
            const timestamp = Date.now();
            const newSlug = `${categoryData.slug}-${timestamp}`;
            console.log(`Trying with new slug: ${newSlug}`);

            // Update the category data with the new slug
            categoryData.slug = newSlug;

            // Try to insert again with the new slug
            const retryResult = await categoriesCollection.insertOne(
              categoryData
            );

            if (retryResult.acknowledged) {
              console.log(
                "Category created successfully with new slug:",
                retryResult
              );

              // Verify the category was saved by fetching it back
              savedCategory = await categoriesCollection.findOne({
                _id: retryResult.insertedId,
              });

              if (!savedCategory) {
                throw new Error("Category verification failed after retry");
              }

              console.log(
                "Category verified in database after retry:",
                savedCategory._id
              );
            } else {
              throw new Error("Insert operation not acknowledged after retry");
            }
          } else {
            // If it's not a duplicate slug, rethrow the error
            throw insertError;
          }
        } else {
          // If it's not a duplicate key error, rethrow the error
          throw insertError;
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
    }

    // Verify that the category was saved
    if (!savedCategory) {
      throw new Error("Category was not saved");
    }

    // Return success response with consistent structure
    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      method: "direct-mongodb",
      data: {
        _id: savedCategory._id,
        name: savedCategory.name,
        slug: savedCategory.slug,
        description: savedCategory.description || "",
        image: savedCategory.image || null,
        createdAt: savedCategory.createdAt,
        updatedAt: savedCategory.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating category:", error);

    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      console.log("Duplicate key error:", error.keyValue);

      // Check if it's a duplicate slug
      if (error.keyValue && error.keyValue.slug) {
        return res.status(200).json({
          success: false,
          message:
            "A category with a similar name already exists. Please try a different name.",
          error: "Duplicate slug error",
          code: "DUPLICATE_SLUG",
        });
      }

      // Check if it's a duplicate name
      if (error.keyValue && error.keyValue.name) {
        return res.status(200).json({
          success: false,
          message:
            "A category with this exact name already exists. Please use a different name.",
          error: "Duplicate name error",
          code: "DUPLICATE_NAME",
        });
      }

      // Generic duplicate key error
      return res.status(200).json({
        success: false,
        message:
          "This category conflicts with an existing one. Please check your input.",
        error: "Duplicate key error",
        code: "DUPLICATE_KEY",
        duplicateField: Object.keys(error.keyValue)[0],
      });
    }

    // Return error response for other errors
    return res.status(200).json({
      success: false,
      message: error.message || "Error creating category",
      error: error.stack,
    });
  }
};

/**
 * Get all categories with guaranteed retrieval
 */
const getAllCategories = async (req, res) => {
  console.log("Fetching all categories");

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let categories = [];

    try {
      console.log("Attempting to fetch categories using direct MongoDB driver");

      // Get the MongoDB URI
      const uri = getMongoURI();

      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5,
      };

      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      console.log(`MongoDB connection established to database: ${dbName}`);

      // Fetch categories from the categories collection
      console.log("Fetching categories from database");
      const categoriesCollection = db.collection("categories");
      categories = await categoriesCollection
        .find({})
        .sort({ name: 1 })
        .toArray();

      console.log(`Fetched ${categories.length} categories from database`);

      // Count products in each category
      try {
        const productsCollection = db.collection("products");

        for (let i = 0; i < categories.length; i++) {
          const category = categories[i];
          const productCount = await productsCollection.countDocuments({
            category: category._id.toString(),
          });

          categories[i] = {
            ...category,
            productCount,
          };
        }
      } catch (countError) {
        console.error("Error counting products in categories:", countError);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      method: "direct-mongodb",
    });
  } catch (error) {
    console.error("Error fetching categories:", error);

    // Return error response
    return res.status(200).json({
      success: false,
      message: error.message || "Error fetching categories",
      error: error.stack,
      data: [],
    });
  }
};

/**
 * Get category by ID with guaranteed retrieval
 */
const getCategoryById = async (req, res) => {
  const { id } = req.params;
  console.log(`Fetching category with ID: ${id}`);

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let category = null;

    try {
      console.log("Attempting to fetch category using direct MongoDB driver");

      // Get the MongoDB URI
      const uri = getMongoURI();

      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5,
      };

      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      console.log(`MongoDB connection established to database: ${dbName}`);

      // Fetch category from the categories collection
      console.log("Fetching category from database");
      const categoriesCollection = db.collection("categories");

      try {
        category = await categoriesCollection.findOne({
          _id: new ObjectId(id),
        });
      } catch (idError) {
        console.error("Error with ObjectId:", idError);
        category = await categoriesCollection.findOne({ _id: id });
      }

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      console.log("Fetched category from database:", category._id);

      // Count products in this category
      try {
        const productsCollection = db.collection("products");
        const productCount = await productsCollection.countDocuments({
          category: category._id.toString(),
        });

        category.productCount = productCount;
      } catch (countError) {
        console.error("Error counting products in category:", countError);
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: category,
      method: "direct-mongodb",
    });
  } catch (error) {
    console.error("Error fetching category:", error);

    // Return error response
    return res.status(200).json({
      success: false,
      message: error.message || "Error fetching category",
      error: error.stack,
    });
  }
};

/**
 * Update category by ID with guaranteed persistence
 */
const updateCategory = async (req, res) => {
  const { id } = req.params;
  console.log(`Updating category with ID: ${id}`);
  console.log("Update data:", req.body);

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Validate required fields
    if (!req.body.name) {
      return res.status(200).json({
        success: false,
        message: "Please provide a category name",
      });
    }

    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let updatedCategory = null;

    try {
      console.log("Attempting to update category using direct MongoDB driver");

      // Get the MongoDB URI
      const uri = getMongoURI();

      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5,
      };

      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      console.log(`MongoDB connection established to database: ${dbName}`);

      // Fetch the existing category
      const categoriesCollection = db.collection("categories");

      let existingCategory;
      try {
        existingCategory = await categoriesCollection.findOne({
          _id: new ObjectId(id),
        });
      } catch (idError) {
        existingCategory = await categoriesCollection.findOne({ _id: id });
      }

      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Check if another category with the same name already exists
      if (req.body.name !== existingCategory.name) {
        const duplicateCategory = await categoriesCollection.findOne({
          name: { $regex: new RegExp(`^${req.body.name}$`, "i") },
          _id: { $ne: existingCategory._id },
        });

        if (duplicateCategory) {
          return res.status(200).json({
            success: false,
            message: "Another category with this name already exists",
            data: duplicateCategory,
          });
        }
      }

      // Generate a new slug if the name is being updated
      let newName = req.body.name.trim();
      let newSlug = "";

      // Generate base slug from name using slugify
      newSlug = slugify(newName, {
        lower: true,
        strict: true, // removes special characters
        remove: /[*+~.()'"!:@]/g,
      });

      // If slug is empty after processing, use a fallback
      if (!newSlug || newSlug.trim() === "") {
        newSlug = `category-${Date.now()}`;
      }

      // Check if the new slug is different from the existing one
      if (newSlug !== existingCategory.slug) {
        console.log(
          `Updating slug from ${existingCategory.slug} to ${newSlug}`
        );

        // Check if the new slug already exists
        let slugCounter = 1;
        let finalSlug = newSlug;
        let slugExists = true;

        while (slugExists) {
          try {
            // Check if another category has this slug
            const categoryWithSlug = await categoriesCollection.findOne({
              slug: finalSlug,
              _id: { $ne: existingCategory._id },
            });

            if (!categoryWithSlug) {
              // Slug is unique
              slugExists = false;
            } else {
              // Slug exists, try with counter
              finalSlug = `${newSlug}-${slugCounter}`;
              slugCounter++;
            }
          } catch (err) {
            console.error("Error checking slug uniqueness:", err);
            // In case of error, use timestamp to ensure uniqueness
            finalSlug = `${newSlug}-${Date.now()}`;
            slugExists = false;
          }
        }

        newSlug = finalSlug;
      }

      // Create the update data
      const updateData = {
        $set: {
          name: newName,
          description:
            req.body.description || existingCategory.description || "",
          slug: newSlug,
          updatedAt: new Date(),
        },
      };

      console.log("Update data:", updateData);

      // Update the category
      const result = await categoriesCollection.updateOne(
        { _id: existingCategory._id },
        updateData
      );

      if (result.modifiedCount === 1) {
        console.log("Category updated successfully");

        // Fetch the updated category
        updatedCategory = await categoriesCollection.findOne({
          _id: existingCategory._id,
        });

        // Count products in this category
        try {
          const productsCollection = db.collection("products");
          const productCount = await productsCollection.countDocuments({
            category: updatedCategory._id.toString(),
          });

          updatedCategory.productCount = productCount;
        } catch (countError) {
          console.error("Error counting products in category:", countError);
        }
      } else {
        throw new Error("Category update failed");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: updatedCategory,
      method: "direct-mongodb",
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating category:", error);

    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      console.log("Duplicate key error during update:", error.keyValue);

      // Check if it's a duplicate slug
      if (error.keyValue && error.keyValue.slug) {
        return res.status(200).json({
          success: false,
          message:
            "A category with a similar name already exists. Please try a different name.",
          error: "Duplicate slug error",
          code: "DUPLICATE_SLUG",
        });
      }

      // Check if it's a duplicate name
      if (error.keyValue && error.keyValue.name) {
        return res.status(200).json({
          success: false,
          message:
            "A category with this exact name already exists. Please use a different name.",
          error: "Duplicate name error",
          code: "DUPLICATE_NAME",
        });
      }

      // Generic duplicate key error
      return res.status(200).json({
        success: false,
        message:
          "This update conflicts with an existing category. Please check your input.",
        error: "Duplicate key error",
        code: "DUPLICATE_KEY",
        duplicateField: Object.keys(error.keyValue)[0],
      });
    }

    // Return error response for other errors
    return res.status(200).json({
      success: false,
      message: error.message || "Error updating category",
      error: error.stack,
    });
  }
};

/**
 * Delete category by ID with guaranteed deletion
 */
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  console.log(`Deleting category with ID: ${id}`);

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;

    try {
      console.log("Attempting to delete category using direct MongoDB driver");

      // Get the MongoDB URI
      const uri = getMongoURI();

      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5,
      };

      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      console.log(`MongoDB connection established to database: ${dbName}`);

      // Fetch the existing category
      const categoriesCollection = db.collection("categories");

      let existingCategory;
      try {
        existingCategory = await categoriesCollection.findOne({
          _id: new ObjectId(id),
        });
      } catch (idError) {
        existingCategory = await categoriesCollection.findOne({ _id: id });
      }

      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Check if there are products using this category
      const productsCollection = db.collection("products");
      const productCount = await productsCollection.countDocuments({
        category: existingCategory._id.toString(),
      });

      if (productCount > 0) {
        return res.status(200).json({
          success: false,
          message: `Cannot delete category because it is used by ${productCount} products`,
          data: { productCount },
        });
      }

      // Delete the category
      const result = await categoriesCollection.deleteOne({
        _id: existingCategory._id,
      });

      if (result.deletedCount !== 1) {
        throw new Error("Category deletion failed");
      }

      console.log("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      method: "direct-mongodb",
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);

    // Return error response
    return res.status(200).json({
      success: false,
      message: error.message || "Error deleting category",
      error: error.stack,
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
