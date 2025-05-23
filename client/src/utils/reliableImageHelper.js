/**
 * Reliable Image Helper Utility
 *
 * This utility provides reliable image handling functions that work even when the server is having issues.
 * It uses external placeholder services instead of relying on the server's /uploads directory.
 */

/**
 * Get a reliable image URL for a product
 * @param {Object} product - The product object
 * @returns {string} - A reliable image URL
 */
export const getReliableProductImage = (product) => {
  if (!product) {
    return "https://placehold.co/300x300/gray/white?text=No+Product";
  }

  // If the product has a name, create a product-specific placeholder
  if (product.name) {
    const productType = getProductType(product.name);
    return getPlaceholderByType(productType, product.name);
  }

  // If the product has an ID but no name, use the ID in the placeholder
  if (product._id) {
    const shortId = product._id.substring(product._id.length - 6);
    return `https://placehold.co/300x300/gray/white?text=Product+${shortId}`;
  }

  // Default placeholder
  return "https://placehold.co/300x300/gray/white?text=No+Image";
};

/**
 * Determine the product type based on the product name
 * @param {string} productName - The product name
 * @returns {string} - The product type
 */
export const getProductType = (productName) => {
  if (!productName) return "unknown";

  const lowerName = productName.toLowerCase();

  if (lowerName.includes("sofa") || lowerName.includes("couch")) {
    return "sofa";
  } else if (lowerName.includes("bed")) {
    return "bed";
  } else if (lowerName.includes("table") || lowerName.includes("dining")) {
    return "table";
  } else if (lowerName.includes("chair")) {
    return "chair";
  } else if (lowerName.includes("wardrobe") || lowerName.includes("cabinet")) {
    return "wardrobe";
  } else {
    return "furniture";
  }
};

/**
 * Get a placeholder image URL based on product type
 * @param {string} type - The product type
 * @param {string} name - The product name (optional)
 * @returns {string} - The placeholder image URL
 */
export const getPlaceholderByType = (type, name = "") => {
  // Color mapping for different product types
  const colorMap = {
    sofa: "8B4513", // Brown
    bed: "4169E1", // Royal Blue
    table: "CD853F", // Peru (wood color)
    chair: "2E8B57", // Sea Green
    wardrobe: "800080", // Purple
    furniture: "708090", // Slate Gray
  };

  // Background color mapping for different product types
  const bgColorMap = {
    sofa: "FFF0E6", // Light peach
    bed: "E6F0FF", // Light blue
    table: "FFF5E6", // Light tan
    chair: "E6FFF0", // Light mint
    wardrobe: "F5E6FF", // Light lavender
    furniture: "F0F0F0", // Light gray
  };

  // Get the colors for this product type
  const color = colorMap[type] || colorMap.furniture;
  const bgColor = bgColorMap[type] || bgColorMap.furniture;

  // Create a display name (either the type or a shortened product name)
  let displayName = type.charAt(0).toUpperCase() + type.slice(1);

  if (name && name.length > 0) {
    // Use the product name, but limit it to 20 characters
    displayName = name.length > 20 ? name.substring(0, 20) + "..." : name;
  }

  // Encode the display name for use in a URL
  const encodedName = encodeURIComponent(displayName);

  // Try to use a more visually appealing placeholder service
  try {
    // First try DiceBear for furniture-themed avatars
    const seed = encodeURIComponent(name || type);
    const style =
      type === "sofa"
        ? "lorelei"
        : type === "bed"
        ? "notionists"
        : type === "table"
        ? "shapes"
        : type === "chair"
        ? "thumbs"
        : type === "wardrobe"
        ? "initials"
        : "identicon";

    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${bgColor}&radius=10`;
  } catch (error) {
    // Fallback to placehold.co
    return `https://placehold.co/300x300/${color}/${bgColor}?text=${encodedName}`;
  }
};

/**
 * Process an array of products to ensure they have reliable image URLs
 * @param {Array} products - Array of product objects
 * @returns {Array} - Array of products with reliable image URLs
 */
export const processProductsWithReliableImages = (products) => {
  if (!products || !Array.isArray(products)) {
    return [];
  }

  return products.map((product) => ({
    ...product,
    reliableImageUrl: getReliableProductImage(product),
  }));
};

/**
 * Create a reliable image object for file upload preview
 * @param {File|string} file - The file or image URL
 * @param {number} index - The index of the file
 * @returns {Object} - An object with reliable image properties
 */
export const createReliableImageObject = (file, index) => {
  // If it's a File object, create a preview URL
  if (file instanceof File) {
    return {
      id: `file_${index}_${Date.now()}`,
      preview: URL.createObjectURL(file),
      file: file,
      isReliable: true,
    };
  }

  // If it's a string URL from a reliable source, use it directly
  if (
    typeof file === "string" &&
    (file.includes("placehold.co") ||
      file.includes("placeholder.com") ||
      file.includes("cloudinary.com"))
  ) {
    return {
      id: `url_${index}_${Date.now()}`,
      url: file,
      isReliable: true,
    };
  }

  // For any other case, use a placeholder
  return {
    id: `placeholder_${index}_${Date.now()}`,
    url: `https://placehold.co/300x300/gray/white?text=Image+${index + 1}`,
    isReliable: true,
  };
};

/**
 * Create a data URL from a file
 * @param {File} file - The file to create a data URL from
 * @returns {Promise<string>} - A promise that resolves to the data URL
 */
export const createDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Get a reliable image URL for a product with a fallback
 * @param {Object} product - The product object
 * @param {string} fallbackUrl - The fallback URL to use if the product has no images
 * @returns {string} - The image URL
 */
export const getReliableImageUrlWithFallback = (product, fallbackUrl) => {
  // If the product has images, try to use the first one
  if (product && product.images && product.images.length > 0) {
    const imageUrl = product.images[0];

    // If the image URL is a full URL, use it
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    // If the image URL is a relative path, try to use the server URL
    const hostname = window.location.hostname;
    const isProduction =
      hostname.includes("render.com") ||
      hostname === "furniture-q3nb.onrender.com";
    const baseUrl = isProduction
      ? "https://furniture-q3nb.onrender.com"
      : "http://localhost:5000";

    return `${baseUrl}${imageUrl}`;
  }

  // If the product has no images, use the fallback URL
  return (
    fallbackUrl ||
    getPlaceholderByType("furniture", product ? product.name : null)
  );
};
