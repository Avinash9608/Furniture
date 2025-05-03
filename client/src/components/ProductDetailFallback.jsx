import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

// Create a safe toast function that won't break the build
const safeToast = {
  warning: (message) => {
    console.warn("Toast warning:", message);
    // Try to use react-toastify if available at runtime
    if (
      typeof window !== "undefined" &&
      window.ReactToastify &&
      window.ReactToastify.toast
    ) {
      window.ReactToastify.toast.warning(message);
    }
  },
  error: (message) => {
    console.error("Toast error:", message);
    if (
      typeof window !== "undefined" &&
      window.ReactToastify &&
      window.ReactToastify.toast
    ) {
      window.ReactToastify.toast.error(message);
    }
  },
  success: (message) => {
    console.log("Toast success:", message);
    if (
      typeof window !== "undefined" &&
      window.ReactToastify &&
      window.ReactToastify.toast
    ) {
      window.ReactToastify.toast.success(message);
    }
  },
  info: (message) => {
    console.log("Toast info:", message);
    if (
      typeof window !== "undefined" &&
      window.ReactToastify &&
      window.ReactToastify.toast
    ) {
      window.ReactToastify.toast.info(message);
    }
  },
};

/**
 * ProductDetailFallback - A robust component for fetching product details
 * with multiple fallback mechanisms to ensure product data is always displayed.
 *
 * This component tries multiple strategies in sequence:
 * 1. Use preloaded data from SSR if available
 * 2. Try the direct product endpoint
 * 3. Try the debug product endpoint
 * 4. Try the legacy product endpoint
 * 5. Use a mock product as last resort
 */
const ProductDetailFallback = ({ children, onProductLoaded, onError }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setSource(null);

        console.log(
          `ProductDetailFallback: Fetching product details for ID: ${id}`
        );

        // Strategy 1: Check if we have preloaded product data from the server
        if (
          window.__PRELOADED_PRODUCT_DATA__ &&
          window.__PRELOADED_PRODUCT_DATA__.data
        ) {
          console.log("ProductDetailFallback: Using preloaded product data");

          const preloadedData = window.__PRELOADED_PRODUCT_DATA__.data;
          setProduct(preloadedData);
          setSource("preloaded");

          // Clear the preloaded data to avoid using it again
          window.__PRELOADED_PRODUCT_DATA__ = null;

          setLoading(false);
          if (onProductLoaded) onProductLoaded(preloadedData, "preloaded");
          return;
        }

        // Create a list of endpoints to try in sequence
        const baseUrl = window.location.origin;
        const deployedUrl = "https://furniture-q3nb.onrender.com";
        const localServerUrl = "http://localhost:5000";

        // Determine if we're in development or production
        const isDevelopment = !baseUrl.includes("onrender.com");

        const endpoints = [
          // Strategy 2: Try the direct product endpoint
          ...(isDevelopment
            ? [`${localServerUrl}/api/direct-product/${id}`]
            : [`${baseUrl}/api/direct-product/${id}`]),
          `${deployedUrl}/api/direct-product/${id}`,

          // Strategy 3: Try the debug product endpoint
          ...(isDevelopment
            ? [`${localServerUrl}/api/debug-product/${id}`]
            : [`${baseUrl}/api/debug-product/${id}`]),
          `${deployedUrl}/api/debug-product/${id}`,

          // Strategy 4: Try the legacy product endpoint
          ...(isDevelopment
            ? [`${localServerUrl}/api/products/${id}`]
            : [`${baseUrl}/api/products/${id}`]),
          `${deployedUrl}/api/products/${id}`,
        ];

        // Try each endpoint in sequence
        let productData = null;
        let endpointSource = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`ProductDetailFallback: Trying endpoint: ${endpoint}`);

            const response = await axios.get(endpoint, {
              timeout: 10000, // 10 second timeout
            });

            // Check if we have valid product data in various formats
            if (response && response.data) {
              if (response.data.data) {
                // Standard API response format
                productData = response.data.data;
                endpointSource = `${endpoint} (standard format)`;
                console.log(
                  "ProductDetailFallback: Product data received from standard format"
                );
                break;
              } else if (response.data.success && response.data.data) {
                // Direct API response format
                productData = response.data.data;
                endpointSource = `${endpoint} (direct format)`;
                console.log(
                  "ProductDetailFallback: Product data received from direct API format"
                );
                break;
              } else if (
                typeof response.data === "object" &&
                response.data._id
              ) {
                // Direct object response
                productData = response.data;
                endpointSource = `${endpoint} (object format)`;
                console.log(
                  "ProductDetailFallback: Product data received as direct object"
                );
                break;
              } else if (response.data.formats) {
                // Debug endpoint format
                productData = response.data.data;
                endpointSource = `${endpoint} (debug format)`;
                console.log(
                  "ProductDetailFallback: Product data received from debug endpoint"
                );
                break;
              }
            }

            console.log(
              `ProductDetailFallback: Endpoint ${endpoint} returned invalid data format`
            );
          } catch (endpointError) {
            console.error(
              `ProductDetailFallback: Error with endpoint ${endpoint}:`,
              endpointError.message
            );
          }
        }

        // If we found product data from any endpoint, use it
        if (productData) {
          console.log(
            `ProductDetailFallback: Successfully fetched product data from ${endpointSource}`
          );
          setProduct(productData);
          setSource(endpointSource);
          setLoading(false);
          if (onProductLoaded) onProductLoaded(productData, endpointSource);
          return;
        }

        // Strategy 5: If all endpoints failed, use a mock product
        console.warn(
          "ProductDetailFallback: All endpoints failed, using mock product"
        );

        const mockProduct = {
          _id: id,
          name: "Fallback Product",
          description:
            "This is a fallback product shown when all data fetching attempts failed.",
          price: 19999,
          discountPrice: 15999,
          category: {
            _id: "fallback-category",
            name: "Fallback Category",
            slug: "fallback-category",
          },
          stock: 10,
          ratings: 4.5,
          numReviews: 12,
          images: [
            "https://placehold.co/800x600/orange/white?text=Fallback+Product",
          ],
          specifications: [
            { name: "Material", value: "Wood" },
            { name: "Dimensions", value: "80 x 60 x 40 cm" },
            { name: "Weight", value: "15 kg" },
          ],
          reviews: [],
          __isMock: true,
          __source: "client_fallback",
        };

        setProduct(mockProduct);
        setSource("client_fallback");
        setError(
          "Failed to load product details from all sources. Showing a fallback product."
        );
        setLoading(false);

        // Show a toast notification
        safeToast.warning(
          "Could not load product details. Showing a fallback product."
        );

        if (onProductLoaded) onProductLoaded(mockProduct, "client_fallback");
        if (onError) onError("Failed to load product details from all sources");
      } catch (error) {
        console.error("ProductDetailFallback: Unhandled error:", error);
        setError("An unexpected error occurred. Please try again later.");
        setLoading(false);

        if (onError) onError(error.message);
      }
    };

    fetchProductDetails();
  }, [id, onProductLoaded, onError]);

  // Render the children with the product data
  return children({ product, loading, error, source });
};

export default ProductDetailFallback;
