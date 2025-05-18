// Default image URLs for fallbacks (using reliable CDN)
export const DEFAULT_PRODUCT_IMAGE =
  "https://placehold.co/300x300/gray/white?text=Product";
export const DEFAULT_CATEGORY_IMAGE =
  "https://placehold.co/300x300/gray/white?text=Category";
export const DEFAULT_USER_IMAGE =
  "https://placehold.co/300x300/gray/white?text=User";
export const DEFAULT_ERROR_IMAGE =
  "https://placehold.co/300x300/gray/white?text=Error";

// Function to get the correct image URL based on environment
export const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://placehold.co/300x300/gray/white?text=No+Image';
  
  // If it's already a full URL (including placeholder), return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Extract filename from various path formats
  let filename = imagePath;
  
  // Handle Windows absolute paths
  if (imagePath.includes(':\\') || imagePath.includes('/')) {
    filename = imagePath.split(/[\/\\]/).pop();
  }

  // Clean up the filename if it contains timestamps or special characters
  if (filename.includes('images-')) {
    // Keep the original filename as is, don't modify timestamps
    filename = filename;
  }
  
  // Determine if we're in development or production
  const baseUrl = window.location.origin;
  const isDevelopment = !baseUrl.includes("onrender.com");
  
  // For development, try both local and production URLs
  if (isDevelopment) {
    return [
      `http://localhost:5000/uploads/${filename}`,
      `https://furniture-q3nb.onrender.com/uploads/${filename}`
    ];
  }
  
  // For production, use the current origin
  return `${baseUrl}/uploads/${filename}`;
};

// Function to handle image loading errors
export const handleImageError = (imageUrl, productName, setImageUrl) => {
  // If we're in development and using localhost, try the production URL
  if (imageUrl.includes('localhost:5000')) {
    const productionUrl = imageUrl.replace(
      'http://localhost:5000',
      'https://furniture-q3nb.onrender.com'
    );
    setImageUrl(productionUrl);
    return;
  }
  
  // If the URL doesn't include the uploads directory, try adding it
  if (!imageUrl.includes('/uploads/')) {
    const filename = imageUrl.split('/').pop();
    const newUrl = `https://furniture-q3nb.onrender.com/uploads/${filename}`;
    setImageUrl(newUrl);
    return;
  }
  
  // If production URL also fails, use a placeholder with the product name
  const placeholderText = productName.replace(/\s+/g, '+');
  setImageUrl(`https://placehold.co/300x300/gray/white?text=${placeholderText}`);
};

// Default placeholder image URL
export const defaultProductImage = 'https://placehold.co/300x300/gray/white?text=No+Image';

// Function to get product image with fallback
export const getProductImage = (product) => {
  if (!product) return defaultProductImage;
  
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return getImageUrl(product.images[0]);
  }
  
  return defaultProductImage;
};

// Helper function to get a category image with fallback
export const getCategoryImage = (category) => {
  if (!category) return DEFAULT_CATEGORY_IMAGE;

  if (category.image) {
    // Check if the image URL is absolute or relative
    if (category.image.startsWith("http")) {
      return category.image;
    } else {
      return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${
        category.image
      }`;
    }
  }

  // If no image is available, use a placeholder with the category name
  return `https://placehold.co/300x300/gray/white?text=${encodeURIComponent(
    category.name || "Category"
  )}`;
};
