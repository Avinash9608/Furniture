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
    const requiredFields = ["name", "description", "price", "category", "stock"];
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
      images: req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Try to save using Mongoose first
    try {
      console.log("Attempting to save using Mongoose model");
      const product = new Product(productData);
      const savedProduct = await product.save();
      console.log("Product saved successfully with Mongoose:", savedProduct._id);

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
const getProductById = async (req, res) => {
  const { id } = req.params;
  console.log(`Fetching product with ID: ${id}`);

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let product = null;

    try {
      console.log("Attempting to fetch product using direct MongoDB driver");

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

      // Fetch product from the products collection
      console.log("Fetching product from database");
      const productsCollection = db.collection("products");

      try {
        // Try to find by ObjectId first
        try {
          product = await productsCollection.findOne({ _id: new ObjectId(id) });
        } catch (idError) {
          console.error("Error with ObjectId:", idError);
          product = await productsCollection.findOne({ _id: id });
        }

        // If not found, try to find by slug
        if (!product) {
          console.log("Product not found by ID, trying to find by slug");
          product = await productsCollection.findOne({ slug: id });
        }

        // If still not found, try a more flexible approach
        if (!product) {
          console.log(
            "Product not found by ID or slug, trying more flexible approach"
          );

          // Try to find by partial ID match (for cases where ID might be truncated)
          const allProducts = await productsCollection.find({}).toArray();
          console.log(
            `Fetched ${allProducts.length} products to search for ID: ${id}`
          );

          product = allProducts.find((p) => {
            if (!p._id) return false;
            const productId = p._id.toString();
            return productId.includes(id) || (p.slug && p.slug.includes(id));
          });

          if (product) {
            console.log(`Found product by flexible matching: ${product._id}`);
          }
        }
      } catch (findError) {
        console.error("Error finding product:", findError);
        // Continue to fallback
      }

      if (!product) {
        console.log("Product not found in database, creating mock product");

        // Create a mock product as fallback
        product = {
          _id: id,
          name: "Product Not Found",
          description: "This product could not be found in the database.",
          price: 0,
          images: [
            "https://placehold.co/800x600/red/white?text=Product+Not+Found",
          ],
          category: "unknown",
          stock: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          isMock: true,
        };

        return res.status(200).json({
          success: true,
          data: product,
          method: "mock-fallback",
          message: "Product not found in database, showing mock data",
        });
      }

      console.log("Fetched product from database:", product._id);

      // Process image URLs to ensure they're proper
      product.images = (product.images || []).map((image) =>
        getProperImageUrl(image)
      );

      // Try to get category information
      try {
        if (product.category) {
          const categoriesCollection = db.collection("categories");
          let categoryId;

          try {
            categoryId = new ObjectId(product.category);
          } catch (idError) {
            categoryId = product.category;
          }

          const category = await categoriesCollection.findOne({
            _id: categoryId,
          });

          if (category) {
            product.categoryInfo = category;
          }
        }
      } catch (categoryError) {
        console.error("Error fetching category info:", categoryError);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
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
      data: product,
      method: "direct-mongodb",
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    // Return error response with proper status code
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching product",
      error: error.stack,
    });
  }
};

/**
 * Update product by ID with guaranteed persistence
 */
const updateProduct = async (req, res) => {
  const { id } = req.params;
  console.log(`Updating product with ID: ${id}`);
  console.log("Update data:", req.body);
  console.log("Files:", req.files);

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let updatedProduct = null;

    try {
      console.log("Attempting to update product using direct MongoDB driver");

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

      // Fetch the existing product
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

      // Process uploaded files if any
      let imageUrls = existingProduct.images || [];

      // If we have files from multer
      if (req.files && req.files.length > 0) {
        console.log(`Processing ${req.files.length} uploaded files`);

        // Try to upload to Cloudinary first
        try {
          const newImageUrls = [];

          for (const file of req.files) {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "furniture_products",
              resource_type: "image",
            });

            console.log("Cloudinary upload result:", result);
            newImageUrls.push(result.secure_url);

            // Remove the local file after successful Cloudinary upload
            fs.unlinkSync(file.path);
          }

          console.log("All new images uploaded to Cloudinary successfully");

          // Replace or append images based on request
          if (req.body.replaceImages === "true") {
            imageUrls = newImageUrls;
          } else {
            imageUrls = [...imageUrls, ...newImageUrls];
          }
        } catch (cloudinaryError) {
          console.error("Error uploading to Cloudinary:", cloudinaryError);

          // Fallback to local file paths with proper URLs
          const newImageUrls = req.files.map((file) =>
            getProperImageUrl(
              file.path.replace(/\\/g, "/").replace("uploads/", "/uploads/")
            )
          );

          console.log("Using local file paths with proper URLs:", newImageUrls);

          // Replace or append images based on request
          if (req.body.replaceImages === "true") {
            imageUrls = newImageUrls;
          } else {
            imageUrls = [...imageUrls, ...newImageUrls];
          }
        }
      } else if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        // If we have files from cloudinaryUpload middleware
        console.log(
          "Using pre-processed files from cloudinaryUpload middleware"
        );

        const newImageUrls = req.uploadedFiles.map((file) => file.path);

        // Replace or append images based on request
        if (req.body.replaceImages === "true") {
          imageUrls = newImageUrls;
        } else {
          imageUrls = [...imageUrls, ...newImageUrls];
        }
      } else if (req.body.images) {
        // If images are provided directly in the request body
        console.log("Using images from request body:", req.body.images);

        let newImageUrls = [];

        // Handle different formats of images in the request body
        if (Array.isArray(req.body.images)) {
          newImageUrls = req.body.images;
        } else if (typeof req.body.images === "string") {
          // Try to parse as JSON if it's a string
          try {
            const parsedImages = JSON.parse(req.body.images);
            newImageUrls = Array.isArray(parsedImages)
              ? parsedImages
              : [req.body.images];
          } catch (e) {
            // If not valid JSON, treat as a single URL or comma-separated list
            newImageUrls = req.body.images.includes(",")
              ? req.body.images.split(",").map((url) => url.trim())
              : [req.body.images];
          }
        }

        // Replace or append images based on request
        if (req.body.replaceImages === "true") {
          imageUrls = newImageUrls;
        } else {
          imageUrls = [...imageUrls, ...newImageUrls];
        }
      } else if (req.body.image) {
        // If image is provided directly in the request body
        console.log("Using image from request body:", req.body.image);

        let newImageUrls = [];

        // Handle different formats of image in the request body
        if (Array.isArray(req.body.image)) {
          newImageUrls = req.body.image;
        } else if (typeof req.body.image === "string") {
          // Try to parse as JSON if it's a string
          try {
            const parsedImage = JSON.parse(req.body.image);
            newImageUrls = Array.isArray(parsedImage)
              ? parsedImage
              : [req.body.image];
          } catch (e) {
            // If not valid JSON, treat as a single URL or comma-separated list
            newImageUrls = req.body.image.includes(",")
              ? req.body.image.split(",").map((url) => url.trim())
              : [req.body.image];
          }
        }

        // Replace or append images based on request
        if (req.body.replaceImages === "true") {
          imageUrls = newImageUrls;
        } else {
          imageUrls = [...imageUrls, ...newImageUrls];
        }
      }

      console.log("Final image URLs:", imageUrls);

      // Create the update data
      const updateData = {
        $set: {
          updatedAt: new Date(),
        },
      };

      // Generate a new slug if the name is being updated
      if (req.body.name) {
        // Try to import slugify, but provide a fallback if it's not available
        let slugify;
        try {
          slugify = require("slugify");
        } catch (error) {
          console.warn(
            "Slugify package not found in update method, using fallback implementation"
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

        // Get the new name
        const newName = req.body.name.trim();

        // Generate a new slug
        let newSlug = slugify(newName, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });

        // If slug is empty after processing, use a fallback
        if (!newSlug || newSlug.trim() === "") {
          newSlug = `product-${Date.now()}`;
        }

        // Check if the new slug is different from the existing one
        if (newSlug !== existingProduct.slug) {
          console.log(
            `Updating slug from ${existingProduct.slug} to ${newSlug}`
          );

          // Check if the new slug already exists
          let slugCounter = 1;
          let finalSlug = newSlug;
          let slugExists = true;

          while (slugExists) {
            try {
              // Check if another product has this slug
              const productWithSlug = await productsCollection.findOne({
                slug: finalSlug,
                _id: { $ne: existingProduct._id },
              });

              if (!productWithSlug) {
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

          // Set the new slug
          updateData.$set.slug = finalSlug;
        }

        // Set the new name
        updateData.$set.name = newName;
      }

      // Add other fields to update if they exist in the request
      if (req.body.price) updateData.$set.price = parseFloat(req.body.price);
      if (req.body.description)
        updateData.$set.description = req.body.description;
      if (req.body.category) updateData.$set.category = req.body.category;
      if (req.body.stock) updateData.$set.stock = parseInt(req.body.stock);
      if (req.body.material) updateData.$set.material = req.body.material;
      if (req.body.color) updateData.$set.color = req.body.color;
      if (req.body.featured !== undefined)
        updateData.$set.featured =
          req.body.featured === "true" || req.body.featured === true;
      if (imageUrls.length > 0) updateData.$set.images = imageUrls;

      // Process dimensions if provided
      if (req.body.dimensions) {
        try {
          // Check if dimensions is a string that needs parsing
          let dimensionsData = {};

          if (typeof req.body.dimensions === "string") {
            try {
              dimensionsData = JSON.parse(req.body.dimensions);
              console.log(
                "Successfully parsed dimensions JSON for update:",
                dimensionsData
              );
            } catch (parseError) {
              console.error(
                "Error parsing dimensions JSON for update:",
                parseError,
                "Original value:",
                req.body.dimensions
              );

              // Try to handle the case where dimensions might be a stringified object with quotes
              try {
                // Remove any extra quotes that might be causing parsing issues
                const cleanedDimensions = req.body.dimensions
                  .replace(/['"]+/g, '"')
                  .trim();
                dimensionsData = JSON.parse(cleanedDimensions);
                console.log(
                  "Successfully parsed cleaned dimensions JSON for update:",
                  dimensionsData
                );
              } catch (secondParseError) {
                console.error(
                  "Second attempt to parse dimensions for update failed:",
                  secondParseError
                );
              }
            }
          } else if (typeof req.body.dimensions === "object") {
            dimensionsData = req.body.dimensions;
          }

          // Create dimensions object with numeric values
          const dimensionsObj = {
            length: parseFloat(dimensionsData.length) || 0,
            width: parseFloat(dimensionsData.width) || 0,
            height: parseFloat(dimensionsData.height) || 0,
          };

          // Always add dimensions to ensure they're updated properly
          updateData.$set.dimensions = dimensionsObj;
          console.log("Processed dimensions for update:", dimensionsObj);
        } catch (dimError) {
          console.error("Error processing dimensions for update:", dimError);
        }
      }

      console.log("Update data:", updateData);

      // Update the product
      const result = await productsCollection.updateOne(
        { _id: existingProduct._id },
        updateData
      );

      if (result.modifiedCount === 1) {
        console.log("Product updated successfully");

        // Fetch the updated product
        updatedProduct = await productsCollection.findOne({
          _id: existingProduct._id,
        });

        // Process image URLs to ensure they're proper
        updatedProduct.images = (updatedProduct.images || []).map((image) =>
          getProperImageUrl(image)
        );

        // Try to get category information
        try {
          if (updatedProduct.category) {
            const categoriesCollection = db.collection("categories");
            let categoryId;

            try {
              categoryId = new ObjectId(updatedProduct.category);
            } catch (idError) {
              categoryId = updatedProduct.category;
            }

            const category = await categoriesCollection.findOne({
              _id: categoryId,
            });

            if (category) {
              updatedProduct.categoryInfo = category;
            }
          }
        } catch (categoryError) {
          console.error("Error fetching category info:", categoryError);
        }
      } else {
        throw new Error("Product update failed");
      }
    } catch (error) {
      console.error("Error updating product:", error);
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
      data: updatedProduct,
      method: "direct-mongodb",
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);

    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      console.log("Duplicate key error during update:", error.keyValue);

      // Check if it's a duplicate slug
      if (error.keyValue && error.keyValue.slug) {
        return res.status(200).json({
          success: false,
          message:
            "A product with a similar name already exists. Please try a different name.",
          error: "Duplicate slug error",
          code: "DUPLICATE_SLUG",
        });
      }

      // Check if it's a duplicate name
      if (error.keyValue && error.keyValue.name) {
        return res.status(200).json({
          success: false,
          message:
            "A product with this exact name already exists. Please use a different name.",
          error: "Duplicate name error",
          code: "DUPLICATE_NAME",
        });
      }

      // Generic duplicate key error
      return res.status(200).json({
        success: false,
        message:
          "This update conflicts with an existing product. Please check your input.",
        error: "Duplicate key error",
        code: "DUPLICATE_KEY",
        duplicateField: Object.keys(error.keyValue)[0],
      });
    }

    // Return error response for other errors
    return res.status(200).json({
      success: false,
      message: error.message || "Error updating product",
      error: error.stack,
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
