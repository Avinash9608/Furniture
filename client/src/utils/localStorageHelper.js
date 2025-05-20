/**
 * Local Storage Helper Utility
 *
 * This utility provides functions for storing and retrieving data from localStorage,
 * which allows the application to work even when the server is down.
 */

/**
 * Save products to localStorage
 * @param {Array} products - Array of product objects
 */
export const saveProductsToLocalStorage = (products) => {
  try {
    localStorage.setItem("localProducts", JSON.stringify(products));
    console.log(`Saved ${products.length} products to localStorage`);
  } catch (error) {
    console.error("Error saving products to localStorage:", error);
  }
};

/**
 * Get products from localStorage
 * @returns {Array} - Array of product objects or empty array if none found
 */
export const getProductsFromLocalStorage = () => {
  try {
    const products = localStorage.getItem("localProducts");
    if (products) {
      return JSON.parse(products);
    }
    return [];
  } catch (error) {
    console.error("Error getting products from localStorage:", error);
    return [];
  }
};

/**
 * Save categories to localStorage
 * @param {Array} categories - Array of category objects
 */
export const saveCategoriesToLocalStorage = (categories) => {
  try {
    localStorage.setItem("localCategories", JSON.stringify(categories));
    console.log(`Saved ${categories.length} categories to localStorage`);
  } catch (error) {
    console.error("Error saving categories to localStorage:", error);
  }
};

/**
 * Get categories from localStorage
 * @returns {Array} - Array of category objects or default categories if none found
 */
export const getCategoriesFromLocalStorage = () => {
  try {
    const categories = localStorage.getItem("localCategories");
    if (categories) {
      return JSON.parse(categories);
    }

    // Return default categories if none found
    const defaultCategories = [
      { _id: "cat1", name: "Sofa Beds" },
      { _id: "cat2", name: "Tables" },
      { _id: "cat3", name: "Chairs" },
      { _id: "cat4", name: "Wardrobes" },
      { _id: "cat5", name: "Beds" },
    ];

    // Save default categories to localStorage
    saveCategoriesToLocalStorage(defaultCategories);

    return defaultCategories;
  } catch (error) {
    console.error("Error getting categories from localStorage:", error);
    return [];
  }
};

/**
 * Get category name by ID
 * @param {string} categoryId - ID of category to get name for
 * @returns {string} - Category name or "Unknown Category" if not found
 */
export const getCategoryNameById = (categoryId) => {
  try {
    if (!categoryId) return "Uncategorized";

    // MongoDB ObjectId map for common categories
    const MONGODB_CATEGORY_MAP = {
      "680c9481ab11e96a288ef6d9": "Sofa Beds",
      "680c9484ab11e96a288ef6da": "Tables",
      "680c9486ab11e96a288ef6db": "Chairs",
      "680c9489ab11e96a288ef6dc": "Wardrobes",
      "680c948eab11e96a288ef6dd": "Beds",
    };

    // Legacy hardcoded map
    const LEGACY_CATEGORY_MAP = {
      cat1: "Sofa Beds",
      cat2: "Tables",
      cat3: "Chairs",
      cat4: "Wardrobes",
      cat5: "Beds",
    };

    // Check MongoDB ObjectId map first
    if (MONGODB_CATEGORY_MAP[categoryId]) {
      return MONGODB_CATEGORY_MAP[categoryId];
    }

    // Check legacy map
    if (LEGACY_CATEGORY_MAP[categoryId]) {
      return LEGACY_CATEGORY_MAP[categoryId];
    }

    // Get categories from localStorage as fallback
    const categories = getCategoriesFromLocalStorage();

    // Find category by ID
    const category = categories.find((c) => c._id === categoryId);

    if (category && category.name) {
      return category.name;
    }

    // If it's a MongoDB ObjectId (24 hex chars), create a readable name
    if (categoryId.length === 24 && /^[0-9a-f]+$/.test(categoryId)) {
      return `Category ${categoryId.substring(categoryId.length - 6)}`;
    }

    return "Unknown Category";
  } catch (error) {
    console.error("Error getting category name by ID:", error);
    return "Unknown Category";
  }
};

/**
 * Add or update a product in localStorage
 * @param {Object} product - Product object to add or update
 * @returns {Object} - Updated product
 */
export const saveProductToLocalStorage = (product) => {
  try {
    // Get existing products
    const products = getProductsFromLocalStorage();

    // Process the category to ensure it's properly formatted
    let processedProduct = { ...product };

    // Handle category if it exists
    if (product.category) {
      // If category is a string (just the ID)
      if (typeof product.category === "string") {
        // Get the category name from the categories list
        const categories = getCategoriesFromLocalStorage();
        const categoryObj = categories.find((c) => c._id === product.category);

        if (categoryObj) {
          // Use the full category object
          processedProduct.category = {
            _id: categoryObj._id,
            name: categoryObj.name,
          };
          console.log(
            "Processed category from string ID:",
            processedProduct.category
          );
        }
      }
      // If category is already an object but missing name
      else if (
        typeof product.category === "object" &&
        product.category !== null
      ) {
        if (product.category._id && !product.category.name) {
          // Get the category name from the categories list
          const categories = getCategoriesFromLocalStorage();
          const categoryObj = categories.find(
            (c) => c._id === product.category._id
          );

          if (categoryObj) {
            // Use the full category object
            processedProduct.category = {
              _id: categoryObj._id,
              name: categoryObj.name,
            };
            console.log(
              "Added missing category name:",
              processedProduct.category
            );
          }
        }
      }
    }

    console.log("Final processed product category:", processedProduct.category);

    // Check if product already exists
    const existingProductIndex = products.findIndex(
      (p) => p._id === processedProduct._id
    );

    if (existingProductIndex >= 0) {
      // Update existing product
      products[existingProductIndex] = {
        ...products[existingProductIndex],
        ...processedProduct,
        updatedAt: new Date().toISOString(),
      };
      console.log(`Updated product ${processedProduct.name} in localStorage`);
    } else {
      // Add new product with generated ID if needed
      const newProduct = {
        ...processedProduct,
        _id: processedProduct._id || `local_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      products.push(newProduct);
      console.log(`Added new product ${newProduct.name} to localStorage`);
    }

    // Save updated products
    saveProductsToLocalStorage(products);

    // Return the updated or new product
    return existingProductIndex >= 0
      ? products[existingProductIndex]
      : products[products.length - 1];
  } catch (error) {
    console.error("Error saving product to localStorage:", error);
    return product;
  }
};

/**
 * Delete a product from localStorage
 * @param {string} productId - ID of product to delete
 * @returns {boolean} - True if product was deleted, false otherwise
 */
export const deleteProductFromLocalStorage = (productId) => {
  try {
    // Get existing products
    const products = getProductsFromLocalStorage();

    // Filter out the product to delete
    const filteredProducts = products.filter((p) => p._id !== productId);

    // Check if a product was removed
    if (filteredProducts.length < products.length) {
      // Save updated products
      saveProductsToLocalStorage(filteredProducts);
      console.log(`Deleted product ${productId} from localStorage`);
      return true;
    }

    console.log(`Product ${productId} not found in localStorage`);
    return false;
  } catch (error) {
    console.error("Error deleting product from localStorage:", error);
    return false;
  }
};

/**
 * Get a product from localStorage by ID
 * @param {string} productId - ID of product to get
 * @returns {Object|null} - Product object or null if not found
 */
export const getProductFromLocalStorage = (productId) => {
  try {
    // Get existing products
    const products = getProductsFromLocalStorage();

    // Find the product
    const product = products.find((p) => p._id === productId);

    return product || null;
  } catch (error) {
    console.error("Error getting product from localStorage:", error);
    return null;
  }
};
