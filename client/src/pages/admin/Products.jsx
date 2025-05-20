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
import {
  getImageUrl,
  fixProductsImageUrls,
  getCachedImageUrl,
  validateImageUrl,
  getDefaultImageForProduct,
} from "../../utils/imageHelper";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";
import Modal from "../../components/Modal";

// Using the imported getImageUrl function from imageHelper.js

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

  // Function to load products directly from the database
  const loadProductsDirectly = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      console.log("Loading all products directly from database...");

      // Import the getAllProducts function from robustApiHelper
      const { getAllProducts } = await import("../../utils/robustApiHelper");

      // Get all products directly from the database
      const productsData = await getAllProducts();

      console.log(
        `Successfully loaded ${productsData.length} products from database`
      );

      // If we have products data, process it
      if (productsData && productsData.length > 0) {
        // Process products to ensure they have all required fields
        const processedProducts = productsData.map((product) => {
          // Ensure product has all required fields
          return {
            ...product,
            // Ensure product has images array
            images:
              product.images &&
              Array.isArray(product.images) &&
              product.images.length > 0
                ? product.images
                : ["https://placehold.co/300x300/gray/white?text=Product"],
            // Ensure product has stock value
            stock: product.stock ?? 0,
          };
        });

        // Set the products
        setProducts(processedProducts);
        setFilteredProducts(processedProducts);

        // Show success message
        setSuccessMessage(
          `Successfully loaded ${processedProducts.length} products from database`
        );

        // Clear any error
        setError(null);

        return true;
      } else {
        // If no products found, throw an error
        throw new Error("No products found in database");
      }
    } catch (error) {
      console.error("Failed to load products directly:", error);

      // Provide detailed error information
      let errorMessage = "Failed to load products from database";

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);

        errorMessage += `: Server returned ${error.response.status}`;
        if (error.response.data && error.response.data.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        errorMessage += ": No response from server";
      } else {
        // Something happened in setting up the request
        errorMessage += `: ${error.message}`;
      }

      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to load products (just calls loadProductsDirectly)
  const testMongoDBConnection = async () => {
    await loadProductsDirectly();
  };

  // Function to try direct endpoint as a last resort (now just calls loadProductsDirectly)
  const tryDirectEndpoint = async () => {
    await loadProductsDirectly();
  };

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage("");

        console.log("Admin Products component mounted - fetching initial data");

        // Fetch categories first to ensure they're available for product processing
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

        // Process categories to ensure they have all required fields
        const processedCategories = fetchedCategories.map((category) => {
          return {
            ...category,
            _id:
              category._id ||
              `temp_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 9)}`,
            name: category.name || category.displayName || "Unknown Category",
            displayName:
              category.displayName || category.name || "Unknown Category",
          };
        });

        // Set categories immediately so they're available for product processing
        setCategories(processedCategories);
        console.log("Processed categories:", processedCategories);

        // Load products directly from the database
        await loadProductsDirectly();
      } catch (error) {
        console.error("Error in fetchData effect:", error);
        setError("Failed to load data: " + error.message);
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
        images: [
          "https://placehold.co/300x300/gray/white?text=No+Image",
          "https://placehold.co/300x300/gray/white?text=Chair+View+2",
        ],
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
        images: [
          "https://placehold.co/300x300/gray/white?text=No+Image",
          "https://placehold.co/300x300/gray/white?text=Sofa+Side+View",
          "https://placehold.co/300x300/gray/white?text=Sofa+Front",
        ],
      },
      {
        _id: "product4",
        name: "Classic Wardrobe",
        price: 34999,
        stock: 0,
        category: { _id: "category4", name: "Wardrobes" },
        images: ["https://placehold.co/300x300/gray/white?text=No+Image"],
      },
      {
        _id: "product5",
        name: "Dining Table Set",
        price: 39999,
        stock: 8,
        category: { _id: "category2", name: "Tables" },
        images: [
          "https://placehold.co/300x300/gray/white?text=Dining+Set",
          "https://placehold.co/300x300/gray/white?text=No+Image",
        ],
      },
    ];
  };

  // Function to generate standard categories
  const getMockCategories = () => {
    return [
      {
        _id: "680c9486ab11e96a288ef6db",
        name: "Chairs",
        displayName: "Chairs",
      },
      {
        _id: "680c9484ab11e96a288ef6da",
        name: "Tables",
        displayName: "Tables",
      },
      {
        _id: "680c9481ab11e96a288ef6d9",
        name: "Sofa Beds",
        displayName: "Sofa Beds",
      },
      {
        _id: "680c9489ab11e96a288ef6dc",
        name: "Wardrobes",
        displayName: "Wardrobes",
      },
      { _id: "680c948eab11e96a288ef6dd", name: "Beds", displayName: "Beds" },
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

  // Handle edit product
  const handleEditProduct = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  // Handle delete product
  const handleDeleteClick = (productId) => {
    setDeleteProductId(productId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);

      // Call the API to delete the product
      await productsAPI.delete(deleteProductId);

      // Remove the product from the state
      const updatedProducts = products.filter((p) => p._id !== deleteProductId);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);

      // Show success message
      setSuccessMessage("Product deleted successfully!");

      // Close the modal
      setShowDeleteModal(false);
      setDeleteProductId(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      setDeleteError(
        error.response?.data?.message || "Failed to delete product"
      );
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
          <Button onClick={loadProductsDirectly} variant="secondary">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            Reload Products
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
            <div className="relative">
              <select
                id="category"
                className="block w-full pl-3 pr-10 py-2 border theme-border rounded-md shadow-sm theme-bg-primary theme-text-primary focus:outline-none focus:ring-primary focus:border-primary"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {/* Default Categories First */}
                <option value="680c9481ab11e96a288ef6d9">Sofa Beds</option>
                <option value="680c9484ab11e96a288ef6da">Tables</option>
                <option value="680c9486ab11e96a288ef6db">Chairs</option>
                <option value="680c9489ab11e96a288ef6dc">Wardrobes</option>
                {/* Custom Categories */}
                {categories &&
                  categories
                    .filter(
                      (category) =>
                        // Filter out default categories that we already added
                        ![
                          "680c9481ab11e96a288ef6d9",
                          "680c9484ab11e96a288ef6da",
                          "680c9486ab11e96a288ef6db",
                          "680c9489ab11e96a288ef6dc",
                        ].includes(category._id)
                    )
                    .map((category) => {
                      const categoryName =
                        category.displayName ||
                        category.name ||
                        "Unknown Category";
                      const categoryId =
                        category._id ||
                        `temp_${Date.now()}_${Math.random()
                          .toString(36)
                          .substring(2, 9)}`;

                      return (
                        <option key={categoryId} value={categoryId}>
                          {categoryName}
                        </option>
                      );
                    })}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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
                    d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                  ></path>
                </svg>
              </div>
            </div>
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
                  {(() => {
                    // Find the category by ID
                    const category = categories.find(
                      (c) => c._id === categoryFilter
                    );
                    if (category) {
                      return category.displayName || category.name;
                    }

                    // If not found, check if it's a known category ID
                    const categoryMap = {
                      "680c9481ab11e96a288ef6d9": "Sofa Beds",
                      "680c9484ab11e96a288ef6da": "Tables",
                      "680c9486ab11e96a288ef6db": "Chairs",
                      "680c9489ab11e96a288ef6dc": "Wardrobes",
                      "680c948eab11e96a288ef6dd": "Beds",
                    };

                    return (
                      categoryMap[categoryFilter] ||
                      `Category ${categoryFilter.substring(0, 6)}`
                    );
                  })()}
                  "
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="flex space-x-2 overflow-x-auto"
                        style={{ maxWidth: "200px" }}
                      >
                        {/* Simplified and more reliable image display */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                          <img
                            src={getDefaultImageForProduct(
                              product.name,
                              product._id
                            )}
                            alt={`${product.name} - Image`}
                            className="w-full h-full object-cover hover:opacity-75 transition-opacity duration-150"
                            onError={(e) => {
                              console.error("Image load error:", {
                                originalSrc: e.target.src,
                                productName: product.name,
                              });
                              e.target.onerror = null;
                              // Use a very simple placeholder as last resort
                              e.target.src =
                                "https://placehold.co/300x300/gray/white?text=No+Image";
                            }}
                          />
                        </div>
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
                      {(() => {
                        // Get category name
                        let categoryName = "Uncategorized";
                        let categoryColor = "gray";

                        // Standard category colors
                        const categoryColors = {
                          "Sofa Beds": "indigo",
                          Tables: "blue",
                          Chairs: "green",
                          Wardrobes: "purple",
                          Beds: "pink",
                        };

                        // Handle different category formats
                        if (!product.category) {
                          categoryName = "Uncategorized";
                        } else if (typeof product.category === "object") {
                          // Use displayName first, then name, then fallback
                          categoryName =
                            product.category.displayName ||
                            product.category.name ||
                            "Unknown Category";
                        } else if (typeof product.category === "string") {
                          // Try to find category by ID in our categories list
                          const foundCategory = categories.find(
                            (c) =>
                              c._id === product.category ||
                              c.id === product.category
                          );

                          if (foundCategory) {
                            categoryName =
                              foundCategory.displayName || foundCategory.name;
                          } else {
                            // Check if it's a MongoDB ObjectId (24 hex chars)
                            if (
                              product.category.length === 24 &&
                              /^[0-9a-f]+$/.test(product.category)
                            ) {
                              // Try to map known category IDs to names
                              const categoryMap = {
                                "680c9481ab11e96a288ef6d9": "Sofa Beds",
                                "680c9484ab11e96a288ef6da": "Tables",
                                "680c9486ab11e96a288ef6db": "Chairs",
                                "680c9489ab11e96a288ef6dc": "Wardrobes",
                                "680c948eab11e96a288ef6dd": "Beds",
                              };

                              if (categoryMap[product.category]) {
                                categoryName = categoryMap[product.category];
                              } else {
                                categoryName = `Category ${product.category.substring(
                                  product.category.length - 6
                                )}`;
                              }
                            } else {
                              categoryName = `Category ${product.category
                                .replace(/[^a-zA-Z0-9]/g, " ")
                                .trim()}`;
                            }
                          }
                        }

                        // Determine color based on category name
                        if (categoryColors[categoryName]) {
                          categoryColor = categoryColors[categoryName];
                        } else {
                          // Generate a consistent color based on the category name
                          const nameHash = categoryName
                            .split("")
                            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                          const colors = [
                            "blue",
                            "green",
                            "indigo",
                            "purple",
                            "pink",
                            "yellow",
                            "red",
                            "orange",
                          ];
                          categoryColor = colors[nameHash % colors.length];
                        }

                        const colorClasses = {
                          blue: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
                          green:
                            "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
                          indigo:
                            "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700",
                          purple:
                            "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
                          pink: "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700",
                          yellow:
                            "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
                          red: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
                          orange:
                            "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
                          gray: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
                        };

                        return (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full border ${colorClasses[categoryColor]}`}
                          >
                            {categoryName}
                          </span>
                        );
                      })()}
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
                        onClick={() => handleDeleteClick(product._id)}
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
        onClose={() => !deleteLoading && setShowDeleteModal(false)}
        title="Delete Product"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this product? This action cannot be
            undone.
          </p>
          {deleteError && (
            <Alert type="error" message={deleteError} className="mb-4" />
          )}
          <div className="flex justify-end gap-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleteLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminProducts;
