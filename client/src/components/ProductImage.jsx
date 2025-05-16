import React, { useState, useEffect } from 'react';
import { getProductImage, handleImageError } from '../utils/defaultImages';

/**
 * A component for displaying product images with robust error handling and fallbacks
 * 
 * @param {Object} props - Component props
 * @param {Object|string} props.product - Product object or product image URL
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.size - Size preset ('small', 'medium', 'large')
 * @param {boolean} props.lazy - Whether to use lazy loading
 * @param {Function} props.onLoad - Callback when image loads successfully
 * @param {Function} props.onError - Callback when image fails to load
 */
const ProductImage = ({
  product,
  alt = 'Product',
  className = '',
  size = 'medium',
  lazy = true,
  onLoad,
  onError
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [src, setSrc] = useState('');
  
  // Size presets
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-full h-full',
    large: 'w-full h-96'
  };
  
  // Get the appropriate size class
  const sizeClass = sizeClasses[size] || sizeClasses.medium;
  
  // Determine the image source
  useEffect(() => {
    try {
      // If product is a string, assume it's an image URL
      if (typeof product === 'string') {
        setSrc(product);
      } else {
        // Otherwise, use the getProductImage helper
        setSrc(getProductImage(product));
      }
    } catch (err) {
      console.error('Error setting product image source:', err);
      setError(true);
    }
  }, [product]);
  
  // Handle successful image load
  const handleLoad = (e) => {
    setLoaded(true);
    setError(false);
    if (onLoad) onLoad(e);
  };
  
  // Handle image load error with enhanced error handling
  const handleError = (e) => {
    console.log(`ProductImage error for ${alt}:`, e.target.src);
    setError(true);
    
    // Use the enhanced error handler
    handleImageError(e);
    
    // Call the onError callback if provided
    if (onError) onError(e);
  };
  
  return (
    <div className={`relative overflow-hidden ${sizeClass} ${className}`}>
      {/* Show loading state if not loaded and not errored */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      
      {/* The actual image */}
      <img
        src={src}
        alt={alt}
        className={`object-cover w-full h-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Show error state if errored */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400 text-center p-2">
            {alt || 'Product'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductImage;
