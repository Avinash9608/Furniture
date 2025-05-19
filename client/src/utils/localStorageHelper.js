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
    localStorage.setItem('localProducts', JSON.stringify(products));
    console.log(`Saved ${products.length} products to localStorage`);
  } catch (error) {
    console.error('Error saving products to localStorage:', error);
  }
};

/**
 * Get products from localStorage
 * @returns {Array} - Array of product objects or empty array if none found
 */
export const getProductsFromLocalStorage = () => {
  try {
    const products = localStorage.getItem('localProducts');
    if (products) {
      return JSON.parse(products);
    }
    return [];
  } catch (error) {
    console.error('Error getting products from localStorage:', error);
    return [];
  }
};

/**
 * Save categories to localStorage
 * @param {Array} categories - Array of category objects
 */
export const saveCategoriesToLocalStorage = (categories) => {
  try {
    localStorage.setItem('localCategories', JSON.stringify(categories));
    console.log(`Saved ${categories.length} categories to localStorage`);
  } catch (error) {
    console.error('Error saving categories to localStorage:', error);
  }
};

/**
 * Get categories from localStorage
 * @returns {Array} - Array of category objects or default categories if none found
 */
export const getCategoriesFromLocalStorage = () => {
  try {
    const categories = localStorage.getItem('localCategories');
    if (categories) {
      return JSON.parse(categories);
    }
    
    // Return default categories if none found
    const defaultCategories = [
      { _id: 'cat1', name: 'Sofa Beds' },
      { _id: 'cat2', name: 'Tables' },
      { _id: 'cat3', name: 'Chairs' },
      { _id: 'cat4', name: 'Wardrobes' },
      { _id: 'cat5', name: 'Beds' }
    ];
    
    // Save default categories to localStorage
    saveCategoriesToLocalStorage(defaultCategories);
    
    return defaultCategories;
  } catch (error) {
    console.error('Error getting categories from localStorage:', error);
    return [];
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
    
    // Check if product already exists
    const existingProductIndex = products.findIndex(p => p._id === product._id);
    
    if (existingProductIndex >= 0) {
      // Update existing product
      products[existingProductIndex] = {
        ...products[existingProductIndex],
        ...product,
        updatedAt: new Date().toISOString()
      };
      console.log(`Updated product ${product.name} in localStorage`);
    } else {
      // Add new product with generated ID if needed
      const newProduct = {
        ...product,
        _id: product._id || `local_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      products.push(newProduct);
      console.log(`Added new product ${newProduct.name} to localStorage`);
    }
    
    // Save updated products
    saveProductsToLocalStorage(products);
    
    // Return the updated or new product
    return existingProductIndex >= 0 ? products[existingProductIndex] : products[products.length - 1];
  } catch (error) {
    console.error('Error saving product to localStorage:', error);
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
    const filteredProducts = products.filter(p => p._id !== productId);
    
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
    console.error('Error deleting product from localStorage:', error);
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
    const product = products.find(p => p._id === productId);
    
    return product || null;
  } catch (error) {
    console.error('Error getting product from localStorage:', error);
    return null;
  }
};
