// Default image URLs for fallbacks (using reliable CDN)
export const DEFAULT_PRODUCT_IMAGE =
  "https://placehold.co/300x300/gray/white?text=Product";
export const DEFAULT_CATEGORY_IMAGE =
  "https://placehold.co/300x300/gray/white?text=Category";
export const DEFAULT_USER_IMAGE =
  "https://placehold.co/300x300/gray/white?text=User";
export const DEFAULT_ERROR_IMAGE =
  "https://placehold.co/300x300/gray/white?text=Error";

// Helper function to get a product image with fallback
export const getProductImage = (product) => {
  if (!product) return DEFAULT_PRODUCT_IMAGE;

  if (product.images && product.images.length > 0) {
    // Check if the image URL is absolute or relative
    if (product.images[0].startsWith("http")) {
      return product.images[0];
    } else {
      return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${
        product.images[0]
      }`;
    }
  }

  // If no image is available, use a placeholder with the product name
  return `https://placehold.co/300x300/gray/white?text=${encodeURIComponent(
    product.name || "Product"
  )}`;
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

// Helper function to handle image load errors
export const handleImageError = (e) => {
  console.log("Image load error:", e.target.src);
  e.target.onerror = null; // Prevent infinite error loop
  e.target.src = DEFAULT_ERROR_IMAGE;
};
