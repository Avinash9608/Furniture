const mongoose = require("mongoose");
const timeoutPlugin = require("../utils/mongooseTimeoutPlugin");

// Try to require slugify, but provide a fallback if it's not available
let slugify;
try {
  slugify = require("slugify");
} catch (error) {
  console.warn("Slugify package not found, using fallback implementation");
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

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a product name"],
    trim: true,
    maxlength: [100, "Name cannot be more than 100 characters"]
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
    maxlength: [2000, "Description cannot be more than 2000 characters"]
  },
  price: {
    type: Number,
    required: [true, "Please add a price"],
    min: [0, "Price must be greater than 0"]
  },
  discountPrice: {
    type: Number,
    min: [0, "Discount price must be greater than 0"]
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: "Category",
    required: [true, "Please select a category"]
  },
  stock: {
    type: Number,
    required: [true, "Please add stock quantity"],
    min: [0, "Stock cannot be negative"]
  },
  images: {
    type: [String],
    default: []
  },
  featured: {
    type: Boolean,
    default: false
  },
  material: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  ratings: {
    type: Number,
    default: 0,
    min: [0, "Rating must be at least 0"],
    max: [5, "Rating cannot be more than 5"]
  },
  numReviews: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
      },
      name: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Debug middleware to log product data before saving
ProductSchema.pre("save", function (next) {
  console.log("=== PRODUCT PRE-SAVE MIDDLEWARE ===");
  console.log("Product data:", this.toObject());
  console.log("isNew:", this.isNew);
  console.log("Required fields:");
  console.log("- name:", this.name);
  console.log("- description:", this.description);
  console.log("- price:", this.price);
  console.log("- category:", this.category);
  console.log("- stock:", this.stock);
  next();
});

// Create slug from name before saving
ProductSchema.pre("save", function(next) {
  if (!this.isModified("name")) {
    next();
    return;
  }
  
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  next();
});

// Additional safety check to ensure we never have null slugs
ProductSchema.pre("save", function (next) {
  if (!this.slug) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.slug = `product-${timestamp}-${random}`;
    console.log(`Fallback slug generated: ${this.slug}`);
  }
  next();
});

// Add mock data for fallback
ProductSchema.statics.mockData = [
  {
    _id: "mock-product-1",
    name: "Luxury Sofa",
    slug: "luxury-sofa",
    description: "A comfortable luxury sofa for your living room",
    price: 12999,
    category: "mock-category-1",
    stock: 10,
    images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc"],
    featured: true,
    dimensions: {
      length: 200,
      width: 90,
      height: 85,
    },
    material: "Leather",
    color: "Brown",
    ratings: 4.5,
    numReviews: 12,
    createdAt: new Date(),
  },
  {
    _id: "mock-product-2",
    name: "Wooden Dining Table",
    slug: "wooden-dining-table",
    description: "A sturdy wooden dining table for your family",
    price: 8999,
    category: "mock-category-2",
    stock: 5,
    images: ["https://images.unsplash.com/photo-1533090161767-e6ffed986c88"],
    featured: false,
    dimensions: {
      length: 180,
      width: 90,
      height: 75,
    },
    material: "Wood",
    color: "Natural",
    ratings: 4.2,
    numReviews: 8,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    _id: "mock-product-3",
    name: "Executive Office Chair",
    slug: "executive-office-chair",
    description: "A comfortable office chair with ergonomic design",
    price: 5999,
    category: "mock-category-3",
    stock: 15,
    images: ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8"],
    featured: true,
    dimensions: {
      length: 70,
      width: 70,
      height: 120,
    },
    material: "Mesh and Metal",
    color: "Black",
    ratings: 4.8,
    numReviews: 20,
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
  },
];

// Apply the timeout plugin
ProductSchema.plugin(timeoutPlugin, { timeout: 60000 });

// Add indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

// Check if model exists before creating a new one
const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

// Export the model
module.exports = Product;
