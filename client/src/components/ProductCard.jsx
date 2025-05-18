import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatPrice, calculateDiscountPercentage } from "../utils/format";
import { getImageUrl, handleImageError } from "../utils/defaultImages";

// Helper function to safely get product data
const safeProduct = (product) => {
  if (!product) {
    return {
      _id: "unknown",
      name: "Unknown Product",
      price: 0,
      category: { name: "Uncategorized" },
      images: [],
    };
  }

  return {
    _id: product._id || "unknown",
    name: product.name || "Unknown Product",
    price: typeof product.price === "number" ? product.price : 0,
    discountPrice:
      typeof product.discountPrice === "number" ? product.discountPrice : null,
    category: product.category || { name: "Uncategorized" },
    images: Array.isArray(product.images) ? product.images : [],
    stock: product.stock || 0,
    ratings: product.ratings || null,
  };
};

const ProductCard = ({ product }) => {
  // Use the safe product helper to ensure we have valid data
  const safe = safeProduct(product);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoadAttempts, setImageLoadAttempts] = useState(0);

  // Initialize image URL
  useEffect(() => {
    const initializeImage = () => {
      if (safe.images && safe.images.length > 0) {
        console.log('ProductCard - Product:', safe._id, 'Original image data:', safe.images);
        
        // Try to get the first valid image path
        const imagePath = safe.images[0];
        console.log('ProductCard - Using image path:', imagePath);
        
        // Always use backend server URL
        const baseUrl = 'http://localhost:5000';
        console.log('ProductCard - Base URL:', baseUrl);
        
        // Process the image URL
        let processedUrl;
        
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          processedUrl = imagePath;
          console.log('ProductCard - Using full URL:', processedUrl);
        } else if (imagePath.startsWith('/uploads/')) {
          processedUrl = `${baseUrl}${imagePath}`;
          console.log('ProductCard - Constructed uploads URL:', processedUrl);
        } else if (!imagePath.startsWith('/')) {
          processedUrl = `${baseUrl}/uploads/${imagePath}`;
          console.log('ProductCard - Constructed filename URL:', processedUrl);
        } else {
          processedUrl = `${baseUrl}${imagePath}`;
          console.log('ProductCard - Constructed fallback URL:', processedUrl);
        }
        
        setImageUrl(processedUrl);
      } else {
        const placeholderUrl = 'https://placehold.co/300x300/gray/white?text=No+Image';
        console.log('ProductCard - No images available, using placeholder:', placeholderUrl);
        setImageUrl(placeholderUrl);
      }
    };

    initializeImage();
  }, [safe.images, safe._id]);

  // Function to handle image load errors
  const handleImageLoadError = (e) => {
    e.target.onerror = null; // Prevent infinite loop
    console.log('ProductCard - Image load error for product:', safe._id);
    console.log('ProductCard - Failed URL:', e.target.src);
    
    const attempts = imageLoadAttempts + 1;
    setImageLoadAttempts(attempts);
    
    // Try different URL formats based on the number of attempts
    switch (attempts) {
      case 1:
        // Try with backend URL first
        const backendUrl = 'http://localhost:5000';
        const filename = safe.images[0].split(/[\/\\]/).pop();
        const uploadsUrl = `${backendUrl}/uploads/${filename}`;
        console.log('ProductCard - Trying backend URL:', uploadsUrl);
        setImageUrl(uploadsUrl);
        break;
        
      case 2:
        // Try production URL
        const prodUrl = 'https://furniture-q3nb.onrender.com';
        const prodUploadsUrl = `${prodUrl}/uploads/${filename}`;
        console.log('ProductCard - Trying production URL:', prodUploadsUrl);
        setImageUrl(prodUploadsUrl);
        break;
        
      default:
        // Use placeholder with product name
        const placeholderText = encodeURIComponent(safe.name);
        const placeholderUrl = `https://placehold.co/300x300/gray/white?text=${placeholderText}`;
        console.log('ProductCard - Using named placeholder:', placeholderUrl);
        setImageUrl(placeholderUrl);
        break;
    }
  };

  return (
    <motion.div whileHover={{ y: -5 }} className="card group">
      <div className="relative overflow-hidden h-64">
        <img
          src={imageUrl}
          alt={safe.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={handleImageLoadError}
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
            if (!safe.category) {
              return "Uncategorized";
            }

            // If category is an object with a name property
            if (typeof safe.category === "object" && safe.category.name) {
              return safe.category.name;
            }

            // If category is a string (MongoDB ID)
            if (typeof safe.category === "string") {
              // Check if it's a MongoDB ObjectId (24 hex chars)
              if (
                safe.category.length === 24 &&
                /^[0-9a-f]+$/.test(safe.category)
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
                return categoryMap[safe.category] || "Furniture";
              }
              // If it's a regular string, use it directly
              return safe.category;
            }

            // Fallback
            return "Uncategorized";
          })()}
        </span>
        <h3 className="text-lg font-medium mb-2 theme-text-primary">
          {safe.name}
        </h3>
        <div className="flex justify-between items-center">
          <div>
            {safe.discountPrice && safe.discountPrice < safe.price ? (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(safe.discountPrice)}
                </span>
                <div className="flex items-center">
                  <span className="text-sm theme-text-secondary line-through mr-1">
                    {formatPrice(safe.price, false)}
                  </span>
                  <span className="text-xs text-red-600">
                    {calculateDiscountPercentage(
                      safe.price,
                      safe.discountPrice
                    )}
                    % OFF
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary">
                {formatPrice(safe.price)}
              </span>
            )}
          </div>
          <Link
            to={`/products/${safe._id}`}
            className="text-sm font-medium theme-text-secondary hover:text-primary transition-colors duration-300"
          >
            View Details
          </Link>
        </div>
        <div className="mt-1 flex justify-between items-center">
          <span className={`text-sm ${safe.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {safe.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        {safe.ratings && (
          <div className="mt-1 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                {safe.ratings.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
