// Default image URLs for fallbacks (using reliable CDN)
export const DEFAULT_PRODUCT_IMAGE =
  "https://placehold.co/300x300/gray/white?text=Product";
export const DEFAULT_CATEGORY_IMAGE =
  "https://placehold.co/300x300/gray/white?text=Category";
export const DEFAULT_USER_IMAGE =
  "https://placehold.co/300x300/gray/white?text=User";
export const DEFAULT_ERROR_IMAGE =
  "https://placehold.co/300x300/gray/white?text=Error";

// Get the base URL for assets based on environment
const getBaseUrl = () => {
  const hostname = window.location.hostname;

  // In development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  // In production on Render
  if (
    hostname.includes("render.com") ||
    hostname === "furniture-q3nb.onrender.com"
  ) {
    return "https://furniture-q3nb.onrender.com";
  }

  // Fallback to environment variable or default
  return import.meta.env.VITE_API_BASE_URL || window.location.origin;
};

// Helper function to fix image paths
const fixImagePath = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL, return it as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If it's a relative path, make sure it starts with a slash
  const normalizedPath = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;

  // Return the full URL
  return `${getBaseUrl()}${normalizedPath}`;
};

// Helper function to get a product image with fallback
export const getProductImage = (product) => {
  if (!product) return DEFAULT_PRODUCT_IMAGE;

  try {
    if (product.images && product.images.length > 0) {
      // Try to fix the image path
      const fixedImagePath = fixImagePath(product.images[0]);

      // If we have a valid image path, return it
      if (fixedImagePath) {
        return fixedImagePath;
      }
    }
  } catch (error) {
    console.error("Error getting product image:", error);
  }

  // If no image is available or there was an error, use a placeholder with the product name
  return `https://placehold.co/300x300/gray/white?text=${encodeURIComponent(
    product.name || "Product"
  )}`;
};

// Helper function to get a category image with fallback
export const getCategoryImage = (category) => {
  if (!category) return DEFAULT_CATEGORY_IMAGE;

  try {
    if (category.image) {
      // Try to fix the image path
      const fixedImagePath = fixImagePath(category.image);

      // If we have a valid image path, return it
      if (fixedImagePath) {
        return fixedImagePath;
      }
    }
  } catch (error) {
    console.error("Error getting category image:", error);
  }

  // If no image is available or there was an error, use a placeholder with the category name
  return `https://placehold.co/300x300/gray/white?text=${encodeURIComponent(
    category.name || "Category"
  )}`;
};

// Helper function to handle image load errors with multiple fallbacks
export const handleImageError = (e) => {
  try {
    console.log("Image load error:", e.target.src);
    e.target.onerror = null; // Prevent infinite error loop

    const originalSrc = e.target.src;
    const altText = e.target.alt || "Image";

    // Try to extract the image path if it's a relative URL
    if (originalSrc.includes("/uploads/")) {
      const pathParts = originalSrc.split("/uploads/");
      if (pathParts.length > 1) {
        const filename = pathParts[1].split("?")[0]; // Remove any query parameters

        // Try alternative URL formats
        const hostname = window.location.hostname;

        // Try production URL first
        if (!originalSrc.includes("furniture-q3nb.onrender.com")) {
          console.log("Trying production URL");
          e.target.src = `https://furniture-q3nb.onrender.com/uploads/${filename}`;

          // Add a second error handler for this attempt
          e.target.onerror = (e2) => {
            console.log("Production URL failed, trying development URL");
            e2.target.onerror = null;

            // Try development URL next
            e.target.src = `http://localhost:5000/uploads/${filename}`;

            // Add a third error handler for this attempt
            e.target.onerror = (e3) => {
              console.log("All URL attempts failed, using placeholder");
              e3.target.onerror = null;
              e.target.src = `https://placehold.co/300x300/gray/white?text=${encodeURIComponent(
                altText
              )}`;
            };
          };

          return; // Exit early as we've set up the fallback chain
        }
      }
    }

    // If we couldn't extract a path or the original URL was already a production URL,
    // fall back to the default error image
    e.target.src = `https://placehold.co/300x300/gray/white?text=${encodeURIComponent(
      altText
    )}`;
  } catch (error) {
    console.error("Error in handleImageError:", error);
    // Final fallback
    e.target.src = DEFAULT_ERROR_IMAGE;
  }
};
