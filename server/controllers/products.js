const Product = require("../models/Product");
const Category = require("../models/Category");
const path = require("path");
const fs = require("fs");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ["select", "sort", "page", "limit"];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\\b(gt|gte|lt|lte|in)\\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    let query = Product.find(JSON.parse(queryStr)).populate("category");

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const products = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
// exports.createProduct = async (req, res) => {
//   try {
//     // Check if category exists
//     const category = await Category.findById(req.body.category);
//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: `Category not found with id of ${req.body.category}`,
//       });
//     }

//     // Handle file uploads
//     if (req.files && req.files.length > 0) {
//       const images = [];
//       req.files.forEach((file) => {
//         // Use relative path for storage in database
//         images.push(`/uploads/${file.filename}`);
//       });
//       req.body.images = images;
//     } else {
//       // If no images provided, use a default image
//       req.body.images = ["/uploads/default-product.jpg"];
//     }

//     const product = await Product.create(req.body);

//     res.status(201).json({
//       success: true,
//       data: product,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// controllers/products.js - Updated createProduct function
// productsController.js - Updated createProduct
exports.createProduct = async (req, res) => {
  try {
    // Log the request for debugging
    console.log("Creating product with data:", {
      body: req.body,
      files: req.files ? req.files.length : 0,
      headers: req.headers,
    });

    // Verify required fields
    if (!req.body.name || !req.body.price || !req.body.category) {
      console.log("Missing required fields:", {
        name: !req.body.name,
        price: !req.body.price,
        category: !req.body.category,
      });
      return res.status(400).json({
        success: false,
        message: "Please provide name, price and category",
      });
    }

    // Process images
    let images = [];

    if (req.files && req.files.length > 0) {
      // If files were uploaded, use them
      images = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (req.body.defaultImage === "true") {
      // If defaultImage flag is set, use a placeholder URL
      console.log("Using placeholder for product image");
      // We'll leave the images array empty and handle this on the frontend
    }

    // Create product data object
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      stock: Number(req.body.stock) || 1,
      images,
    };

    // Handle optional fields
    if (req.body.discountPrice) {
      productData.discountPrice = Number(req.body.discountPrice);
    }

    if (req.body.featured === "true") {
      productData.featured = true;
    }

    if (req.body.material) {
      productData.material = req.body.material;
    }

    if (req.body.color) {
      productData.color = req.body.color;
    }

    // Handle dimensions object
    if (req.body.dimensions) {
      try {
        // Check if dimensions is already a string that needs parsing
        const dimensionsData =
          typeof req.body.dimensions === "string"
            ? JSON.parse(req.body.dimensions)
            : req.body.dimensions;

        productData.dimensions = {
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

        console.log("Processed dimensions:", productData.dimensions);
      } catch (dimError) {
        console.error("Error processing dimensions:", dimError);
        // Continue without dimensions if there's an error
      }
    }

    // Add creator info if available
    if (req.user && req.user.id) {
      productData.createdBy = req.user.id;
    }

    console.log("Attempting to create product with data:", productData);

    try {
      const product = await Product.create(productData);
      console.log("Product created successfully:", {
        id: product._id,
        name: product.name,
        category: product.category,
      });

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (dbError) {
      console.error("Database error creating product:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during product creation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
