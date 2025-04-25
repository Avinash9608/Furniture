const mongoose = require("mongoose");

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
    maxlength: [100, "Product name cannot be more than 100 characters"],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    sparse: true, // This allows multiple documents with null values
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
    maxlength: [2000, "Description cannot be more than 2000 characters"],
  },
  price: {
    type: Number,
    required: [true, "Please add a price"],
    min: [0, "Price must be a positive number"],
  },
  discountPrice: {
    type: Number,
    min: [0, "Discount price must be a positive number"],
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: "Category",
    required: true,
  },
  stock: {
    type: Number,
    required: [true, "Please add stock quantity"],
    min: [0, "Stock cannot be negative"],
    default: 1,
  },
  images: [
    {
      type: String,
      required: false,
    },
  ],
  featured: {
    type: Boolean,
    default: false,
  },
  dimensions: {
    length: {
      type: Number,
      min: [0, "Length must be a positive number"],
    },
    width: {
      type: Number,
      min: [0, "Width must be a positive number"],
    },
    height: {
      type: Number,
      min: [0, "Height must be a positive number"],
    },
  },
  material: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  ratings: {
    type: Number,
    default: 0,
    min: [0, "Rating must be at least 0"],
    max: [5, "Rating cannot be more than 5"],
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create slug from name before saving
ProductSchema.pre("save", async function (next) {
  try {
    // If name hasn't changed and we already have a slug, skip slug generation
    if (!this.isModified("name") && this.slug) {
      return next();
    }

    // Make sure we have a name to work with
    if (!this.name || this.name.trim() === "") {
      this.slug = `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return next();
    }

    // Generate base slug from name using slugify
    let baseSlug = slugify(this.name, {
      lower: true,
      strict: true, // removes special characters
      remove: /[*+~.()'"!:@]/g,
    });

    // If baseSlug is empty after processing, use a fallback
    if (!baseSlug || baseSlug.trim() === "") {
      baseSlug = `product-${Date.now()}`;
    }

    // Check if slug already exists
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    // Keep checking until we find a unique slug
    while (slugExists) {
      try {
        // Check if a product with this slug already exists (excluding this document)
        const existingProduct = await this.constructor.findOne({
          slug: slug,
          _id: { $ne: this._id }, // Exclude current document
        });

        if (!existingProduct) {
          // Slug is unique
          slugExists = false;
        } else {
          // Slug exists, try with counter
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      } catch (err) {
        console.error("Error checking slug uniqueness:", err);
        // In case of error, use timestamp to ensure uniqueness
        slug = `${baseSlug}-${Date.now()}`;
        slugExists = false;
      }
    }

    this.slug = slug;
    console.log(`Generated slug: ${this.slug} for product: ${this.name}`);
    next();
  } catch (error) {
    console.error("Error in slug generation:", error);
    // Ensure we always have a slug, even if there's an error
    this.slug = `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    next();
  }
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

module.exports = mongoose.model("Product", ProductSchema);
