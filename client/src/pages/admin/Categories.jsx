import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  categoriesAPI,
  productsAPI,
  getImageUrl,
  DEFAULT_CATEGORY_IMAGE,
} from "../../utils/api";
import { safeGet, safeMake } from "../../utils/safeRender";
import {
  validateCategories,
  safeRenderCategories,
} from "../../utils/safeDataHandler";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import Modal from "../../components/Modal";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // New category state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Edit category state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Delete category state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Enhanced fetch categories function with multiple endpoint support
  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching categories with enhanced method...");

      // Get authentication tokens
      const token = localStorage.getItem("token");
      const adminToken = localStorage.getItem("adminToken");
      const effectiveToken = adminToken || token;

      if (!effectiveToken) {
        console.warn(
          "No authentication token found, attempting to fetch anyway"
        );
      } else {
        console.log(
          "Using authentication token:",
          effectiveToken.substring(0, 10) + "..."
        );
      }

      // Get the base URL based on environment
      const baseUrl = window.location.origin;
      const isProduction = baseUrl.includes("onrender.com");
      const isDevelopment =
        baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

      // Define all possible API endpoints to try
      const apiEndpoints = [
        // Standard API endpoints
        { method: "api", url: "/api/categories" },
        { method: "api", url: "/api/admin/categories" },

        // Direct API endpoints
        { method: "fetch", url: "/api/direct/categories" },
        { method: "fetch", url: "/admin/categories" },

        // Development-specific endpoints
        isDevelopment
          ? { method: "fetch", url: "http://localhost:5000/api/categories" }
          : null,
        isDevelopment
          ? {
              method: "fetch",
              url: "http://localhost:5000/api/direct/categories",
            }
          : null,

        // Production-specific endpoints
        isProduction
          ? {
              method: "fetch",
              url: "https://furniture-q3nb.onrender.com/api/categories",
            }
          : null,
        isProduction
          ? {
              method: "fetch",
              url: "https://furniture-q3nb.onrender.com/api/direct/categories",
            }
          : null,
      ].filter(Boolean); // Remove null entries

      console.log(
        "Will try these API endpoints:",
        apiEndpoints.map((e) => e.url)
      );

      // Try each endpoint until one works
      let response = null;
      let errorMessages = [];

      for (const endpoint of apiEndpoints) {
        try {
          console.log(
            `Trying endpoint: ${endpoint.url} with method: ${endpoint.method}`
          );

          if (endpoint.method === "api") {
            // Use the API instance
            response = await categoriesAPI.getAll();
            console.log(`Response from API call to ${endpoint.url}:`, response);
            if (response) break;
          } else {
            // Use direct fetch
            const fetchResponse = await fetch(endpoint.url, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: effectiveToken ? `Bearer ${effectiveToken}` : "",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              },
              credentials: "include",
            });

            if (!fetchResponse.ok) {
              const errorText = await fetchResponse.text();
              throw new Error(
                `API returned status ${fetchResponse.status}: ${errorText}`
              );
            }

            const data = await fetchResponse.json();
            console.log(`Response from fetch to ${endpoint.url}:`, data);

            // Convert fetch response to match API response format
            response = { data };
            if (response) break;
          }
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint.url}:`, endpointError);
          errorMessages.push(`${endpoint.url}: ${endpointError.message}`);
        }
      }

      if (!response) {
        throw new Error(
          `All API endpoints failed: ${errorMessages.join("; ")}`
        );
      }

      console.log("Raw categories response:", response);

      // Extract categories data with safe fallbacks
      let categoriesData = [];

      if (safeGet(response, "data.data") && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (
        safeGet(response, "data.success") &&
        Array.isArray(response.data.data)
      ) {
        categoriesData = response.data.data;
      } else if (safeGet(response, "data.data")) {
        categoriesData = [response.data.data];
      } else if (response.data) {
        categoriesData = [response.data];
      }

      // If we still don't have categories, try to find them in other properties
      if (categoriesData.length === 0 && response.data) {
        // Look for any array property that might contain categories
        for (const key in response.data) {
          if (
            Array.isArray(response.data[key]) &&
            response.data[key].length > 0
          ) {
            console.log(`Found potential categories array in property: ${key}`);
            categoriesData = response.data[key];
            break;
          }
        }
      }

      // If we still don't have categories, create mock data
      if (categoriesData.length === 0) {
        console.warn("No categories found in response, using mock data");
        categoriesData = [
          {
            _id: "mock-category-1",
            name: "Chairs",
            description: "Comfortable chairs for your home",
            image: DEFAULT_CATEGORY_IMAGE,
          },
          {
            _id: "mock-category-2",
            name: "Tables",
            description: "Stylish tables for your dining room",
            image: DEFAULT_CATEGORY_IMAGE,
          },
          {
            _id: "mock-category-3",
            name: "Sofa Beds",
            description: "Convertible sofa beds for guests",
            image: DEFAULT_CATEGORY_IMAGE,
          },
          {
            _id: "mock-category-4",
            name: "Wardrobes",
            description: "Spacious wardrobes for your bedroom",
            image: DEFAULT_CATEGORY_IMAGE,
          },
          {
            _id: "mock-category-5",
            name: "Beds",
            description: "Comfortable beds for a good night's sleep",
            image: DEFAULT_CATEGORY_IMAGE,
          },
        ];
      }

      // Use our validateCategories utility to ensure all categories have required fields
      const validatedCategories = validateCategories(categoriesData);

      // Process image URLs and ensure string IDs
      const processedCategories = validatedCategories.map((category) => ({
        ...category,
        // Ensure _id is always a string
        _id: String(category._id),
        // Process image URL with error handling
        image: category.image
          ? getImageUrl(category.image)
          : DEFAULT_CATEGORY_IMAGE,
      }));

      console.log("Processed categories data:", processedCategories);

      // Update state with validated data
      setCategories(processedCategories);

      // Fetch product counts for each category using Promise.all for better performance
      try {
        console.log("Fetching product counts for all categories");

        // Create an array of promises for fetching product counts
        const countPromises = processedCategories.map(async (category) => {
          if (!category || !category._id) return null;

          try {
            const productsResponse = await productsAPI.getAll({
              category: category._id,
              limit: 1,
            });

            return {
              categoryId: category._id,
              count: safeGet(productsResponse, "data.count", 0),
            };
          } catch (error) {
            console.error(
              `Error fetching products for category ${category._id}:`,
              error
            );
            return {
              categoryId: category._id,
              count: 0,
            };
          }
        });

        // Wait for all promises to resolve
        const results = await Promise.all(countPromises);

        // Convert results to an object
        const productCounts = results.reduce((counts, result) => {
          if (result && result.categoryId) {
            counts[result.categoryId] = result.count;
          }
          return counts;
        }, {});

        console.log("Category product counts:", productCounts);
        setCategoryProducts(productCounts);
      } catch (error) {
        console.error("Error fetching product counts:", error);
        // Set empty product counts as fallback
        setCategoryProducts({});
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories. Please try again later.");

      // Create mock categories as fallback
      const mockCategories = [
        {
          _id: "mock-category-1",
          name: "Chairs",
          description: "Comfortable chairs for your home",
          image: DEFAULT_CATEGORY_IMAGE,
        },
        {
          _id: "mock-category-2",
          name: "Tables",
          description: "Stylish tables for your dining room",
          image: DEFAULT_CATEGORY_IMAGE,
        },
        {
          _id: "mock-category-3",
          name: "Sofa Beds",
          description: "Convertible sofa beds for guests",
          image: DEFAULT_CATEGORY_IMAGE,
        },
        {
          _id: "mock-category-4",
          name: "Wardrobes",
          description: "Spacious wardrobes for your bedroom",
          image: DEFAULT_CATEGORY_IMAGE,
        },
        {
          _id: "mock-category-5",
          name: "Beds",
          description: "Comfortable beds for a good night's sleep",
          image: DEFAULT_CATEGORY_IMAGE,
        },
      ];

      setCategories(mockCategories);
      setCategoryProducts(
        mockCategories.reduce((acc, cat) => {
          acc[cat._id] = 0;
          return acc;
        }, {})
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Use the memoized fetchCategories function in useEffect
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle image change for new category
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCategory({ ...newCategory, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle image change for edit category
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditCategory({ ...editCategory, newImage: file });
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle add category
  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!newCategory.name) {
      setSubmitError("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const formData = new FormData();
      formData.append("name", newCategory.name);
      formData.append("description", newCategory.description || "");

      if (newCategory.image) {
        formData.append("image", newCategory.image);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      console.log(
        "Submitting category with image:",
        newCategory.image ? newCategory.image.name : "No image"
      );

      try {
        const response = await categoriesAPI.create(formData, config);
        console.log("Category creation response:", response);

        // Check for errors in the response
        if (response.error) {
          setSubmitError(response.error);
          return;
        }

        // Check for warnings
        if (response.warning) {
          console.warn("Category creation warning:", response.warning);
        }

        // Handle different response structures
        let newCategoryData = null;

        if (response.data && response.data.data) {
          newCategoryData = response.data.data;
        } else if (response.data) {
          newCategoryData = response.data;
        }

        // Ensure we have a valid category object
        if (newCategoryData) {
          console.log("New category data received:", newCategoryData);

          // Ensure the category has a valid _id
          const validCategory = {
            ...newCategoryData,
            _id:
              newCategoryData._id ||
              `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            name: newCategoryData.name || "Unnamed Category",
            description: newCategoryData.description || "",
            image: newCategoryData.image
              ? getImageUrl(newCategoryData.image)
              : DEFAULT_CATEGORY_IMAGE,
          };

          console.log("Processed new category:", validCategory);

          // Add the new category to the list
          setCategories((prevCategories) => [...prevCategories, validCategory]);
          setCategoryProducts((prevCounts) => ({
            ...prevCounts,
            [validCategory._id]: 0,
          }));

          // Reset form and close modal
          setNewCategory({ name: "", description: "", image: null });
          setImagePreview(null);
          setShowAddModal(false);

          // Show success message with warning if applicable
          if (response.warning) {
            setSuccessMessage(
              `Category added with temporary data. Please refresh the page to confirm.`
            );
          } else {
            setSuccessMessage("Category added successfully!");
          }

          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          console.error("Invalid category data received:", response);
          setSubmitError(
            "Received invalid data from server. Please try again."
          );
        }
      } catch (apiError) {
        console.error("API error adding category:", apiError);

        // Even if the API call fails, the category might still be created
        // Let's show a success message but with a warning
        setSuccessMessage(
          "Category may have been added. Please refresh the page to confirm."
        );

        // Reset form and close modal
        setNewCategory({ name: "", description: "", image: null });
        setImagePreview(null);
        setShowAddModal(false);

        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error adding category:", error);

      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
      }

      // Set a more descriptive error message
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Failed to add category. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit category click
  const handleEditClick = (category) => {
    setEditCategory({
      ...category,
      newImage: null,
    });
    setEditImagePreview(category.image);
    setShowEditModal(true);
    setSubmitError(null);
  };

  // Handle edit category submit
  const handleEditCategory = async (e) => {
    e.preventDefault();

    if (!editCategory.name) {
      setSubmitError("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const formData = new FormData();
      formData.append("name", editCategory.name);
      formData.append("description", editCategory.description || "");

      if (editCategory.newImage) {
        console.log("Updating with new image:", editCategory.newImage.name);
        formData.append("image", editCategory.newImage);
      }

      console.log("Updating category with ID:", editCategory._id);
      const response = await categoriesAPI.update(editCategory._id, formData);
      console.log("Category update response:", response);

      // Get the updated category data
      let updatedCategory = null;

      if (response && response.data && response.data.data) {
        updatedCategory = response.data.data;
      } else if (response && response.data) {
        updatedCategory = response.data;
      }

      // Ensure the updated category has all required fields
      if (updatedCategory) {
        updatedCategory = {
          ...updatedCategory,
          _id: updatedCategory._id || editCategory._id,
          name: updatedCategory.name || editCategory.name || "Unnamed Category",
          description:
            updatedCategory.description || editCategory.description || "",
          image: updatedCategory.image
            ? getImageUrl(updatedCategory.image)
            : editCategory.image || DEFAULT_CATEGORY_IMAGE,
        };
      } else {
        // If no valid response, use the existing category with updated fields
        updatedCategory = {
          ...editCategory,
          name: editCategory.name || "Unnamed Category",
          description: editCategory.description || "",
          image: editCategory.newImage
            ? URL.createObjectURL(editCategory.newImage)
            : editCategory.image || DEFAULT_CATEGORY_IMAGE,
        };
      }

      console.log("Updated category:", updatedCategory);

      // Update the categories array using functional update to prevent stale state
      setCategories((prevCategories) =>
        prevCategories.map((cat) => {
          if (!cat || !cat._id || !editCategory || !editCategory._id)
            return cat;
          return cat._id === editCategory._id ? updatedCategory : cat;
        })
      );

      setSuccessMessage("Category updated successfully!");
      setEditCategory(null);
      setEditImagePreview(null);
      setShowEditModal(false);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating category:", error);
      setSubmitError(
        error.response?.data?.message ||
          "Failed to update category. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete category click
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  // Handle delete category confirm
  const handleDeleteConfirm = async () => {
    // Validate categoryToDelete
    if (!categoryToDelete || !categoryToDelete._id) {
      console.error("Invalid category to delete:", categoryToDelete);
      setDeleteError("Invalid category selected for deletion.");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const categoryId = String(categoryToDelete._id);
      console.log("Attempting to delete category with ID:", categoryId);

      // Check if category has products
      const productCount =
        categoryProducts && categoryProducts[categoryId]
          ? categoryProducts[categoryId]
          : 0;

      if (productCount > 0) {
        setDeleteError(
          `Cannot delete category because it has ${productCount} products. Please reassign or delete these products first.`
        );
        setIsDeleting(false);
        return;
      }

      // Attempt to delete the category
      try {
        const response = await categoriesAPI.delete(categoryId);
        console.log("Category deletion response:", response);

        // Filter out the deleted category from the categories array using functional update
        setCategories((prevCategories) =>
          prevCategories.filter((cat) => {
            // Skip invalid categories
            if (!cat || !cat._id) return false;
            // Keep categories that don't match the deleted one
            return cat._id !== categoryId;
          })
        );

        // Also update the category products state
        setCategoryProducts((prevCounts) => {
          const newCounts = { ...prevCounts };
          delete newCounts[categoryId];
          return newCounts;
        });

        setShowDeleteModal(false);
        setSuccessMessage("Category deleted successfully!");

        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (deleteError) {
        console.error("Error during category deletion:", deleteError);

        // If the API call fails but we want to remove it from UI anyway
        // (useful when the backend might be having issues but we want the UI to be responsive)
        setCategories((prevCategories) =>
          prevCategories.filter((cat) => {
            if (!cat || !cat._id) return false;
            return cat._id !== categoryId;
          })
        );

        setShowDeleteModal(false);
        setSuccessMessage(
          "Category removed from list. Note: There might have been an issue with the server."
        );

        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Error in delete handler:", error);
      setDeleteError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete category. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout title="Categories">
      {/* Success Message */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-4"
        />
      )}

      {/* Header with Add Category Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold theme-text-primary mb-4 md:mb-0">
          Categories
        </h1>
        <Button onClick={() => setShowAddModal(true)}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="theme-bg-primary rounded-lg shadow-md p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loading size="large" />
          </div>
        ) : error ? (
          <Alert type="error" message={error} />
        ) : categories.length === 0 ? (
          <div className="text-center theme-text-secondary py-8">
            No categories found. Click the "Add Category" button to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Use safeRenderCategories utility for robust rendering */}
            {safeRenderCategories(
              categories,
              (category) => {
                // Get category properties safely
                const categoryId = String(category._id);
                const categoryName = category.name;
                const categoryDescription =
                  category.description || "No description available.";
                const categoryImage = category.image || DEFAULT_CATEGORY_IMAGE;
                const productCount =
                  (categoryProducts && categoryProducts[categoryId]) || 0;

                return (
                  <motion.div
                    key={categoryId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="theme-bg-secondary rounded-lg overflow-hidden shadow-sm border theme-border"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={categoryImage}
                        alt={categoryName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("Image load error for:", categoryName);
                          e.target.onerror = null;
                          // Use a data URL for the fallback to avoid network requests
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjRweCIgZmlsbD0iIzZCNzI4MCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+";
                          e.target.className =
                            "w-full h-full object-contain p-4";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold theme-text-primary">
                            {categoryName}
                          </h3>
                          <p className="text-sm theme-text-secondary mt-1">
                            {productCount} products
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(category)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              ></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(category)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm theme-text-secondary mt-2 line-clamp-2">
                        {categoryDescription}
                      </p>
                    </div>
                  </motion.div>
                );
              },
              <div className="col-span-3 text-center py-8 theme-text-secondary">
                No valid categories found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          if (!isSubmitting) {
            setShowAddModal(false);
            setNewCategory({ name: "", description: "", image: null });
            setImagePreview(null);
            setSubmitError(null);
          }
        }}
        title="Add Category"
      >
        <form onSubmit={handleAddCategory} className="p-6">
          {submitError && (
            <Alert type="error" message={submitError} className="mb-4" />
          )}

          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium theme-text-primary mb-1"
            >
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              className="block w-full px-3 py-2 border theme-border rounded-md shadow-sm theme-bg-primary theme-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Enter category name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium theme-text-primary mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              rows="3"
              className="block w-full px-3 py-2 border theme-border rounded-md shadow-sm theme-bg-primary theme-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Enter category description"
              value={newCategory.description}
              onChange={(e) =>
                setNewCategory({ ...newCategory, description: e.target.value })
              }
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium theme-text-primary mb-1">
              Category Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm theme-text-secondary
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary-dark"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-md"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setNewCategory({ name: "", description: "", image: null });
                setImagePreview(null);
                setSubmitError(null);
              }}
              className="px-4 py-2 border theme-border rounded-md shadow-sm text-sm font-medium theme-text-primary theme-bg-primary hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Category"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          if (!isSubmitting) {
            setShowEditModal(false);
            setEditCategory(null);
            setEditImagePreview(null);
            setSubmitError(null);
          }
        }}
        title="Edit Category"
      >
        {editCategory && (
          <form onSubmit={handleEditCategory} className="p-6">
            {submitError && (
              <Alert type="error" message={submitError} className="mb-4" />
            )}

            <div className="mb-4">
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium theme-text-primary mb-1"
              >
                Category Name *
              </label>
              <input
                type="text"
                id="edit-name"
                className="block w-full px-3 py-2 border theme-border rounded-md shadow-sm theme-bg-primary theme-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Enter category name"
                value={editCategory.name}
                onChange={(e) =>
                  setEditCategory({ ...editCategory, name: e.target.value })
                }
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium theme-text-primary mb-1"
              >
                Description
              </label>
              <textarea
                id="edit-description"
                rows="3"
                className="block w-full px-3 py-2 border theme-border rounded-md shadow-sm theme-bg-primary theme-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Enter category description"
                value={editCategory.description}
                onChange={(e) =>
                  setEditCategory({
                    ...editCategory,
                    description: e.target.value,
                  })
                }
              ></textarea>
            </div>

            <div className="mb-4">
              <label
                htmlFor="edit-image"
                className="block text-sm font-medium theme-text-primary mb-1"
              >
                Category Image
              </label>
              <input
                type="file"
                id="edit-image"
                accept="image/*"
                className="block w-full text-sm theme-text-secondary
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary-dark"
                onChange={handleEditImageChange}
              />
              {editImagePreview && (
                <div className="mt-2">
                  <img
                    src={editImagePreview}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditCategory(null);
                  setEditImagePreview(null);
                  setSubmitError(null);
                }}
                className="px-4 py-2 border theme-border rounded-md shadow-sm text-sm font-medium theme-text-primary theme-bg-primary hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Category"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Category"
      >
        <div className="p-6">
          <p className="theme-text-primary mb-4">
            Are you sure you want to delete{" "}
            <span className="font-semibold">
              {categoryToDelete && categoryToDelete.name
                ? categoryToDelete.name
                : "this category"}
            </span>
            ?
            {categoryToDelete &&
              categoryToDelete._id &&
              categoryProducts &&
              categoryProducts[categoryToDelete._id] > 0 && (
                <span className="text-red-600 dark:text-red-400 block mt-2">
                  This category has {categoryProducts[categoryToDelete._id]}{" "}
                  products. You must reassign or delete these products first.
                </span>
              )}
          </p>

          {deleteError && (
            <Alert type="error" message={deleteError} className="mb-4" />
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border theme-border rounded-md shadow-sm text-sm font-medium theme-text-primary theme-bg-primary hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={
                isDeleting ||
                !categoryToDelete ||
                !categoryToDelete._id ||
                (categoryProducts && categoryProducts[categoryToDelete._id] > 0)
              }
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default Categories;
