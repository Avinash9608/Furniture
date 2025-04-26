import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { productsAPI, categoriesAPI } from "../../utils/api";
import {
  createDefaultCategories,
  saveLocalCategories,
} from "../../utils/defaultData";
import AdminLayout from "../../components/admin/AdminLayout";
import ProductForm from "../../components/admin/ProductForm";
import CategoryForm from "../../components/admin/CategoryForm";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Modal from "../../components/Modal";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // State for category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [categorySuccess, setCategorySuccess] = useState(null);

  // Fetch product and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product details
        const productResponse = await productsAPI.getById(id);
        setProduct(productResponse.data.data);

        // Fetch categories
        const categoriesResponse = await categoriesAPI.getAll();
        console.log("Categories API response:", categoriesResponse);

        // Check if we have categories data and it's in the expected format
        let fetchedCategories = [];
        if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
          fetchedCategories = categoriesResponse.data;
        } else if (
          categoriesResponse.data &&
          categoriesResponse.data.data &&
          Array.isArray(categoriesResponse.data.data)
        ) {
          fetchedCategories = categoriesResponse.data.data;
        } else {
          console.error(
            "Unexpected categories data format:",
            categoriesResponse.data
          );
        }

        // If no categories exist, create default ones
        if (fetchedCategories.length === 0) {
          console.log("No categories found, creating default categories...");
          const createCategory = async (categoryData) => {
            return await categoriesAPI.create(categoryData);
          };

          fetchedCategories = await createDefaultCategories(createCategory);
        }

        // Filter out test categories and only keep the specific ones we want
        const validCategoryNames = [
          "Sofa Beds",
          "Tables",
          "Chairs",
          "Wardrobes",
        ];
        fetchedCategories = fetchedCategories.filter((category) =>
          validCategoryNames.includes(category.name)
        );

        console.log("Filtered categories for edit product:", fetchedCategories);

        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up global function to add a new category
    window.addCategory = () => setShowCategoryModal(true);

    // Clean up
    return () => {
      window.addCategory = undefined;
    };
  }, [id]);

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
          productData.images.forEach((image) => {
            if (image.file) {
              // New image file
              formData.append("images", image.file);
            } else if (typeof image === "string") {
              // Existing image URL
              formData.append("existingImages", image);
            }
          });
        } else if (key === "dimensions") {
          // Handle dimensions object
          formData.append("dimensions", JSON.stringify(productData.dimensions));
        } else {
          // Handle other fields
          formData.append(key, productData[key]);
        }
      });

      // Send request to update product
      const response = await productsAPI.update(id, formData);
      console.log("Product updated successfully:", response);

      // Redirect to products page with a slight delay to ensure UI updates
      setTimeout(() => {
        navigate("/admin/products", {
          state: {
            successMessage: "Product updated successfully!",
          },
        });
      }, 500);
    } catch (error) {
      console.error("Error updating product:", error);
      setSubmitError(
        error.response?.data?.message ||
          "Failed to update product. Please try again."
      );

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Edit Product">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center text-gray-600 hover:text-primary mb-6"
        >
          <svg
            className="w-5 h-5 mr-1"
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">
            Edit Product: {product?.name || ""}
          </h1>

          {error ? (
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          ) : loading ? (
            <div className="flex justify-center py-8">
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
                  className="mb-4"
                />
              )}

              <ProductForm
                initialData={product}
                categories={categories}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            </>
          )}
        </div>
      </motion.div>

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

              // Create new category
              const response = await categoriesAPI.create(categoryData);

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

export default EditProduct;
