import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import HybridProductTable from "../../components/admin/HybridProductTable";
import {
  getAllProducts,
  deleteProduct,
  checkOfflineMode,
  setOfflineMode,
} from "../../utils/robustApiHelper";
import {
  getPlaceholderByType,
  getProductType,
} from "../../utils/reliableImageHelper";

/**
 * A hybrid admin products page that uses database data with reliable fallbacks.
 * Fetches data from MongoDB Atlas but has robust fallback mechanisms.
 */
const HybridProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State for products
  const [products, setProducts] = useState([]);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || null
  );

  // State for offline mode
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Clear location state after using it
  useEffect(() => {
    if (location.state?.successMessage) {
      // Clear the success message from location state after 3 seconds
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Function to load products from database with fallbacks
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're already in offline mode
      const startingOfflineMode = checkOfflineMode();
      setIsOfflineMode(startingOfflineMode);

      if (startingOfflineMode) {
        console.log("Starting in offline mode");
      }

      // Get products from database with fallbacks
      const productsData = await getAllProducts();

      // Check if we're in offline mode by examining the source of the data
      const isOffline =
        checkOfflineMode() || // Check global offline mode flag
        (productsData &&
          productsData.length > 0 &&
          productsData[0]._id &&
          (productsData[0]._id.startsWith("local_") ||
            productsData[0].source === "localStorage"));

      // Update offline mode state
      setIsOfflineMode(isOffline);

      // Also update the global offline mode flag
      if (isOffline) {
        setOfflineMode(true);
      }

      if (productsData && productsData.length > 0) {
        setProducts(productsData);

        if (!successMessage) {
          if (isOffline) {
            setSuccessMessage(
              `Loaded ${productsData.length} products from local storage (offline mode)`
            );
          } else {
            setSuccessMessage(
              `Loaded ${productsData.length} products successfully`
            );
          }
        }
      } else {
        setError("No products found. Please add some products.");

        // If we have no products, we're probably offline
        setIsOfflineMode(true);
        setOfflineMode(true);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Failed to load products. Please try again later.");

      // Set offline mode if there's an error
      setIsOfflineMode(true);
      setOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle product deletion
  const handleDeleteProduct = async (productId) => {
    try {
      // Find the product to be deleted
      const productToDelete = products.find((p) => p._id === productId);
      const productName = productToDelete
        ? productToDelete.name
        : "this product";

      // Show confirmation dialog with product details
      const result = await Swal.fire({
        title: "Are you sure?",
        html: `
          <div class="text-center">
            <p class="mb-2">You are about to delete:</p>
            <p class="font-bold text-lg mb-3">${productName}</p>
            <div class="flex justify-center my-3">
              ${
                productToDelete
                  ? `
                <div class="w-16 h-16 rounded-md overflow-hidden">
                  <img
                    src="${getPlaceholderByType(
                      getProductType(productName),
                      productName
                    )}"
                    alt="${productName}"
                    class="w-full h-full object-cover"
                  />
                </div>
              `
                  : ""
              }
            </div>
            <p class="text-sm text-red-600">This action cannot be undone!</p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });

      // If user confirms deletion
      if (result.isConfirmed) {
        // Show loading state with progress
        let timerInterval;
        Swal.fire({
          title: "Deleting...",
          html: "Please wait while we delete the product.<br/><b>Processing request...</b>",
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();

            // Simulate progress updates
            const b = Swal.getHtmlContainer().querySelector("b");
            timerInterval = setInterval(() => {
              const messages = [
                "Processing request...",
                "Removing product data...",
                "Updating inventory...",
                "Finalizing deletion...",
              ];
              const randomMessage =
                messages[Math.floor(Math.random() * messages.length)];
              b.textContent = randomMessage;
            }, 800);
          },
          willClose: () => {
            clearInterval(timerInterval);
          },
        });

        // Delete product from database with fallbacks
        const deleted = await deleteProduct(productId);

        if (deleted) {
          // Remove product from state
          setProducts(products.filter((product) => product._id !== productId));

          // Show success message
          Swal.fire({
            title: "Deleted!",
            html: `
              <div class="text-center">
                <p class="mb-2">Product has been deleted successfully.</p>
                <div class="flex justify-center my-3">
                  <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <p class="text-sm text-gray-600">${productName} has been removed from your inventory.</p>
              </div>
            `,
            icon: "success",
            confirmButtonText: "OK",
          });
        } else {
          // Show error message with fallback
          Swal.fire({
            title: "Partial Success",
            html: `
              <div class="text-center">
                <p class="mb-2">The server encountered an issue, but the product was removed locally.</p>
                <div class="flex justify-center my-3">
                  <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                </div>
                <p class="text-sm text-gray-600">The product will appear deleted in your interface.</p>
              </div>
            `,
            icon: "warning",
            confirmButtonText: "OK",
          });

          // Still remove from state for better UX
          setProducts(products.filter((product) => product._id !== productId));
        }
      }
    } catch (error) {
      console.error("Failed to delete product:", error);

      // Show error message but still remove from state
      Swal.fire({
        title: "Error",
        html: `
          <div class="text-center">
            <p class="mb-2">There was an error while deleting the product.</p>
            <div class="flex justify-center my-3">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <p class="text-sm text-gray-600">However, we've removed it from your view.</p>
            <p class="text-xs text-gray-500 mt-2">Error: ${
              error.message || "Unknown error"
            }</p>
          </div>
        `,
        icon: "error",
        confirmButtonText: "OK",
      });

      // Still remove from state for better UX
      setProducts(products.filter((product) => product._id !== productId));
    }
  };

  // Function to refresh products
  const handleRefresh = () => {
    loadProducts();
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Products
            </h1>
            {isOfflineMode && (
              <div className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-full flex items-center text-sm">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Offline Mode
              </div>
            )}
          </div>
          <div className="flex space-x-4">
            <Button color="green" onClick={handleRefresh}>
              Refresh
            </Button>
            <Link to="/admin/products/add">
              <Button color="blue">Add New Product</Button>
            </Link>
          </div>
        </div>

        {/* Success message */}
        {successMessage && (
          <Alert type="success" message={successMessage} className="mb-4" />
        )}

        {/* Error message */}
        {error && <Alert type="error" message={error} className="mb-4" />}

        {/* Loading indicator */}
        {loading ? (
          <Loading />
        ) : (
          <HybridProductTable
            products={products}
            onDeleteClick={handleDeleteProduct}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default HybridProducts;
