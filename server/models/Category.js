const mongoose = require("mongoose");

// Try to require slugify, but provide a fallback if it's not available
let slugify;
try {
  slugify = require("slugify");
} catch (error) {
  console.warn(
    "Slugify package not found in Category model, using fallback implementation"
  );
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

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a category name"],
    unique: true,
    trim: true,
    maxlength: [50, "Category name cannot be more than 50 characters"],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot be more than 500 characters"],
  },
  image: {
    type: String,
    default: "no-image.jpg",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create slug from name before saving
CategorySchema.pre("save", async function (next) {
  try {
    // If name hasn't changed and we already have a slug, skip slug generation
    if (!this.isModified("name") && this.slug) {
      return next();
    }

    // Make sure we have a name to work with
    if (!this.name || this.name.trim() === "") {
      this.slug = `category-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
      baseSlug = `category-${Date.now()}`;
    }

    // Check if slug already exists
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    // Keep checking until we find a unique slug
    while (slugExists) {
      try {
        // Check if a category with this slug already exists (excluding this document)
        const existingCategory = await this.constructor.findOne({
          slug: slug,
          _id: { $ne: this._id }, // Exclude current document
        });

        if (!existingCategory) {
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
    console.log(`Generated slug: ${this.slug} for category: ${this.name}`);
    next();
  } catch (error) {
    console.error("Error in slug generation:", error);
    // Ensure we always have a slug, even if there's an error
    this.slug = `category-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    next();
  }
});

// Additional safety check to ensure we never have null slugs
CategorySchema.pre("save", function (next) {
  if (!this.slug) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.slug = `category-${timestamp}-${random}`;
    console.log(`Fallback slug generated: ${this.slug}`);
  }
  next();
});

// Also handle insertMany operations
CategorySchema.pre("insertMany", function (next, docs) {
  if (Array.isArray(docs) && docs.length) {
    docs = docs.map((doc) => {
      try {
        if (doc.name && doc.name.trim() !== "") {
          // Generate base slug from name using slugify
          let baseSlug = slugify(doc.name, {
            lower: true,
            strict: true, // removes special characters
            remove: /[*+~.()'"!:@]/g,
          });

          // If baseSlug is empty after processing, use a fallback
          if (!baseSlug || baseSlug.trim() === "") {
            baseSlug = `category-${Date.now()}`;
          }

          // Add a timestamp to ensure uniqueness in bulk operations
          doc.slug = `${baseSlug}-${Date.now()}-${Math.floor(
            Math.random() * 100
          )}`;
        } else {
          // Generate a random slug if name is not provided
          doc.slug = `category-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`;
        }
      } catch (error) {
        console.error("Error generating slug in insertMany:", error);
        // Ensure we always have a slug, even if there's an error
        doc.slug = `category-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }

      return doc;
    });
  }
  next();
});

module.exports = mongoose.model("Category", CategorySchema);
