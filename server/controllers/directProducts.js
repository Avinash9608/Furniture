/**
 * Direct Products Controller
 *
 * This controller provides direct MongoDB access for product operations,
 * bypassing Mongoose to avoid buffering timeout issues.
 */

const { ObjectId } = require("mongodb");
const {
  getCollection,
  findDocuments,
  findOneDocument,
  insertDocument,
  updateDocument,
  deleteDocument,
} = require("../utils/directDbAccess");
const path = require("path");
const fs = require("fs");
const slugify = require("slugify");

// Collection name
const COLLECTION = "products";

// Category mapping
const categoryMap = {
  "680c9481ab11e96a288ef6d9": "Sofa Beds",
  "680c9484ab11e96a288ef6da": "Tables",
  "680c9486ab11e96a288ef6db": "Chairs",
  "680c9489ab11e96a288ef6dc": "Wardrobes",
  "680c948eab11e96a288ef6dd": "Beds",
};

// @desc    Get all products with direct MongoDB access
// @route   GET /api/direct/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    console.log("Getting all products with direct MongoDB access");

    // Get query parameters
    const {
      category,
      featured,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "desc",
      limit = 100,
      page = 1,
    } = req.query;

    // Build query
    const query = {};

    if (category) {
      // Handle different category formats (ID, slug, or name)
      if (category.length === 24 && /^[0-9a-f]+$/.test(category)) {
        // If it looks like a MongoDB ObjectId
        try {
          query.category = category;
          console.log(`Filtering by category ID: ${category}`);
        } catch (error) {
          console.error("Invalid category ID format:", error);
        }
      } else {
        // Try to match by category slug or name
        console.log(`Filtering by category slug/name: ${category}`);
        query.category = category;
      }
    }

    if (featured) {
      query.featured = featured === "true";
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build options
    const options = {
      sort: { [sort]: order === "desc" ? -1 : 1 },
      limit: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    };

    // Get products using findDocuments utility
    const products = await findDocuments(COLLECTION, query, options);

    // Populate category information for each product
    const populatedProducts = await Promise.all(
      products.map(async (product) => {
        if (product.category) {
          const categoryId =
            typeof product.category === "object"
              ? product.category._id.toString()
              : product.category.toString();

          try {
            // Try to get category from database
            const category = await findOneDocument("categories", {
              _id: new ObjectId(categoryId),
            });

            if (category) {
              product.category = {
                _id: categoryId,
                name: category.name,
                slug:
                  category.slug ||
                  category.name.toLowerCase().replace(/\s+/g, "-"),
              };
            } else if (categoryMap[categoryId]) {
              // Fallback to category map
              product.category = {
                _id: categoryId,
                name: categoryMap[categoryId],
                slug: categoryMap[categoryId]
                  .toLowerCase()
                  .replace(/\s+/g, "-"),
              };
            } else {
              // Generic fallback
              product.category = {
                _id: categoryId,
                name: "Other",
                slug: "other",
              };
            }
          } catch (error) {
            console.error(
              `Error populating category for product ${product._id}:`,
              error
            );
            // Use fallback category
            product.category = {
              _id: categoryId,
              name: categoryMap[categoryId] || "Other",
              slug: (categoryMap[categoryId] || "other")
                .toLowerCase()
                .replace(/\s+/g, "-"),
            };
          }
        }
        return product;
      })
    );

    // Return products
    return res.status(200).json({
      success: true,
      count: populatedProducts.length,
      data: populatedProducts,
      source: "direct_database",
    });
  } catch (error) {
    console.error("Error getting products with direct MongoDB access:", error);

    // Return mock data as last resort
    return res.status(200).json({
      success: true,
      count: 2,
      data: [
        {
          _id: "mock1",
          name: "Mock Product 1",
          price: 19999,
          category: {
            _id: "mock-cat-1",
            name: "Mock Category 1",
            slug: "mock-category-1",
          },
          stock: 10,
          images: ["https://placehold.co/300x300/gray/white?text=Product1"],
        },
        {
          _id: "mock2",
          name: "Mock Product 2",
          price: 29999,
          category: {
            _id: "mock-cat-2",
            name: "Mock Category 2",
            slug: "mock-category-2",
          },
          stock: 5,
          images: ["https://placehold.co/300x300/gray/white?text=Product2"],
        },
      ],
      source: "mock_data",
    });
  }
};

// @desc    Get single product with direct MongoDB access
// @route   GET /api/direct/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    console.log(`Getting product with ID: ${req.params.id}`);

    // First try to find by ID (either ObjectId or string ID)
    let product = null;
    let productId = req.params.id;

    // Try to convert to ObjectId if it looks like one
    let objectIdQuery = null;
    if (/^[0-9a-fA-F]{24}$/.test(productId)) {
      try {
        objectIdQuery = { _id: new ObjectId(productId) };
        console.log("Trying to find product with ObjectId:", objectIdQuery);
        product = await findOneDocument(COLLECTION, objectIdQuery);
      } catch (error) {
        console.log(
          "Error converting to ObjectId, will try string ID:",
          error.message
        );
      }
    }

    // If not found by ObjectId, try string ID
    if (!product) {
      console.log(
        "Product not found by ObjectId, trying string ID:",
        productId
      );
      product = await findOneDocument(COLLECTION, { _id: productId });
    }

    // If still not found, try by slug
    if (!product) {
      console.log("Product not found by ID, trying slug:", productId);
      product = await findOneDocument(COLLECTION, { slug: productId });
    }

    // If still not found, try a more flexible query
    if (!product) {
      console.log("Product not found by ID or slug, trying flexible query");
      product = await findOneDocument(COLLECTION, {
        $or: [
          objectIdQuery,
          { _id: productId },
          { slug: productId },
          { name: productId },
        ].filter(Boolean), // Remove null values
      });
    }

    // Check if product exists
    if (!product) {
      console.log("Product not found with any query method");
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    console.log("Product found:", product.name);

    // Check if category is just an ID and try to fetch category details
    if (product.category && typeof product.category === "string") {
      try {
        console.log(`Fetching category details for ID: ${product.category}`);

        // Try to fetch the category
        const category = await findOneDocument("categories", {
          $or: [
            { _id: product.category },
            ...(product.category.length === 24 &&
            /^[0-9a-f]+$/.test(product.category)
              ? [{ _id: new ObjectId(product.category) }]
              : []),
          ],
        });

        if (category) {
          console.log(`Category found: ${category.name}`);
          // Replace the category ID with the category object
          product.category = {
            _id: category._id,
            name: category.name,
            slug:
              category.slug || category.name.toLowerCase().replace(/\s+/g, "-"),
            image: category.image,
          };
        } else {
          // If category not found in database, use the mapping
          const categoryId = product.category.toString();
          if (categoryMap[categoryId]) {
            console.log(
              `Using category mapping for ID ${categoryId}: ${categoryMap[categoryId]}`
            );
            product.category = {
              _id: categoryId,
              name: categoryMap[categoryId],
              slug: categoryMap[categoryId].toLowerCase().replace(/\s+/g, "-"),
            };
          } else {
            // Create a generic category object if no mapping exists
            console.log(`No mapping found for category ID: ${categoryId}`);
            product.category = {
              _id: categoryId,
              name:
                categoryId.length === 24
                  ? `Category ${categoryId.substring(0, 8)}`
                  : categoryId,
              slug: `category-${categoryId.substring(0, 8)}`,
            };
          }
        }
      } catch (categoryError) {
        console.error("Error fetching category details:", categoryError);
        // If there's an error, create a fallback category object
        const categoryId = product.category.toString();
        const categoryMap = {
          "680c9481ab11e96a288ef6d9": "Sofa Beds",
          "680c9484ab11e96a288ef6da": "Tables",
          "680c9486ab11e96a288ef6db": "Chairs",
          "680c9489ab11e96a288ef6dc": "Wardrobes",
        };

        product.category = {
          _id: categoryId,
          name:
            categoryMap[categoryId] || `Category ${categoryId.substring(0, 8)}`,
          slug: (
            categoryMap[categoryId] || `Category ${categoryId.substring(0, 8)}`
          )
            .toLowerCase()
            .replace(/\s+/g, "-"),
        };
      }
    }

    // Return product with populated category
    return res.status(200).json({
      success: true,
      data: product,
      source: "direct_database",
    });
  } catch (error) {
    console.error("Error getting product with direct MongoDB access:", error);

    // Log detailed error information
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      productId: req.params.id,
    });

    try {
      // Try to get the product with a string ID as fallback
      console.log("Attempting fallback query for product with string ID");
      const fallbackProduct = await findOneDocument(COLLECTION, {
        $or: [{ _id: req.params.id }, { slug: req.params.id }],
      });

      if (fallbackProduct) {
        console.log(
          `Fallback query successful, found product: ${fallbackProduct.name}`
        );
        return res.status(200).json({
          success: true,
          data: fallbackProduct,
          source: "direct_database_fallback",
        });
      }
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError);
    }

    // Return a mock product as last resort
    console.log("All database queries failed, returning mock product");
    return res.status(200).json({
      success: true,
      data: {
        _id: req.params.id,
        name: "Sample Product",
        description:
          "This is a sample product shown when the database query fails.",
        price: 19999,
        discountPrice: 15999,
        category: {
          _id: "sample-category",
          name: "Sample Category",
          slug: "sample-category",
        },
        stock: 10,
        ratings: 4.5,
        numReviews: 12,
        images: ["https://placehold.co/800x600/gray/white?text=Sample+Product"],
        specifications: [
          { name: "Material", value: "Wood" },
          { name: "Dimensions", value: "80 x 60 x 40 cm" },
          { name: "Weight", value: "15 kg" },
        ],
        source: "mock_data",
      },
    });
  }
};

// @desc    Create product with direct MongoDB access
// @route   POST /api/direct/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    console.log("\n=== Creating Product ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Files received:", req.files ? req.files.length : 0);

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

    // Handle image files
    const images = [];
    if (req.files && req.files.length > 0) {
      console.log("Processing uploaded files...", req.files);

      for (const file of req.files) {
        if (!file.path) {
          console.warn("File missing path:", file);
          continue;
        }

        // Get the absolute file path
        const absolutePath = file.path;
        console.log("Absolute file path:", absolutePath);

        // Make sure the file exists
        if (!fs.existsSync(absolutePath)) {
          console.warn(`File does not exist at path: ${absolutePath}`);
          continue;
        }

        // Format the image path correctly for storage
        const filename = path.basename(file.path);
        console.log("Extracted filename:", filename);

        try {
          // Create a URL that will work in both development and production
          const isProduction = process.env.NODE_ENV === "production";
          const baseUrl = isProduction
            ? process.env.BASE_URL || "https://furniture-q3nb.onrender.com"
            : "http://localhost:5000";

          const imagePath = `${baseUrl}/uploads/${filename}`;
          console.log("Generated image URL:", imagePath);

          // Add to images array
          images.push(imagePath);
          console.log("Added image path:", imagePath);
        } catch (error) {
          console.error("Error processing image:", error);
          // If there's an error, still try to save a relative path
          const fallbackPath = `/uploads/${filename}`;
          images.push(fallbackPath);
          console.log("Added fallback image path:", fallbackPath);
        }
      }
    }

    // Add default image if no images were uploaded
    if (images.length === 0) {
      images.push("https://placehold.co/800x600/gray/white?text=No+Image");
      console.log("No images uploaded, using default image");
    }

    console.log("Final images array:", images);

    // Parse numeric fields
    const price = parseFloat(req.body.price);
    const stock = parseInt(req.body.stock);
    const discountPrice = req.body.discountPrice
      ? parseFloat(req.body.discountPrice)
      : undefined;

    // Validate numeric fields
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price value",
      });
    }

    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock value",
      });
    }

    // Create a slug from the product name
    const baseSlug = slugify(req.body.name.trim(), { lower: true });

    // Add timestamp to ensure uniqueness
    const slug = `${baseSlug}-${Date.now().toString().substring(9)}`;

    // Parse dimensions if it's a string
    let dimensions = {};
    if (req.body.dimensions) {
      try {
        dimensions =
          typeof req.body.dimensions === "string"
            ? JSON.parse(req.body.dimensions)
            : req.body.dimensions;
      } catch (e) {
        console.warn("Error parsing dimensions:", e);
      }
    }

    // Create the product object
    const productData = {
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      slug,
      price,
      stock,
      category: req.body.category,
      images,
      material: req.body.material?.trim() || "",
      color: req.body.color?.trim() || "",
      dimensions: dimensions,
      featured: req.body.featured === "true",
      discountPrice,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Final product data:", JSON.stringify(productData, null, 2));

    // Save to database
    let result;
    try {
      const collection = await getCollection(COLLECTION);
      console.log("Connected to database successfully");
      result = await collection.insertOne(productData);
      console.log("Product inserted successfully with ID:", result.insertedId);

      if (!result.acknowledged) {
        throw new Error("Database operation failed - not acknowledged");
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database operation failed: ${dbError.message}`);
    }

    console.log("Product created successfully:", result.insertedId);

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      productId: result.insertedId,
    });
  } catch (error) {
    console.error("Error in createProduct:", error);

    // Send formatted error response
    return res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// @desc    Update product with direct MongoDB access
// @route   PUT /api/direct/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    console.log("\n=== Starting Product Update ===");
    console.log(`Updating product with ID: ${req.params.id}`);
    console.log("Request body:", req.body);
    console.log("Files received:", req.files ? req.files.length : 0);

    // Create query for finding the product
    let query = {};

    // Try to convert to ObjectId if it looks like one
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      try {
        const objectId = new ObjectId(req.params.id);
        query = { _id: objectId };
        console.log("Using ObjectId query:", query);
      } catch (error) {
        console.warn("Could not convert to ObjectId, using string ID");
        query = { _id: req.params.id };
      }
    } else {
      // Use string ID
      query = { _id: req.params.id };
      console.log("Using string ID query:", query);
    }

    // Get existing product
    const existingProduct = await findOneDocument(COLLECTION, query);

    if (!existingProduct) {
      console.error("Product not found in database");
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    console.log("Found existing product:", {
      id: existingProduct._id,
      name: existingProduct.name,
    });

    // Create updates object with all fields
    const updates = {
      $set: {
        updatedAt: new Date(),
      },
    };

    // Handle each field explicitly with type conversion and validation
    if ("name" in req.body) {
      const name = req.body.name.toString().trim();
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty",
        });
      }
      updates.$set.name = name;
    }

    if ("description" in req.body) {
      updates.$set.description = req.body.description.toString().trim();
    }

    if ("price" in req.body) {
      const price = Number(req.body.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid price value - must be a non-negative number",
        });
      }
      updates.$set.price = price;
    }

    if ("stock" in req.body) {
      const stock = parseInt(req.body.stock);
      if (isNaN(stock) || stock < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid stock value - must be a non-negative integer",
        });
      }
      updates.$set.stock = stock;
    }

    if ("material" in req.body) {
      updates.$set.material = req.body.material.toString().trim();
    }

    if ("color" in req.body) {
      updates.$set.color = req.body.color.toString().trim();
    }

    if ("featured" in req.body) {
      updates.$set.featured =
        req.body.featured === "true" || req.body.featured === true;
    }

    if ("category" in req.body && req.body.category) {
      try {
        if (/^[0-9a-fA-F]{24}$/.test(req.body.category)) {
          updates.$set.category = new ObjectId(req.body.category);
        } else {
          updates.$set.category = req.body.category;
        }
      } catch (error) {
        console.warn(
          "Could not convert category to ObjectId, using as is:",
          error.message
        );
        updates.$set.category = req.body.category;
      }
    }

    // Handle images
    if (req.files && req.files.length > 0) {
      console.log("New files uploaded:", req.files.length);
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      console.log("New image paths:", newImages);

      // Check if we should replace or append images
      if (req.body.replaceImages === "true") {
        updates.$set.images = newImages;
        console.log("Replacing all images with new uploads");
      } else {
        // Get existing images from the product
        const existingImages = existingProduct.images || [];
        console.log("Existing images:", existingImages);

        // Combine existing and new images
        updates.$set.images = [...existingImages, ...newImages];
        console.log("Appending new images to existing ones");
      }
      console.log("Final images array:", updates.$set.images);
    }

    // Handle existing images from form data
    else if (req.body.existingImages) {
      try {
        console.log(
          "Processing existingImages from form data:",
          req.body.existingImages
        );
        let existingImages;

        // Handle different formats of existingImages
        if (typeof req.body.existingImages === "string") {
          // Try to parse as JSON first
          try {
            existingImages = JSON.parse(req.body.existingImages);
            console.log("Successfully parsed existingImages as JSON");
          } catch (parseError) {
            // If not valid JSON, treat as comma-separated list
            console.log("Treating existingImages as comma-separated list");
            existingImages = req.body.existingImages
              .split(",")
              .map((url) => url.trim());
          }
        } else if (Array.isArray(req.body.existingImages)) {
          // If it's already an array
          existingImages = req.body.existingImages;
          console.log("existingImages is already an array");
        } else {
          // If it's a single value
          existingImages = [req.body.existingImages];
          console.log("existingImages is a single value");
        }

        // Set the images in the update
        updates.$set.images = existingImages;
        console.log("Final existingImages array:", existingImages);
      } catch (error) {
        console.error("Error processing existing images:", error);
        return res.status(400).json({
          success: false,
          message: "Invalid image data format",
          error: error.message,
        });
      }
    }

    // Handle dimensions
    if (req.body.dimensions) {
      try {
        let dimensionsData;
        if (typeof req.body.dimensions === "string") {
          try {
            dimensionsData = JSON.parse(req.body.dimensions);
          } catch {
            const cleanedDimensions = req.body.dimensions
              .replace(/['"]+/g, '"')
              .trim();
            dimensionsData = JSON.parse(cleanedDimensions);
          }
        } else {
          dimensionsData = req.body.dimensions;
        }

        const dimensionsObj = {
          length: parseFloat(dimensionsData.length) || 0,
          width: parseFloat(dimensionsData.width) || 0,
          height: parseFloat(dimensionsData.height) || 0,
        };

        if (Object.values(dimensionsObj).some((val) => val < 0)) {
          return res.status(400).json({
            success: false,
            message: "Dimensions cannot be negative",
          });
        }

        updates.$set.dimensions = dimensionsObj;
        console.log("Processed dimensions:", dimensionsObj);
      } catch (error) {
        console.error("Error processing dimensions:", error);
        return res.status(400).json({
          success: false,
          message: "Invalid dimensions format",
          error: error.message,
        });
      }
    }

    console.log("Final update object:", JSON.stringify(updates, null, 2));

    try {
      console.log("Calling updateDocument with query:", query);
      console.log("Updates:", updates);

      // Use the updateDocument function from directDbAccess
      const updatedProduct = await updateDocument(COLLECTION, query, updates);

      if (!updatedProduct) {
        console.error("Product not found or update failed");
        return res.status(404).json({
          success: false,
          message: "Product not found or update failed",
        });
      }

      // Fetch the category details if needed
      if (updatedProduct.category) {
        try {
          const category = await findOneDocument("categories", {
            _id:
              typeof updatedProduct.category === "string" &&
              /^[0-9a-fA-F]{24}$/.test(updatedProduct.category)
                ? new ObjectId(updatedProduct.category)
                : updatedProduct.category,
          });

          if (category) {
            updatedProduct.category = {
              _id: category._id,
              name: category.name,
              slug:
                category.slug ||
                category.name.toLowerCase().replace(/\s+/g, "-"),
            };
          }
        } catch (categoryError) {
          console.warn("Error fetching category details:", categoryError);
          // Don't fail the update if category details can't be fetched
        }
      }

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database operation failed",
        error: dbError.message,
        details: dbError.details || {},
      });
    }
  } catch (error) {
    console.error("Error in product update:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during product update",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// @desc    Delete product with direct MongoDB access
// @route   DELETE /api/direct/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    console.log(`Deleting product with ID: ${req.params.id}`);

    // Convert string ID to ObjectId
    let productId;
    try {
      productId = new ObjectId(req.params.id);
    } catch (error) {
      console.error("Invalid product ID format:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // Delete product
    const result = await deleteDocument(COLLECTION, { _id: productId });

    // Check if product exists
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      data: {},
      source: "direct_database",
    });
  } catch (error) {
    console.error("Error deleting product with direct MongoDB access:", error);

    // Return error
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
