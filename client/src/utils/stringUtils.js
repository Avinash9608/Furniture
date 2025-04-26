/**
 * Utility functions for safe string operations
 */

/**
 * Safely gets a substring from a value, handling null/undefined values
 * @param {*} value - The value to get a substring from
 * @param {number} start - The start index
 * @param {number} end - The end index (optional)
 * @param {string} fallback - The fallback value if the value is null/undefined
 * @returns {string} The substring or fallback value
 */
export const safeSubstring = (value, start, end, fallback = "N/A") => {
  if (value == null) return fallback;
  
  try {
    const str = String(value);
    return end ? str.substring(start, end) : str.substring(start);
  } catch (error) {
    console.error("Error in safeSubstring:", error);
    return fallback;
  }
};

/**
 * Safely formats an ID for display, typically showing first few characters
 * @param {*} id - The ID to format
 * @param {number} length - The number of characters to show
 * @param {boolean} addEllipsis - Whether to add ellipsis at the end
 * @returns {string} The formatted ID
 */
export const formatId = (id, length = 8, addEllipsis = true) => {
  if (id == null) return "ID Not Available";
  
  try {
    const str = String(id);
    const shortened = str.substring(0, length);
    return addEllipsis ? `${shortened}...` : shortened;
  } catch (error) {
    console.error("Error in formatId:", error);
    return "ID Not Available";
  }
};

/**
 * Safely capitalizes the first letter of a string
 * @param {*} value - The value to capitalize
 * @returns {string} The capitalized string
 */
export const capitalize = (value) => {
  if (value == null) return "";
  
  try {
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch (error) {
    console.error("Error in capitalize:", error);
    return "";
  }
};
