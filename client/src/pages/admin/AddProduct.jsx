import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { productsAPI, categoriesAPI } from "../../utils/api";
import { adminProductsAPI, adminCategoriesAPI } from "../../utils/adminAPI";
import { saveLocalCategories } from "../../utils/defaultData";
import AdminLayout from "../../components/admin/AdminLayout";
import ProductForm from "../../components/admin/ProductForm";
import CategoryForm from "../../components/admin/CategoryForm";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Modal from "../../components/Modal";

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // State for category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [categorySuccess, setCategorySuccess] = useState(null);

  const navigate = useNavigate();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories from the API using authenticated admin API
        const response = await adminCategoriesAPI.getAll();
        console.log("Categories API response:", response);

        if (response && response.data) {
          let allCategories = [];

          // Check if response.data.data is an array (API returns {success, count, data})
          if (response.data.data && Array.isArray(response.data.data)) {
            allCategories = response.data.data;
          } else if (Array.isArray(response.data)) {
            // If response.data is directly an array
            allCategories = response.data;
          } else {
            console.error("Unexpected API response format:", response.data);
            setError("Failed to load categories. Invalid data format.");
            setLoading(false);
            return;
          }

          // Required categories that should be displayed
          const requiredCategoryNames = [
            "Sofa Beds",
            "Tables",
            "Chairs",
            "Wardrobes",
            "Beds",
          ];

          // Check if we have all required categories
          const existingCategoryNames = allCategories.map((cat) => cat.name);
          const missingCategories = requiredCategoryNames.filter(
            (name) => !existingCategoryNames.includes(name)
          );

          if (missingCategories.length > 0) {
            console.warn("Missing required categories:", missingCategories);

            // Create missing categories
            for (const categoryName of missingCategories) {
              try {
                console.log(`Creating missing category: ${categoryName}`);
                const newCategory = await adminCategoriesAPI.create({
                  name: categoryName,
                  description: `${categoryName} furniture items`,
                });

                if (newCategory && newCategory.data) {
                  const categoryData =
                    newCategory.data.data || newCategory.data;
                  allCategories.push(categoryData);
                  console.log(`Created category: ${categoryName}`);
                }
              } catch (err) {
                console.error(
                  `Failed to create category ${categoryName}:`,
                  err
                );
              }
            }
          }

          // Filter to only include the required categories
          const filteredCategories = allCategories.filter((category) =>
            requiredCategoryNames.includes(category.name)
          );

          console.log("Filtered categories:", filteredCategories);

          if (filteredCategories.length > 0) {
            setCategories(filteredCategories);
          } else {
            console.warn("No matching categories found. Using all categories.");
            setCategories(allCategories);
          }
        } else {
          console.error("No data received from API");
          setError("Failed to load categories. No data received.");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    // Set up global function to add a new category
    window.addCategory = () => setShowCategoryModal(true);

    // Clean up
    return () => {
      window.addCategory = undefined;
    };
  }, []);

  // Handle form submission
  const handleSubmit = async (productData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Create FormData object for file upload
      const formData = new FormData();

      // Add product data to FormData
      Object.keys(productData).forEach((key) => {
        if (key === "images") {
          // Handle images
          if (productData.images && productData.images.length > 0) {
            productData.images.forEach((image) => {
              if (image.file) {
                formData.append("images", image.file);
              }
            });
          } else {
            // If no images, set a flag for the server
            formData.append("defaultImage", "true");
          }
        } else if (key === "dimensions") {
          // Handle dimensions object
          formData.append("dimensions", JSON.stringify(productData.dimensions));
        } else {
          // Handle other fields
          formData.append(key, productData[key]);
        }
      });

      // Log the FormData contents for debugging
      console.log("FormData entries:");
      for (let pair of formData.entries()) {
        console.log(
          pair[0] + ": " + (pair[1] instanceof File ? pair[1].name : pair[1])
        );
      }

      console.log("Submitting product data to API...");
      console.log("Auth token in localStorage:", localStorage.getItem("token"));
      console.log("User in localStorage:", localStorage.getItem("user"));

      // Use the API client instead of direct axios
      console.log("Using API client to create product");

      // Log the FormData contents for debugging
      console.log("Final FormData entries before submission:");
      for (let pair of formData.entries()) {
        console.log(
          pair[0] +
            ": " +
            (pair[1] instanceof File
              ? pair[1].name + " (" + pair[1].type + ")"
              : pair[1])
        );
      }

      // Use the adminProductsAPI client which ensures authentication
      const response = await adminProductsAPI.create(formData);
      console.log("Product created successfully:", response);

      // Show success message with a slight delay to ensure UI updates
      setTimeout(() => {
        navigate("/admin/products", {
          state: {
            successMessage: "Product added successfully!",
          },
        });
      }, 500);
    } catch (error) {
      console.error("Error creating product:", error);
      setSubmitError(
        error.response?.data?.message ||
          "An error occurred while creating the product. Please try again."
      );

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Add Product">
      <div className="px-4 sm:px-6 py-4 sm:py-6 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary mb-4 sm:mb-6 text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Back to Products
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-gray-700">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
              Add New Product
            </h1>

            {error ? (
              <Alert
                type="error"
                message={error}
                onClose={() => setError(null)}
                className="text-sm sm:text-base"
              />
            ) : loading ? (
              <div className="flex justify-center py-6 sm:py-8">
                <Loading size="large" />
              </div>
            ) : (
              <>
                {/* Category success message */}
                {categorySuccess && (
                  <Alert
                    type="success"
                    message={categorySuccess}
                    onClose={() => setCategorySuccess(null)}
                    className="mb-3 sm:mb-4 text-sm sm:text-base"
                  />
                )}

                {/* Add category button if no categories */}
                {(!categories || categories.length === 0) && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <div className="flex items-start sm:items-center">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 dark:text-yellow-300 mr-2 mt-0.5 sm:mt-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-200 flex-1">
                        No categories found. You need to create at least one
                        category before adding products.
                      </p>
                    </div>
                    <div className="mt-3">
                      <Button
                        onClick={() => setShowCategoryModal(true)}
                        variant="secondary"
                        className="text-xs sm:text-sm w-full sm:w-auto"
                      >
                        Add New Category
                      </Button>
                    </div>
                  </div>
                )}

                <ProductForm
                  categories={categories}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                />
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Add New Category"
        size="md"
      >
        <CategoryForm
          onSubmit={async (categoryData) => {
            try {
              setIsSubmittingCategory(true);

              // Create new category with authenticated API
              const response = await adminCategoriesAPI.create(categoryData);

              // Add the new category to the list
              const newCategory = response.data.data || response.data;
              const updatedCategories = [...categories, newCategory];
              setCategories(updatedCategories);

              // Save to local storage
              saveLocalCategories(updatedCategories);

              // Get the category name from FormData if it's FormData
              const categoryName =
                categoryData instanceof FormData
                  ? categoryData.get("name")
                  : categoryData.name;

              // Show success message
              setCategorySuccess(
                `Category "${categoryName}" created successfully`
              );

              // Close modal
              setShowCategoryModal(false);
            } catch (error) {
              console.error("Error creating category:", error);
              setError("Failed to create category. Please try again.");
            } finally {
              setIsSubmittingCategory(false);
            }
          }}
          onCancel={() => setShowCategoryModal(false)}
          isSubmitting={isSubmittingCategory}
        />
      </Modal>
    </AdminLayout>
  );
};

export default AddProduct;
