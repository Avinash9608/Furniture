const express = require("express");
const router = express.Router();
const {
  getCollection,
  findDocuments,
  findOneDocument,
} = require("../utils/directDbAccess");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

/**
 * Test endpoint for MongoDB connection
 * GET /api/test/mongo
 */
router.get("/mongo", async (req, res) => {
  try {
    console.log("Testing MongoDB connection");

    // Check mongoose connection
    const mongooseState = mongoose.connection.readyState;
    console.log(`Mongoose connection state: ${mongooseState}`);

    // Try direct connection
    let directConnection = false;
    let collections = [];
    let error = null;

    try {
      const { client, db } = await getMongoClient();
      directConnection = true;
      collections = await db.listCollections().toArray();
      collections = collections.map((c) => c.name);
    } catch (err) {
      error = err.message;
      console.error("Error connecting to MongoDB directly:", err);
    }

    return res.json({
      success: true,
      mongooseState,
      directConnection,
      collections,
      error,
    });
  } catch (err) {
    console.error("Error in MongoDB test endpoint:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Test endpoint for product retrieval
 * GET /api/test/product/:id
 */
router.get("/product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Testing product retrieval for ID: ${id}`);

    // Results object to track all attempts
    const results = {
      attempts: [],
      product: null,
      success: false,
    };

    // Attempt 1: Try with mongoose model if available
    try {
      if (mongoose.models.Product) {
        console.log("Attempting to find product with mongoose model");
        const Product = mongoose.models.Product;
        const product = await Product.findById(id);

        results.attempts.push({
          method: "mongoose",
          success: !!product,
          error: null,
        });

        if (product) {
          results.product = product;
          results.success = true;
          console.log("Found product with mongoose model");
        }
      }
    } catch (err) {
      console.error("Error finding product with mongoose model:", err);
      results.attempts.push({
        method: "mongoose",
        success: false,
        error: err.message,
      });
    }

    // Attempt 2: Try with direct MongoDB access using ObjectId
    if (!results.success && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        console.log(
          "Attempting to find product with direct MongoDB access using ObjectId"
        );
        const objectId = new ObjectId(id);
        const product = await findOneDocument("products", { _id: objectId });

        results.attempts.push({
          method: "directObjectId",
          success: !!product,
          error: null,
        });

        if (product) {
          results.product = product;
          results.success = true;
          console.log(
            "Found product with direct MongoDB access using ObjectId"
          );
        }
      } catch (err) {
        console.error(
          "Error finding product with direct MongoDB access using ObjectId:",
          err
        );
        results.attempts.push({
          method: "directObjectId",
          success: false,
          error: err.message,
        });
      }
    }

    // Attempt 3: Try with direct MongoDB access using string ID
    if (!results.success) {
      try {
        console.log(
          "Attempting to find product with direct MongoDB access using string ID"
        );
        const product = await findOneDocument("products", { _id: id });

        results.attempts.push({
          method: "directStringId",
          success: !!product,
          error: null,
        });

        if (product) {
          results.product = product;
          results.success = true;
          console.log(
            "Found product with direct MongoDB access using string ID"
          );
        }
      } catch (err) {
        console.error(
          "Error finding product with direct MongoDB access using string ID:",
          err
        );
        results.attempts.push({
          method: "directStringId",
          success: false,
          error: err.message,
        });
      }
    }

    // Attempt 4: Try with direct MongoDB access using slug
    if (!results.success) {
      try {
        console.log(
          "Attempting to find product with direct MongoDB access using slug"
        );
        const product = await findOneDocument("products", { slug: id });

        results.attempts.push({
          method: "directSlug",
          success: !!product,
          error: null,
        });

        if (product) {
          results.product = product;
          results.success = true;
          console.log("Found product with direct MongoDB access using slug");
        }
      } catch (err) {
        console.error(
          "Error finding product with direct MongoDB access using slug:",
          err
        );
        results.attempts.push({
          method: "directSlug",
          success: false,
          error: err.message,
        });
      }
    }

    // Attempt 5: Try with direct MongoDB access using flexible query
    if (!results.success) {
      try {
        console.log(
          "Attempting to find product with direct MongoDB access using flexible query"
        );
        const query = { $or: [{ _id: id }, { slug: id }] };
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
          query.$or.push({ _id: new ObjectId(id) });
        }

        const product = await findOneDocument("products", query);

        results.attempts.push({
          method: "directFlexible",
          success: !!product,
          error: null,
        });

        if (product) {
          results.product = product;
          results.success = true;
          console.log(
            "Found product with direct MongoDB access using flexible query"
          );
        }
      } catch (err) {
        console.error(
          "Error finding product with direct MongoDB access using flexible query:",
          err
        );
        results.attempts.push({
          method: "directFlexible",
          success: false,
          error: err.message,
        });
      }
    }

    // Attempt 6: Get a sample product if all else fails
    if (!results.success) {
      try {
        console.log("Attempting to get a sample product");
        const products = await findDocuments("products", {}, { limit: 1 });

        results.attempts.push({
          method: "sampleProduct",
          success: products && products.length > 0,
          error: null,
        });

        if (products && products.length > 0) {
          results.product = products[0];
          results.success = true;
          console.log("Found sample product");
        }
      } catch (err) {
        console.error("Error getting sample product:", err);
        results.attempts.push({
          method: "sampleProduct",
          success: false,
          error: err.message,
        });
      }
    }

    // If all attempts fail, create a mock product
    if (!results.success) {
      console.log("All attempts failed, creating mock product");
      results.product = {
        _id: id,
        name: "Sample Product (Mock)",
        description:
          "This is a sample product shown when no products are found in the database.",
        price: 19999,
        discountPrice: 15999,
        category: "sample-category",
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
      };
      results.success = true;
      results.isMock = true;
    }

    return res.json({
      success: true,
      results,
    });
  } catch (err) {
    console.error("Error in product test endpoint:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Test endpoint for product listing
 * GET /api/test/products
 */
router.get("/products", async (req, res) => {
  try {
    console.log("Testing product listing");

    // Results object to track all attempts
    const results = {
      attempts: [],
      products: [],
      count: 0,
      success: false,
    };

    // Attempt 1: Try with mongoose model if available
    try {
      if (mongoose.models.Product) {
        console.log("Attempting to find products with mongoose model");
        const Product = mongoose.models.Product;
        const products = await Product.find({ stock: { $gt: 0 } }).limit(5);

        results.attempts.push({
          method: "mongoose",
          success: products && products.length > 0,
          error: null,
        });

        if (products && products.length > 0) {
          results.products = products;
          results.count = products.length;
          results.success = true;
          console.log(`Found ${products.length} products with mongoose model`);
        }
      }
    } catch (err) {
      console.error("Error finding products with mongoose model:", err);
      results.attempts.push({
        method: "mongoose",
        success: false,
        error: err.message,
      });
    }

    // Attempt 2: Try with direct MongoDB access
    if (!results.success) {
      try {
        console.log("Attempting to find products with direct MongoDB access");
        const products = await findDocuments(
          "products",
          { stock: { $gt: 0 } },
          { limit: 5 }
        );

        results.attempts.push({
          method: "direct",
          success: products && products.length > 0,
          error: null,
        });

        if (products && products.length > 0) {
          results.products = products;
          results.count = products.length;
          results.success = true;
          console.log(
            `Found ${products.length} products with direct MongoDB access`
          );
        }
      } catch (err) {
        console.error(
          "Error finding products with direct MongoDB access:",
          err
        );
        results.attempts.push({
          method: "direct",
          success: false,
          error: err.message,
        });
      }
    }

    // If all attempts fail, create mock products
    if (!results.success) {
      console.log("All attempts failed, creating mock products");
      results.products = Array.from({ length: 5 }, (_, i) => ({
        _id: `mock_${i + 1}`,
        name: `Sample Product ${i + 1}`,
        description: "This is a sample product.",
        price: 19999,
        discountPrice: 15999,
        category: "sample-category",
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
      }));
      results.count = results.products.length;
      results.success = true;
      results.isMock = true;
    }

    return res.json({
      success: true,
      results,
    });
  } catch (err) {
    console.error("Error in products test endpoint:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Test endpoint for database collections
 * GET /api/test/collections
 */
router.get("/collections", async (req, res) => {
  try {
    console.log("Testing database collections");

    // Results object
    const results = {
      collections: [],
      collectionData: {},
      success: false,
    };

    // Try to get collections
    try {
      const { db } = await getMongoClient();
      const collections = await db.listCollections().toArray();
      results.collections = collections.map((c) => c.name);
      results.success = true;

      // Get counts for each collection
      for (const collection of results.collections) {
        try {
          const count = await db.collection(collection).countDocuments();
          results.collectionData[collection] = { count };

          // Get sample documents for important collections
          if (
            ["products", "categories", "users", "orders"].includes(collection)
          ) {
            const samples = await db
              .collection(collection)
              .find()
              .limit(2)
              .toArray();
            results.collectionData[collection].samples = samples.map((s) => ({
              _id: s._id.toString(),
              name: s.name || s.email || s.orderId || "Unknown",
            }));
          }
        } catch (err) {
          results.collectionData[collection] = { error: err.message };
        }
      }
    } catch (err) {
      console.error("Error getting collections:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    return res.json({
      success: true,
      results,
    });
  } catch (err) {
    console.error("Error in collections test endpoint:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
