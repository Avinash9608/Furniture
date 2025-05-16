const Product = require("../models/Product");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const slugify = require("slugify");

// @desc    Create product with direct MongoDB insertion
// @route   POST /api/bypass/product
// @access  Public (for testing) / Private (in production)
exports.createProduct = async (req, res) => {
  try {
    console.log("=== Creating Product with Bypass Method ===");
    console.log("Request body:", req.body);
    console.log("Files received:", req.files ? req.files.length : 0);
    
    // Validate required fields
    const requiredFields = ["name", "description", "price", "category", "stock"];
    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }
    
    // Process uploaded files if any
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files`);
      imageUrls = req.files.map((file) => {
        // Convert Windows backslashes to forward slashes for URLs
        return file.path.replace(/\\/g, "/");
      });
      console.log("Uploaded image paths:", imageUrls);
    }
    
    // Process dimensions if provided
    let dimensions = {};
    if (req.body.dimensions) {
      try {
        if (typeof req.body.dimensions === "string") {
          dimensions = JSON.parse(req.body.dimensions);
          console.log("Successfully parsed dimensions JSON:", dimensions);
        } else {
          dimensions = req.body.dimensions;
          console.log("Using dimensions object directly:", dimensions);
        }
        console.log("Processed dimensions:", dimensions);
      } catch (error) {
        console.error("Error parsing dimensions:", error);
        dimensions = {}; // Default to empty object if parsing fails
      }
    }
    
    // Process category - handle offline categories
    let categoryValue = req.body.category;
    let categoryName = req.body.categoryName || "";
    
    // If it's an offline category, extract the name
    if (categoryValue && typeof categoryValue === 'string' && categoryValue.startsWith('offline_')) {
      console.log(`Detected offline category: ${categoryValue}`);
      
      // Extract category name from the offline ID if not provided
      if (!categoryName) {
        categoryName = categoryValue.replace('offline_', '');
        // Capitalize first letter
        categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        console.log(`Extracted category name: ${categoryName}`);
      }
    }
    
    // Generate a slug from the product name
    let slug = "";
    try {
      slug = slugify(req.body.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
      
      // Check if slug already exists
      const existingProduct = await Product.findOne({ slug });
      if (existingProduct) {
        // Add a timestamp to make the slug unique
        slug = `${slug}-${Date.now()}`;
      }
      
      console.log(`Generated slug: ${slug}`);
    } catch (slugError) {
      console.error("Error generating slug:", slugError);
      // Fallback to a timestamp-based slug
      slug = `product-${Date.now()}`;
    }
    
    // Create product data object
    const productData = {
      name: req.body.name,
      slug: slug,
      description: req.body.description || "",
      price: parseFloat(req.body.price) || 0,
      discountPrice: req.body.discountPrice ? parseFloat(req.body.discountPrice) : null,
      category: categoryValue,
      categoryName: categoryName,
      stock: parseInt(req.body.stock) || 0,
      images: imageUrls,
      featured: req.body.featured === "true" || req.body.featured === true,
      material: req.body.material || "",
      color: req.body.color || "",
      dimensions: dimensions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log("Final product data to be saved:", productData);
    
    // Create the product using the model directly
    const product = new Product(productData);
    await product.save();
    
    console.log("Product created successfully:", {
      id: product._id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      categoryName: product.categoryName,
    });
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product",
      error: error.toString(),
    });
  }
};
