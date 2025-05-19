import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import ReliableProductTable from "../../components/admin/ReliableProductTable";
import { processProductsWithReliableImages } from "../../utils/reliableImageHelper";

/**
 * A reliable admin products page that works even when the server is having issues.
 */
const ReliableProducts = () => {
  const navigate = useNavigate();

  // State for products and categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Function to load products with multiple fallbacks
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine if we're in development or production
      const baseUrl = window.location.origin;
      const isDevelopment = !baseUrl.includes("onrender.com");
      const apiUrl = isDevelopment ? "http://localhost:5000" : baseUrl;

      // Try multiple endpoints with fallbacks
      const endpoints = [
        `${apiUrl}/api/products`,
        `${apiUrl}/api/direct/products`,
        `${apiUrl}/api/admin/products`,
        `${apiUrl}/api/fallback/products`
      ];

      let productsData = null;
      let successEndpoint = null;

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, { timeout: 10000 });
          
          // Check if we got valid data
          if (response.data) {
            // Extract products array from various response formats
            let extractedProducts = null;
            
            if (Array.isArray(response.data)) {
              extractedProducts = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              extractedProducts = response.data.data;
            } else if (response.data.products && Array.isArray(response.data.products)) {
              extractedProducts = response.data.products;
            }
            
            // If we found products, use them
            if (extractedProducts && extractedProducts.length > 0) {
              productsData = extractedProducts;
              successEndpoint = endpoint;
              break;
            }
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError);
          // Continue to next endpoint
        }
      }

      // If we found products, process them
      if (productsData && productsData.length > 0) {
        console.log(`Found ${productsData.length} products from ${successEndpoint}`);
        
        // Process products with reliable images
        const processedProducts = processProductsWithReliableImages(productsData);
        
        setProducts(processedProducts);
        setSuccessMessage(`Loaded ${processedProducts.length} products successfully`);
      } else {
        // If all endpoints failed, use mock data
        console.log("All endpoints failed, using mock data");
        
        // Create mock products
        const mockProducts = [
          {
            _id: "mock1",
            name: "Sample Sofa",
            price: 12999,
            stock: 5,
            category: { name: "Sofa Beds" }
          },
          {
            _id: "mock2",
            name: "Sample Table",
            price: 8999,
            stock: 3,
            category: { name: "Tables" }
          },
          {
            _id: "mock3",
            name: "Sample Chair",
            price: 4999,
            stock: 10,
            category: { name: "Chairs" }
          }
        ];
        
        // Process mock products with reliable images
        const processedMockProducts = processProductsWithReliableImages(mockProducts);
        
        setProducts(processedMockProducts);
        setError("Could not connect to server. Using sample data instead.");
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Function to load categories
  const loadCategories = async () => {
    try {
      // Determine if we're in development or production
      const baseUrl = window.location.origin;
      const isDevelopment = !baseUrl.includes("onrender.com");
      const apiUrl = isDevelopment ? "http://localhost:5000" : baseUrl;

      // Try to load categories from API
      const response = await axios.get(`${apiUrl}/api/categories`, { timeout: 5000 });
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
      } else {
        // Use default categories if API fails
        setCategories([
          { _id: "cat1", name: "Sofa Beds" },
          { _id: "cat2", name: "Tables" },
          { _id: "cat3", name: "Chairs" },
          { _id: "cat4", name: "Wardrobes" },
          { _id: "cat5", name: "Beds" }
        ]);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      
      // Use default categories if API fails
      setCategories([
        { _id: "cat1", name: "Sofa Beds" },
        { _id: "cat2", name: "Tables" },
        { _id: "cat3", name: "Chairs" },
        { _id: "cat4", name: "Wardrobes" },
        { _id: "cat5", name: "Beds" }
      ]);
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
        // Determine if we're in development or production
        const baseUrl = window.location.origin;
        const isDevelopment = !baseUrl.includes("onrender.com");
        const apiUrl = isDevelopment ? "http://localhost:5000" : baseUrl;

        // Delete product
        await axios.delete(`${apiUrl}/api/products/${productId}`);
        
        // Remove product from state
        setProducts(products.filter(product => product._id !== productId));
        
        // Show success message
        Swal.fire(
          "Deleted!",
          "Your product has been deleted.",
          "success"
        );
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

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold theme-text-primary">Products</h1>
          <Link to="/admin/products/add">
            <Button color="blue">Add New Product</Button>
          </Link>
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
          <ReliableProductTable 
            products={products} 
            onDeleteClick={handleDeleteProduct}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default ReliableProducts;
