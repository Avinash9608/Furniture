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

/**
 * A hybrid product edit page that uses database data with reliable fallbacks.
 * Fetches data from MongoDB Atlas but has robust fallback mechanisms.
 */
const HybridEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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

  // Function to load product directly from database
  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading product with ID:", id);

      // Get product directly from database
      const productData = await getProductById(id);

      if (productData) {
        console.log("Product loaded successfully:", productData.name);

        // IMPROVED APPROACH: Extract the category ID regardless of format
        let categoryId;

        // If category is an object with ID
        if (
          typeof productData.category === "object" &&
          productData.category !== null &&
          productData.category._id
        ) {
          categoryId = productData.category._id;
          console.log("Category is an object, extracted ID:", categoryId);
        }
        // If category is just a string (ID)
        else if (typeof productData.category === "string") {
          categoryId = productData.category;
          console.log("Category is a string ID:", categoryId);
        }
        // If category is missing or invalid
        else {
          categoryId = "";
          console.log("Category is missing or invalid, using empty string");
        }

        // Calculate discount percentage if not provided
        let discountPercentage = productData.discountPercentage || 0;

        // If we have price and discount price but no discount percentage, calculate it
        if (
          productData.price > 0 &&
          productData.discountPrice > 0 &&
          !productData.discountPercentage
        ) {
          discountPercentage = Math.round(
            ((productData.price - productData.discountPrice) /
              productData.price) *
              100
          );
          console.log("Calculated discount percentage:", discountPercentage);
        }

        // Format the product data for the form - use the ID directly
        setProduct({
          ...productData,
          category: categoryId, // Use the ID directly
          discountPercentage: discountPercentage,
          dimensions: productData.dimensions || {
            length: 0,
            width: 0,
            height: 0,
          },
        });

        // For debugging, show what the category name would be
        if (categoryId) {
          const categoryName = getCategoryNameById(categoryId);
          console.log("Category name from ID:", categoryName);

          // Log all categories to help with debugging
          console.log("Available categories:", categories);

          // Check if the category exists in our categories list
          const categoryExists = categories.some(
            (cat) => cat._id === categoryId
          );
          console.log("Category exists in list:", categoryExists);
        }

        setSuccessMessage("Product loaded successfully");
      } else {
        setError(`Product with ID ${id} not found`);

        // Navigate back to products page after 3 seconds
        setTimeout(() => {
          navigate("/admin/products");
        }, 3000);
      }
    } catch (error) {
      console.error("Error loading product:", error);
      setError("Failed to load product: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Function to load all categories from the database
  const loadCategories = async () => {
    try {
      console.log("Loading all categories from database...");

      // Determine if we're in development or production
      const baseUrl = window.location.origin;
      const isDevelopment = !baseUrl.includes("onrender.com");
      const localServerUrl = "http://localhost:5000";

      // Use the appropriate URL based on environment with high limit to get all categories
      const categoriesUrl = isDevelopment
        ? `${localServerUrl}/api/categories?limit=100`
        : `${baseUrl}/api/categories?limit=100`;

      console.log("Fetching categories from:", categoriesUrl);

      // Add authentication headers
      const adminToken =
        localStorage.getItem("adminToken") ||
        sessionStorage.getItem("adminToken");
      const token = localStorage.getItem("token");
      const authToken = adminToken || token;

      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      // Fetch categories from server with increased timeout
      const response = await fetch(categoriesUrl, {
        headers,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      const data = await response.json();

      console.log("Server categories response:", data);

      // Extract categories from response
      let serverCategories = [];
      if (data && Array.isArray(data)) {
        serverCategories = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        serverCategories = data.data;
      }

      // Process categories to ensure they have all required fields
      const processedCategories = serverCategories.map((category) => ({
        ...category,
        name: category.name || category.displayName || "Unknown Category",
      }));

      // Add default categories if none found or if we need to ensure they exist
      const defaultCategories = [
        { _id: "680c9481ab11e96a288ef6d9", name: "Sofa Beds" },
        { _id: "680c9484ab11e96a288ef6da", name: "Tables" },
        { _id: "680c9486ab11e96a288ef6db", name: "Chairs" },
        { _id: "680c9489ab11e96a288ef6dc", name: "Wardrobes" },
        { _id: "680c948eab11e96a288ef6dd", name: "Beds" },
      ];

      // Merge server categories with default categories to ensure we have all
      const mergedCategories = [...processedCategories];

      // Add default categories that don't exist in server categories
      defaultCategories.forEach((defaultCat) => {
        const exists = mergedCategories.some(
          (cat) => cat._id === defaultCat._id
        );
        if (!exists) {
          mergedCategories.push(defaultCat);
        }
      });

      console.log(
        `Setting ${mergedCategories.length} categories:`,
        mergedCategories
      );
      setCategories(mergedCategories);
    } catch (error) {
      console.error("Error loading categories:", error);

      // Use default categories as fallback
      console.log("Error loading categories, using default categories");
      setCategories([
        { _id: "680c9481ab11e96a288ef6d9", name: "Sofa Beds" },
        { _id: "680c9484ab11e96a288ef6da", name: "Tables" },
        { _id: "680c9486ab11e96a288ef6db", name: "Chairs" },
        { _id: "680c9489ab11e96a288ef6dc", name: "Wardrobes" },
        { _id: "680c948eab11e96a288ef6dd", name: "Beds" },
      ]);
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

  // Function to handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a preview URL for the image
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Convert the file to a data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;

      // Store both the file and the data URL in the product state
      setProduct({
        ...product,
        imageFile: file,
        // Add the data URL to the images array
        images: [dataUrl, ...(product.images || [])],
      });
    };

    reader.readAsDataURL(file);
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

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Show loading indicator
      setLoading(true);
      setError(null);

      // Show loading state with progress
      let timerInterval;
      Swal.fire({
        title: "Updating...",
        html: "Please wait while we update the product.<br/><b>Processing changes...</b>",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();

          // Simulate progress updates
          const b = Swal.getHtmlContainer().querySelector("b");
          timerInterval = setInterval(() => {
            const messages = [
              "Processing changes...",
              "Validating data...",
              "Preparing image...",
              "Saving product information...",
              "Finalizing update...",
            ];
            const randomMessage =
              messages[Math.floor(Math.random() * messages.length)];
            b.textContent = randomMessage;
          }, 800);
        },
        willClose: () => {
          clearInterval(timerInterval);
        },
      });

      // Format the product data for saving
      let productToSave = {
        ...product,
        // Keep the original images if no new image is uploaded
        images: product.images || [],
      };

      // Get the selected category from the form
      const selectedCategoryId = product.category;

      // Always use the category ID directly
      // This ensures consistent handling throughout the application
      productToSave.category = selectedCategoryId;

      // Remove the imageFile property as we're using data URLs
      if (productToSave.imageFile) {
        // We already converted the file to a data URL and added it to the images array
        // So we can remove the imageFile property
        const { imageFile, ...productWithoutImageFile } = productToSave;
        productToSave = productWithoutImageFile;
      }

      // Prepare product data for saving

      // Update product directly in database
      const updatedProduct = await updateProduct(id, productToSave);

      if (updatedProduct) {
        // Close loading dialog
        Swal.close();

        // Show success message with more details
        Swal.fire({
          title: "Success!",
          html: `
            <div class="text-center">
              <p class="mb-2">Product updated successfully!</p>
              <div class="flex justify-center my-3">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <p class="text-sm text-gray-600">All changes have been saved to the database successfully.</p>
              <p class="text-xs text-gray-500 mt-2">Updated: ${new Date().toLocaleString()}</p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Go to Products",
        }).then(() => {
          // Navigate back to products page
          navigate("/admin/products", {
            state: { successMessage: "Product updated successfully" },
          });
        });
      } else {
        // Close loading dialog
        Swal.close();

        // Show error message
        Swal.fire({
          title: "Update Error",
          html: `
            <div class="text-center">
              <p class="mb-2">The server encountered an error while updating the product.</p>
              <div class="flex justify-center my-3">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
              </div>
              <p class="text-sm text-gray-600">Please try again or contact support if the problem persists.</p>
            </div>
          `,
          icon: "error",
          showCancelButton: true,
          confirmButtonText: "Go to Products",
          cancelButtonText: "Try Again",
        }).then((result) => {
          if (result.isConfirmed) {
            // Navigate back to products page
            navigate("/admin/products");
          } else {
            // Stay on the page and allow retry
            setError("Update failed. Please try again.");
            setLoading(false);
          }
        });
      }
    } catch (error) {
      console.error("Error updating product:", error);

      // Close loading dialog
      Swal.close();

      // Show error message
      Swal.fire({
        title: "Update Error",
        html: `
          <div class="text-center">
            <p class="mb-2">An error occurred while updating the product.</p>
            <div class="flex justify-center my-3">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
            </div>
            <p class="text-sm text-gray-600">Please try again or contact support if the problem persists.</p>
            <p class="text-xs text-gray-500 mt-2">Error: ${
              error.message || "Unknown error"
            }</p>
          </div>
        `,
        icon: "error",
        showCancelButton: true,
        confirmButtonText: "Go to Products",
        cancelButtonText: "Try Again",
      }).then((result) => {
        if (result.isConfirmed) {
          // Navigate back to products page
          navigate("/admin/products");
        } else {
          // Stay on the page and allow retry
          setError(
            "Update failed: " +
              (error.message || "Unknown error") +
              ". Please try again."
          );
          setLoading(false);
        }
      });
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
                  {categories.map((category) => {
                    // Check if this category is selected
                    const isSelected = category._id === product.category;

                    return (
                      <option
                        key={category._id}
                        value={category._id}
                        selected={isSelected}
                      >
                        {category.name}
                      </option>
                    );
                  })}
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
              <Button type="submit" color="blue" disabled={loading} fullWidth>
                {loading ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default HybridEditProduct;
