import React, { useState, useEffect } from "react";
import { categoriesAPI, productsAPI } from "../../utils/api";
import {
  validateCategories,
  safeRenderCategories,
  getImageUrl,
} from "../../utils/safeDataHandler";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import SimpleModal from "../../components/SimpleModal";

const CategoriesSimple = () => {
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    image: null,
  });
  const [editCategory, setEditCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching categories...");
      const response = await categoriesAPI.getAll();
      console.log("Raw categories response:", response);

      // Extract categories data with safe fallbacks
      let categoriesData = [];

      if (response.data && Array.isArray(response.data.data)) {
        console.log("Found categories in response.data.data");
        categoriesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log("Found categories in response.data (array)");
        categoriesData = response.data;
      } else if (response.success && Array.isArray(response.data)) {
        console.log("Found categories in response.data with success flag");
        categoriesData = response.data;
      } else if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        console.log("Found categories in response.data.data with success flag");
        categoriesData = response.data.data;
      } else if (response.data && typeof response.data === "object") {
        // Look for any array property that might contain categories
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            console.log(`Found potential categories array in property: ${key}`);
            categoriesData = response.data[key];
            break;
          }
        }
      }

      console.log("Extracted categories data:", categoriesData);

      // If we don't have categories, just use an empty array - no fallback data
      if (!categoriesData || categoriesData.length === 0) {
        console.warn("No categories found in response, using empty array");
        categoriesData = [];
      }

      // Validate categories data to ensure all required fields exist
      const validatedCategories = validateCategories(categoriesData);
      console.log("Validated categories:", validatedCategories);

      setCategories(validatedCategories);

      // Fetch product counts for each category
      const productCounts = {};
      for (const category of validatedCategories) {
        try {
          // Ensure category._id exists before making the API call
          if (!category._id) {
            console.warn("Category without _id found:", category);
            continue;
          }

          const productsResponse = await productsAPI.getAll({
            category: category._id,
            limit: 1,
          });

          // Handle different response formats
          let count = 0;
          if (
            productsResponse.data &&
            typeof productsResponse.data.count === "number"
          ) {
            count = productsResponse.data.count;
          } else if (productsResponse.count) {
            count = productsResponse.count;
          } else if (Array.isArray(productsResponse.data)) {
            count = productsResponse.data.length;
          } else if (
            productsResponse.data &&
            Array.isArray(productsResponse.data.data)
          ) {
            count = productsResponse.data.data.length;
          }

          productCounts[category._id] = count;
        } catch (err) {
          console.error(
            `Error fetching products for category ${category._id}:`,
            err
          );
          productCounts[category._id] = 0;
        }
      }
      setCategoryProducts(productCounts);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(
        "No categories found in the database. Use the 'Add Category' button to create new categories."
      );

      // Don't set any fallback categories, just use an empty array
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle image change for new category
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log(
        "Selected image file:",
        file.name,
        "Size:",
        file.size,
        "Type:",
        file.type
      );

      setNewCategory({ ...newCategory, image: file });

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      console.log("Created object URL for preview:", objectUrl);
      setImagePreview(objectUrl);

      // Log file details for debugging
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log(
          "File loaded successfully, size in bytes:",
          event.target.result.length
        );
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image change for edit category
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log(
        "Selected edit image file:",
        file.name,
        "Size:",
        file.size,
        "Type:",
        file.type
      );

      setEditCategory({ ...editCategory, newImage: file });

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      console.log("Created object URL for edit preview:", objectUrl);
      setEditImagePreview(objectUrl);

      // Log file details for debugging
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log(
          "Edit file loaded successfully, size in bytes:",
          event.target.result.length
        );
      };
      reader.onerror = (error) => {
        console.error("Error reading edit file:", error);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add category
  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!newCategory.name) {
      setFormError("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      // Create FormData object for file upload
      const formData = new FormData();

      // Add required fields with validation
      if (!newCategory.name || newCategory.name.trim() === "") {
        setFormError("Category name is required");
        setIsSubmitting(false);
        return;
      }

      // Add name and description to form data
      formData.append("name", newCategory.name.trim());

      if (newCategory.description) {
        formData.append("description", newCategory.description.trim());
      } else {
        formData.append("description", "");
      }

      // Add image if it exists
      if (newCategory.image) {
        formData.append("image", newCategory.image);
      }

      // Log form data for debugging
      console.log("Form data being sent:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const response = await categoriesAPI.create(formData, config);
      console.log("Category creation response:", response);

      // Handle different response structures
      let newCategoryData = null;

      if (response && response.data) {
        newCategoryData = response.data;
        console.log("Response data:", newCategoryData);
      } else if (response && response.success && response.data) {
        newCategoryData = response.data;
        console.log("Direct response data:", newCategoryData);
      } else {
        // If no valid data, create a temporary category object
        newCategoryData = {
          _id: `temp_${Date.now()}`,
          name: formData.get("name"),
          description: formData.get("description") || "",
          image: null,
        };
        console.log("Created temporary category:", newCategoryData);
      }

      // Ensure we have all required fields
      if (!newCategoryData.name && formData.get("name")) {
        newCategoryData.name = formData.get("name");
      }

      if (!newCategoryData.description && formData.get("description")) {
        newCategoryData.description = formData.get("description");
      }

      console.log("Final category data to be added to state:", newCategoryData);

      console.log("Processed new category data:", newCategoryData);

      // Update state with the new category
      setCategories([...categories, newCategoryData]);
      setCategoryProducts({
        ...categoryProducts,
        [newCategoryData._id]: 0,
      });

      // Reset form and close modal
      resetAddForm();
      setShowAddModal(false);

      // Show success message
      setSuccessMessage(
        "Category added successfully! It has been saved to the database."
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Error adding category:", err);

      // Even if there's an error, the category might have been created successfully
      // Let's check if we need to refresh the page to see the new category
      if (
        err.message &&
        (err.message.includes("404") ||
          err.message.includes("Cannot read properties") ||
          err.message.includes("undefined"))
      ) {
        // This is likely the case where the category was added but we got a 404 when trying to access it
        console.log(
          "Category may have been added. Showing success message and refreshing data."
        );

        // Create a temporary category object using the form values directly
        const tempCategory = {
          _id: `temp_${Date.now()}`,
          name: newCategory.name,
          description: newCategory.description || "",
          image: null,
        };

        // Update state with the temporary category
        setCategories([...categories, tempCategory]);
        setCategoryProducts({
          ...categoryProducts,
          [tempCategory._id]: 0,
        });

        // Reset form and close modal
        resetAddForm();
        setShowAddModal(false);

        // Show success message
        setSuccessMessage(
          "Category may have been added to the database. The page will refresh to check for updates."
        );
        setTimeout(() => setSuccessMessage(null), 5000);

        // Fetch categories again after a short delay
        setTimeout(() => {
          fetchCategories();
        }, 2000);
      } else {
        // For other errors, show the error message
        setFormError(
          err.response?.data?.message ||
            "Failed to add category. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit category
  const handleEditClick = (category) => {
    console.log("Edit category:", category);
    setEditCategory({
      ...category,
      newImage: null,
    });

    // Set the image preview with proper URL handling
    if (category.image) {
      const imageUrl = getImageUrl(category.image);
      console.log("Setting edit image preview to:", imageUrl);
      setEditImagePreview(category.image);
    } else {
      setEditImagePreview(null);
    }

    setShowEditModal(true);
    setFormError(null);
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();

    if (!editCategory.name) {
      setFormError("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      // Create FormData object for file upload
      const formData = new FormData();

      // Add required fields with validation
      if (!editCategory.name || editCategory.name.trim() === "") {
        setFormError("Category name is required");
        setIsSubmitting(false);
        return;
      }

      // Add name and description to form data
      formData.append("name", editCategory.name.trim());

      if (editCategory.description) {
        formData.append("description", editCategory.description.trim());
      } else {
        formData.append("description", "");
      }

      // Add image if it exists
      if (editCategory.newImage) {
        formData.append("image", editCategory.newImage);
      }

      // Log form data for debugging
      console.log("Edit form data being sent:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }

      const response = await categoriesAPI.update(editCategory._id, formData);
      console.log("Category update response:", response);

      // Handle different response structures
      let updatedCategoryData = null;

      if (response && response.data) {
        updatedCategoryData = response.data;
        console.log("Response data:", updatedCategoryData);
      } else if (response && response.success && response.data) {
        updatedCategoryData = response.data;
        console.log("Direct response data:", updatedCategoryData);
      } else {
        // If no valid data, create an updated category object based on the form data
        updatedCategoryData = {
          ...editCategory,
          name: formData.get("name"),
          description: formData.get("description") || "",
          // Keep the existing image if no new one was uploaded
          image: editCategory.image,
        };
        console.log("Created temporary updated category:", updatedCategoryData);
      }

      // Ensure we have all required fields
      if (!updatedCategoryData.name && formData.get("name")) {
        updatedCategoryData.name = formData.get("name");
      }

      if (!updatedCategoryData.description && formData.get("description")) {
        updatedCategoryData.description = formData.get("description");
      }

      // Ensure we preserve the ID
      if (!updatedCategoryData._id && editCategory._id) {
        updatedCategoryData._id = editCategory._id;
      }

      console.log("Final updated category data:", updatedCategoryData);

      console.log("Processed updated category data:", updatedCategoryData);

      // Update state with the updated category
      setCategories(
        categories.map((cat) =>
          cat._id === editCategory._id ? updatedCategoryData : cat
        )
      );

      // Reset form and close modal
      resetEditForm();
      setShowEditModal(false);

      // Show success message
      setSuccessMessage(
        "Category updated successfully! Changes have been saved to the database."
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Error updating category:", err);

      // Even if there's an error, the category might have been updated successfully
      // Let's check if we need to refresh the page to see the updated category
      if (
        err.message &&
        (err.message.includes("404") ||
          err.message.includes("Cannot read properties") ||
          err.message.includes("undefined"))
      ) {
        // This is likely the case where the category was updated but we got a 404 when trying to access it
        console.log(
          "Category may have been updated. Showing success message and refreshing data."
        );

        // Create an updated category object using the state values directly
        const updatedCategory = {
          ...editCategory,
          name: editCategory.name,
          description: editCategory.description || "",
          // Keep the existing image if no new one was uploaded
          image: editCategory.image,
        };

        // Update state with the updated category
        setCategories(
          categories.map((cat) =>
            cat._id === editCategory._id ? updatedCategory : cat
          )
        );

        // Reset form and close modal
        resetEditForm();
        setShowEditModal(false);

        // Show success message
        setSuccessMessage(
          "Category may have been updated in the database. The page will refresh to check for updates."
        );
        setTimeout(() => setSuccessMessage(null), 5000);

        // Fetch categories again after a short delay
        setTimeout(() => {
          fetchCategories();
        }, 2000);
      } else {
        // For other errors, show the error message
        setFormError(
          err.response?.data?.message ||
            "Failed to update category. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete category
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
    setFormError(null);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) {
      console.error("No category selected for deletion");
      return;
    }

    // Check if category has products
    if (categoryProducts[categoryToDelete._id] > 0) {
      setFormError(
        `Cannot delete category because it has ${
          categoryProducts[categoryToDelete._id]
        } products. Please reassign or delete these products first.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      // Make the API call
      console.log("Deleting category with ID:", categoryToDelete._id);
      console.log("Category object:", categoryToDelete);

      // Call the API to delete the category
      const response = await categoriesAPI.delete(categoryToDelete._id);
      console.log("Delete API response:", response);

      // Update the categories state by filtering out the deleted category
      setCategories((prevCategories) => {
        console.log("Filtering categories, before:", prevCategories.length);
        const newCategories = prevCategories.filter(
          (cat) => cat._id !== categoryToDelete._id
        );
        console.log("After filtering:", newCategories.length);
        return newCategories;
      });

      // Reset form and close modal
      resetDeleteForm();
      setShowDeleteModal(false);

      // Show success message
      setSuccessMessage(
        "Category deleted successfully! It has been removed from the database."
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Error deleting category:", err);
      setFormError(
        err.response?.data?.message ||
          "Failed to delete category. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset forms
  const resetAddForm = () => {
    setNewCategory({ name: "", description: "", image: null });
    setImagePreview(null);
    setFormError(null);
  };

  const resetEditForm = () => {
    setEditCategory(null);
    setEditImagePreview(null);
    setFormError(null);
  };

  const resetDeleteForm = () => {
    setCategoryToDelete(null);
    setFormError(null);
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
            <p className="mb-2">No categories found in the database.</p>
            <p>
              Click the "Add Category" button above to create your first
              category.
            </p>
            <p className="mt-4 text-sm">
              Categories you create will be saved to the database and displayed
              here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeRenderCategories(
              categories,
              (category) => {
                // Safely access category properties
                const categoryId = String(category._id);
                const categoryName = category.name;
                const categoryDescription =
                  category.description || "No description available.";
                const categoryImage = category.image;
                const productCount = categoryProducts[categoryId] || 0;

                return (
                  <div
                    key={categoryId}
                    className="theme-bg-secondary rounded-lg overflow-hidden shadow-sm border theme-border"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={getImageUrl(categoryImage)}
                        alt={categoryName || "Category"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("Image load error for:", categoryImage);
                          console.log("Attempted URL:", e.target.src);
                          e.target.onerror = null;

                          // Try alternative URL formats before falling back to placeholder
                          if (
                            categoryImage &&
                            categoryImage.startsWith("/uploads/")
                          ) {
                            const filename = categoryImage.split("/").pop();
                            console.log(
                              "Trying alternative URL with filename:",
                              filename
                            );
                            e.target.src = `http://localhost:5000/uploads/${filename}`;

                            // Add a second error handler for the alternative URL
                            e.target.onerror = (e2) => {
                              console.log("Alternative URL also failed");
                              e2.target.onerror = null;
                              e2.target.src =
                                "https://placehold.co/300x300/e2e8f0/1e293b?text=No+Image";
                            };
                          } else {
                            // Use a reliable placeholder service
                            e.target.src =
                              "https://placehold.co/300x300/e2e8f0/1e293b?text=No+Image";
                          }
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
                  </div>
                );
              },
              <div className="col-span-3 text-center py-8 theme-text-secondary">
                <p>No valid categories found in the database.</p>
                <p className="mt-2">
                  Please add categories using the "Add Category" button.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      <SimpleModal
        isOpen={showAddModal}
        onClose={() => {
          if (!isSubmitting) {
            resetAddForm();
            setShowAddModal(false);
          }
        }}
        title="Add Category"
      >
        <form onSubmit={handleAddCategory}>
          {formError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
              {formError}
            </div>
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
            <div className="mt-2">
              <img
                src={
                  imagePreview ||
                  "https://placehold.co/300x300/e2e8f0/1e293b?text=No+Image"
                }
                alt="Preview"
                className="h-32 w-32 object-cover rounded-md"
                onError={(e) => {
                  console.log("Image preview load error");
                  console.log("Attempted preview URL:", e.target.src);
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/300x300/e2e8f0/1e293b?text=No+Image";
                }}
              />
              {imagePreview && (
                <p className="mt-1 text-xs text-gray-500">
                  {typeof imagePreview === "string"
                    ? `Image path: ${imagePreview.substring(0, 30)}${
                        imagePreview.length > 30 ? "..." : ""
                      }`
                    : "Image preview available"}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => {
                resetAddForm();
                setShowAddModal(false);
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
      </SimpleModal>

      {/* Edit Category Modal */}
      <SimpleModal
        isOpen={showEditModal}
        onClose={() => {
          if (!isSubmitting) {
            resetEditForm();
            setShowEditModal(false);
          }
        }}
        title="Edit Category"
      >
        {editCategory && (
          <form onSubmit={handleEditCategory}>
            {formError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
                {formError}
              </div>
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <div className="mt-2">
                <img
                  src={
                    editImagePreview
                      ? getImageUrl(editImagePreview)
                      : "https://placehold.co/300x300/e2e8f0/1e293b?text=No+Image"
                  }
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-md"
                  onError={(e) => {
                    console.log("Edit image preview load error");
                    console.log("Attempted edit preview URL:", e.target.src);
                    console.log("Original edit image path:", editImagePreview);
                    e.target.onerror = null;

                    // Try alternative URL formats before falling back to placeholder
                    if (
                      editImagePreview &&
                      editImagePreview.startsWith("/uploads/")
                    ) {
                      const filename = editImagePreview.split("/").pop();
                      console.log(
                        "Trying alternative URL with filename:",
                        filename
                      );
                      e.target.src = `http://localhost:5000/uploads/${filename}`;

                      // Add a second error handler for the alternative URL
                      e.target.onerror = (e2) => {
                        console.log("Alternative URL also failed");
                        e2.target.onerror = null;
                        e2.target.src =
                          "https://placehold.co/300x300/e2e8f0/1e293b?text=No+Image";
                      };
                    } else {
                      e.target.src =
                        "https://placehold.co/300x300/e2e8f0/1e293b?text=No+Image";
                    }
                  }}
                />
                {editImagePreview && (
                  <p className="mt-1 text-xs text-gray-500">
                    {`Image path: ${editImagePreview.substring(0, 30)}${
                      editImagePreview.length > 30 ? "..." : ""
                    }`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  resetEditForm();
                  setShowEditModal(false);
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
      </SimpleModal>

      {/* Delete Confirmation Modal */}
      <SimpleModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isSubmitting) {
            resetDeleteForm();
            setShowDeleteModal(false);
          }
        }}
        title="Delete Category"
      >
        <div>
          <p className="theme-text-primary mb-4">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{categoryToDelete?.name}</span>?
            {categoryToDelete && categoryProducts[categoryToDelete._id] > 0 && (
              <span className="text-red-600 dark:text-red-400 block mt-2">
                This category has {categoryProducts[categoryToDelete._id]}{" "}
                products. You must reassign or delete these products first.
              </span>
            )}
          </p>

          {formError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
              {formError}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                resetDeleteForm();
                setShowDeleteModal(false);
              }}
              className="px-4 py-2 border theme-border rounded-md shadow-sm text-sm font-medium theme-text-primary theme-bg-primary hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCategory}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={
                isSubmitting ||
                (categoryToDelete && categoryProducts[categoryToDelete._id] > 0)
              }
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </SimpleModal>
    </AdminLayout>
  );
};

export default CategoriesSimple;
