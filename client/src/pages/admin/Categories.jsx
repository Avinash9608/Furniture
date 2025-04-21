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
        setCategories(response.data.data);

        // Fetch product counts for each category
        const productCounts = {};
        for (const category of response.data.data) {
          try {
            const productsResponse = await productsAPI.getAll({
              category: category._id,
              limit: 1,
            });
            productCounts[category._id] = productsResponse.data.count || 0;
          } catch (error) {
            console.error(`Error fetching products for category ${category._id}:`, error);
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
    
    // Validate form
    if (!newCategory.name) {
      setSubmitError("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Create FormData for image upload
      const formData = new FormData();
      formData.append("name", newCategory.name);
      formData.append("description", newCategory.description);
      if (newCategory.image) {
        formData.append("image", newCategory.image);
      }

      // Send request to create category
      const response = await categoriesAPI.create(formData);
      
      // Add new category to state
      setCategories([...categories, response.data.data]);
      setCategoryProducts({
        ...categoryProducts,
        [response.data.data._id]: 0,
      });

      // Reset form and close modal
      setNewCategory({ name: "", description: "", image: null });
      setImagePreview(null);
      setShowAddModal(false);
      
      // Show success message
      setSuccessMessage("Category added successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
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
    
    // Validate form
    if (!editCategory.name) {
      setSubmitError("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Create FormData for image upload
      const formData = new FormData();
      formData.append("name", editCategory.name);
      formData.append("description", editCategory.description);
      if (editCategory.newImage) {
        formData.append("image", editCategory.newImage);
      }

      // Send request to update category
      const response = await categoriesAPI.update(editCategory._id, formData);
      
      // Update category in state
      setCategories(
        categories.map((cat) =>
          cat._id === editCategory._id ? response.data.data : cat
        )
      );

      // Reset form and close modal
      setEditCategory(null);
      setEditImagePreview(null);
      setShowEditModal(false);
      
      // Show success message
      setSuccessMessage("Category updated successfully!");
      
      // Clear success message after 3 seconds
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

      // Send request to delete category
      await categoriesAPI.delete(categoryToDelete._id);
      
      // Remove category from state
      setCategories(categories.filter((cat) => cat._id !== categoryToDelete._id));
      
      // Close modal and show success message
      setShowDeleteModal(false);
      setSuccessMessage("Category deleted successfully!");
      
      // Clear success message after 3 seconds
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
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
      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loading size="large" />
          </div>
        ) : error ? (
          <Alert type="error" message={error} />
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
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
                className="bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {categoryProducts[category._id] || 0} products
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(category)}
                        className="text-indigo-600 hover:text-indigo-900"
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
                        className="text-red-600 hover:text-red-900"
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
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {category.description || "No description available."}
                  </p>
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
          setShowAddModal(false);
          setNewCategory({ name: "", description: "", image: null });
          setImagePreview(null);
          setSubmitError(null);
        }}
        title="Add Category"
      >
        <form onSubmit={handleAddCategory} className="p-6">
          {submitError && (
            <Alert
              type="error"
              message={submitError}
              className="mb-4"
            />
          )}

          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              rows="3"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Enter category description"
              value={newCategory.description}
              onChange={(e) =>
                setNewCategory({ ...newCategory, description: e.target.value })
              }
            ></textarea>
          </div>

          <div className="mb-4">
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
          setShowEditModal(false);
          setEditCategory(null);
          setEditImagePreview(null);
          setSubmitError(null);
        }}
        title="Edit Category"
      >
        {editCategory && (
          <form onSubmit={handleEditCategory} className="p-6">
            {submitError && (
              <Alert
                type="error"
                message={submitError}
                className="mb-4"
              />
            )}

            <div className="mb-4">
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category Name *
              </label>
              <input
                type="text"
                id="edit-name"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="edit-description"
                rows="3"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category Image
              </label>
              <input
                type="file"
                id="edit-image"
                accept="image/*"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
        onClose={() => setShowDeleteModal(false)}
        title="Delete Category"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{categoryToDelete?.name}</span>?
            {categoryProducts[categoryToDelete?._id] > 0 && (
              <span className="text-red-600 block mt-2">
                This category has {categoryProducts[categoryToDelete._id]}{" "}
                products. You must reassign or delete these products first.
              </span>
            )}
          </p>

          {deleteError && (
            <Alert
              type="error"
              message={deleteError}
              className="mb-4"
            />
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isDeleting || categoryProducts[categoryToDelete?._id] > 0}
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
