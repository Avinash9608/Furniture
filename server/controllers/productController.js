const Product = require("../models/Product");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      featured,
      material,
      color,
      dimensions,
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !stock) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    // Upload images to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file);
        imageUrls.push(result.secure_url);
      }
    }

    // Create product
    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      images: imageUrls,
      featured: featured || false,
      material: material || "",
      color: color || "",
      dimensions: dimensions ? JSON.parse(dimensions) : {},
    });

    const createdProduct = await product.save();

    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).populate("category");
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      featured,
      material,
      color,
      dimensions,
    } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Upload new images to Cloudinary
    const newImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file);
        newImageUrls.push(result.secure_url);
      }
    }

    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.stock = stock || product.stock;
    product.featured = featured || product.featured;
    product.material = material || product.material;
    product.color = color || product.color;
    product.dimensions = dimensions
      ? JSON.parse(dimensions)
      : product.dimensions;

    // Handle images - replace or append based on client logic
    if (req.body.replaceImages === "true") {
      product.images = newImageUrls;
    } else if (newImageUrls.length > 0) {
      product.images = [...product.images, ...newImageUrls];
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // TODO: Optionally delete images from Cloudinary here

    await product.remove();
    res.json({ message: "Product removed" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
