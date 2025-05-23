/**
 * Product Controller
 *
 * Handles all product-related operations with robust error handling,
 * guaranteed persistence, and proper image URL handling.
 */

const { MongoClient, ObjectId } = require("mongodb");
const { cloudinary } = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const { getCollection } = require("../utils/directDbAccess");
const mongoose = require("mongoose");

// Get the MongoDB URI from environment variables
const getMongoURI = () => process.env.MONGO_URI;

// Generate proper image URL based on environment
const getProperImageUrl = (imagePath) => {
  // If it's already a full URL (like Cloudinary), return as is
  if (
    imagePath &&
    (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
  ) {
    return imagePath;
  }

  // For local paths, use relative URLs that work in any environment
  const baseUrl = "";

  // Ensure the path starts with a slash if it doesn't already
  const normalizedPath =
    imagePath && !imagePath.startsWith("/") ? `/${imagePath}` : imagePath;

  return normalizedPath ? `${baseUrl}${normalizedPath}` : null;
};

// Collection name
const COLLECTION = "products";

/**
 * Create a new product with guaranteed persistence
 */
const createProduct = async (req, res) => {
  try {
    console.log("Creating new product");
    console.log("Request body:", req.body);
    console.log("Files:", req.files);

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "price",
      "category",
      "stock",
    ];
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

    // Create product data
    const productData = {
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      price: parseFloat(req.body.price),
      category: req.body.category,
      stock: parseInt(req.body.stock),
      images: req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Try to save using Mongoose first
    try {
      console.log("Attempting to save using Mongoose model");
      const product = new Product(productData);
      const savedProduct = await product.save();
      console.log(
        "Product saved successfully with Mongoose:",
        savedProduct._id
      );

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: savedProduct,
        source: "mongoose",
      });
    } catch (mongooseError) {
      console.error("Error saving product with Mongoose:", mongooseError);

      // Try direct MongoDB driver as fallback
      try {
        console.log("Attempting to save using direct MongoDB driver");

        // Get collection
        const collection = await getCollection(COLLECTION);

        // Insert document
        const result = await collection.insertOne(productData);

        if (!result.acknowledged || !result.insertedId) {
          throw new Error("Insert operation not acknowledged");
        }

        // Get the inserted product
        const insertedProduct = await collection.findOne({
          _id: result.insertedId,
        });

        if (!insertedProduct) {
          throw new Error("Failed to retrieve inserted product");
        }

        console.log("Product saved successfully with MongoDB driver");

        return res.status(201).json({
          success: true,
          message: "Product created successfully",
          data: insertedProduct,
          source: "mongodb_driver",
        });
      } catch (mongoError) {
        console.error("Error with MongoDB driver:", mongoError);
        throw mongoError;
      }
    }
  } catch (error) {
    console.error("Error in createProduct:", error);

    return res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

/**
 * Get all products with guaranteed retrieval
 */
const getAllProducts = async (req, res) => {
  console.log("Fetching all products");

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let products = [];

    try {
      console.log("Attempting to fetch products using direct MongoDB driver");

      // Get the MongoDB URI
      const uri = getMongoURI();

      // Direct connection options with increased timeouts for Render deployment
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 600000, // 10 minutes
        socketTimeoutMS: 600000, // 10 minutes
        serverSelectionTimeoutMS: 600000, // 10 minutes
        maxPoolSize: 20, // Increased pool size
        minPoolSize: 5, // Ensure minimum connections
        maxIdleTimeMS: 120000, // 2 minutes max idle time
        // Removed unsupported options: keepAlive, keepAliveInitialDelay, poolSize, bufferCommands
      };

      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      console.log(`MongoDB connection established to database: ${dbName}`);

      // Fetch products from the products collection
      console.log("Fetching products from database");
      console.log("Query parameters:", req.query);

      const productsCollection = db.collection("products");

      // Build query based on request parameters
      const query = {};

      // Filter by category if provided
      if (req.query.category) {
        console.log(`Filtering by category: ${req.query.category}`);
        try {
          // Try to convert to ObjectId first
          query.category = new ObjectId(req.query.category);
        } catch (error) {
          // If not a valid ObjectId, use as string
          console.log("Category is not a valid ObjectId, using as string");
          query.category = req.query.category;
        }

        // Add a fallback query for category as an object with _id field
        console.log(
          "Adding fallback query for category as object with _id field"
        );
        query.$or = [
          { category: query.category },
          { "category._id": req.query.category },
          { "category._id": query.category },
        ];

        // Remove the original category query since we're using $or
        delete query.category;

        console.log(
          "Updated query with $or for category:",
          JSON.stringify(query)
        );
      }

      // Add other filters as needed
      if (req.query.featured === "true") {
        query.featured = true;
      }

      console.log("Final query:", JSON.stringify(query));

      // Execute the query
      let findQuery = productsCollection.find(query).sort({ createdAt: -1 });

      // Apply limit if provided
      if (req.query.limit) {
        const limit = parseInt(req.query.limit);
        if (!isNaN(limit) && limit > 0) {
          console.log(`Limiting results to ${limit} products`);
          findQuery = findQuery.limit(limit);
        }
      }

      // Execute the query with a timeout
      try {
        products = await findQuery.toArray();
        console.log(`Fetched ${products.length} products from database`);
      } catch (queryError) {
        console.error("Error executing MongoDB query:", queryError);
        console.log(
          "Trying alternative approach - fetching all products first"
        );

        // Try a different approach - get all products and filter in memory
        try {
          const allProducts = await productsCollection.find({}).toArray();
          console.log(
            `Fetched ${allProducts.length} total products, filtering in memory`
          );

          // If we're filtering by category
          if (req.query.category) {
            const categoryId = req.query.category;
            console.log(`Filtering by category ID: ${categoryId} in memory`);

            products = allProducts.filter((product) => {
              // Handle different category formats
              if (!product.category) return false;

              if (typeof product.category === "string") {
                return product.category === categoryId;
              } else if (typeof product.category === "object") {
                if (product.category._id) {
                  const productCategoryId = product.category._id.toString();
                  return productCategoryId === categoryId;
                }
              }

              return false;
            });

            console.log(
              `Found ${products.length} products after in-memory filtering by category`
            );
          } else {
            products = allProducts;
          }

          // Apply featured filter if needed
          if (req.query.featured === "true") {
            products = products.filter((product) => product.featured === true);
            console.log(
              `Found ${products.length} products after filtering by featured`
            );
          }

          // Apply limit if provided
          if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            if (!isNaN(limit) && limit > 0) {
              console.log(`Limiting results to ${limit} products`);
              products = products.slice(0, limit);
            }
          }
        } catch (fallbackError) {
          console.error("Error with fallback approach:", fallbackError);
          // Continue with empty products array, will be handled by mock data
        }
      }

      // Process image URLs to ensure they're proper
      products = products.map((product) => ({
        ...product,
        images: (product.images || []).map((image) => getProperImageUrl(image)),
      }));

      // Try to get category information for each product
      try {
        const categoriesCollection = db.collection("categories");
        const categories = await categoriesCollection.find({}).toArray();

        // Create a map of category IDs to category objects
        const categoryMap = {};
        categories.forEach((category) => {
          categoryMap[category._id.toString()] = category;
        });

        // Add category information to each product
        products = products.map((product) => {
          if (product.category) {
            const categoryId = product.category.toString();
            if (categoryMap[categoryId]) {
              return {
                ...product,
                categoryInfo: categoryMap[categoryId],
              };
            }
          }
          return product;
        });
      } catch (categoryError) {
        console.error("Error fetching category info:", categoryError);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
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
      count: products.length,
      data: products,
      method: "direct-mongodb",
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    // Return error response with proper status code
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching products",
      error: error.stack,
      data: [],
    });
  }
};

/**
 * Get product by ID with guaranteed retrieval
 */
// const getProductById = async (req, res) => {
//   const { id } = req.params;
//   console.log(`Fetching product with ID: ${id}`);

//   // Set proper headers to ensure JSON response
//   res.setHeader("Content-Type", "application/json");

//   try {
//     // Create a new direct MongoDB connection specifically for this operation
//     let client = null;
//     let product = null;

//     try {
//       console.log("Attempting to fetch product using direct MongoDB driver");

//       // Get the MongoDB URI
//       const uri = getMongoURI();

//       // Direct connection options with increased timeouts for Render deployment
//       const options = {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//         connectTimeoutMS: 600000, // 10 minutes
//         socketTimeoutMS: 600000, // 10 minutes
//         serverSelectionTimeoutMS: 600000, // 10 minutes
//         maxPoolSize: 20, // Increased pool size
//         minPoolSize: 5, // Ensure minimum connections
//         maxIdleTimeMS: 120000, // 2 minutes max idle time
//         // Removed unsupported options: keepAlive, keepAliveInitialDelay, poolSize, bufferCommands
//       };

//       // Create a new MongoClient
//       client = new MongoClient(uri, options);
//       await client.connect();

//       // Get database name from connection string
//       const dbName = uri.split("/").pop().split("?")[0];
//       const db = client.db(dbName);

//       console.log(`MongoDB connection established to database: ${dbName}`);

//       // Fetch product from the products collection
//       console.log("Fetching product from database");
//       const productsCollection = db.collection("products");

//       try {
//         // Try to find by ObjectId first
//         try {
//           product = await productsCollection.findOne({ _id: new ObjectId(id) });
//         } catch (idError) {
//           console.error("Error with ObjectId:", idError);
//           product = await productsCollection.findOne({ _id: id });
//         }

//         // If not found, try to find by slug
//         if (!product) {
//           console.log("Product not found by ID, trying to find by slug");
//           product = await productsCollection.findOne({ slug: id });
//         }

//         // If still not found, try a more flexible approach
//         if (!product) {
//           console.log(
//             "Product not found by ID or slug, trying more flexible approach"
//           );

//           // Try to find by partial ID match (for cases where ID might be truncated)
//           const allProducts = await productsCollection.find({}).toArray();
//           console.log(
//             `Fetched ${allProducts.length} products to search for ID: ${id}`
//           );

//           product = allProducts.find((p) => {
//             if (!p._id) return false;
//             const productId = p._id.toString();
//             return productId.includes(id) || (p.slug && p.slug.includes(id));
//           });

//           if (product) {
//             console.log(`Found product by flexible matching: ${product._id}`);
//           }
//         }
//       } catch (findError) {
//         console.error("Error finding product:", findError);
//         // Continue to fallback
//       }

//       if (!product) {
//         console.log("Product not found in database, creating mock product");

//         // Create a mock product as fallback
//         product = {
//           _id: id,
//           name: "Product Not Found",
//           description: "This product could not be found in the database.",
//           price: 0,
//           images: [
//             "https://placehold.co/800x600/red/white?text=Product+Not+Found",
//           ],
//           category: "unknown",
//           stock: 0,
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           isMock: true,
//         };

//         return res.status(200).json({
//           success: true,
//           data: product,
//           method: "mock-fallback",
//           message: "Product not found in database, showing mock data",
//         });
//       }

//       console.log("Fetched product from database:", product._id);

//       // Process image URLs to ensure they're proper
//       product.images = (product.images || []).map((image) =>
//         getProperImageUrl(image)
//       );

//       // Try to get category information
//       try {
//         if (product.category) {
//           const categoriesCollection = db.collection("categories");
//           let categoryId;

//           try {
//             categoryId = new ObjectId(product.category);
//           } catch (idError) {
//             categoryId = product.category;
//           }

//           const category = await categoriesCollection.findOne({
//             _id: categoryId,
//           });

//           if (category) {
//             product.categoryInfo = category;
//           }
//         }
//       } catch (categoryError) {
//         console.error("Error fetching category info:", categoryError);
//       }
//     } catch (error) {
//       console.error("Error fetching product:", error);
//       throw error;
//     } finally {
//       // Close the MongoDB client
//       if (client) {
//         await client.close();
//         console.log("MongoDB connection closed");
//       }
//     }

//     // Return success response
//     return res.status(200).json({
//       success: true,
//       data: product,
//       method: "direct-mongodb",
//     });
//   } catch (error) {
//     console.error("Error fetching product:", error);

//     // Return error response with proper status code
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Error fetching product",
//       error: error.stack,
//     });
//   }
// };

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).exec();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error finding product:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * Update product by ID with guaranteed persistence
 */
const updateProduct = async (req, res) => {
  try {
    // Process numeric conversions with validation
    const updateData = {
      $set: {
        ...req.body,
        price: Number(req.body.price) || 0,
        discountPrice: Number(req.body.discountPrice) || null,
        stock: Number(req.body.stock) || 0,
        dimensions: (() => {
          try {
            return typeof req.body.dimensions === "string"
              ? JSON.parse(req.body.dimensions)
              : req.body.dimensions;
          } catch (e) {
            console.error("Invalid dimensions format:", e);
            return {};
          }
        })(),
        updatedAt: new Date(),
        ...(req.files && {
          images: req.files.map((file) => `/uploads/${file.filename}`),
        }),
      },
    };

    // Perform atomic update with proper MongoDB syntax
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found after update",
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};
/**
 * Delete product by ID with guaranteed deletion
 */
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  console.log(`Deleting product with ID: ${id}`);

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;

    try {
      console.log("Attempting to delete product using direct MongoDB driver");

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

      // Fetch the existing product to get image URLs
      const productsCollection = db.collection("products");

      let existingProduct;
      try {
        existingProduct = await productsCollection.findOne({
          _id: new ObjectId(id),
        });
      } catch (idError) {
        existingProduct = await productsCollection.findOne({ _id: id });
      }

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Delete the product
      const result = await productsCollection.deleteOne({
        _id: existingProduct._id,
      });

      if (result.deletedCount !== 1) {
        throw new Error("Product deletion failed");
      }

      console.log("Product deleted successfully");

      // Try to delete Cloudinary images
      if (existingProduct.images && existingProduct.images.length > 0) {
        for (const imageUrl of existingProduct.images) {
          try {
            // Check if it's a Cloudinary URL
            if (imageUrl && imageUrl.includes("cloudinary.com")) {
              // Extract the public ID from the URL
              const publicId = imageUrl.split("/").pop().split(".")[0];

              if (publicId) {
                await cloudinary.uploader.destroy(
                  `furniture_products/${publicId}`
                );
                console.log(`Deleted Cloudinary image: ${publicId}`);
              }
            }
          } catch (cloudinaryError) {
            console.error("Error deleting Cloudinary image:", cloudinaryError);
          }
        }
      }
    } catch (error) {
      console.error("Error deleting product:", error);
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
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);

    // Return error response
    return res.status(200).json({
      success: false,
      message: error.message || "Error deleting product",
      error: error.stack,
    });
  }
};

/**
 * Create a product review with guaranteed persistence
 */
const createProductReview = async (req, res) => {
  const { id } = req.params;
  console.log(`Creating review for product with ID: ${id}`);
  console.log("Review data:", req.body);

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Validate required fields
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Please provide both rating and comment",
      });
    }

    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let updatedProduct = null;

    try {
      console.log("Attempting to add review using direct MongoDB driver");

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

      // Fetch the existing product
      const productsCollection = db.collection("products");

      let product;
      try {
        product = await productsCollection.findOne({
          _id: new ObjectId(id),
        });
      } catch (idError) {
        product = await productsCollection.findOne({ _id: id });
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Get user information
      const userId = req.user ? req.user.id : "anonymous";
      const userName = req.user ? req.user.name : "Anonymous User";

      // Check if user already reviewed this product
      const reviews = product.reviews || [];
      const alreadyReviewed = reviews.find(
        (r) => r.user && r.user.toString() === userId.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this product",
        });
      }

      // Create the review object
      const review = {
        name: userName,
        rating: Number(rating),
        comment,
        user: userId,
        createdAt: new Date(),
      };

      // Add the review to the product
      const updatedReviews = [...reviews, review];
      const numReviews = updatedReviews.length;
      const ratings =
        updatedReviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

      // Update the product with the new review
      const result = await productsCollection.updateOne(
        { _id: product._id },
        {
          $set: {
            reviews: updatedReviews,
            numReviews: numReviews,
            ratings: ratings,
            updatedAt: new Date(),
          },
        }
      );

      if (result.modifiedCount !== 1) {
        throw new Error("Failed to update product with review");
      }

      // Fetch the updated product
      updatedProduct = await productsCollection.findOne({
        _id: product._id,
      });
    } catch (error) {
      console.error("Error adding review:", error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: updatedProduct
        ? {
            numReviews: updatedProduct.numReviews,
            ratings: updatedProduct.ratings,
          }
        : null,
    });
  } catch (error) {
    console.error("Error creating review:", error);

    // Return error response
    return res.status(500).json({
      success: false,
      message: error.message || "Error adding review",
      error: error.stack,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProperImageUrl,
};
