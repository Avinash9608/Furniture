import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { categoriesAPI, productsAPI } from "../../utils/api";
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await categoriesAPI.getAll();

        // Ensure we have a valid array of categories
        let categoriesData = [];

        // Handle different response structures
        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          categoriesData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data && response.data.data) {
          // If data.data is not an array but exists, convert to array
          categoriesData = [response.data.data];
        } else if (response.data) {
          // If data exists but not in expected format, try to use it
          categoriesData = [response.data];
        }

        console.log("Categories data:", categoriesData);
        setCategories(categoriesData);

        // Check if there's a warning about temporary categories
        if (response.data && response.data.warning) {
          setSuccessMessage(response.data.warning);
          setTimeout(() => {
            setSuccessMessage(null);
          }, 8000); // Show for 8 seconds
        }

        // If server fetch failed, show a message
        if (
          response.data &&
          response.data.error &&
          !response.data.fetchSucceeded
        ) {
          setError(
            `Server error: ${response.data.error}. Using locally stored categories.`
          );
        }

        // Fetch product counts for each category
        const productCounts = {};
        for (const category of categoriesData) {
          // Skip if category doesn't have a valid _id
          if (!category || !category._id) {
            console.warn("Invalid category object:", category);
            continue;
          }

          // For temporary categories, set product count to 0
          if (category.isTemporary) {
            productCounts[category._id] = 0;
            continue;
          }

          try {
            const productsResponse = await productsAPI.getAll({
              category: category._id,
              limit: 1,
            });
            productCounts[category._id] = productsResponse.data.count || 0;
          } catch (error) {
            console.error(
              `Error fetching products for category ${category._id}:`,
              error
            );
            productCounts[category._id] = 0;
          }
        }
        setCategoryProducts(productCounts);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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

      if (response.data) {
        newCategoryData = response.data;
      }

      // Ensure we have a valid category object
      if (newCategoryData && newCategoryData._id) {
        console.log("New category created:", newCategoryData);

        // Add the new category to the list
        setCategories([...categories, newCategoryData]);
        setCategoryProducts({
          ...categoryProducts,
          [newCategoryData._id]: 0,
        });

        // Reset form and close modal
        setNewCategory({ name: "", description: "", image: null });
        setImagePreview(null);
        setShowAddModal(false);

        // Show success message with warning if applicable
        if (response.isTemporary) {
          setSuccessMessage(
            `Category added with temporary data. It will be saved to the server when connection is restored.`
          );

          // Set a follow-up message after a delay
          setTimeout(() => {
            setSuccessMessage(
              "You can continue using this category normally. It will be automatically synced when server connection is available."
            );
          }, 5000);
        } else if (response.warning) {
          setSuccessMessage(`Category added successfully! ${response.warning}`);
        } else {
          setSuccessMessage("Category added successfully!");
        }

        setTimeout(() => setSuccessMessage(null), 10000);
      } else {
        console.error("Invalid category data received:", response);
        setSubmitError("Received invalid data from server. Please try again.");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      setSubmitError(
        error.response?.data?.message ||
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
      formData.append("description", editCategory.description);
      if (editCategory.newImage) {
        formData.append("image", editCategory.newImage);
      }

      const response = await categoriesAPI.update(editCategory._id, formData);

      setCategories(
        categories.map((cat) =>
          cat._id === editCategory._id ? response.data.data : cat
        )
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
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      // Check if category has products
      if (categoryProducts[categoryToDelete._id] > 0) {
        setDeleteError(
          `Cannot delete category because it has ${
            categoryProducts[categoryToDelete._id]
          } products. Please reassign or delete these products first.`
        );
        setIsDeleting(false);
        return;
      }

      await categoriesAPI.delete(categoryToDelete._id);

      setCategories(
        categories.filter((cat) => cat._id !== categoryToDelete._id)
      );

      setShowDeleteModal(false);
      setSuccessMessage("Category deleted successfully!");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting category:", error);
      setDeleteError(
        error.response?.data?.message ||
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
            {categories.map((category) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="theme-bg-secondary rounded-lg overflow-hidden shadow-sm border theme-border"
              >
                <div className="h-48 overflow-hidden">
                  {category.image ? (
                    <img
                      src={`${
                        import.meta.env.VITE_API_BASE_URL ||
                        "http://localhost:5000"
                      }${category.image}`}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/no-image.jpg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs theme-text-secondary">
                        No Image
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold theme-text-primary">
                          {category.name}
                        </h3>
                        {category.isTemporary && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                            Local
                          </span>
                        )}
                      </div>
                      <p className="text-sm theme-text-secondary mt-1">
                        {categoryProducts[category._id] || 0} products
                        {category.isTemporary && " • Not saved to server"}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(category)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        title="Edit category"
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
                        title="Delete category"
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
                    {category.description || "No description available."}
                  </p>
                  {category.isTemporary && (
                    <div className="mt-3 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded">
                      <p>
                        This category is stored locally and will be saved to the
                        server when connection is restored.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
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
              required
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
            <span className="font-semibold">{categoryToDelete?.name}</span>?
            {categoryProducts[categoryToDelete?._id] > 0 && (
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
                isDeleting || categoryProducts[categoryToDelete?._id] > 0
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
