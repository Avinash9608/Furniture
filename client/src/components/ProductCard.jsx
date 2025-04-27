import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatPrice, calculateDiscountPercentage } from "../utils/format";
import { getProductImage, handleImageError } from "../utils/defaultImages";

const ProductCard = ({ product }) => {
  return (
    <motion.div whileHover={{ y: -5 }} className="card group">
      <div className="relative overflow-hidden h-64">
        <img
          src={getProductImage(product)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={handleImageError}
        />
        <div className="absolute top-2 right-2 theme-bg-primary rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            ></path>
          </svg>
        </div>
      </div>
      <div className="p-4">
        <span className="text-sm theme-text-secondary">
          {(() => {
            // Handle different category formats
            if (!product || !product.category) {
              return "Uncategorized";
            }

            // If category is an object with a name property
            if (typeof product.category === "object" && product.category.name) {
              return product.category.name;
            }

            // If category is a string (MongoDB ID)
            if (typeof product.category === "string") {
              // Check if it's a MongoDB ObjectId (24 hex chars)
              if (
                product.category.length === 24 &&
                /^[0-9a-f]+$/.test(product.category)
              ) {
                // Direct mapping of known category IDs to their names
                const categoryMap = {
                  // Map exact category IDs to their proper names
                  "680c9481ab11e96a288ef6d9": "Sofa Beds",
                  "680c9484ab11e96a288ef6da": "Tables",
                  "680c9486ab11e96a288ef6db": "Chairs",
                  "680c9489ab11e96a288ef6dc": "Wardrobes",
                };

                // Return the mapped category name or a default
                return categoryMap[product.category] || "Furniture";
              }
              // If it's a regular string, use it directly
              return product.category;
            }

            // Fallback
            return "Uncategorized";
          })()}
        </span>
        <h3 className="text-lg font-medium mb-2 theme-text-primary">
          {product.name}
        </h3>
        <div className="flex justify-between items-center">
          <div>
            {product.discountPrice && product.discountPrice < product.price ? (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(product.discountPrice)}
                </span>
                <div className="flex items-center">
                  <span className="text-sm theme-text-secondary line-through mr-1">
                    {formatPrice(product.price, false)}
                  </span>
                  <span className="text-xs text-red-600">
                    {calculateDiscountPercentage(
                      product.price,
                      product.discountPrice
                    )}
                    % OFF
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <Link
            to={`/products/${product._id || "not-found"}`}
            className="text-sm font-medium theme-text-secondary hover:text-primary transition-colors duration-300"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
