/**
 * Utility function to get the proper image URL based on environment
 * @param {string} imagePath - The image path from the database
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL, return it as is
  if (imagePath.startsWith("http")) return imagePath;

  // For local development
  if (window.location.hostname === "localhost") {
    return `${window.location.origin}${imagePath}`;
  }

  // For production deployment
  return `https://furniture-q3nb.onrender.com${imagePath}`;
};

/**
 * Safely validates and normalizes category data to prevent "_id undefined" errors
 * @param {Array|Object} data - The category data to validate
 * @returns {Array} - Array of validated category objects
 */
export const validateCategories = (data) => {
  // Handle null/undefined data
  if (!data) {
    console.warn("validateCategories received null/undefined data");
    return [];
  }

  // Handle array data
  let categories = Array.isArray(data)
    ? data
    : data?.data && Array.isArray(data.data)
    ? data.data
    : [data];

  // Filter out invalid items and normalize each valid item
  const validatedCategories = categories
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      // Generate a safe ID if missing
      const safeId = item._id || item.id || `temp_${Date.now()}_${index}`;

      // Ensure image field is properly handled
      const imageField = item.image || null;
      console.log(`Category ${index} (${item.name}) image:`, imageField);

      // Generate a better name if it's a MongoDB ObjectId
      let categoryName = item.name;
      if (
        !categoryName &&
        typeof safeId === "string" &&
        safeId.length === 24 &&
        /^[0-9a-f]+$/.test(safeId)
      ) {
        // This is likely a MongoDB ObjectId, use a friendly name
        const categoryMap = {
          // Map common category IDs to friendly names
          "680c9481ab11e96a288ef6d9": "Sofa Beds",
          "680c9484ab11e96a288ef6da": "Tables",
          "680c9486ab11e96a288ef6db": "Chairs",
          "680c9489ab11e96a288ef6dc": "Wardrobes",
        };

        // Try to find a mapped name or use a generic one
        categoryName = categoryMap[safeId] || `Furniture ${index + 1}`;
      }

      const validatedItem = {
        _id: safeId,
        name: categoryName || `Category ${index + 1}`,
        description: item.description || "",
        image: imageField,
        slug:
          item.slug ||
          (categoryName
            ? categoryName.toLowerCase().replace(/\s+/g, "-")
            : `category-${index}`),
        ...item, // Keep any additional properties
        __validated: true,
      };

      return validatedItem;
    });

  console.log("Validated categories:", validatedCategories);
  return validatedCategories;
};

/**
 * Safe renderer for category data
 * @param {Array} categories - Array of category objects
 * @param {Function} renderFn - Function to render each category
 * @param {React.ReactNode} fallback - Fallback UI when no valid categories
 * @returns {Array} - Array of rendered components
 */
export const safeRenderCategories = (categories, renderFn, fallback) => {
  // Validate input
  if (!Array.isArray(categories) || categories.length === 0) {
    return fallback || null;
  }

  // Safely render each category
  return categories
    .map((category, index) => {
      try {
        // Skip invalid categories
        if (!category || typeof category !== "object" || !category._id) {
          console.warn("Invalid category object:", category);
          return null;
        }

        return renderFn(category, index);
      } catch (error) {
        console.error("Error rendering category:", error);
        return null;
      }
    })
    .filter(Boolean); // Remove null values
};
