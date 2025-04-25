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

  // For local paths, generate the proper URL based on environment
  const isProduction = process.env.NODE_ENV === "production";
  const baseUrl = isProduction
    ? process.env.BASE_URL || "https://furniture-q3nb.onrender.com"
    : "http://localhost:5000";

  // Ensure the path starts with a slash if it doesn't already
  const normalizedPath =
    imagePath && !imagePath.startsWith("/") ? `/${imagePath}` : imagePath;

  return normalizedPath ? `${baseUrl}${normalizedPath}` : null;
};

/**
 * Create a new product with guaranteed persistence
 */
const createProduct = async (req, res) => {
  console.log("Creating product with data:", req.body);
  console.log("Files:", req.files);

  // Set proper headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  try {
    // Validate required fields
    if (!req.body.name || !req.body.price || !req.body.category) {
      return res.status(200).json({
        success: false,
        message: "Please provide name, price, and category",
      });
    }

    // Process uploaded files if any
    let imageUrls = [];

    // If we have files from multer
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files`);

      // Try to upload to Cloudinary first
      try {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "furniture_products",
            resource_type: "image",
          });

          console.log("Cloudinary upload result:", result);
          imageUrls.push(result.secure_url);

          // Remove the local file after successful Cloudinary upload
          fs.unlinkSync(file.path);
        }

        console.log("All images uploaded to Cloudinary successfully");
      } catch (cloudinaryError) {
        console.error("Error uploading to Cloudinary:", cloudinaryError);

        // Fallback to local file paths with proper URLs
        imageUrls = req.files.map((file) =>
          getProperImageUrl(
            file.path.replace(/\\/g, "/").replace("uploads/", "/uploads/")
          )
        );
        console.log("Using local file paths with proper URLs:", imageUrls);
      }
    } else if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      // If we have files from cloudinaryUpload middleware
      console.log("Using pre-processed files from cloudinaryUpload middleware");
      imageUrls = req.uploadedFiles.map((file) => file.path);
    } else if (req.body.images) {
      // If images are provided directly in the request body
      console.log("Using images from request body:", req.body.images);

      // Handle different formats of images in the request body
      if (Array.isArray(req.body.images)) {
        imageUrls = req.body.images;
      } else if (typeof req.body.images === "string") {
        // Try to parse as JSON if it's a string
        try {
          const parsedImages = JSON.parse(req.body.images);
          imageUrls = Array.isArray(parsedImages)
            ? parsedImages
            : [req.body.images];
        } catch (e) {
          // If not valid JSON, treat as a single URL or comma-separated list
          imageUrls = req.body.images.includes(",")
            ? req.body.images.split(",").map((url) => url.trim())
            : [req.body.images];
        }
      }
    } else if (req.body.image) {
      // If image URL is provided directly in the request body
      console.log("Using image from request body:", req.body.image);

      // Handle different formats of image in the request body
      if (Array.isArray(req.body.image)) {
        imageUrls = req.body.image;
      } else if (typeof req.body.image === "string") {
        // Try to parse as JSON if it's a string
        try {
          const parsedImage = JSON.parse(req.body.image);
          imageUrls = Array.isArray(parsedImage)
            ? parsedImage
            : [req.body.image];
        } catch (e) {
          // If not valid JSON, treat as a single URL or comma-separated list
          imageUrls = req.body.image.includes(",")
            ? req.body.image.split(",").map((url) => url.trim())
            : [req.body.image];
        }
      }
    }

    // Log the final image URLs
    console.log("Final image URLs:", imageUrls);

    // Try to import slugify, but provide a fallback if it's not available
    let slugify;
    try {
      slugify = require("slugify");
    } catch (error) {
      console.warn(
        "Slugify package not found in controller, using fallback implementation"
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

    // Generate a slug from the product name
    let productName = req.body.name ? req.body.name.trim() : "";
    let slug = "";

    if (productName) {
      // Generate base slug from name using slugify
      slug = slugify(productName, {
        lower: true,
        strict: true, // removes special characters
        remove: /[*+~.()'"!:@]/g,
      });

      // If slug is empty after processing, use a fallback
      if (!slug || slug.trim() === "") {
        slug = `product-${Date.now()}`;
      }
    } else {
      // If no name provided, generate a random slug
      slug = `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    console.log(`Generated slug: ${slug} for product: ${productName}`);

    // Create the product data
    const productData = {
      name: productName,
      slug: slug, // Add the generated slug
      price: parseFloat(req.body.price),
      description: req.body.description || "",
      category: req.body.category,
      images: imageUrls,
      stock: parseInt(req.body.stock) || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Product data to be saved:", productData);

    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let savedProduct = null;
    let saveMethod = null;

    try {
      console.log("Attempting to save product using direct MongoDB driver");

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

      // Insert the product into the products collection
      console.log("Inserting product into database");
      const productsCollection = db.collection("products");
      const result = await productsCollection.insertOne(productData);

      if (result.acknowledged) {
        console.log("Product created successfully:", result);

        // Verify the product was saved by fetching it back
        const verifiedProduct = await productsCollection.findOne({
          _id: result.insertedId,
        });

        if (verifiedProduct) {
          console.log("Product verified in database:", verifiedProduct._id);

          // Try to get category information
          try {
            const categoriesCollection = db.collection("categories");
            const category = await categoriesCollection.findOne({
              _id: new ObjectId(productData.category),
            });

            savedProduct = {
              ...verifiedProduct,
              categoryInfo: category,
            };
          } catch (categoryError) {
            console.error("Error fetching category info:", categoryError);
            savedProduct = verifiedProduct;
          }

          saveMethod = "direct-mongodb";
        } else {
          throw new Error("Product verification failed");
        }
      } else {
        throw new Error("Insert operation not acknowledged");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log("MongoDB connection closed");
      }
    }

    // Verify that the product was saved
    if (!savedProduct) {
      throw new Error("Product was not saved");
    }

    // Return success response
    return res.status(201).json({
      success: true,
      data: savedProduct,
      method: saveMethod,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      console.log("Duplicate key error:", error.keyValue);

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
          "This product conflicts with an existing one. Please check your input.",
        error: "Duplicate key error",
        code: "DUPLICATE_KEY",
        duplicateField: Object.keys(error.keyValue)[0],
      });
    }

    // Return error response for other errors
    return res.status(200).json({
      success: false,
      message: error.message || "Error creating product",
      error: error.stack,
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

      // Fetch products from the products collection
      console.log("Fetching products from database");
      const productsCollection = db.collection("products");
      products = await productsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`Fetched ${products.length} products from database`);

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

    // Return error response
    return res.status(200).json({
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

      // Fetch product from the products collection
      console.log("Fetching product from database");
      const productsCollection = db.collection("products");

      try {
        product = await productsCollection.findOne({ _id: new ObjectId(id) });
      } catch (idError) {
        console.error("Error with ObjectId:", idError);
        product = await productsCollection.findOne({ _id: id });
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
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

    // Return error response
    return res.status(200).json({
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
      if (imageUrls.length > 0) updateData.$set.images = imageUrls;

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

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProperImageUrl,
};
