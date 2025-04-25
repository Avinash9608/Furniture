/**
 * Safely renders an array of items, handling null/undefined values and missing required properties
 * 
 * @param {Array} items - The array of items to render
 * @param {Function} renderFn - Function that renders each item (receives item and index)
 * @param {React.ReactNode} fallback - What to render if the array is invalid
 * @param {string} requiredProp - Property that must exist on each item (default: '_id')
 * @param {Function} logFn - Function to call for logging invalid items (default: console.warn)
 * @returns {Array|React.ReactNode} - Array of rendered items or fallback
 */
export const safeRender = (
  items, 
  renderFn, 
  fallback = null, 
  requiredProp = '_id',
  logFn = console.warn
) => {
  // Check if items is a valid array
  if (!Array.isArray(items)) {
    logFn('safeRender: items is not an array', items);
    return fallback;
  }
  
  // Filter out invalid items and map the valid ones
  return items
    .map((item, index) => {
      // Check if item exists and has the required property
      if (!item || (requiredProp && !item[requiredProp])) {
        logFn(`safeRender: Invalid item at index ${index}`, item);
        return null;
      }
      
      // Render the item
      try {
        return renderFn(item, index);
      } catch (error) {
        logFn(`safeRender: Error rendering item at index ${index}`, { item, error });
        return null;
      }
    })
    .filter(Boolean); // Remove null values
};

/**
 * Safely accesses a nested property in an object
 * 
 * @param {Object} obj - The object to access
 * @param {string} path - The path to the property (e.g., 'user.address.city')
 * @param {any} defaultValue - Value to return if the property doesn't exist
 * @returns {any} - The property value or defaultValue
 */
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || !Object.prototype.hasOwnProperty.call(result, key)) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
};

/**
 * Creates a safe version of an object with default values for missing properties
 * 
 * @param {Object} obj - The object to make safe
 * @param {Object} defaults - Default values for properties
 * @returns {Object} - A new object with all required properties
 */
export const safeMake = (obj, defaults) => {
  if (!obj || typeof obj !== 'object') {
    return { ...defaults };
  }
  
  return Object.entries(defaults).reduce((result, [key, defaultValue]) => {
    result[key] = obj[key] !== undefined ? obj[key] : defaultValue;
    return result;
  }, { ...obj });
};

export default {
  safeRender,
  safeGet,
  safeMake
};
