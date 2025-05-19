import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import HybridProductTable from "../../components/admin/HybridProductTable";
import { getAllProducts, deleteProduct } from "../../utils/robustApiHelper";

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

      // Get products from database with fallbacks
      const productsData = await getAllProducts();
      
      if (productsData && productsData.length > 0) {
        setProducts(productsData);
        
        if (!successMessage) {
          setSuccessMessage(`Loaded ${productsData.length} products successfully`);
        }
      } else {
        setError("No products found. Please add some products.");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle product deletion
  const handleDeleteProduct = async (productId) => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      });

      // If user confirms deletion
      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while we delete the product.",
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Delete product from database with fallbacks
        const deleted = await deleteProduct(productId);
        
        if (deleted) {
          // Remove product from state
          setProducts(products.filter(product => product._id !== productId));
          
          // Show success message
          Swal.fire(
            "Deleted!",
            "Your product has been deleted.",
            "success"
          );
        } else {
          // Show error message
          Swal.fire(
            "Error!",
            "Failed to delete product. Please try again later.",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      
      // Show error message
      Swal.fire(
        "Error!",
        "Failed to delete product. Please try again later.",
        "error"
      );
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Products</h1>
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
        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

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
