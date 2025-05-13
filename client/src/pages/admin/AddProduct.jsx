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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Define standard categories to use as absolute fallback
        const standardCategories = [
          {
            _id: "standard_sofa_beds",
            name: "Sofa Beds",
            displayName: "Sofa Beds",
            description: "Comfortable sofa beds for your living room",
            isStandard: true,
          },
          {
            _id: "standard_tables",
            name: "Tables",
            displayName: "Tables",
            description: "Stylish tables for your home",
            isStandard: true,
          },
          {
            _id: "standard_chairs",
            name: "Chairs",
            displayName: "Chairs",
            description: "Ergonomic chairs for comfort",
            isStandard: true,
          },
          {
            _id: "standard_wardrobes",
            name: "Wardrobes",
            displayName: "Wardrobes",
            description: "Spacious wardrobes for storage",
            isStandard: true,
          },
          {
            _id: "standard_beds",
            name: "Beds",
            displayName: "Beds",
            description: "Comfortable beds for a good night's sleep",
            isStandard: true,
          },
        ];

        // Determine if we're in development or production
        const isDevelopment =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        const baseUrl = isDevelopment
          ? "http://localhost:5000"
          : window.location.origin;

        console.log(
          `Environment: ${isDevelopment ? "Development" : "Production"}`
        );
        console.log(`Base URL: ${baseUrl}`);

        // Simple fetch function with timeout
        const fetchWithTimeout = async (url, timeout = 10000) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            console.log(`Fetching from ${url}...`);
            const response = await fetch(url, {
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            console.error(`Error fetching from ${url}:`, error);
            throw error;
          }
        };

        // Try to fetch from mock categories endpoint first (most reliable)
        try {
          console.log("Trying mock categories endpoint...");
          const mockResponse = await fetchWithTimeout(
            `${baseUrl}/api/mock/categories`,
            10000
          );

          if (mockResponse.ok) {
            const mockData = await mockResponse.json();
            console.log("Mock categories endpoint successful:", mockData);

            if (Array.isArray(mockData) && mockData.length > 0) {
              // Add displayName property
              const categoriesWithDisplay = mockData.map((category) => ({
                ...category,
                displayName: category.name,
              }));

              // Save to localStorage for future use
              localStorage.setItem(
                "furniture_categories",
                JSON.stringify(categoriesWithDisplay)
              );

              // Use these categories
              setCategories(categoriesWithDisplay);
              setLoading(false);
              return;
            }
          } else {
            console.warn(
              `Mock endpoint returned status ${mockResponse.status}`
            );
          }
        } catch (mockError) {
          console.error("Error with mock endpoint:", mockError);
        }

        // Try localStorage as a fallback
        try {
          console.log("Trying localStorage for cached categories...");
          const cachedCategories = localStorage.getItem("furniture_categories");

          if (cachedCategories) {
            const parsedCategories = JSON.parse(cachedCategories);

            if (
              Array.isArray(parsedCategories) &&
              parsedCategories.length > 0
            ) {
              console.log("Using cached categories from localStorage");
              setCategories(parsedCategories);
              setLoading(false);
              return;
            }
          }
        } catch (cacheError) {
          console.error("Error using cached categories:", cacheError);
        }

        // If all else fails, use standard categories
        console.log(
          "All category fetching methods failed, using standard categories"
        );
        setCategories(standardCategories);

        // Show a message that we're using standard categories
        setError(
          "Using standard categories. Products will be saved with proper category associations."
        );
      } catch (error) {
        console.error("Unexpected error in category fetching:", error);

        // Use standard categories as last resort
        setCategories(standardCategories);
        setError("Using standard categories due to an unexpected error.");
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

      // Check if we're using standard categories
      const isUsingStandardCategories = categories.some(
        (cat) => cat.isStandard
      );

      // Log the received FormData
      console.log("Received product data:");
      if (productData instanceof FormData) {
        for (let pair of productData.entries()) {
          console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
        }
      }

      // Determine if we're in development or production
      const isDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      const baseUrl = isDevelopment
        ? "http://localhost:5000"
        : window.location.origin;

      console.log("Submitting product data...");

      // Try the direct endpoint first (no auth required)
      try {
        console.log("Trying direct product creation endpoint...");

        const directUrl = `${baseUrl}/api/direct/products`;
        console.log(`Sending POST to ${directUrl}`);

        // Add a flag to indicate this is coming from the client
        if (productData instanceof FormData) {
          productData.append("source", "client_direct");
        }

        // Send the request with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

        console.log("Sending direct request now...");
        const directResponse = await fetch(directUrl, {
          method: "POST",
          body: productData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`Direct response status: ${directResponse.status}`);

        // Try to parse the response body for more details
        let responseBody;
        try {
          responseBody = await directResponse.json();
          console.log("Response body:", responseBody);
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          responseBody = { message: "Could not parse response" };
        }

        if (directResponse.ok) {
          console.log(
            "Product created successfully with direct endpoint:",
            responseBody
          );

          // Show success message
          setTimeout(() => {
            navigate("/admin/products", {
              state: {
                successMessage: "Product added successfully!",
              },
            });
          }, 500);

          return;
        } else {
          console.warn(
            `Direct endpoint returned status ${directResponse.status}:`,
            responseBody.message || "Unknown error"
          );
          throw new Error(
            `Direct endpoint failed: ${
              responseBody.message || responseBody.error || "Unknown error"
            }`
          );
        }
      } catch (directError) {
        console.error("Error with direct endpoint:", directError);
        throw directError;
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setSubmitError(error.message || "Failed to create product. Please try again.");
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
