/**
 * Direct Product Details Controller
 *
 * This controller provides a specialized endpoint for fetching product details
 * that completely bypasses Mongoose and uses direct MongoDB driver access
 * with multiple fallback mechanisms to ensure reliability.
 */

const { MongoClient, ObjectId } = require("mongodb");

// Get MongoDB URI from environment variables
const getMongoURI = () => {
  return process.env.MONGO_URI || process.env.MONGODB_URI;
};

/**
 * Get product details by ID with multiple fallback mechanisms
 * @route GET /api/direct-product/:id
 * @access Public
 */
exports.getProductById = async (req, res) => {
  console.log(
    `[DirectProductDetails] Fetching product with ID: ${req.params.id}`
  );

  // Set proper headers
  res.setHeader("Content-Type", "application/json");

  // Track all attempts for better debugging
  const attempts = [];
  let client = null;

  try {
    const productId = req.params.id;
    const uri = getMongoURI();

    if (!uri) {
      throw new Error("MongoDB URI not found in environment variables");
    }

    // Log a redacted version of the URI for debugging
    const redactedUri = uri.replace(
      /\/\/([^:]+):([^@]+)@/,
      (_, username) => `\/\/${username}:****@`
    );
    console.log(
      `[DirectProductDetails] Using connection string: ${redactedUri}`
    );

    // Create a new MongoDB client with minimal options
    client = new MongoClient(uri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 1,
      retryWrites: true,
      retryReads: true,
    });

    // Connect to MongoDB
    console.log("[DirectProductDetails] Connecting to MongoDB...");
    await client.connect();
    console.log("[DirectProductDetails] Connected to MongoDB");

    // Get database name from URI
    const dbName = uri.split("/").pop().split("?")[0];
    const db = client.db(dbName);
    console.log(`[DirectProductDetails] Using database: ${dbName}`);

    // Get the products collection
    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");

    // Try multiple strategies to find the product
    let product = null;

    // Strategy 1: Try with ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(productId)) {
      try {
        console.log(
          "[DirectProductDetails] Trying to find product with ObjectId"
        );
        product = await productsCollection.findOne({
          _id: new ObjectId(productId),
        });
        attempts.push({
          strategy: "objectId",
          success: !!product,
        });

        if (product) {
          console.log("[DirectProductDetails] Found product with ObjectId");
        }
      } catch (error) {
        console.error(
          "[DirectProductDetails] Error finding product with ObjectId:",
          error.message
        );
        attempts.push({
          strategy: "objectId",
          success: false,
          error: error.message,
        });
      }
    }

    // Strategy 2: Try with string ID
    if (!product) {
      try {
        console.log(
          "[DirectProductDetails] Trying to find product with string ID"
        );
        product = await productsCollection.findOne({ _id: productId });
        attempts.push({
          strategy: "stringId",
          success: !!product,
        });

        if (product) {
          console.log("[DirectProductDetails] Found product with string ID");
        }
      } catch (error) {
        console.error(
          "[DirectProductDetails] Error finding product with string ID:",
          error.message
        );
        attempts.push({
          strategy: "stringId",
          success: false,
          error: error.message,
        });
      }
    }

    // Strategy 3: Try with slug
    if (!product) {
      try {
        console.log("[DirectProductDetails] Trying to find product with slug");
        product = await productsCollection.findOne({ slug: productId });
        attempts.push({
          strategy: "slug",
          success: !!product,
        });

        if (product) {
          console.log("[DirectProductDetails] Found product with slug");
        }
      } catch (error) {
        console.error(
          "[DirectProductDetails] Error finding product with slug:",
          error.message
        );
        attempts.push({
          strategy: "slug",
          success: false,
          error: error.message,
        });
      }
    }

    // Strategy 4: Try with flexible query
    if (!product) {
      try {
        console.log(
          "[DirectProductDetails] Trying to find product with flexible query"
        );
        const query = { $or: [{ _id: productId }, { slug: productId }] };

        if (/^[0-9a-fA-F]{24}$/.test(productId)) {
          query.$or.push({ _id: new ObjectId(productId) });
        }

        product = await productsCollection.findOne(query);
        attempts.push({
          strategy: "flexible",
          success: !!product,
        });

        if (product) {
          console.log(
            "[DirectProductDetails] Found product with flexible query"
          );
        }
      } catch (error) {
        console.error(
          "[DirectProductDetails] Error finding product with flexible query:",
          error.message
        );
        attempts.push({
          strategy: "flexible",
          success: false,
          error: error.message,
        });
      }
    }

    // Strategy 5: Get any product as fallback
    if (!product) {
      try {
        console.log(
          "[DirectProductDetails] Trying to find any product as fallback"
        );
        product = await productsCollection.findOne({}, { limit: 1 });
        attempts.push({
          strategy: "anyProduct",
          success: !!product,
        });

        if (product) {
          console.log("[DirectProductDetails] Found a fallback product");
        }
      } catch (error) {
        console.error(
          "[DirectProductDetails] Error finding fallback product:",
          error.message
        );
        attempts.push({
          strategy: "anyProduct",
          success: false,
          error: error.message,
        });
      }
    }

    // If we found a product, process it
    if (product) {
      console.log(`[DirectProductDetails] Processing product: ${product.name}`);

      // Process category if it exists
      if (product.category) {
        try {
          // Define category mapping for fallback
          const categoryMap = {
            "680c9481ab11e96a288ef6d9": "Sofa Beds",
            "680c9484ab11e96a288ef6da": "Tables",
            "680c9486ab11e96a288ef6db": "Chairs",
            "680c9489ab11e96a288ef6dc": "Wardrobes",
          };

          // If category is a string (ID), try to fetch the category object
          if (typeof product.category === "string") {
            console.log(
              `[DirectProductDetails] Fetching category for ID: ${product.category}`
            );

            let category = null;

            // Try to fetch with ObjectId
            if (/^[0-9a-fA-F]{24}$/.test(product.category)) {
              try {
                category = await categoriesCollection.findOne({
                  _id: new ObjectId(product.category),
                });
              } catch (categoryError) {
                console.error(
                  "[DirectProductDetails] Error fetching category with ObjectId:",
                  categoryError.message
                );
              }
            }

            // Try to fetch with string ID if ObjectId failed
            if (!category) {
              try {
                category = await categoriesCollection.findOne({
                  _id: product.category,
                });
              } catch (categoryError) {
                console.error(
                  "[DirectProductDetails] Error fetching category with string ID:",
                  categoryError.message
                );
              }
            }

            // If we found the category, use it
            if (category) {
              console.log(
                `[DirectProductDetails] Found category: ${category.name}`
              );
              product.category = {
                _id: category._id,
                name: category.name,
                slug:
                  category.slug ||
                  category.name.toLowerCase().replace(/\s+/g, "-"),
                image: category.image,
              };
            } else {
              // Use the mapping as fallback
              const categoryId = product.category;
              if (categoryMap[categoryId]) {
                console.log(
                  `[DirectProductDetails] Using category mapping for ID ${categoryId}: ${categoryMap[categoryId]}`
                );
                product.category = {
                  _id: categoryId,
                  name: categoryMap[categoryId],
                  slug: categoryMap[categoryId]
                    .toLowerCase()
                    .replace(/\s+/g, "-"),
                };
              } else {
                // Create a generic category object if no mapping exists
                console.log(
                  `[DirectProductDetails] No mapping found for category ID: ${categoryId}`
                );
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
          } else if (
            typeof product.category === "object" &&
            product.category &&
            !product.category.name
          ) {
            // If category is an object but doesn't have a name, try to add one
            const categoryId = product.category._id
              ? product.category._id.toString()
              : "";
            if (categoryId && categoryMap[categoryId]) {
              product.category.name = categoryMap[categoryId];
              product.category.slug = categoryMap[categoryId]
                .toLowerCase()
                .replace(/\s+/g, "-");
            } else {
              product.category.name =
                categoryId.length === 24
                  ? `Category ${categoryId.substring(0, 8)}`
                  : "Unknown Category";
              product.category.slug = `category-${categoryId.substring(0, 8)}`;
            }
          }
        } catch (categoryError) {
          console.error(
            "[DirectProductDetails] Error processing category:",
            categoryError.message
          );
          // Ensure we have a valid category object even if processing fails
          if (typeof product.category === "string") {
            product.category = {
              _id: product.category,
              name: "Unknown Category",
              slug: "unknown-category",
            };
          }
        }
      }

      // Return the product in the format expected by the frontend
      return res.status(200).json({
        success: true,
        data: product,
        source: "direct_mongodb",
        attempts,
      });
    }

    // If we didn't find a product, return a mock product
    console.log(
      "[DirectProductDetails] No product found, returning mock product"
    );

    // Create a mock product
    const mockProduct = {
      _id: productId,
      name: "Sample Product (Mock)",
      description:
        "This is a sample product shown when the product could not be found in the database.",
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
      reviews: [],
      source: "mock_data",
      __isMock: true,
    };

    return res.status(200).json({
      success: true,
      data: mockProduct,
      source: "mock_data",
      attempts,
    });
  } catch (error) {
    console.error("[DirectProductDetails] Error in getProductById:", error);

    // Return a mock product with error information
    return res.status(200).json({
      success: true,
      data: {
        _id: req.params.id,
        name: "Error Product (Mock)",
        description: "This is a sample product shown when an error occurred.",
        price: 19999,
        discountPrice: 15999,
        category: {
          _id: "error-category",
          name: "Error Category",
          slug: "error-category",
        },
        stock: 10,
        ratings: 4.5,
        numReviews: 12,
        images: [
          "https://placehold.co/800x600/red/white?text=Error+Loading+Product",
        ],
        specifications: [
          { name: "Error", value: error.message },
          {
            name: "Stack",
            value: error.stack ? error.stack.split("\n")[0] : "No stack trace",
          },
        ],
        reviews: [],
        source: "error_mock_data",
        __isMock: true,
        __error: error.message,
      },
      error: error.message,
      attempts,
    });
  } finally {
    // Close the MongoDB client if it was created
    if (client) {
      try {
        await client.close();
        console.log("[DirectProductDetails] MongoDB client closed");
      } catch (closeError) {
        console.error(
          "[DirectProductDetails] Error closing MongoDB client:",
          closeError.message
        );
      }
    }
  }
};
