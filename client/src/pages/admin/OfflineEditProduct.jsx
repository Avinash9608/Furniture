import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import { 
  getProductFromLocalStorage, 
  saveProductToLocalStorage,
  getCategoriesFromLocalStorage
} from "../../utils/localStorageHelper";

/**
 * A completely offline product edit page that works without any server requests.
 * Uses only localStorage for data storage.
 */
const OfflineEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State for product data
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: 0,
    discountPrice: 0,
    stock: 0,
    category: "",
    material: "",
    color: "",
    featured: false,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    }
  });

  // State for categories
  const [categories, setCategories] = useState([]);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load product and categories on component mount
  useEffect(() => {
    loadProduct();
    loadCategories();
  }, [id]);

  // Function to load product from localStorage
  const loadProduct = () => {
    try {
      setLoading(true);
      
      // Get product from localStorage
      const localProduct = getProductFromLocalStorage(id);
      
      if (localProduct) {
        // Format the product data for the form
        setProduct({
          ...localProduct,
          category: typeof localProduct.category === 'object' ? localProduct.category._id : localProduct.category,
          dimensions: localProduct.dimensions || { length: 0, width: 0, height: 0 }
        });
        
        setSuccessMessage("Product loaded successfully");
      } else {
        setError(`Product with ID ${id} not found`);
        
        // Navigate back to products page after 3 seconds
        setTimeout(() => {
          navigate("/admin/products");
        }, 3000);
      }
    } catch (error) {
      console.error("Error loading product from localStorage:", error);
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  // Function to load categories from localStorage
  const loadCategories = () => {
    try {
      // Get categories from localStorage
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

  // Function to handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., dimensions.length)
      const [parent, child] = name.split('.');
      setProduct({
        ...product,
        [parent]: {
          ...product[parent],
          [child]: type === 'number' ? Number(value) : value
        }
      });
    } else {
      // Handle regular properties
      setProduct({
        ...product,
        [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
      });
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Show loading indicator
      setLoading(true);
      
      // Format the product data for saving
      const productToSave = {
        ...product,
        category: categories.find(cat => cat._id === product.category) || product.category,
        updatedAt: new Date().toISOString()
      };
      
      // Save product to localStorage
      const savedProduct = saveProductToLocalStorage(productToSave);
      
      // Show success message
      Swal.fire({
        title: "Success!",
        text: "Product updated successfully",
        icon: "success",
        confirmButtonText: "OK"
      }).then(() => {
        // Navigate back to products page
        navigate("/admin/products", { 
          state: { successMessage: "Product updated successfully" } 
        });
      });
    } catch (error) {
      console.error("Error updating product:", error);
      
      // Show error message
      setError("Failed to update product");
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Product (Offline Mode)</h1>
          <Button color="blue" onClick={() => navigate("/admin/products")}>
            Back to Products
          </Button>
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
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Discount Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Price (₹)
                </label>
                <input
                  type="number"
                  name="discountPrice"
                  value={product.discountPrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={product.stock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                  min="0"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={product.featured}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Featured Product
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <Button type="submit" color="blue" disabled={loading} fullWidth>
                {loading ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default OfflineEditProduct;
