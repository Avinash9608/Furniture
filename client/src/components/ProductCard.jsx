import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatPrice, calculateDiscountPercentage } from "../utils/format";

const ProductCard = ({ product }) => {
  return (
    <motion.div whileHover={{ y: -5 }} className="card group">
      <div className="relative overflow-hidden h-64">
        <img
          src={
            product.images && product.images.length > 0
              ? product.images[0].startsWith("http")
                ? product.images[0]
                : `${
                    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
                  }${product.images[0]}`
              : "https://via.placeholder.com/300x300?text=" +
                encodeURIComponent(product.name || "Product")
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            console.log("Image load error:", e.target.src);
            e.target.onerror = null;
            e.target.src =
              "https://via.placeholder.com/300x300?text=Image+Not+Found";
          }}
        />
        <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
        <span className="text-sm text-gray-500">
          {product.category &&
          typeof product.category === "object" &&
          product.category.name
            ? product.category.name
            : "Uncategorized"}
        </span>
        <h3 className="text-lg font-medium mb-2">{product.name}</h3>
        <div className="flex justify-between items-center">
          <div>
            {product.discountPrice && product.discountPrice < product.price ? (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(product.discountPrice)}
                </span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 line-through mr-1">
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
            to={`/products/${product._id}`}
            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-300"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
