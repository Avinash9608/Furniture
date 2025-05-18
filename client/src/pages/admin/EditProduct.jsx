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

        // Get the hostname for environment detection
        const hostname = window.location.hostname;
        const isProduction =
          hostname.includes("render.com") ||
          hostname === "furniture-q3nb.onrender.com";

        console.log(
          "Environment:",
          isProduction ? "Production" : "Development"
        );
        console.log("Fetching product with ID:", id);

        // Fetch product details with retry logic
        let productResponse = null;
        let fetchError = null;
        let retryCount = 0;
        const maxRetries = isProduction ? 3 : 1;

        while (retryCount <= maxRetries) {
          try {
            console.log(
              `Attempt ${retryCount + 1}/${maxRetries + 1} to fetch product`
            );
            productResponse = await productsAPI.getById(id);

            if (productResponse && productResponse.data) {
              console.log(
                "Product fetch successful on attempt",
                retryCount + 1
              );
              break;
            }
          } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            fetchError = error;

            // Wait before retrying in production
            if (isProduction && retryCount < maxRetries) {
              const delay = (retryCount + 1) * 1000; // Increasing delay
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
          retryCount++;
        }

        // If all retries failed and we're in production, try a direct fetch as last resort
        if (!productResponse && isProduction) {
          try {
            console.log("All API attempts failed, trying direct fetch...");
            const directUrl = `${
              window.location.origin
            }/api/direct-product/${id}?_t=${Date.now()}`;

            const directResponse = await fetch(directUrl, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Cache-Control": "no-cache",
              },
            });

            if (directResponse.ok) {
              const data = await directResponse.json();
              console.log("Direct fetch successful:", data);

              productResponse = {
                data: {
                  success: true,
                  data: data.data || data,
                },
              };
            }
          } catch (directError) {
            console.error("Direct fetch failed:", directError);
          }
        }

        console.log("Final product response:", productResponse);

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

        // Ensure product has all required fields
        if (!productData.name || !productData.price) {
          console.error("Product data missing required fields:", productData);
          throw new Error("Product data is incomplete");
        }

        // Ensure product has images array
        if (!productData.images || !Array.isArray(productData.images)) {
          console.log("Adding empty images array to product");
          productData.images = [];
        }

        setProduct(productData);

        // Fetch categories with retry logic
        let categoriesResponse = null;
        retryCount = 0;

        while (retryCount <= maxRetries) {
          try {
            console.log(
              `Attempt ${retryCount + 1}/${maxRetries + 1} to fetch categories`
            );
            categoriesResponse = await categoriesAPI.getAll();

            if (categoriesResponse && categoriesResponse.data) {
              console.log(
                "Categories fetch successful on attempt",
                retryCount + 1
              );
              break;
            }
          } catch (error) {
            console.error(
              `Categories attempt ${retryCount + 1} failed:`,
              error
            );

            // Wait before retrying in production
            if (isProduction && retryCount < maxRetries) {
              const delay = (retryCount + 1) * 1000; // Increasing delay
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
          retryCount++;
        }

        // If we have categories response, process it
        if (categoriesResponse && categoriesResponse.data) {
          const categoriesData =
            categoriesResponse.data.data || categoriesResponse.data;
          console.log("Fetched categories:", categoriesData);
          setCategories(categoriesData);
        } else {
          // Use default categories as fallback
          console.log("Using default categories as fallback");
          setCategories([
            { _id: "680c9481ab11e96a288ef6d9", name: "Sofa Beds" },
            { _id: "680c9484ab11e96a288ef6da", name: "Tables" },
            { _id: "680c9486ab11e96a288ef6db", name: "Chairs" },
            { _id: "680c9489ab11e96a288ef6dc", name: "Wardrobes" },
            { _id: "680c948eab11e96a288ef6dd", name: "Beds" },
          ]);
        }
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

      // Get the hostname for environment detection
      const hostname = window.location.hostname;
      const isProduction =
        hostname.includes("render.com") ||
        hostname === "furniture-q3nb.onrender.com";

      console.log("Environment:", isProduction ? "Production" : "Development");

      // Log the form data for debugging
      console.log("Form data contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ":", pair[1]);
      }

      // Add a cache-busting parameter
      formData.append("_t", Date.now());

      // Add retry logic for production
      let response = null;
      let lastError = null;
      let retryCount = 0;
      const maxRetries = isProduction ? 3 : 1;

      while (retryCount <= maxRetries) {
        try {
          console.log(
            `Attempt ${retryCount + 1}/${maxRetries + 1} to update product`
          );

          // Create a new FormData for each attempt to avoid issues
          const attemptFormData = new FormData();
          for (let pair of formData.entries()) {
            attemptFormData.append(pair[0], pair[1]);
          }

          // Send the update request
          response = await productsAPI.update(id, attemptFormData);
          console.log(
            `Update response for attempt ${retryCount + 1}:`,
            response
          );

          // Check if response has the expected structure
          if (response && response.data && response.data.success !== false) {
            console.log("Update successful on attempt", retryCount + 1);
            break;
          } else {
            console.warn("Invalid response:", response);
            throw new Error(
              response?.data?.message || "Invalid response from server"
            );
          }
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          lastError = error;

          // Wait before retrying in production
          if (isProduction && retryCount < maxRetries) {
            const delay = (retryCount + 1) * 2000; // Increasing delay
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
        retryCount++;
      }

      // If all retries failed and we're in production, try a direct fetch as last resort
      if (!response && isProduction) {
        try {
          console.log("All API attempts failed, trying direct fetch...");

          // Create a new FormData object for the fetch API
          const fetchFormData = new FormData();
          for (let pair of formData.entries()) {
            fetchFormData.append(pair[0], pair[1]);
          }

          const directUrl = `${
            window.location.origin
          }/api/fallback/products/${id}?_t=${Date.now()}`;
          console.log("Direct URL:", directUrl);

          const directResponse = await fetch(directUrl, {
            method: "PUT",
            body: fetchFormData,
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-cache",
            },
          });

          if (directResponse.ok) {
            const data = await directResponse.json();
            console.log("Direct fetch successful:", data);

            response = {
              data: {
                success: true,
                data: data.data || data,
              },
            };
          } else {
            throw new Error(
              `Direct fetch failed with status: ${directResponse.status}`
            );
          }
        } catch (directError) {
          console.error("Direct fetch failed:", directError);
          lastError = directError;
        }
      }

      // If we have a valid response, show success
      if (response && response.data && response.data.success !== false) {
        console.log("Product updated successfully!");

        // Show success message and redirect
        navigate("/admin/products", {
          state: { successMessage: "Product updated successfully!" },
        });
      } else {
        // If all attempts failed, throw the last error
        throw (
          lastError ||
          new Error("Failed to update product after multiple attempts")
        );
      }
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
