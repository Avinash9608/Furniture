import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { productsAPI, categoriesAPI } from "../../utils/api";
import { adminProductsAPI, adminCategoriesAPI } from "../../utils/adminAPI";
import { createProduct as createProductEnhanced } from "../../utils/enhancedProductAPI";
import AdminLayout from "../../components/admin/AdminLayout";
import ProductForm from "../../components/admin/ProductForm";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import axios from "axios";

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const navigate = useNavigate();

  // Hardcoded standard categories to use when server is unavailable
  const standardCategories = [
    {
      _id: "offline_sofa_beds",
      name: "Sofa Beds",
      displayName: "Sofa Beds",
      description: "Comfortable sofa beds for your living room",
      isOffline: true,
    },
    {
      _id: "offline_tables",
      name: "Tables",
      displayName: "Tables",
      description: "Stylish tables for your home",
      isOffline: true,
    },
    {
      _id: "offline_chairs",
      name: "Chairs",
      displayName: "Chairs",
      description: "Ergonomic chairs for comfort",
      isOffline: true,
    },
    {
      _id: "offline_wardrobes",
      name: "Wardrobes",
      displayName: "Wardrobes",
      description: "Spacious wardrobes for storage",
      isOffline: true,
    },
    {
      _id: "offline_beds",
      name: "Beds",
      displayName: "Beds",
      description: "Comfortable beds for a good night's sleep",
      isOffline: true,
    },
  ];

  // Remove the authentication check useEffect since ProtectedRoute handles it
  useEffect(() => {
    // Only fetch categories when component mounts
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/categories");
        console.log("Categories API response:", response.data);

        // Handle different response formats
        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          // Format: { success: true, data: [...] }
          setCategories(response.data.data);
        } else if (Array.isArray(response.data)) {
          // Format: Direct array
          setCategories(response.data);
        } else {
          console.warn("Unexpected categories response format:", response.data);
          // Fallback to standard categories
          setCategories(standardCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories. Using default categories.");
        // Use hardcoded categories as fallback
        setCategories(standardCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []); // Only run on mount

  // Handle form submission with enhanced error handling
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      console.log("Starting product submission with enhanced API...");

      // Get the token from multiple sources
      const token =
        localStorage.getItem("adminToken") ||
        sessionStorage.getItem("adminToken");
      if (!token) {
        throw new Error(
          "Admin authentication required. Please log in as an administrator."
        );
      }

      // Verify user is admin
      const userData =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      if (!user || user.role !== "admin") {
        throw new Error(
          "Admin privileges required. Please log in as an administrator."
        );
      }

      // Add admin token to FormData
      formData.append("adminToken", token);

      // Log all form data being sent
      console.log("FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Try emergency endpoint first (2-minute timeout)
      try {
        console.log("Trying emergency endpoint with 2-minute timeout...");

        // Get the base URL
        const baseUrl =
          window.location.hostname === "localhost"
            ? "http://localhost:5000"
            : window.location.origin;

        // Make the request directly to the emergency endpoint
        const emergencyResponse = await fetch(
          `${baseUrl}/api/emergency/product`,
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Check if the request was successful
        if (emergencyResponse.ok) {
          const data = await emergencyResponse.json();
          console.log(
            "Product created successfully with emergency endpoint:",
            data
          );

          // Navigate to products page with success message
          navigate("/admin/products", {
            state: { successMessage: "Product added successfully!" },
          });
          return;
        } else {
          console.error(
            "Emergency endpoint failed:",
            await emergencyResponse.text()
          );
          // Continue to next approach
        }
      } catch (emergencyError) {
        console.error("Error with emergency endpoint:", emergencyError);
        // Continue to next approach
      }

      // Try direct MongoDB endpoint next (no Mongoose)
      try {
        console.log("Trying direct MongoDB endpoint (no Mongoose)...");

        // Get the base URL
        const baseUrl =
          window.location.hostname === "localhost"
            ? "http://localhost:5000"
            : window.location.origin;

        // Make the request directly to the direct MongoDB endpoint
        const directMongoResponse = await fetch(
          `${baseUrl}/api/direct-mongo/product`,
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Check if the request was successful
        if (directMongoResponse.ok) {
          const data = await directMongoResponse.json();
          console.log(
            "Product created successfully with direct MongoDB endpoint:",
            data
          );

          // Navigate to products page with success message
          navigate("/admin/products", {
            state: { successMessage: "Product added successfully!" },
          });
          return;
        } else {
          console.error(
            "Direct MongoDB endpoint failed:",
            await directMongoResponse.text()
          );
          // Continue to next approach
        }
      } catch (directMongoError) {
        console.error("Error with direct MongoDB endpoint:", directMongoError);
        // Continue to next approach
      }

      // Try direct bypass endpoint next
      try {
        console.log("Trying direct bypass endpoint...");

        // Get the base URL
        const baseUrl =
          window.location.hostname === "localhost"
            ? "http://localhost:5000"
            : window.location.origin;

        // Make the request directly to the bypass endpoint
        const bypassResponse = await fetch(`${baseUrl}/api/bypass/product`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Check if the request was successful
        if (bypassResponse.ok) {
          const data = await bypassResponse.json();
          console.log(
            "Product created successfully with bypass endpoint:",
            data
          );

          // Navigate to products page with success message
          navigate("/admin/products", {
            state: { successMessage: "Product added successfully!" },
          });
          return;
        } else {
          console.error("Bypass endpoint failed:", await bypassResponse.text());
          // Continue to next approach
        }
      } catch (bypassError) {
        console.error("Error with bypass endpoint:", bypassError);
        // Continue to next approach
      }

      // Try the enhanced product creation API next
      try {
        console.log("Trying enhanced product creation API...");
        const response = await createProductEnhanced(formData);
        console.log(
          "Product created successfully with enhanced API:",
          response
        );

        // Navigate to products page with success message
        navigate("/admin/products", {
          state: { successMessage: "Product added successfully!" },
        });
        return;
      } catch (enhancedError) {
        console.error("Enhanced API failed:", enhancedError);

        // If the error is authentication-related, don't try the fallback
        if (
          enhancedError.response?.status === 401 ||
          enhancedError.response?.status === 403
        ) {
          throw enhancedError;
        }

        // Otherwise, try the regular API as fallback
        console.log("Falling back to regular product creation API...");
      }

      // Fallback to the regular product creation API
      console.log("Sending product creation request to regular API...");
      const response = await productsAPI.create(formData);
      console.log("Product created successfully with regular API:", response);

      // Navigate to products page with success message
      navigate("/admin/products", {
        state: { successMessage: "Product added successfully!" },
      });
    } catch (error) {
      console.error("Error creating product:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        // Authentication error - redirect to login
        sessionStorage.setItem("adminRedirectPath", window.location.pathname);
        navigate("/admin/login");
        return;
      }

      // Handle other types of errors
      let errorMessage = "Failed to create product. Please try again.";

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.statusText ||
          errorMessage;
      } else if (error.request) {
        errorMessage =
          "Network error: Could not reach the server. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSubmitError(errorMessage);

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
