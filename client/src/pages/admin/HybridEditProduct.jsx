import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import {
  getProductById,
  updateProduct,
  fixImageUrl,
} from "../../utils/robustApiHelper";
import {
  getCategoriesFromLocalStorage,
  getCategoryNameById,
} from "../../utils/localStorageHelper";
import {
  getPlaceholderByType,
  getProductType,
} from "../../utils/reliableImageHelper";
import axios from "axios";
/**
 * A hybrid product edit page that uses database data with reliable fallbacks.
 * Fetches data from MongoDB Atlas but has robust fallback mechanisms.
 */
const HybridEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImageFile, setSelectedImageFile] = useState(null); // Add this line

  // State for product data
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: 0,
    discountPrice: 0,
    discountPercentage: 0,
    stock: 0,
    category: "",
    material: "",
    color: "",
    featured: false,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
  });

  // State for categories
  const [categories, setCategories] = useState([]);

  // State for image preview
  // const [imagePreview, setImagePreview] = useState(null);
  // Simplified image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load product and categories on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // First load categories to ensure they're available when the product loads
        await loadCategories();

        // Then fetch the product
        await loadProduct();

        // After loading the product, check if we need to reload categories
        // This ensures that the category of the product is in the categories list
        const productCategory = product.category;
        if (productCategory) {
          console.log(
            "Checking if product category exists in categories list:",
            productCategory
          );

          // Check if the category exists in our categories list
          const categoryExists = categories.some(
            (cat) => cat._id === productCategory
          );
          console.log("Category exists in list:", categoryExists);

          // If the category doesn't exist in our list, reload categories
          if (!categoryExists) {
            console.log(
              "Product category not found in list, reloading categories..."
            );
            await loadCategories();
          }
        }
      } catch (error) {
        console.error("Error initializing data:", error);
        setError("Failed to load product data");
      }
    };

    initializeData();
  }, [id]);

  // Add this function near the top of your file, before the component definition
  const getBaseUrl = () => {
    const hostname = window.location.hostname;
    const isProduction =
      hostname.includes("render.com") ||
      hostname === "furniture-q3nb.onrender.com";
    return isProduction
      ? "https://furniture-q3nb.onrender.com"
      : "http://localhost:5000";
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await getProductById(`${id}?cache=${Date.now()}`); // Add cache buster

      if (!productData) {
        throw new Error("Product not found");
      }

      // Ensure category is properly formatted
      const formattedProduct = {
        ...productData,
        category: productData.category?._id || productData.category,
      };

      setProduct(formattedProduct);
    } catch (error) {
      console.error("Load error:", error);
      setError(error.message);
      navigate("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Default categories as fallback
      const defaultCategories = [
        { _id: "680c9481ab11e96a288ef6d9", name: "Sofa Beds" },
        { _id: "680c9484ab11e96a288ef6da", name: "Tables" },
        { _id: "680c9486ab11e96a288ef6db", name: "Chairs" },
        { _id: "680c9489ab11e96a288ef6dc", name: "Wardrobes" },
        { _id: "680c948eab11e96a288ef6dd", name: "Beds" },
      ];

      try {
        const response = await axios.get(
          `${getBaseUrl()}/api/categories?limit=100`
        );

        // Handle different response formats
        const serverCategories =
          response.data.data || response.data.products || response.data || [];

        // Merge with defaults, ensuring no duplicates
        const mergedCategories = [
          ...serverCategories,
          ...defaultCategories.filter(
            (defaultCat) =>
              !serverCategories.some((cat) => cat._id === defaultCat._id)
          ),
        ];

        setCategories(mergedCategories);
      } catch (serverError) {
        console.error(
          "Failed to fetch categories, using defaults",
          serverError
        );
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error("Category loading error:", error);
      setCategories([]);
    }
  };
  // Function to handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      // Handle nested properties (e.g., dimensions.length)
      const [parent, child] = name.split(".");
      setProduct({
        ...product,
        [parent]: {
          ...product[parent],
          [child]: type === "number" ? Number(value) : value,
        },
      });
    }
    // Special handling for category selection - SIMPLIFIED APPROACH
    else if (name === "category") {
      console.log("Category selected:", value);

      // SIMPLIFIED: Just store the category ID directly
      // This ensures consistent handling throughout the application
      setProduct({
        ...product,
        category: value, // Store the ID directly
      });

      console.log("Set category as ID:", value);

      // For debugging, show what the category name would be
      const categoryName = getCategoryNameById(value);
      console.log("Category name from ID:", categoryName);
    }
    // Special handling for price changes - update discount percentage
    else if (name === "price") {
      const newPrice = Number(value);
      let newDiscountPercentage = product.discountPercentage;

      // If we have a discount price, recalculate the percentage
      if (product.discountPrice > 0 && newPrice > 0) {
        newDiscountPercentage = Math.round(
          ((newPrice - product.discountPrice) / newPrice) * 100
        );
      }

      setProduct({
        ...product,
        price: newPrice,
        discountPercentage:
          newDiscountPercentage >= 0 ? newDiscountPercentage : 0,
      });
    }
    // Special handling for discount price changes - update discount percentage
    else if (name === "discountPrice") {
      const newDiscountPrice = Number(value);
      let newDiscountPercentage = 0;

      // Calculate discount percentage if price is greater than 0
      if (product.price > 0 && newDiscountPrice >= 0) {
        newDiscountPercentage = Math.round(
          ((product.price - newDiscountPrice) / product.price) * 100
        );
      }

      setProduct({
        ...product,
        discountPrice: newDiscountPrice,
        discountPercentage:
          newDiscountPercentage >= 0 ? newDiscountPercentage : 0,
      });
    }
    // Special handling for discount percentage changes - update discount price
    else if (name === "discountPercentage") {
      const newDiscountPercentage = Number(value);
      let newDiscountPrice = product.discountPrice;

      // Calculate discount price if price is greater than 0
      if (
        product.price > 0 &&
        newDiscountPercentage >= 0 &&
        newDiscountPercentage <= 100
      ) {
        newDiscountPrice =
          product.price - (product.price * newDiscountPercentage) / 100;
        newDiscountPrice = Math.round(newDiscountPrice * 100) / 100; // Round to 2 decimal places
      }

      setProduct({
        ...product,
        discountPercentage: newDiscountPercentage,
        discountPrice: newDiscountPrice >= 0 ? newDiscountPrice : 0,
      });
    } else {
      // Handle regular properties
      setProduct({
        ...product,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
            ? Number(value)
            : value,
      });
    }
  };

  // Simplified upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic validation
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  // Function to get a placeholder image based on product type
  const getProductImageUrl = () => {
    // If we have a preview image, use it
    if (imagePreview) {
      return imagePreview;
    }

    // If the product has images, use the first one with proper URL fixing
    if (product.images && product.images.length > 0) {
      // Handle data URLs directly
      if (product.images[0].startsWith("data:image")) {
        return product.images[0];
      }
      // Fix server URLs
      return fixImageUrl(product.images[0]);
    }

    // Otherwise, use a placeholder based on product type
    const productType = getProductType(product.name);
    return getPlaceholderByType(productType, product.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();

      // Append all product data
      formData.append("name", product.name);
      formData.append("description", product.description);
      formData.append("price", product.price);
      formData.append("discountPrice", product.discountPrice);
      formData.append("stock", product.stock);
      formData.append("category", product.category);
      formData.append("featured", product.featured);
      // Append numeric fields with type conversion
      formData.append("price", Number(product.price));
      formData.append("discountPrice", Number(product.discountPrice));
      formData.append("stock", Number(product.stock));

      // Append individual dimension fields
      formData.append("length", Number(product.dimensions.length));
      formData.append("width", Number(product.dimensions.width));
      formData.append("height", Number(product.dimensions.height));

      // Handle image upload with validation
      if (imageFile) {
        formData.append("images", imageFile);
      } else if (product.images?.length > 0) {
        formData.append(
          "existingImages",
          JSON.stringify(product.images.map((img) => fixImageUrl(img)))
        );
      }

      // Get auth token
      const authToken =
        localStorage.getItem("adminToken") ||
        sessionStorage.getItem("adminToken");

      // Add cache buster to prevent caching issues
      const cacheBuster = `?cb=${Date.now()}`;

      const response = await axios.put(
        `${getBaseUrl()}/api/products/${id}${cacheBuster}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      // Check for successful response
      if (!response.data) {
        throw new Error("Empty response from server");
      }

      // Handle different response formats
      const updatedProduct = response.data.data || response.data;

      if (!updatedProduct) {
        throw new Error("Product not found in response");
      }

      // Update local state
      setProduct(updatedProduct);
      setSuccessMessage("Product updated successfully!");

      // Clear image states
      setSelectedImageFile(null);
      setImagePreview(null);

      // Navigate back after 2 seconds
      setTimeout(() => {
        navigate("/admin/products", { state: { forceRefresh: true } });
      }, 2000);
    } catch (error) {
      console.error("Update error:", error);

      // More detailed error messages
      let errorMessage = "Failed to update product";
      if (error.response) {
        // Server responded with error status
        errorMessage =
          error.response.data?.message ||
          error.response.statusText ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Other errors
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Edit Product
            </h1>
          </div>
          <Button color="blue" onClick={() => navigate("/admin/products")}>
            Back to Products
          </Button>
        </div>

        {/* Success message */}
        {successMessage && (
          <Alert type="success" message={successMessage} className="mb-4" />
        )}

        {/* Error message */}
        {error && <Alert type="error" message={error} className="mb-4" />}

        {/* Loading indicator */}
        {loading ? (
          <Loading />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={product.category || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {product.category && (
                  <div className="mt-1 text-xs text-gray-500">
                    Selected category: {getCategoryNameById(product.category)}
                  </div>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Discount Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Price (₹)
                </label>
                <input
                  type="number"
                  name="discountPrice"
                  value={product.discountPrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={product.discountPercentage || 0}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  max="100"
                  step="1"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {product.price > 0 && product.discountPercentage > 0 && (
                    <span>
                      Calculated discount price: ₹
                      {(
                        product.price -
                        (product.price * product.discountPercentage) / 100
                      ).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={product.stock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                  min="0"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={product.featured}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Featured Product
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              ></textarea>
            </div>

            {/* Product Image */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Image
              </label>
              <div className="flex flex-col md:flex-row items-start gap-4">
                {/* Image Preview */}
                <div className="w-full md:w-1/3 mb-4 md:mb-0">
                  <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <img
                      src={getProductImageUrl()}
                      alt={product.name || "Product"}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        const productType = getProductType(product.name);
                        e.target.src = getPlaceholderByType(
                          productType,
                          product.name
                        );
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {imagePreview
                      ? "New image preview"
                      : product.images && product.images.length > 0
                      ? "Current image"
                      : "No image available"}
                  </p>
                </div>

                {/* Image Upload */}
                <div className="w-full md:w-2/3">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6 flex flex-col items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop an image, or click to select
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Select Image
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setProduct({
                            ...product,
                            imageFile: null,
                          });
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove new image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              {/* <Button type="submit" color="blue" disabled={loading} fullWidth>
                {loading ? "Updating..." : "Update Product"}
              </Button> */}
              <Button type="submit" color="blue" disabled={loading} fullWidth>
                {loading ? (
                  <>
                    <CircularProgress size={24} color="inherit" />
                    <span style={{ marginLeft: 8 }}>Updating...</span>
                  </>
                ) : (
                  "Update Product"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default HybridEditProduct;
