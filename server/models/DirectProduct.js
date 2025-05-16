const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create a more flexible product schema that accepts string categories
const DirectProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      default: null,
    },
    // Make category more flexible - can be ObjectId or String
    category: {
      type: Schema.Types.Mixed,
      required: [true, "Product category is required"],
    },
    // Store category name separately for easier access
    categoryName: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    images: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    material: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "",
    },
    dimensions: {
      type: Object,
      default: {},
    },
    reviews: [
      {
        user: {
          type: Schema.Types.Mixed, // Can be ObjectId or String
          required: true,
        },
        userName: {
          type: String,
          default: "Anonymous",
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
    averageRating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for formatted price
DirectProductSchema.virtual("formattedPrice").get(function () {
  return `₹${this.price.toLocaleString("en-IN")}`;
});

// Virtual for formatted discount price
DirectProductSchema.virtual("formattedDiscountPrice").get(function () {
  return this.discountPrice
    ? `₹${this.discountPrice.toLocaleString("en-IN")}`
    : null;
});

// Virtual for discount percentage
DirectProductSchema.virtual("discountPercentage").get(function () {
  if (!this.discountPrice || this.price <= 0) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Pre-save hook to ensure slug is created
DirectProductSchema.pre("save", async function (next) {
  // If no slug is provided, create one from the name
  if (!this.slug && this.name) {
    const slugify = require("slugify");
    let baseSlug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    
    // Check if slug already exists
    let slug = baseSlug;
    let counter = 1;
    let exists = true;
    
    while (exists) {
      const existingProduct = await mongoose.model("DirectProduct").findOne({ slug });
      
      if (!existingProduct) {
        exists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    
    this.slug = slug;
  }
  
  next();
});

// Method to calculate average rating
DirectProductSchema.methods.calculateAverageRating = function () {
  if (!this.reviews || this.reviews.length === 0) {
    this.averageRating = 0;
    return;
  }
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageRating = totalRating / this.reviews.length;
};

// Pre-save hook to calculate average rating
DirectProductSchema.pre("save", function (next) {
  this.calculateAverageRating();
  next();
});

module.exports = mongoose.model("DirectProduct", DirectProductSchema);
