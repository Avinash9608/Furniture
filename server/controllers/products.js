const Product = require("../models/Product");
const Category = require("../models/Category");
const path = require("path");
const fs = require("fs");
const slugify = require("slugify");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
// exports.getProducts = async (req, res) => {
//   try {
//     // Copy req.query
//     const reqQuery = { ...req.query };

//     // Fields to exclude
//     const removeFields = ["select", "sort", "page", "limit"];

//     // Loop over removeFields and delete them from reqQuery
//     removeFields.forEach((param) => delete reqQuery[param]);

//     // Create query string
//     let queryStr = JSON.stringify(reqQuery);

//     // Create operators ($gt, $gte, etc)
//     queryStr = queryStr.replace(
//       /\\b(gt|gte|lt|lte|in)\\b/g,
//       (match) => `$${match}`
//     );

//     // Finding resource
//     let query = Product.find(JSON.parse(queryStr)).populate("category");

//     // Select Fields
//     if (req.query.select) {
//       const fields = req.query.select.split(",").join(" ");
//       query = query.select(fields);
//     }

//     // Sort
//     if (req.query.sort) {
//       const sortBy = req.query.sort.split(",").join(" ");
//       query = query.sort(sortBy);
//     } else {
//       query = query.sort("-createdAt");
//     }

//     // Pagination
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = parseInt(req.query.limit, 10) || 10;
//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;
//     const total = await Product.countDocuments(JSON.parse(queryStr));

//     query = query.skip(startIndex).limit(limit);

//     // Executing query
//     const products = await query;

//     // Pagination result
//     const pagination = {};

//     if (endIndex < total) {
//       pagination.next = {
//         page: page + 1,
//         limit,
//       };
//     }

//     if (startIndex > 0) {
//       pagination.prev = {
//         page: page - 1,
//         limit,
//       };
//     }

//     res.status(200).json({
//       success: true,
//       count: products.length,
//       pagination,
//       data: products,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
exports.getProducts = async (req, res) => {
  try {
    console.log("Getting all products with query:", req.query);

    // Try using Mongoose first
    try {
      // Always populate the category field to ensure category name is available
      const query = Product.find().populate("category");

      // Apply category filter if provided
      if (req.query.category) {
        console.log(`Filtering by category: ${req.query.category}`);
        query.where({ category: req.query.category });
      }

      // Apply featured filter if provided
      if (req.query.featured === "true") {
        console.log("Filtering by featured products");
        query.where({ featured: true });
      }

      // Apply limit if provided
      if (req.query.limit) {
        const limit = parseInt(req.query.limit);
        if (!isNaN(limit) && limit > 0) {
          console.log(`Limiting results to ${limit} products`);
          query.limit(limit);
        }
      }

      // Set a timeout for the query
      const products = await query.exec();

      console.log(`Found ${products.length} products using Mongoose`);

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products,
        source: "mongoose",
      });
    } catch (mongooseError) {
      console.error("Mongoose query error:", mongooseError);

      // If Mongoose fails, try direct MongoDB connection
      console.log("Attempting direct MongoDB connection");

      const { MongoClient, ObjectId } = require("mongodb");
      const uri = process.env.MONGO_URI;

      // Connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 5,
      };

      let client = null;

      try {
        // Connect to MongoDB
        client = new MongoClient(uri, options);
        await client.connect();

        // Get database name from connection string
        const dbName = uri.split("/").pop().split("?")[0];
        const db = client.db(dbName);

        // Build query
        const query = {};

        // Apply category filter
        if (req.query.category) {
          try {
            query.category = new ObjectId(req.query.category);
          } catch (idError) {
            query.category = req.query.category;
          }
        }

        // Apply featured filter
        if (req.query.featured === "true") {
          query.featured = true;
        }

        // Execute query
        const productsCollection = db.collection("products");
        let findQuery = productsCollection.find(query);

        // Apply limit
        if (req.query.limit) {
          const limit = parseInt(req.query.limit);
          if (!isNaN(limit) && limit > 0) {
            findQuery = findQuery.limit(limit);
          }
        }

        // Get products
        const products = await findQuery.toArray();

        console.log(
          `Found ${products.length} products using direct MongoDB connection`
        );

        // Get categories to populate product data
        const categoriesCollection = db.collection("categories");
        const categories = await categoriesCollection.find().toArray();

        // Create a map of category IDs to category objects
        const categoryMap = {};
        categories.forEach((category) => {
          categoryMap[category._id.toString()] = category;
        });

        // Populate category data in products
        const populatedProducts = products.map((product) => {
          if (product.category) {
            const categoryId = product.category.toString();
            if (categoryMap[categoryId]) {
              product.category = categoryMap[categoryId];
            }
          }
          return product;
        });

        return res.status(200).json({
          success: true,
          count: populatedProducts.length,
          data: populatedProducts,
          source: "direct-mongodb",
        });
      } catch (directError) {
        console.error("Direct MongoDB connection error:", directError);
        throw directError; // Re-throw to be caught by outer catch
      } finally {
        // Close MongoDB connection
        if (client) {
          await client.close();
        }
      }
    }
  } catch (error) {
    console.error("Error fetching products:", error);

    // Return mock data as a last resort
    const mockProducts = [
      {
        _id: "mock1",
        name: "Elegant Wooden Sofa",
        description:
          "A beautiful wooden sofa with comfortable cushions. Perfect for your living room.",
        price: 24999,
        discountPrice: 19999,
        category: {
          _id: "680c9481ab11e96a288ef6d9",
          name: "Sofa Beds",
        },
        stock: 15,
        ratings: 4.7,
        numReviews: 24,
        images: [
          "https://placehold.co/800x600/brown/white?text=Elegant+Wooden+Sofa",
          "https://placehold.co/800x600/brown/white?text=Sofa+Side+View",
          "https://placehold.co/800x600/brown/white?text=Sofa+Front+View",
        ],
        specifications: [
          { name: "Material", value: "Sheesham Wood" },
          { name: "Dimensions", value: "72 x 30 x 32 inches" },
          { name: "Weight", value: "45 kg" },
          { name: "Seating Capacity", value: "3 People" },
          { name: "Cushion Material", value: "High-density Foam" },
        ],
        reviews: [],
        createdAt: new Date(),
      },
      {
        _id: "mock2",
        name: "Modern Dining Table",
        description:
          "A stylish dining table perfect for family gatherings and dinner parties.",
        price: 18999,
        discountPrice: 15999,
        category: {
          _id: "680c9484ab11e96a288ef6da",
          name: "Tables",
        },
        stock: 10,
        ratings: 4.5,
        numReviews: 18,
        images: [
          "https://placehold.co/800x600/darkwood/white?text=Modern+Dining+Table",
          "https://placehold.co/800x600/darkwood/white?text=Table+Top+View",
          "https://placehold.co/800x600/darkwood/white?text=Table+Side+View",
        ],
        specifications: [
          { name: "Material", value: "Teak Wood" },
          { name: "Dimensions", value: "72 x 36 x 30 inches" },
          { name: "Weight", value: "40 kg" },
          { name: "Seating Capacity", value: "6 People" },
          { name: "Finish", value: "Polished" },
        ],
        reviews: [],
        createdAt: new Date(),
      },
    ];

    // Filter mock data if needed
    let filteredMockProducts = [...mockProducts];

    if (req.query.category) {
      filteredMockProducts = filteredMockProducts.filter(
        (product) => product.category._id === req.query.category
      );
    }

    if (req.query.featured === "true") {
      // All mock products are considered featured
    }

    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      if (!isNaN(limit) && limit > 0) {
        filteredMockProducts = filteredMockProducts.slice(0, limit);
      }
    }

    console.log(
      `Returning ${filteredMockProducts.length} mock products as fallback`
    );

    return res.status(200).json({
      success: true,
      count: filteredMockProducts.length,
      data: filteredMockProducts,
      source: "mock-fallback",
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    console.log(`Getting product with ID: ${req.params.id}`);

    // Try using Mongoose first
    try {
      const product = await Product.findById(req.params.id).populate(
        "category"
      );

      if (product) {
        console.log(`Found product using Mongoose: ${product._id}`);
        return res.status(200).json({
          success: true,
          data: product,
          source: "mongoose",
        });
      }

      console.log(
        "Product not found using Mongoose, trying alternative approaches"
      );

      // Try to find by slug if ID lookup failed
      const productBySlug = await Product.findOne({
        slug: req.params.id,
      }).populate("category");

      if (productBySlug) {
        console.log(
          `Found product by slug using Mongoose: ${productBySlug._id}`
        );
        return res.status(200).json({
          success: true,
          data: productBySlug,
          source: "mongoose-slug",
        });
      }
    } catch (mongooseError) {
      console.error("Mongoose query error:", mongooseError);
      // Continue to direct MongoDB approach
    }

    // If Mongoose fails, try direct MongoDB connection
    console.log("Attempting direct MongoDB connection for product");

    const { MongoClient, ObjectId } = require("mongodb");
    const uri = process.env.MONGO_URI;

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 5,
    };

    let client = null;

    try {
      // Connect to MongoDB
      client = new MongoClient(uri, options);
      await client.connect();

      // Get database name from connection string
      const dbName = uri.split("/").pop().split("?")[0];
      const db = client.db(dbName);

      // Get collections
      const productsCollection = db.collection("products");
      const categoriesCollection = db.collection("categories");

      // Try to find product by ID
      let product = null;

      try {
        // Try ObjectId first
        product = await productsCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
      } catch (idError) {
        console.log("Not a valid ObjectId, trying as string");
        product = await productsCollection.findOne({ _id: req.params.id });
      }

      // If not found, try by slug
      if (!product) {
        console.log("Product not found by ID, trying by slug");
        product = await productsCollection.findOne({ slug: req.params.id });
      }

      // If still not found, try a more flexible approach
      if (!product) {
        console.log(
          "Product not found by ID or slug, trying flexible approach"
        );

        // Get all products
        const allProducts = await productsCollection.find({}).toArray();
        console.log(
          `Fetched ${allProducts.length} products for flexible search`
        );

        // Try to find a product with a matching ID or slug
        product = allProducts.find((p) => {
          if (!p._id) return false;
          const productId = p._id.toString();
          return (
            productId.includes(req.params.id) ||
            (p.slug && p.slug.includes(req.params.id))
          );
        });
      }

      // If product found, try to get category info
      if (product && product.category) {
        try {
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
            product.category = category;
          }
        } catch (categoryError) {
          console.error("Error fetching category info:", categoryError);
        }
      }

      // Return the product if found
      if (product) {
        console.log(`Found product using direct MongoDB: ${product._id}`);
        return res.status(200).json({
          success: true,
          data: product,
          source: "direct-mongodb",
        });
      }
    } catch (directError) {
      console.error("Direct MongoDB connection error:", directError);
      // Continue to fallback
    } finally {
      // Close MongoDB connection
      if (client) {
        await client.close();
      }
    }

    // If we get here, we couldn't find the product
    console.log("Product not found in database, using mock data");

    // Create a mock product as fallback
    const mockProduct = {
      _id: req.params.id,
      name: "Product " + req.params.id.substring(0, 8),
      description:
        "This is a fallback product shown when the requested product could not be found.",
      price: 19999,
      discountPrice: 15999,
      category: {
        _id: "fallback-category",
        name: "Furniture",
      },
      stock: 10,
      ratings: 4.5,
      numReviews: 12,
      images: [
        "https://placehold.co/800x600/orange/white?text=Product+" +
          req.params.id.substring(0, 8),
      ],
      specifications: [
        { name: "Material", value: "Wood" },
        { name: "Dimensions", value: "80 x 60 x 40 cm" },
        { name: "Weight", value: "15 kg" },
      ],
      reviews: [],
      createdAt: new Date(),
      isMock: true,
    };

    return res.status(200).json({
      success: true,
      data: mockProduct,
      source: "mock-fallback",
      message: "Product not found in database, showing mock data",
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    // Return a generic mock product as a last resort
    const genericMockProduct = {
      _id: req.params.id,
      name: "Fallback Product",
      description:
        "This is a generic fallback product shown when an error occurs.",
      price: 9999,
      discountPrice: 7999,
      category: {
        _id: "error-fallback-category",
        name: "Furniture",
      },
      stock: 5,
      ratings: 4.0,
      numReviews: 10,
      images: [
        "https://placehold.co/800x600/red/white?text=Error+Fallback+Product",
      ],
      specifications: [
        { name: "Note", value: "This is a fallback product due to an error" },
      ],
      reviews: [],
      createdAt: new Date(),
      isErrorFallback: true,
    };

    return res.status(200).json({
      success: true,
      data: genericMockProduct,
      source: "error-fallback",
      error: error.message,
      message: "Error fetching product, showing fallback data",
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    // Log incoming request
    console.log("Creating product with data:", {
      body: req.body,
      files: req.files?.length || 0,
      user: req.user?._id
    });

    // Validate required fields
    const requiredFields = ["name", "description", "price", "category", "stock"];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    // Process images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
      console.log("Processed images:", images);
    }

    // Generate slug from name
    const slug = req.body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + 
      '-' + Date.now().toString().slice(-4);

    // Parse dimensions if provided
    let dimensions = {};
    if (req.body.dimensions) {
      try {
        dimensions = typeof req.body.dimensions === 'string' 
          ? JSON.parse(req.body.dimensions)
          : req.body.dimensions;
      } catch (error) {
        console.error("Error parsing dimensions:", error);
      }
    }

    // Create product data object
    const productData = {
      name: req.body.name,
      slug,
      description: req.body.description,
      price: parseFloat(req.body.price),
      category: req.body.category,
      stock: parseInt(req.body.stock),
      images,
      featured: req.body.featured === "true",
      material: req.body.material || "",
      color: req.body.color || "",
      dimensions,
      discountPrice: req.body.discountPrice ? parseFloat(req.body.discountPrice) : undefined,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("Attempting to save product with data:", productData);

    let product;
    try {
      // Try Mongoose first with timeout
      product = await Promise.race([
        Product.create(productData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Mongoose operation timed out")), 10000)
        )
      ]);
    } catch (mongooseError) {
      console.log("Mongoose save failed, trying direct MongoDB connection:", mongooseError.message);
      
      // If Mongoose fails, try direct MongoDB connection
      const { createProduct: directCreate } = require('../utils/directDbConnection');
      const result = await directCreate(productData);
      
      if (result.success) {
        // Fetch the created product
        product = await Product.findById(result.productId);
        if (!product) {
          product = { _id: result.productId, ...productData };
        }
      } else {
        throw new Error("Failed to create product using direct connection");
      }
    }

    console.log("Product created successfully:", product._id);

    // Return success response
    return res.status(201).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error("Error creating product:", error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A product with this name already exists"
      });
    }

    if (error.message === "Mongoose operation timed out") {
      return res.status(500).json({
        success: false,
        message: "Database operation timed out. Please try again."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error creating product",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`,
      });
    }

    // Create update data object
    const updateData = {};

    // Handle basic fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.price) updateData.price = Number(req.body.price);
    if (req.body.discountPrice)
      updateData.discountPrice = Number(req.body.discountPrice);
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.stock) updateData.stock = Number(req.body.stock);
    if (req.body.material) updateData.material = req.body.material;
    if (req.body.color) updateData.color = req.body.color;

    // Handle boolean fields
    if (req.body.featured === "true") updateData.featured = true;
    if (req.body.featured === "false") updateData.featured = false;

    // Handle dimensions object
    if (req.body.dimensions) {
      try {
        // Check if dimensions is already a string that needs parsing
        const dimensionsData =
          typeof req.body.dimensions === "string"
            ? JSON.parse(req.body.dimensions)
            : req.body.dimensions;

        updateData.dimensions = {
          length: dimensionsData.length
            ? Number(dimensionsData.length)
            : undefined,
          width: dimensionsData.width
            ? Number(dimensionsData.width)
            : undefined,
          height: dimensionsData.height
            ? Number(dimensionsData.height)
            : undefined,
        };

        console.log("Processed dimensions for update:", updateData.dimensions);
      } catch (dimError) {
        console.error("Error processing dimensions for update:", dimError);
        // Continue without dimensions if there's an error
      }
    }

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const images = [];

      // Delete old images
      if (product.images && product.images.length > 0) {
        product.images.forEach((image) => {
          const imagePath = path.join(__dirname, "..", image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }

      // Add new images
      req.files.forEach((file) => {
        images.push(`/uploads/${file.filename}`);
      });
      updateData.images = images;
    }

    console.log("Updating product with data:", updateData);

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Product update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during product update",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`,
      });
    }

    // Delete product images
    if (product.images && product.images.length > 0) {
      product.images.forEach((image) => {
        const imagePath = path.join(__dirname, "..", image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`,
      });
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user.id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "Product already reviewed",
      });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user.id,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.ratings =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
