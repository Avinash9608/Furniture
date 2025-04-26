/**
 * Safely validates and normalizes category data to prevent "_id undefined" errors
 * @param {Array|Object} data - The category data to validate
 * @returns {Array} - Array of validated category objects
 */
export const validateCategories = (data) => {
  // Handle null/undefined data
  if (!data) {
    console.warn('validateCategories received null/undefined data');
    return [];
  }

  // Handle array data
  let categories = Array.isArray(data) ? data : 
                  (data?.data && Array.isArray(data.data)) ? data.data : 
                  [data];

  // Filter out invalid items and normalize each valid item
  return categories
    .filter(item => item && typeof item === 'object')
    .map((item, index) => {
      // Generate a safe ID if missing
      const safeId = item._id || 
                    item.id || 
                    `temp_${Date.now()}_${index}`;
      
      return {
        _id: safeId,
        name: item.name || `Category ${index + 1}`,
        description: item.description || '',
        image: item.image || null,
        slug: item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : `category-${index}`),
        ...item, // Keep any additional properties
        __validated: true
      };
    });
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
        if (!category || typeof category !== 'object' || !category._id) {
          console.warn('Invalid category object:', category);
          return null;
        }

        return renderFn(category, index);
      } catch (error) {
        console.error('Error rendering category:', error);
        return null;
      }
    })
    .filter(Boolean); // Remove null values
};
