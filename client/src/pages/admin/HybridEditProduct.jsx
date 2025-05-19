import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import { getProductById, updateProduct } from "../../utils/robustApiHelper";
import { getCategoriesFromLocalStorage } from "../../utils/localStorageHelper";
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

  // State for offline mode
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Load product and categories on component mount
  useEffect(() => {
    loadProduct();
    loadCategories();
  }, [id]);

  // Function to load product from database with fallbacks
  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsOfflineMode(false);

      // Get product from database with fallbacks
      const productData = await getProductById(id);

      // Check if we're in offline mode by examining the source of the data
      const isOffline =
        productData &&
        ((productData._id && productData._id.startsWith("local_")) ||
          productData.source === "localStorage");

      setIsOfflineMode(isOffline);

      if (productData) {
        // Format the product data for the form
        setProduct({
          ...productData,
          category:
            typeof productData.category === "object"
              ? productData.category._id
              : productData.category,
          dimensions: productData.dimensions || {
            length: 0,
            width: 0,
            height: 0,
          },
        });

        if (isOffline) {
          setSuccessMessage("Product loaded from local storage (offline mode)");
        } else {
          setSuccessMessage("Product loaded successfully");
        }
      } else {
        setError(`Product with ID ${id} not found`);
        setIsOfflineMode(true); // Assume offline mode if product not found

        // Navigate back to products page after 3 seconds
        setTimeout(() => {
          navigate("/admin/products");
        }, 3000);
      }
    } catch (error) {
      console.error("Error loading product:", error);
      setError("Failed to load product");
      setIsOfflineMode(true); // Assume offline mode if there's an error
    } finally {
      setLoading(false);
    }
  };

  // Function to load categories
  const loadCategories = () => {
    try {
      // Get categories from localStorage (will return default categories if none found)
      const localCategories = getCategoriesFromLocalStorage();
      setCategories(localCategories);
    } catch (error) {
      console.error("Error loading categories:", error);

      // Use default categories as fallback
      setCategories([
        { _id: "cat1", name: "Sofa Beds" },
        { _id: "cat2", name: "Tables" },
        { _id: "cat3", name: "Chairs" },
        { _id: "cat4", name: "Wardrobes" },
        { _id: "cat5", name: "Beds" },
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

    // Store the file in the product state
    setProduct({
      ...product,
      imageFile: file,
    });
  };

  // Function to get a placeholder image based on product type
  const getProductImageUrl = () => {
    // If we have a preview image, use it
    if (imagePreview) {
      return imagePreview;
    }

    // If the product has images, use the first one
    if (product.images && product.images.length > 0) {
      return product.images[0];
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
        // Keep the original category if it's an object
        category:
          typeof product.category === "object"
            ? product.category
            : product.category,
      };

      // If a new image file was uploaded, create a FormData object
      if (product.imageFile) {
        const formData = new FormData();

        // Add all product data to FormData
        Object.keys(productToSave).forEach((key) => {
          if (key !== "imageFile" && key !== "images" && key !== "dimensions") {
            formData.append(key, productToSave[key]);
          }
        });

        // Add dimensions as JSON string
        if (productToSave.dimensions) {
          formData.append(
            "dimensions",
            JSON.stringify(productToSave.dimensions)
          );
        }

        // Add the image file
        formData.append("images", product.imageFile);

        // Use FormData instead of JSON
        productToSave = formData;
      }

      // Update product in database with fallbacks
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
              <p class="text-sm text-gray-600">All changes have been saved successfully.</p>
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

        // Show error message with fallback option
        Swal.fire({
          title: "Server Error",
          html: `
            <div class="text-center">
              <p class="mb-2">The server encountered an error while updating the product.</p>
              <div class="flex justify-center my-3">
                <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
              </div>
              <p class="text-sm text-gray-600">However, your changes have been saved locally.</p>
              <p class="text-xs text-gray-500 mt-2">You can continue working with the product.</p>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Go to Products",
          cancelButtonText: "Stay Here",
        }).then((result) => {
          if (result.isConfirmed) {
            // Navigate back to products page
            navigate("/admin/products", {
              state: { successMessage: "Product updated locally" },
            });
          } else {
            // Stay on the page, but show success message
            setSuccessMessage(
              "Product updated locally. Server update failed but your changes are saved."
            );
            setLoading(false);
          }
        });
      }
    } catch (error) {
      console.error("Error updating product:", error);

      // Close loading dialog
      Swal.close();

      // Show error message with fallback option
      Swal.fire({
        title: "Update Error",
        html: `
          <div class="text-center">
            <p class="mb-2">An error occurred while updating the product.</p>
            <div class="flex justify-center my-3">
              <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
            </div>
            <p class="text-sm text-gray-600">We've attempted to save your changes locally.</p>
            <p class="text-xs text-gray-500 mt-2">Error: ${
              error.message || "Unknown error"
            }</p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Go to Products",
        cancelButtonText: "Try Again",
      }).then((result) => {
        if (result.isConfirmed) {
          // Navigate back to products page
          navigate("/admin/products", {
            state: { successMessage: "Product may have been updated locally" },
          });
        } else {
          // Stay on the page and allow retry
          setError(
            "Update failed. You can try again or make changes to your input."
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
            {isOfflineMode && (
              <div className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-full flex items-center text-sm">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Offline Mode
              </div>
            )}
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
                  value={product.category}
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
