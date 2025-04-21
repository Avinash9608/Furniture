/**
 * Default categories for the furniture shop
 */
export const defaultCategories = [
  {
    name: "Sofa Beds",
    description: "Convertible sofas that can be used as beds",
  },
  {
    name: "Tables",
    description: "Dining tables, coffee tables, side tables and more",
  },
  {
    name: "Chairs",
    description: "Dining chairs, armchairs, recliners and more",
  },
  {
    name: "Wardrobes",
    description: "Storage solutions for bedrooms",
  },
  {
    name: "Beds",
    description: "Single beds, double beds, king size beds and more",
  },
  {
    name: "Cabinets",
    description: "Storage solutions for living rooms and dining rooms",
  },
];

/**
 * Get categories from local storage
 * @returns {Array} Array of categories
 */
export const getLocalCategories = () => {
  try {
    const categoriesJson = localStorage.getItem("furniture_categories");
    if (categoriesJson) {
      return JSON.parse(categoriesJson);
    }
  } catch (error) {
    console.warn("Error getting categories from local storage:", error);
  }
  return [];
};

/**
 * Save categories to local storage
 * @param {Array} categories - Array of categories to save
 */
export const saveLocalCategories = (categories) => {
  try {
    localStorage.setItem("furniture_categories", JSON.stringify(categories));
  } catch (error) {
    console.warn("Error saving categories to local storage:", error);
  }
};

/**
 * Creates default categories if none exist
 * @param {Function} createCategory - Function to create a category
 * @param {Array} existingCategories - Array of existing categories
 * @returns {Promise<Array>} - Array of created categories
 */
export const createDefaultCategories = async (
  createCategory,
  existingCategories = []
) => {
  // If categories already exist, return them
  if (existingCategories && existingCategories.length > 0) {
    return existingCategories;
  }

  // Check if we have categories in local storage
  const localCategories = getLocalCategories();
  if (localCategories && localCategories.length > 0) {
    console.log("Using categories from local storage");
    return localCategories;
  }

  // Create default categories
  const createdCategories = [];

  for (const category of defaultCategories) {
    try {
      const response = await createCategory(category);
      const newCategory = response.data.data || response.data;
      createdCategories.push(newCategory);
    } catch (error) {
      console.error(`Error creating category ${category.name}:`, error);
      // Create a local fallback category with a temporary ID
      const fallbackCategory = {
        ...category,
        _id: `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createdCategories.push(fallbackCategory);
    }
  }

  // Save to local storage for future use
  saveLocalCategories(createdCategories);

  return createdCategories;
};

export default {
  defaultCategories,
  createDefaultCategories,
};
