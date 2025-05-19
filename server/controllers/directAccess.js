const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

/**
 * Direct MongoDB access controller for emergency situations
 * This controller provides direct access to MongoDB without using Mongoose
 * It's used as a fallback when the regular controllers fail
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniquePrefix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files are allowed!'));
  },
});

// Helper function to connect to MongoDB
const connectToMongoDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000
    });
    
    await client.connect();
    console.log('Connected to MongoDB directly');
    
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

// @desc    Get all products directly from MongoDB
// @route   GET /api/direct/products
// @access  Public
exports.getProducts = async (req, res) => {
  let client;
  
  try {
    const { client: mongoClient, db } = await connectToMongoDB();
    client = mongoClient;
    
    const productsCollection = db.collection('products');
    const products = await productsCollection.find({}).toArray();
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error getting products directly from MongoDB:', error);
    res.status(200).json({
      success: false,
      message: 'Error getting products',
      error: error.message
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// @desc    Get a product by ID directly from MongoDB
// @route   GET /api/direct/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  let client;
  
  try {
    const { client: mongoClient, db } = await connectToMongoDB();
    client = mongoClient;
    
    const productsCollection = db.collection('products');
    
    // Convert string ID to ObjectId
    const objectId = new ObjectId(req.params.id);
    
    // Find the product
    const product = await productsCollection.findOne({ _id: objectId });
    
    if (!product) {
      return res.status(200).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error getting product directly from MongoDB:', error);
    res.status(200).json({
      success: false,
      message: 'Error getting product',
      error: error.message
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// @desc    Update a product directly in MongoDB
// @route   PUT /api/direct/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  let client;
  
  try {
    console.log(`Direct update for product with ID: ${req.params.id}`);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    const { client: mongoClient, db } = await connectToMongoDB();
    client = mongoClient;
    
    const productsCollection = db.collection('products');
    
    // Convert string ID to ObjectId
    const objectId = new ObjectId(req.params.id);
    
    // Find the product
    const product = await productsCollection.findOne({ _id: objectId });
    
    if (!product) {
      return res.status(200).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`
      });
    }
    
    // Create update data object
    const updateData = {};
    
    // Handle basic fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.price) updateData.price = Number(req.body.price);
    if (req.body.discountPrice) updateData.discountPrice = Number(req.body.discountPrice);
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.stock) updateData.stock = Number(req.body.stock);
    if (req.body.material) updateData.material = req.body.material;
    if (req.body.color) updateData.color = req.body.color;
    
    // Handle boolean fields
    if (req.body.featured === 'true') updateData.featured = true;
    if (req.body.featured === 'false') updateData.featured = false;
    
    // Handle dimensions object
    if (req.body.dimensions) {
      try {
        // Check if dimensions is already a string that needs parsing
        const dimensionsData =
          typeof req.body.dimensions === 'string'
            ? JSON.parse(req.body.dimensions)
            : req.body.dimensions;
        
        updateData.dimensions = {
          length: dimensionsData.length ? Number(dimensionsData.length) : undefined,
          width: dimensionsData.width ? Number(dimensionsData.width) : undefined,
          height: dimensionsData.height ? Number(dimensionsData.height) : undefined,
        };
        
        console.log('Processed dimensions for update:', updateData.dimensions);
      } catch (dimError) {
        console.error('Error processing dimensions for update:', dimError);
        // Continue without dimensions if there's an error
      }
    }
    
    // Handle existing images from request body
    if (req.body.existingImages) {
      try {
        let existingImages;
        
        if (typeof req.body.existingImages === 'string') {
          try {
            existingImages = JSON.parse(req.body.existingImages);
          } catch (parseError) {
            // Try to handle as comma-separated string
            existingImages = req.body.existingImages.split(',').map(path => path.trim());
          }
        } else if (Array.isArray(req.body.existingImages)) {
          existingImages = req.body.existingImages;
        }
        
        console.log('Existing images from request:', existingImages);
        
        if (existingImages && existingImages.length > 0) {
          updateData.images = existingImages;
        }
      } catch (parseError) {
        console.error('Error handling existing images:', parseError);
      }
    }
    
    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const images = [];
      
      // Add new images
      req.files.forEach((file) => {
        images.push(`/uploads/${file.filename}`);
      });
      
      // If we already have images from existingImages, append the new ones
      if (updateData.images && updateData.images.length > 0) {
        updateData.images = [...updateData.images, ...images];
      } else {
        updateData.images = images;
      }
      
      console.log('Final images array:', updateData.images);
    }
    
    // Add updated timestamp
    updateData.updatedAt = new Date();
    
    console.log('Updating product with data:', updateData);
    
    // Update the product
    const result = await productsCollection.updateOne(
      { _id: objectId },
      { $set: updateData }
    );
    
    console.log('Update result:', result);
    
    if (result.modifiedCount > 0) {
      // Get the updated product
      const updatedProduct = await productsCollection.findOne({ _id: objectId });
      
      res.status(200).json({
        success: true,
        data: updatedProduct
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'Product not updated'
      });
    }
  } catch (error) {
    console.error('Error updating product directly in MongoDB:', error);
    res.status(200).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// Middleware for handling file uploads
exports.uploadProductImages = upload.array('images', 5);
