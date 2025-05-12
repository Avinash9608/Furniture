import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { productsAPI } from "../../utils/api";
import { adminProductsAPI, adminCategoriesAPI } from "../../utils/adminAPI";
import AdminLayout from "../../components/admin/AdminLayout";
import ProductForm from "../../components/admin/ProductForm";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import Button from "../../components/Button";

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const navigate = useNavigate();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, ensure standard categories exist in the database
        const baseUrl = import.meta.env.PROD
          ? window.location.origin
          : "http://localhost:5000";

        console.log("Ensuring standard categories exist...");

        try {
          // Call the ensure-categories endpoint to create standard categories if they don't exist
          const ensureResponse = await fetch(
            `${baseUrl}/api/ensure-categories`
          );
          const ensureData = await ensureResponse.json();

          if (ensureResponse.ok && ensureData.success) {
            console.log("Categories ensured successfully:", ensureData.message);

            // Use the categories returned by the ensure endpoint
            if (
              ensureData.data &&
              Array.isArray(ensureData.data) &&
              ensureData.data.length > 0
            ) {
              console.log(
                `Using ${ensureData.data.length} categories from ensure endpoint`
              );

              // Add displayName property for UI
              const categoriesWithDisplay = ensureData.data.map((category) => ({
                ...category,
                displayName: category.name,
              }));

              setCategories(categoriesWithDisplay);
              setLoading(false);
              return;
            }
          } else {
            console.warn("Failed to ensure categories:", ensureData.message);
          }
        } catch (ensureError) {
          console.error("Error ensuring categories:", ensureError);
        }

        // If ensure endpoint fails, try regular categories endpoint
        try {
          console.log("Fetching categories from regular endpoint...");
          const response = await adminCategoriesAPI.getAll();

          if (response && response.data) {
            let allCategories = [];

            // Extract categories from response
            if (response.data.data && Array.isArray(response.data.data)) {
              allCategories = response.data.data;
            } else if (Array.isArray(response.data)) {
              allCategories = response.data;
            } else {
              console.warn("Unexpected API response format");
              setError("Failed to load categories. Please try again later.");
              setLoading(false);
              return;
            }

            if (allCategories.length > 0) {
              // Add displayName property
              const categoriesWithDisplay = allCategories.map((category) => ({
                ...category,
                displayName: category.name,
              }));

              setCategories(categoriesWithDisplay);
            } else {
              console.warn("No categories found");
              setError("No categories found. Please contact an administrator.");
            }
          } else {
            console.warn("No data received from API");
            setError("Failed to load categories. No data received.");
          }
        } catch (apiError) {
          console.error("Error fetching categories from API:", apiError);
          setError("Failed to load categories. Please try again later.");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
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
              <ProductForm
                categories={categories}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AddProduct;
