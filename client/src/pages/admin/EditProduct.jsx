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

        // Process categories to ensure they have all required fields
        fetchedCategories = fetchedCategories.map(category => ({
          ...category,
          _id: category._id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: category.name || "Unnamed Category",
          description: category.description || ""
        }));

        console.log("Processed categories:", fetchedCategories);
        setCategories(fetchedCategories);

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load product or categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await productsAPI.update(id, formData);

      navigate("/admin/products", {
        state: { successMessage: "Product updated successfully!" },
      });
    } catch (error) {
      console.error("Error updating product:", error);
      setSubmitError(
        error.response?.data?.message || "Failed to update product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex justify-center items-center h-64">
          <Loading size="large" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Edit Product">
        <Alert type="error" message={error} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Product">
      {categorySuccess && (
        <Alert
          type="success"
          message={categorySuccess}
          onClose={() => setCategorySuccess(null)}
          className="mb-4"
        />
      )}

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold theme-text-primary">Edit Product</h1>
        <Button onClick={() => setShowCategoryModal(true)}>
          Add New Category
        </Button>
      </div>

      <ProductForm
        initialData={product}
        categories={categories}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />

      {/* Add Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => !isSubmittingCategory && setShowCategoryModal(false)}
        title="Add New Category"
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
