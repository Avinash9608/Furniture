/**
 * Format price in Indian Rupees
 * @param {number} price - Price to format
 * @param {boolean} showSymbol - Whether to show the ₹ symbol
 * @returns {string} Formatted price
 */
export const formatPrice = (price, showSymbol = true) => {
  // Handle null, undefined, or NaN values
  if (price === null || price === undefined || isNaN(price)) {
    return showSymbol ? "₹0" : "0";
  }

  // Convert to number if it's a string
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  // Check if conversion resulted in a valid number
  if (isNaN(numericPrice)) {
    return showSymbol ? "₹0" : "0";
  }

  try {
    const formatter = new Intl.NumberFormat("en-IN", {
      style: showSymbol ? "currency" : "decimal",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(numericPrice);
  } catch (error) {
    console.error("Error formatting price:", error, "for price:", price);
    return showSymbol ? "₹0" : "0";
  }
};

/**
 * Format date to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Date(date).toLocaleDateString("en-IN", options);
};

/**
 * Format date and time to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return new Date(date).toLocaleDateString("en-IN", options);
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text) return "";
  if (text.length <= length) return text;

  return text.substring(0, length) + "...";
};

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} Title cased string
 */
export const toTitleCase = (str) => {
  if (!str) return "";

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Format order status with color
 * @param {string} status - Order status
 * @returns {object} Status with color
 */
export const formatOrderStatus = (status) => {
  const statusMap = {
    Pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    Processing: { label: "Processing", color: "bg-blue-100 text-blue-800" },
    Shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
    Delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
    Cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  };

  return (
    statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
  );
};

/**
 * Calculate discount percentage safely
 * @param {number} originalPrice - Original price
 * @param {number} discountedPrice - Discounted price
 * @param {number} maxPercentage - Maximum percentage to display (default: 99)
 * @returns {number} Discount percentage
 */
export const calculateDiscountPercentage = (
  originalPrice,
  discountedPrice,
  maxPercentage = 99
) => {
  // Check if inputs are valid numbers and discounted price is less than original price
  if (
    !originalPrice ||
    !discountedPrice ||
    originalPrice <= 0 ||
    discountedPrice >= originalPrice
  ) {
    return 0;
  }

  // Calculate percentage
  const percentage = Math.round(
    ((originalPrice - discountedPrice) / originalPrice) * 100
  );

  // Cap at maxPercentage to avoid unrealistic discounts
  return Math.min(percentage, maxPercentage);
};
