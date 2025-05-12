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

        // Try to get categories from localStorage first (if they exist)
        const cachedCategories = localStorage.getItem("furniture_categories");
        if (cachedCategories) {
          try {
            const parsedCategories = JSON.parse(cachedCategories);
            if (
              Array.isArray(parsedCategories) &&
              parsedCategories.length > 0
            ) {
              console.log("Using cached categories from localStorage");
              setCategories(parsedCategories);
              setLoading(false);

              // Try to refresh categories in the background
              refreshCategoriesInBackground();
              return;
            }
          } catch (cacheError) {
            console.error("Error parsing cached categories:", cacheError);
          }
        }

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

        // Try to fetch categories with a timeout
        const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeout);

          try {
            console.log(`Fetching from ${url} with ${timeout}ms timeout...`);

            // Add auth token to request if available
            const token =
              localStorage.getItem("adminToken") ||
              localStorage.getItem("token");
            const headers = {
              ...options.headers,
            };

            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
              console.log("Added auth token to request");
            }

            const response = await fetch(url, {
              ...options,
              headers,
              signal: controller.signal,
              credentials: "include", // Include cookies
            });

            clearTimeout(id);
            console.log(`Response from ${url}: status ${response.status}`);
            return response;
          } catch (error) {
            clearTimeout(id);
            console.error(`Error fetching from ${url}:`, error);
            throw error;
          }
        };

        try {
          console.log("Fetching categories from API...");

          // Try multiple endpoints with increasing timeouts
          let response;
          let success = false;

          // First try the categories endpoint with a longer timeout
          try {
            response = await fetchWithTimeout(
              `${baseUrl}/api/categories`,
              {},
              15000 // 15 seconds timeout
            );

            if (response.ok) {
              success = true;
              console.log(
                "Successfully fetched categories from primary endpoint"
              );
            } else {
              console.warn(
                `Primary endpoint returned status ${response.status}`
              );
            }
          } catch (primaryError) {
            console.error("Error with primary endpoint:", primaryError);
          }

          // If first attempt failed, try the admin categories endpoint
          if (!success) {
            try {
              console.log("Trying admin categories endpoint...");
              response = await fetchWithTimeout(
                `${baseUrl}/api/admin/categories`,
                {},
                20000 // 20 seconds timeout
              );

              if (response.ok) {
                success = true;
                console.log(
                  "Successfully fetched categories from admin endpoint"
                );
              } else {
                console.warn(
                  `Admin endpoint returned status ${response.status}`
                );
              }
            } catch (adminError) {
              console.error("Error with admin endpoint:", adminError);
            }
          }

          // If both attempts failed, try a direct endpoint
          if (!success) {
            try {
              console.log("Trying direct categories endpoint...");
              response = await fetchWithTimeout(
                `${baseUrl}/api/direct/categories`,
                {},
                25000 // 25 seconds timeout
              );

              if (response.ok) {
                success = true;
                console.log(
                  "Successfully fetched categories from direct endpoint"
                );
              } else {
                console.warn(
                  `Direct endpoint returned status ${response.status}`
                );
              }
            } catch (directError) {
              console.error("Error with direct endpoint:", directError);
            }
          }

          // If all attempts failed, throw an error
          if (!success && !response) {
            throw new Error("All category endpoints failed");
          }

          if (response.ok) {
            const data = await response.json();
            console.log("Categories API response:", data);

            let allCategories = [];

            // Extract categories from response
            if (data.data && Array.isArray(data.data)) {
              allCategories = data.data;
            } else if (Array.isArray(data)) {
              allCategories = data;
            } else {
              throw new Error("Unexpected API response format");
            }

            if (allCategories.length > 0) {
              // Add displayName property
              const categoriesWithDisplay = allCategories.map((category) => ({
                ...category,
                displayName: category.name,
              }));

              // Cache categories in localStorage
              localStorage.setItem(
                "furniture_categories",
                JSON.stringify(categoriesWithDisplay)
              );

              setCategories(categoriesWithDisplay);
              setLoading(false);
              return;
            } else {
              throw new Error("No categories found in API response");
            }
          } else {
            throw new Error(`API returned status ${response.status}`);
          }
        } catch (apiError) {
          console.error("Error fetching categories from API:", apiError);

          // Use hardcoded categories as fallback
          console.log("Using hardcoded categories as fallback");
          setCategories(standardCategories);

          // Show a warning message instead of an error
          setError(
            "Using offline categories. Products created now will need to be updated later."
          );
        }
      } catch (error) {
        console.error("Unexpected error:", error);

        // Use hardcoded categories as fallback
        console.log("Using hardcoded categories due to unexpected error");
        setCategories(standardCategories);

        // Show a warning message
        setError(
          "Using offline categories. Products created now will need to be updated later."
        );
      } finally {
        setLoading(false);
      }
    };

    // Function to refresh categories in the background
    const refreshCategoriesInBackground = async () => {
      try {
        const isDevelopment =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        const baseUrl = isDevelopment
          ? "http://localhost:5000"
          : window.location.origin;

        const response = await fetch(`${baseUrl}/api/categories`);

        if (response.ok) {
          const data = await response.json();
          let allCategories = [];

          if (data.data && Array.isArray(data.data)) {
            allCategories = data.data;
          } else if (Array.isArray(data)) {
            allCategories = data;
          }

          if (allCategories.length > 0) {
            const categoriesWithDisplay = allCategories.map((category) => ({
              ...category,
              displayName: category.name,
            }));

            localStorage.setItem(
              "furniture_categories",
              JSON.stringify(categoriesWithDisplay)
            );
            console.log("Categories refreshed in background");
          }
        }
      } catch (error) {
        console.error("Error refreshing categories in background:", error);
      }
    };

    fetchCategories();
  }, []);

  // Handle form submission
  const handleSubmit = async (productData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Check if we're using offline categories
      const isUsingOfflineCategories = categories.some((cat) => cat.isOffline);

      if (isUsingOfflineCategories) {
        // Store product in localStorage for later sync
        const offlineProducts = JSON.parse(
          localStorage.getItem("furniture_offline_products") || "[]"
        );

        // Generate a temporary ID
        const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Create a product object with all the data
        const offlineProduct = {
          _id: tempId,
          ...productData,
          createdAt: new Date().toISOString(),
          isOffline: true,
        };

        // Add to offline products
        offlineProducts.push(offlineProduct);
        localStorage.setItem(
          "furniture_offline_products",
          JSON.stringify(offlineProducts)
        );

        // Show success message
        setTimeout(() => {
          navigate("/admin/products", {
            state: {
              successMessage:
                "Product saved offline. It will be synced when connection is restored.",
            },
          });
        }, 500);

        return;
      }

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

      // Try to determine if we're online
      const isOnline = navigator.onLine;
      console.log(`Browser reports online status: ${isOnline}`);

      if (!isOnline) {
        // Store product in localStorage for later sync
        const offlineProducts = JSON.parse(
          localStorage.getItem("furniture_offline_products") || "[]"
        );

        // Convert FormData to object
        const offlineProductData = {};
        for (let pair of formData.entries()) {
          if (pair[0] !== "images") {
            offlineProductData[pair[0]] = pair[1];
          }
        }

        // Generate a temporary ID
        const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Create a product object with all the data
        const offlineProduct = {
          _id: tempId,
          ...offlineProductData,
          createdAt: new Date().toISOString(),
          isOffline: true,
        };

        // Add to offline products
        offlineProducts.push(offlineProduct);
        localStorage.setItem(
          "furniture_offline_products",
          JSON.stringify(offlineProducts)
        );

        // Show success message
        setTimeout(() => {
          navigate("/admin/products", {
            state: {
              successMessage:
                "Product saved offline. It will be synced when connection is restored.",
            },
          });
        }, 500);

        return;
      }

      console.log("Submitting product data to API...");
      console.log("Auth token in localStorage:", localStorage.getItem("token"));

      // Use the API client instead of direct axios
      console.log("Using API client to create product");

      // Try to create the product with a longer timeout
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 30000) // 30 seconds timeout
      );

      console.log("Creating product with adminProductsAPI...");

      // Log the auth token being used
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      console.log(
        "Using auth token:",
        token ? `${token.substring(0, 10)}...` : "No token found"
      );

      // Try to create the product
      const fetchPromise = adminProductsAPI.create(formData);

      try {
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        console.log("Product created successfully:", response);

        // Check if the response indicates success
        if (
          response &&
          (response.data || response.status === 200 || response.status === 201)
        ) {
          console.log("Server confirmed product creation");
          return response;
        } else {
          console.warn("Unexpected response format:", response);
          throw new Error("Server returned an unexpected response");
        }
      } catch (apiError) {
        console.error("Error with adminProductsAPI:", apiError);

        // Try a direct fetch as fallback
        console.log("Trying direct fetch as fallback...");

        const directFormData = new FormData();
        for (let pair of formData.entries()) {
          directFormData.append(pair[0], pair[1]);
        }

        const directUrl = `${baseUrl}/api/products`;
        console.log(`Sending direct POST to ${directUrl}`);

        const directResponse = await fetch(directUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: directFormData,
          credentials: "include",
        });

        if (directResponse.ok) {
          const data = await directResponse.json();
          console.log("Product created successfully with direct fetch:", data);
          return { data };
        } else {
          console.error(
            `Direct fetch failed with status ${directResponse.status}`
          );
          throw new Error(
            `Failed to create product: ${directResponse.statusText}`
          );
        }
      }

      // Success! Show success message with a slight delay to ensure UI updates
      console.log("Product creation successful, navigating to products page");
      setTimeout(() => {
        navigate("/admin/products", {
          state: {
            successMessage: "Product added successfully!",
          },
        });
      }, 500);
    } catch (error) {
      console.error("Error creating product:", error);

      // Check if it's a timeout or network error
      if (
        error.message === "Request timed out" ||
        error.message === "Network Error" ||
        !navigator.onLine
      ) {
        setSubmitError(
          "Could not connect to server. Product will be saved offline and synced later."
        );

        // Store product in localStorage for later sync
        try {
          const offlineProducts = JSON.parse(
            localStorage.getItem("furniture_offline_products") || "[]"
          );

          // Generate a temporary ID
          const tempId = `temp_${Date.now()}_${Math.floor(
            Math.random() * 1000
          )}`;

          // Create a product object with all the data
          const offlineProduct = {
            _id: tempId,
            ...productData,
            createdAt: new Date().toISOString(),
            isOffline: true,
          };

          // Add to offline products
          offlineProducts.push(offlineProduct);
          localStorage.setItem(
            "furniture_offline_products",
            JSON.stringify(offlineProducts)
          );

          // Show success message after a delay
          setTimeout(() => {
            navigate("/admin/products", {
              state: {
                successMessage:
                  "Product saved offline. It will be synced when connection is restored.",
              },
            });
          }, 2000);
        } catch (offlineError) {
          console.error("Error saving product offline:", offlineError);
          setSubmitError(
            "Failed to save product offline. Please try again or check your browser storage."
          );
        }
      } else {
        setSubmitError(
          error.response?.data?.message ||
            "An error occurred while creating the product. Please try again."
        );
      }

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
