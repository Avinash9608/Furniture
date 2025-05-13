/**
 * V2 Product Controller
 * Uses Mongoose model directly to ensure all fields are saved
 */

const mongoose = require('mongoose');
const slugify = require('slugify');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Create a product using the Product model directly
exports.createProduct = async (req, res) => {
  try {
    console.log('=== V2 PRODUCT CONTROLLER ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request files:', req.files ? JSON.stringify(req.files.map(f => f.filename), null, 2) : 'none');
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Database connection is not established',
        connectionState: mongoose.connection.readyState
      });
    }
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'stock'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Generate a unique slug
    const timestamp = Date.now();
    let baseSlug = slugify(req.body.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    if (!baseSlug || baseSlug.trim() === '') {
      baseSlug = 'product';
    }
    
    const uniqueSlug = `${baseSlug}-${timestamp}`;
    console.log('Generated unique slug:', uniqueSlug);
    
    // Process images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/images/${file.filename}`);
      console.log('Uploaded images:', images);
    } else {
      // Default image
      images = ['https://placehold.co/300x300/gray/white?text=Product'];
      console.log('Using default image');
    }
    
    // Process dimensions
    let dimensions = { length: 0, width: 0, height: 0 };
    if (req.body.dimensions) {
      try {
        if (typeof req.body.dimensions === 'string') {
          dimensions = JSON.parse(req.body.dimensions);
          console.log('Successfully parsed dimensions JSON:', dimensions);
        } else {
          dimensions = req.body.dimensions;
        }
      } catch (error) {
        console.error('Error parsing dimensions:', error);
      }
    }
    
    // Ensure dimensions are numbers, not strings
    dimensions = {
      length: parseFloat(dimensions.length) || 0,
      width: parseFloat(dimensions.width) || 0,
      height: parseFloat(dimensions.height) || 0
    };
    
    console.log('Normalized dimensions:', dimensions);
    
    // Process category
    let categoryId;
    
    if (req.body.category && req.body.category.startsWith('standard_')) {
      // Handle standard category
      const categoryMap = {
        standard_sofa_beds: 'Sofa Beds',
        standard_tables: 'Tables',
        standard_chairs: 'Chairs',
        standard_wardrobes: 'Wardrobes',
        standard_beds: 'Beds'
      };
      
      const categoryName = categoryMap[req.body.category] || 'Other';
      
      try {
        // Find or create category
        let category = await Category.findOne({ name: categoryName });
        
        if (!category) {
          category = new Category({
            name: categoryName,
            description: `${categoryName} furniture items`,
            slug: slugify(categoryName, { lower: true })
          });
          
          await category.save();
          console.log(`Created new category: ${categoryName}`);
        }
        
        categoryId = category._id;
        console.log(`Using category: ${categoryName} (${categoryId})`);
      } catch (error) {
        console.error('Error handling category:', error);
        
        // Create a default category
        const defaultCategory = new Category({
          name: 'Default Category',
          description: 'Default category created due to error',
          slug: 'default-category'
        });
        
        const savedCategory = await defaultCategory.save();
        categoryId = savedCategory._id;
        console.log(`Using fallback category: ${savedCategory._id}`);
      }
    } else if (req.body.category) {
      // Try to use provided category ID
      try {
        categoryId = new mongoose.Types.ObjectId(req.body.category);
        
        // Check if category exists
        const categoryExists = await Category.exists({ _id: categoryId });
        
        if (!categoryExists) {
          // Create a default category
          const defaultCategory = new Category({
            name: 'Other',
            description: 'Other furniture items',
            slug: 'other'
          });
          
          const savedCategory = await defaultCategory.save();
          categoryId = savedCategory._id;
          console.log(`Category not found, using default: ${savedCategory._id}`);
        }
      } catch (error) {
        console.error('Error processing category ID:', error);
        
        // Create a default category
        const defaultCategory = new Category({
          name: 'Fallback',
          description: 'Fallback category',
          slug: 'fallback'
        });
        
        const savedCategory = await defaultCategory.save();
        categoryId = savedCategory._id;
        console.log(`Using fallback category: ${savedCategory._id}`);
      }
    } else {
      // Create a default category
      const defaultCategory = new Category({
        name: 'Uncategorized',
        description: 'Uncategorized items',
        slug: 'uncategorized'
      });
      
      const savedCategory = await defaultCategory.save();
      categoryId = savedCategory._id;
      console.log(`No category provided, using default: ${savedCategory._id}`);
    }
    
    // Create a new product using the Product model directly
    const product = new Product({
      name: req.body.name,
      slug: uniqueSlug,
      description: req.body.description,
      price: parseFloat(req.body.price) || 0,
      stock: parseInt(req.body.stock) || 0,
      category: categoryId,
      images: images,
      featured: req.body.featured === 'true' || req.body.isFeatured === 'true',
      dimensions: dimensions,
      material: req.body.material || '',
      color: req.body.color || '',
      ratings: 0,
      numReviews: 0,
      reviews: []
    });
    
    // Handle discount price separately
    if (req.body.discountPrice) {
      product.discountPrice = parseFloat(req.body.discountPrice);
    }
    
    console.log('Product instance created:', JSON.stringify(product.toObject(), null, 2));
    
    // Save the product
    const savedProduct = await product.save();
    console.log('Product saved successfully:', savedProduct._id);
    
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    });
  } catch (error) {
    console.error('Error in V2 product creation:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).populate('category', 'name');
    
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get a single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};
