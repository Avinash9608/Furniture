/**
 * Default categories for the furniture shop
 */
export const defaultCategories = [
  {
    name: "Sofa Beds",
    description: "Convertible sofas that can be used as beds",
    _id: "680c9481ab11e96a288ef6d9"
  },
  {
    name: "Tables",
    description: "Dining tables, coffee tables, side tables and more",
    _id: "680c9484ab11e96a288ef6da"
  },
  {
    name: "Chairs",
    description: "Dining chairs, armchairs, recliners and more",
    _id: "680c9486ab11e96a288ef6db"
  },
  {
    name: "Wardrobes",
    description: "Storage solutions for bedrooms",
    _id: "680c9489ab11e96a288ef6dc"
  },
  {
    name: "Beds",
    description: "Single beds, double beds, king size beds and more",
    _id: "680c948eab11e96a288ef6dd"
  }
];

/**
 * Get categories from local storage
 * @returns {Array} Array of categories
 */
export const getLocalCategories = () => {
  try {
    const categoriesJson = localStorage.getItem("furniture_categories");
    if (categoriesJson) {
      const savedCategories = JSON.parse(categoriesJson);
      // Merge with default categories to ensure we always have the defaults
      const defaultIds = defaultCategories.map(cat => cat._id);
      const customCategories = savedCategories.filter(cat => !defaultIds.includes(cat._id));
      return [...defaultCategories, ...customCategories];
    }
  } catch (error) {
    console.warn("Error getting categories from local storage:", error);
  }
  return defaultCategories;
};

/**
 * Save categories to local storage
 * @param {Array} categories - Array of categories to save
 */
export const saveLocalCategories = (categories) => {
  try {
    // Ensure we don't duplicate default categories
    const defaultIds = defaultCategories.map(cat => cat._id);
    const customCategories = categories.filter(cat => !defaultIds.includes(cat._id));
    const categoriesToSave = [...defaultCategories, ...customCategories];
    localStorage.setItem("furniture_categories", JSON.stringify(categoriesToSave));
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
export const createDefaultCategories = async (createCategory, existingCategories = []) => {
  // If categories already exist, merge them with defaults
  if (existingCategories && existingCategories.length > 0) {
    const defaultIds = defaultCategories.map(cat => cat._id);
    const customCategories = existingCategories.filter(cat => !defaultIds.includes(cat._id));
    return [...defaultCategories, ...customCategories];
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
      createdCategories.push({
        ...newCategory,
        _id: category._id // Ensure we keep the default ID
      });
    } catch (error) {
      console.error(`Error creating category ${category.name}:`, error);
      // Use the default category as fallback
      createdCategories.push(category);
    }
  }

  // Save to local storage for future use
  saveLocalCategories(createdCategories);

  return createdCategories;
};

export default {
  defaultCategories,
  createDefaultCategories,
  getLocalCategories,
  saveLocalCategories
};
