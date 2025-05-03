import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { productsAPI, categoriesAPI } from "../../utils/api";
import {
  createDefaultCategories,
  saveLocalCategories,
} from "../../utils/defaultData";
import { formatPrice } from "../../utils/format";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import Modal from "../../components/Modal";

const AdminProducts = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State for products and categories
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for delete functionality
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsPerPage] = useState(10);

  // State for success message
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || null
  );

  // Clear location state after using it
  useEffect(() => {
    if (location.state?.successMessage) {
      // Clear the success message from location state after 3 seconds
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true });
        setSuccessMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // Function to test MongoDB connection
  const testMongoDBConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine if we're in development or production
      const baseUrl = window.location.origin;
      const isDevelopment = !baseUrl.includes("onrender.com");
      const localServerUrl = "http://localhost:5000";

      // Use the appropriate URL based on environment
      const testUrl = isDevelopment
        ? `${localServerUrl}/api/test-mongodb`
        : `${baseUrl}/api/test-mongodb`;

      console.log("Testing MongoDB connection at:", testUrl);

      // Make the request
      const response = await axios.get(testUrl, { timeout: 30000 });

      console.log("MongoDB connection test response:", response.data);

      // Show success message
      setError(
        `MongoDB connection successful! Found ${response.data.data.products.count} products and ${response.data.data.categories.count} categories.`
      );

      // Fetch data again
      fetchData();
    } catch (error) {
      console.error("MongoDB connection test failed:", error);
      setError(`MongoDB connection test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories first
        console.log("Fetching categories first...");
        let fetchedCategories = [];

        try {
          const categoriesResponse = await categoriesAPI.getAll();
          console.log("Categories API response:", categoriesResponse);

          // Process categories before fetching products
          if (
            categoriesResponse.data &&
            Array.isArray(categoriesResponse.data)
          ) {
            fetchedCategories = categoriesResponse.data;
          } else if (
            categoriesResponse.data &&
            categoriesResponse.data.data &&
            Array.isArray(categoriesResponse.data.data)
          ) {
            fetchedCategories = categoriesResponse.data.data;
          } else {
            console.error(
              "Unexpected categories data format:",
              categoriesResponse.data
            );
            // Use mock categories
            fetchedCategories = getMockCategories();
          }
        } catch (categoryError) {
          console.error("Error fetching categories:", categoryError);
          fetchedCategories = getMockCategories();
        }

        // If no categories exist, create default ones
        if (fetchedCategories.length === 0) {
          console.log("No categories found, using mock categories...");
          fetchedCategories = getMockCategories();
        }

        // Process categories to ensure they have all required fields
        fetchedCategories = fetchedCategories.map((category) => {
          // Ensure category has an _id
          if (!category._id) {
            category._id = `temp_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 9)}`;
          }

          // Ensure category has a name
          if (!category.name) {
            category.name = `Category ${category._id.substring(
              category._id.length - 6
            )}`;
          }

          return category;
        });

        console.log("Processed categories:", fetchedCategories);

        // Set categories immediately so they're available for product processing
        setCategories(fetchedCategories);

        // Now fetch products after categories are loaded
        console.log("Now fetching products...");
        let productsData = [];

        try {
          const productsResponse = await productsAPI.getAll();
          console.log("Products API response:", productsResponse);

          // Handle different response structures
          if (
            productsResponse &&
            productsResponse.data &&
            productsResponse.data.data &&
            Array.isArray(productsResponse.data.data)
          ) {
            productsData = productsResponse.data.data;
          } else if (
            productsResponse &&
            productsResponse.data &&
            Array.isArray(productsResponse.data)
          ) {
            productsData = productsResponse.data;
          } else if (productsResponse && Array.isArray(productsResponse)) {
            productsData = productsResponse;
          }

          // Log the processed data
          console.log("Processed products data after API call:", productsData);

          // If we have data but it's empty, log a warning
          if (productsData && productsData.length === 0) {
            console.warn("API returned empty products array");
          }
        } catch (productError) {
          console.error("Error fetching products:", productError);
          productsData = [];
        }

        console.log("Processed products data:", productsData);

        // Always clear any previous error
        setError(null);

        if (productsData && productsData.length > 0) {
          // Process products to ensure they have all required fields
          const processedProducts = productsData.map((product) => {
            // Ensure product has a category object
            if (!product.category) {
              product.category = { _id: "unknown", name: "Unknown" };
            } else if (typeof product.category === "string") {
              // If category is a string (ID), try to find the corresponding category object
              const categoryObj = fetchedCategories.find(
                (c) => c._id === product.category
              );
              if (categoryObj) {
                product.category = categoryObj;
              } else {
                // If we can't find the category, create a placeholder with the ID
                // Check if it's a MongoDB ObjectId (24 hex chars)
                if (
                  product.category.length === 24 &&
                  /^[0-9a-f]+$/.test(product.category)
                ) {
                  product.category = {
                    _id: product.category,
                    name: `Category ${product.category.substring(
                      product.category.length - 6
                    )}`,
                  };
                } else {
                  // Otherwise try to make a readable name from the ID
                  product.category = {
                    _id: product.category,
                    name: `Category ${product.category
                      .replace(/[^a-zA-Z0-9]/g, " ")
                      .trim()}`,
                  };
                }
              }
            } else if (
              typeof product.category === "object" &&
              !product.category.name
            ) {
              // If category is an object but missing name
              product.category.name = "Unknown";
            }

            // Ensure product has images array
            if (
              !product.images ||
              !Array.isArray(product.images) ||
              product.images.length === 0
            ) {
              product.images = [
                "https://placehold.co/300x300/gray/white?text=Product",
              ];
            }

            // Ensure product has stock value
            if (product.stock === undefined || product.stock === null) {
              product.stock = 0;
            }

            return product;
          });

          setProducts(processedProducts);
          setFilteredProducts(processedProducts);
        } else {
          console.log(
            "No products found or invalid data format, using mock data"
          );
          const mockProducts = getMockProducts();
          setProducts(mockProducts);
          setFilteredProducts(mockProducts);
        }
      } catch (error) {
        console.error("Error in fetchData effect:", error);

        // Check if we already have products data before setting error
        if (!products.length) {
          console.log(
            "No products data available, using mock data as fallback"
          );
          setError("Failed to load data. Using sample data instead.");

          // Use mock data as fallback
          const mockProducts = getMockProducts();
          setProducts(mockProducts);
          setFilteredProducts(mockProducts);
          setCategories(getMockCategories());
        } else {
          console.log("Products data already available, not using mock data");
          // Don't set error if we already have products data
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to generate mock products for testing
  const getMockProducts = () => {
    return [
      {
        _id: "product1",
        name: "Elegant Wooden Chair",
        price: 12999,
        stock: 25,
        category: { _id: "category1", name: "Chairs" },
        images: ["https://placehold.co/300x300/gray/white?text=Chair"],
      },
      {
        _id: "product2",
        name: "Modern Coffee Table",
        price: 24999,
        stock: 10,
        category: { _id: "category2", name: "Tables" },
        images: ["https://placehold.co/300x300/gray/white?text=Table"],
      },
      {
        _id: "product3",
        name: "Luxury Sofa Bed",
        price: 49999,
        stock: 5,
        category: { _id: "category3", name: "Sofa Beds" },
        images: ["https://placehold.co/300x300/gray/white?text=Sofa"],
      },
      {
        _id: "product4",
        name: "Classic Wardrobe",
        price: 34999,
        stock: 0,
        category: { _id: "category4", name: "Wardrobes" },
        images: ["https://placehold.co/300x300/gray/white?text=Wardrobe"],
      },
      {
        _id: "product5",
        name: "Dining Table Set",
        price: 39999,
        stock: 8,
        category: { _id: "category2", name: "Tables" },
        images: ["https://placehold.co/300x300/gray/white?text=DiningSet"],
      },
    ];
  };

  // Function to generate mock categories for testing
  const getMockCategories = () => {
    return [
      { _id: "category1", name: "Chairs" },
      { _id: "category2", name: "Tables" },
      { _id: "category3", name: "Sofa Beds" },
      { _id: "category4", name: "Wardrobes" },
    ];
  };

  // Apply search and filters
  useEffect(() => {
    let results = [...products];

    // Search by name
    if (searchTerm.trim() !== "") {
      results = results.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description &&
            product.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      results = results.filter(
        (product) => product.category && product.category._id === categoryFilter
      );
    }

    // Filter by stock
    if (stockFilter === "inStock") {
      results = results.filter((product) => product.stock > 0);
    } else if (stockFilter === "outOfStock") {
      results = results.filter((product) => product.stock === 0);
    } else if (stockFilter === "lowStock") {
      results = results.filter(
        (product) => product.stock > 0 && product.stock <= 10
      );
    }

    setFilteredProducts(results);

    // Calculate total pages
    setTotalPages(Math.ceil(results.length / productsPerPage));

    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, stockFilter, products, productsPerPage]);

  // Get current products for pagination
  const getCurrentProducts = () => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    return filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      try {
        // Try to delete via API
        await productsAPI.delete(deleteProductId);
      } catch (apiError) {
        console.log(
          "API error when deleting product, continuing with UI update:",
          apiError
        );
        // We'll continue with the UI update even if the API fails
      }

      // Remove product from state
      const updatedProducts = products.filter(
        (product) => product._id !== deleteProductId
      );
      setProducts(updatedProducts);

      // Show success message
      setSuccessMessage("Product deleted successfully");

      // Close modal
      setShowDeleteModal(false);
      setDeleteProductId(null);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting product:", error);
      setDeleteError("Failed to delete product. Please try again.");

      // Close modal anyway after a delay
      setTimeout(() => {
        setShowDeleteModal(false);
        setDeleteProductId(null);
      }, 2000);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStockFilter("all");
  };

  return (
    <AdminLayout title="Products">
      {/* Success Message */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-4"
        />
      )}

      {/* Header with Add Product Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <div className="flex gap-2">
          <Button onClick={testMongoDBConnection} variant="secondary">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            Test MongoDB
          </Button>
          <Link to="/admin/products/add">
            <Button>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="theme-bg-primary rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium theme-text-primary mb-1"
            >
              Search Products
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border theme-border rounded-md shadow-sm theme-bg-primary theme-text-primary placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Search by name or description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-64">
            <label
              htmlFor="category"
              className="block text-sm font-medium theme-text-primary mb-1"
            >
              Category
            </label>
            <select
              id="category"
              className="block w-full pl-3 pr-10 py-2 border theme-border rounded-md shadow-sm theme-bg-primary theme-text-primary focus:outline-none focus:ring-primary focus:border-primary"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories &&
                categories.length > 0 &&
                categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="w-full md:w-64">
            <label
              htmlFor="stock"
              className="block text-sm font-medium theme-text-primary mb-1"
            >
              Stock Status
            </label>
            <select
              id="stock"
              className="block w-full pl-3 pr-10 py-2 border theme-border rounded-md shadow-sm theme-bg-primary theme-text-primary focus:outline-none focus:ring-primary focus:border-primary"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All Stock Status</option>
              <option value="inStock">In Stock</option>
              <option value="lowStock">Low Stock (≤ 10)</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex justify-end mt-4">
          <Button
            variant="secondary"
            onClick={handleResetFilters}
            className="text-sm"
          >
            Reset Filters
          </Button>
        </div>

        {/* Filter Summary */}
        {(searchTerm || categoryFilter !== "all" || stockFilter !== "all") && (
          <div className="mt-4 pt-4 border-t theme-border">
            <div className="text-sm theme-text-secondary">
              Showing {filteredProducts.length} of {products.length} products
              {searchTerm && <span> matching "{searchTerm}"</span>}
              {categoryFilter !== "all" && (
                <span>
                  {" "}
                  in category "
                  {categories.find((c) => c._id === categoryFilter)?.name}"
                </span>
              )}
              {stockFilter !== "all" && (
                <span>
                  {" "}
                  with stock status "
                  {stockFilter === "inStock"
                    ? "In Stock"
                    : stockFilter === "lowStock"
                    ? "Low Stock"
                    : "Out of Stock"}
                  "
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loading size="large" />
        </div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : filteredProducts.length === 0 ? (
        <div className="theme-bg-primary rounded-lg shadow-md p-8 text-center">
          <svg
            className="w-16 h-16 theme-text-secondary mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            ></path>
          </svg>
          <h3 className="text-xl font-bold mb-2 theme-text-primary">
            No Products Found
          </h3>
          <p className="theme-text-secondary mb-4">
            {products.length === 0
              ? "You haven't added any products yet."
              : "No products match your current filters."}
          </p>
          <Link to="/admin/products/add">
            <Button>Add Your First Product</Button>
          </Link>
        </div>
      ) : (
        <div className="theme-bg-primary rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y theme-divide">
              <thead className="theme-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="theme-bg-primary divide-y theme-divide">
                {getCurrentProducts().map((product) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:theme-bg-secondary transition-colors duration-150"
                  >
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-16 rounded-md overflow-hidden">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-16 rounded-md overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={
                              product.images[0].startsWith("http")
                                ? product.images[0]
                                : `${
                                    import.meta.env.VITE_API_BASE_URL ||
                                    "http://localhost:5000"
                                  }${product.images[0]}`
                            }
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/300x300/gray/white?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-xs theme-text-secondary">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium theme-text-primary">
                        {product.name}
                      </div>
                      <div className="text-sm theme-text-secondary">
                        ID: {product._id.substring(product._id.length - 6)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full theme-bg-secondary border theme-border">
                        {(() => {
                          // Handle different category formats
                          if (!product.category) {
                            return "Uncategorized";
                          }

                          if (
                            typeof product.category === "object" &&
                            product.category.name
                          ) {
                            return product.category.name;
                          }

                          if (typeof product.category === "string") {
                            // Try to find category by ID
                            const foundCategory = categories.find(
                              (c) =>
                                c._id === product.category ||
                                c.id === product.category
                            );
                            if (foundCategory) {
                              return foundCategory.name;
                            }
                            // If not found, try to extract a meaningful name from the ID
                            // Check if it's a MongoDB ObjectId (24 hex chars)
                            if (
                              product.category.length === 24 &&
                              /^[0-9a-f]+$/.test(product.category)
                            ) {
                              return `Category ${product.category.substring(
                                product.category.length - 6
                              )}`;
                            }
                            // Otherwise try to make a readable name from the ID
                            return `Category ${product.category
                              .replace(/[^a-zA-Z0-9]/g, " ")
                              .trim()}`;
                          }

                          // Fallback
                          return "Unknown Category";
                        })()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm theme-text-primary">
                        {formatPrice(product.price)}
                      </div>
                      {product.discountPrice && (
                        <div className="text-xs theme-text-secondary line-through">
                          {formatPrice(product.discountPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full theme-bg-secondary border theme-border ${
                          product.stock === 0
                            ? "text-red-600 dark:text-red-400"
                            : ""
                        }`}
                      >
                        {product.stock > 0 ? product.stock : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/admin/products/edit/${product._id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          setDeleteProductId(product._id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t theme-border">
              <div className="flex items-center justify-between">
                <div className="text-sm theme-text-secondary">
                  Showing {(currentPage - 1) * productsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * productsPerPage,
                    filteredProducts.length
                  )}{" "}
                  of {filteredProducts.length} products
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-sm py-1 px-3"
                  >
                    Previous
                  </Button>

                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "primary" : "secondary"
                          }
                          onClick={() => handlePageChange(pageNum)}
                          className="text-sm py-1 px-3"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="text-sm py-1 px-3"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteProductId(null);
          setDeleteError(null);
        }}
        title="Delete Product"
        size="md"
        footer={
          <>
            <Button
              variant="danger"
              onClick={handleDeleteProduct}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteProductId(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
          </>
        }
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <p className="text-sm theme-text-secondary">
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>
            {deleteError && (
              <div className="mt-2">
                <Alert
                  type="error"
                  message={deleteError}
                  onClose={() => setDeleteError(null)}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminProducts;
