import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import OfflineProductTable from "../../components/admin/OfflineProductTable";
import { 
  getProductsFromLocalStorage, 
  saveProductsToLocalStorage,
  deleteProductFromLocalStorage,
  getCategoriesFromLocalStorage
} from "../../utils/localStorageHelper";

/**
 * A completely offline admin products page that works without any server requests.
 * Uses only localStorage for data storage and client-side placeholder images.
 */
const OfflineProducts = () => {
  // State for products and categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load products and categories from localStorage on component mount
  useEffect(() => {
    loadProductsFromLocalStorage();
    loadCategoriesFromLocalStorage();
  }, []);

  // Function to load products from localStorage
  const loadProductsFromLocalStorage = () => {
    try {
      setLoading(true);
      
      // Get products from localStorage
      const localProducts = getProductsFromLocalStorage();
      
      if (localProducts && localProducts.length > 0) {
        setProducts(localProducts);
        setSuccessMessage(`Loaded ${localProducts.length} products from local storage`);
      } else {
        // Create sample products if none found
        const sampleProducts = createSampleProducts();
        saveProductsToLocalStorage(sampleProducts);
        setProducts(sampleProducts);
        setSuccessMessage("Created sample products in local storage");
      }
      
      setError(null);
    } catch (error) {
      console.error("Error loading products from localStorage:", error);
      setError("Failed to load products from local storage");
      
      // Create sample products as fallback
      const sampleProducts = createSampleProducts();
      setProducts(sampleProducts);
    } finally {
      setLoading(false);
    }
  };

  // Function to load categories from localStorage
  const loadCategoriesFromLocalStorage = () => {
    try {
      // Get categories from localStorage (will return default categories if none found)
      const localCategories = getCategoriesFromLocalStorage();
      setCategories(localCategories);
    } catch (error) {
      console.error("Error loading categories from localStorage:", error);
      
      // Use default categories as fallback
      setCategories([
        { _id: 'cat1', name: 'Sofa Beds' },
        { _id: 'cat2', name: 'Tables' },
        { _id: 'cat3', name: 'Chairs' },
        { _id: 'cat4', name: 'Wardrobes' },
        { _id: 'cat5', name: 'Beds' }
      ]);
    }
  };

  // Function to create sample products
  const createSampleProducts = () => {
    return [
      {
        _id: "sample1",
        name: "Elegant Sofa",
        price: 12999,
        stock: 5,
        category: { _id: "cat1", name: "Sofa Beds" },
        description: "A comfortable and elegant sofa for your living room.",
        createdAt: new Date().toISOString()
      },
      {
        _id: "sample2",
        name: "Dining Table",
        price: 8999,
        stock: 3,
        category: { _id: "cat2", name: "Tables" },
        description: "A sturdy dining table for family gatherings.",
        createdAt: new Date().toISOString()
      },
      {
        _id: "sample3",
        name: "Office Chair",
        price: 4999,
        stock: 10,
        category: { _id: "cat3", name: "Chairs" },
        description: "An ergonomic office chair for comfortable work.",
        createdAt: new Date().toISOString()
      },
      {
        _id: "sample4",
        name: "Wooden Wardrobe",
        price: 15999,
        stock: 2,
        category: { _id: "cat4", name: "Wardrobes" },
        description: "A spacious wooden wardrobe for your bedroom.",
        createdAt: new Date().toISOString()
      },
      {
        _id: "sample5",
        name: "King Size Bed",
        price: 18999,
        stock: 4,
        category: { _id: "cat5", name: "Beds" },
        description: "A luxurious king size bed for ultimate comfort.",
        createdAt: new Date().toISOString()
      }
    ];
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
        // Delete product from localStorage
        const deleted = deleteProductFromLocalStorage(productId);
        
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
            "Failed to delete product. Product not found.",
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

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Products (Offline Mode)</h1>
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
          <OfflineProductTable 
            products={products} 
            onDeleteClick={handleDeleteProduct}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default OfflineProducts;
