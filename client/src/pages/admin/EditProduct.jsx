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
        console.log("Fetching product with ID:", id);
        const productResponse = await productsAPI.getById(id);

        console.log("Product response:", productResponse);

        if (!productResponse || !productResponse.data) {
          console.error("Invalid product response:", productResponse);
          throw new Error("Product not found or invalid response format");
        }

        // Handle different response formats
        let productData;
        if (productResponse.data.data) {
          // If response has nested data property
          productData = productResponse.data.data;
        } else if (
          productResponse.data.success === true &&
          productResponse.data.data === undefined
        ) {
          // If response has success flag but no data property
          productData = productResponse.data;
        } else {
          // Direct data object
          productData = productResponse.data;
        }

        console.log("Processed product data:", productData);

        if (
          !productData ||
          (typeof productData === "object" &&
            Object.keys(productData).length === 0)
        ) {
          console.error("Empty product data");
          throw new Error("Product data is empty");
        }

        setProduct(productData);

        // Fetch categories
        const categoriesResponse = await categoriesAPI.getAll();
        const categoriesData =
          categoriesResponse.data.data || categoriesResponse.data;
        console.log("Fetched categories:", categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error.response?.data?.message || "Failed to load product data"
        );
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

      console.log("Raw form data:", formData);

      // Validate that we received FormData
      if (!(formData instanceof FormData)) {
        throw new Error("Invalid form data format");
      }

      // Log the form data for debugging
      console.log("Form data contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ":", pair[1]);
      }

      // Send the update request
      const response = await productsAPI.update(id, formData);
      console.log("Update response:", response);

      // Check if response has the expected structure
      if (!response || !response.data || response.data.success === false) {
        const errorMessage =
          response?.data?.message || "Failed to update product";
        console.error("Update failed:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("Product updated successfully!");

      // Show success message and redirect
      navigate("/admin/products", {
        state: { successMessage: "Product updated successfully!" },
      });
    } catch (error) {
      console.error("Error updating product:", error);
      setSubmitError(error.message || "Failed to update product");
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
        <div className="space-y-4">
          <Alert type="error" message={error} />
          <Button onClick={() => navigate("/admin/products")}>
            Back to Products
          </Button>
        </div>
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

      {submitError && (
        <Alert
          type="error"
          message={submitError}
          className="mb-4"
          onClose={() => setSubmitError(null)}
        />
      )}

      <ProductForm
        initialData={product}
        categories={categories}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        mode="edit"
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
