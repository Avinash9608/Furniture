import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/format';
import { getReliableProductImage } from '../../utils/reliableImageHelper';

/**
 * A reliable product table component that displays products with placeholder images
 * when server images fail to load.
 */
const ReliableProductTable = ({ 
  products = [], 
  onDeleteClick,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="theme-bg-primary rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 theme-border-primary mx-auto"></div>
        <p className="mt-4 theme-text-secondary">Loading products...</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="theme-bg-primary rounded-lg shadow-md p-8 text-center">
        <svg
          className="w-16 h-16 theme-text-secondary mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          ></path>
        </svg>
        <h3 className="text-xl font-bold mb-2 theme-text-primary">
          No Products Found
        </h3>
        <p className="theme-text-secondary mb-4">
          You haven't added any products yet.
        </p>
        <Link to="/admin/products/add">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Add Your First Product
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="theme-bg-primary rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y theme-divide">
          <thead className="theme-bg-secondary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium theme-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="theme-bg-primary divide-y theme-divide">
            {products.map((product) => (
              <motion.tr
                key={product._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="hover:theme-bg-secondary transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                    <img
                      src={getReliableProductImage(product)}
                      alt={`${product.name || 'Product'}`}
                      className="w-full h-full object-cover hover:opacity-75 transition-opacity duration-150"
                      onError={(e) => {
                        console.error("Image load error:", {
                          originalSrc: e.target.src,
                          productName: product.name,
                        });
                        e.target.onerror = null;
                        // Use a very simple placeholder as last resort
                        e.target.src = "https://placehold.co/300x300/gray/white?text=No+Image";
                      }}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium theme-text-primary">
                    {product.name || 'Unnamed Product'}
                  </div>
                  <div className="text-sm theme-text-secondary">
                    ID: {product._id ? product._id.substring(product._id.length - 6) : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    // Get category name with fallback
                    let categoryName = "Uncategorized";
                    let categoryColor = "gray";

                    // Try to get the category name
                    if (product.category) {
                      if (typeof product.category === 'string') {
                        categoryName = product.category;
                      } else if (product.category.name) {
                        categoryName = product.category.name;
                      }
                    }

                    // Standard category colors
                    const categoryColors = {
                      "Sofa Beds": "indigo",
                      "Tables": "blue",
                      "Chairs": "green",
                      "Wardrobes": "purple",
                      "Beds": "pink",
                    };

                    // Set color based on category name
                    for (const [key, color] of Object.entries(categoryColors)) {
                      if (categoryName.includes(key)) {
                        categoryColor = color;
                        break;
                      }
                    }

                    // Color classes for different categories
                    const colorClasses = {
                      indigo: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700",
                      blue: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
                      green: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
                      purple: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
                      pink: "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700",
                      red: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
                      orange: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
                      gray: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
                    };

                    return (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${colorClasses[categoryColor]}`}
                      >
                        {categoryName}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm theme-text-primary">
                    {formatPrice(product.price || 0)}
                  </div>
                  {product.discountPrice && (
                    <div className="text-xs theme-text-secondary line-through">
                      {formatPrice(product.discountPrice)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full theme-bg-secondary border theme-border ${
                      product.stock === 0 || product.stock === undefined
                        ? "text-red-600 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {product.stock > 0 ? product.stock : "Out of Stock"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    to={`/admin/products/edit/${product._id}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onDeleteClick(product._id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReliableProductTable;
