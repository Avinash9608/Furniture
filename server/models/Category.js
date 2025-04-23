const mongoose = require("mongoose");

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
CategorySchema.pre("save", function (next) {
  if (this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
  } else {
    // Generate a random slug if name is not provided
    this.slug =
      "category-" + Date.now() + "-" + Math.round(Math.random() * 1000);
  }
  next();
});

// Also handle insertMany operations
CategorySchema.pre("insertMany", function (next, docs) {
  if (Array.isArray(docs) && docs.length) {
    docs = docs.map((doc) => {
      if (doc.name) {
        doc.slug = doc.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
      } else {
        // Generate a random slug if name is not provided
        doc.slug =
          "category-" + Date.now() + "-" + Math.round(Math.random() * 1000);
      }
      return doc;
    });
  }
  next();
});

module.exports = mongoose.model("Category", CategorySchema);
