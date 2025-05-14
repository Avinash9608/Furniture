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
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      console.log("Starting product submission...");

      // Create FormData for submission
      const formDataToSubmit = new FormData();

      // Add basic fields with proper type conversion and validation
      const stringFields = ['name', 'description', 'material', 'color'];
      const numberFields = ['price', 'stock', 'discountPrice'];

      // Add string fields
      stringFields.forEach(field => {
        if (formData[field]) {
          console.log(`Adding ${field}:`, formData[field]);
          formDataToSubmit.append(field, formData[field].trim());
        }
      });

      // Add number fields
      numberFields.forEach(field => {
        if (formData[field] !== '') {
          const value = Number(formData[field]);
          if (!isNaN(value)) {
            console.log(`Adding ${field}:`, value);
            formDataToSubmit.append(field, value);
          }
        }
      });

      // Add category
      if (formData.category) {
        console.log('Adding category:', formData.category);
        formDataToSubmit.append('category', formData.category);
      }

      // Add boolean fields
      formDataToSubmit.append('featured', formData.featured);

      // Handle dimensions
      if (Object.values(formData.dimensions).some(val => val !== '')) {
        const dimensions = {};
        Object.entries(formData.dimensions).forEach(([key, value]) => {
          if (value !== '' && !isNaN(Number(value))) {
            dimensions[key] = Number(value);
          }
        });
        if (Object.keys(dimensions).length > 0) {
          formDataToSubmit.append('dimensions', JSON.stringify(dimensions));
        }
      }

      // Handle images
      if (formData.images && formData.images.length > 0) {
        console.log('Processing images:', formData.images);
        formData.images.forEach((image, index) => {
          if (image instanceof File) {
            console.log(`Adding image file ${index}:`, image.name);
            formDataToSubmit.append('images', image);
          } else if (image.file instanceof File) {
            console.log(`Adding image file ${index}:`, image.file.name);
            formDataToSubmit.append('images', image.file);
          } else if (typeof image === 'string') {
            // For existing images, just send the filename
            const filename = image.split('/').pop();
            console.log(`Adding existing image ${index}:`, filename);
            formDataToSubmit.append('imageUrls', filename);
          }
        });
      }

      // Log the final FormData
      console.log('FormData entries:');
      for (let pair of formDataToSubmit.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Try to create the product with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second

      while (retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} to create product...`);
          const response = await productsAPI.create(formDataToSubmit);
          const responseData = response.data;

          if (responseData && responseData.success) {
            console.log("Product created successfully:", responseData);
            
            // Show success message and redirect
            setTimeout(() => {
              navigate("/admin/products", {
                state: { successMessage: "Product added successfully!" }
              });
            }, 500);
            
            return;
          } else {
            throw new Error(responseData?.message || "Failed to create product");
          }
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;

          if (retryCount < maxRetries) {
            console.log(`Waiting ${retryDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      let errorMessage = "Failed to create product. Please try again.";

      if (error.message === "Failed to fetch") {
        errorMessage = "Network error: Please check your internet connection and try again.";
      } else if (error.response) {
        // Server responded with an error
        errorMessage = error.response.data?.message || errorMessage;
      }

      setSubmitError(errorMessage);
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
