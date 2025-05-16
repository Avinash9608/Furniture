import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import Button from "../components/Button";
import { productsAPI, categoriesAPI } from "../utils/api";
import { formatPrice } from "../utils/format";
import { validateCategories } from "../utils/safeDataHandler";

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get("category");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: categoryParam || "",
    priceRange: [0, 100000],
    sort: "newest",
    search: "",
  });
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage("");

        console.log("Products component mounted - fetching initial data");

        // Try to fetch products directly first
        try {
          // Determine if we're in development or production
          const baseUrl = window.location.origin;
          const isDevelopment = !baseUrl.includes("onrender.com");
          const localServerUrl = "http://localhost:5000";
          const deployedUrl = "https://furniture-q3nb.onrender.com";

          // Use the appropriate URL based on environment
          const directUrl = isDevelopment
            ? `${localServerUrl}/api/direct/products`
            : `${baseUrl}/api/direct/products`;

          console.log("Trying direct products endpoint:", directUrl);

          const directResponse = await axios.get(directUrl, { timeout: 30000 });

          if (directResponse.data && directResponse.data.data) {
            console.log(
              "Direct products endpoint success:",
              directResponse.data
            );

            // Filter out any invalid products
            const validProducts = directResponse.data.data.filter(
              (product) => product && typeof product === "object" && product._id
            );

            if (validProducts.length !== directResponse.data.data.length) {
              console.warn(
                `Filtered out ${
                  directResponse.data.data.length - validProducts.length
                } invalid products`
              );
            }

            // Set the products
            setProducts(validProducts);
            setTotalPages(Math.ceil(directResponse.data.count / 12));

            // Find the highest price for the price range filter
            if (validProducts.length > 0) {
              const highestPrice = Math.max(
                ...validProducts.map((product) =>
                  typeof product.price === "number" ? product.price : 0
                )
              );
              setMaxPrice(highestPrice);
              setPriceRange([0, highestPrice]);
            }

            // Set success message
            setSuccessMessage(
              `Found ${directResponse.data.count} products from source: ${
                directResponse.data.source || "direct"
              }`
            );

            // Set loading to false to prevent fetchProducts from overriding our data
            setLoading(false);

            // Skip the regular fetchProducts call
            return;
          }
        } catch (directError) {
          console.error("Direct products endpoint failed:", directError);
          // Continue with normal flow
        }

        // Fetch categories
        const categoriesResponse = await categoriesAPI.getAll();
        console.log("Raw categories response:", categoriesResponse);

        // Define the valid category names and their corresponding IDs
        const categoryMapping = {
          "680c9481ab11e96a288ef6d9": "Sofa Beds",
          "680c9484ab11e96a288ef6da": "Tables",
          "680c9486ab11e96a288ef6db": "Chairs",
          "680c9489ab11e96a288ef6dc": "Wardrobes",
        };

        const validCategoryNames = Object.values(categoryMapping);

        // First validate the categories to ensure they all have required properties
        let validatedCategories = [];

        try {
          // Handle different response formats
          if (
            categoriesResponse.data &&
            Array.isArray(categoriesResponse.data)
          ) {
            validatedCategories = validateCategories(
              categoriesResponse.data,
              categoryMapping
            );
          } else if (
            categoriesResponse.data &&
            categoriesResponse.data.data &&
            Array.isArray(categoriesResponse.data.data)
          ) {
            validatedCategories = validateCategories(
              categoriesResponse.data.data,
              categoryMapping
            );
          } else if (Array.isArray(categoriesResponse)) {
            validatedCategories = validateCategories(
              categoriesResponse,
              categoryMapping
            );
          } else {
            console.error(
              "Unexpected categories response format:",
              categoriesResponse
            );
            // Create fallback categories from the mapping
            validatedCategories = Object.entries(categoryMapping).map(
              ([id, name]) => ({
                _id: id,
                name: name,
                slug: name.toLowerCase().replace(/\s+/g, "-"),
                description: `${name} collection`,
              })
            );
          }
        } catch (validationError) {
          console.error("Error validating categories:", validationError);
          // Create fallback categories from the mapping
          validatedCategories = Object.entries(categoryMapping).map(
            ([id, name]) => ({
              _id: id,
              name: name,
              slug: name.toLowerCase().replace(/\s+/g, "-"),
              description: `${name} collection`,
            })
          );
        }

        console.log("Validated categories:", validatedCategories);

        // Then filter them by name if they have valid names
        const filteredCategories = validatedCategories.filter(
          (category) =>
            category &&
            category.name &&
            (validCategoryNames.includes(category.name) ||
              // Also include categories with MongoDB IDs that might not have proper names yet
              (typeof category._id === "string" &&
                category._id.length === 24 &&
                /^[0-9a-f]+$/.test(category._id)))
        );

        console.log(
          "Filtered categories for product page:",
          filteredCategories
        );
        setCategories(filteredCategories);

        // Only fetch products if we don't already have them from the direct endpoint
        if (products.length === 0) {
          console.log("No products loaded yet, fetching with filters...");
          await fetchProducts();
        } else {
          console.log(
            "Products already loaded from direct endpoint, skipping fetchProducts"
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load products. Please try again later.");

        // Set fallback categories in case of error
        const categoryMapping = {
          "680c9481ab11e96a288ef6d9": "Sofa Beds",
          "680c9484ab11e96a288ef6da": "Tables",
          "680c9486ab11e96a288ef6db": "Chairs",
          "680c9489ab11e96a288ef6dc": "Wardrobes",
        };

        // Create fallback categories with proper IDs
        const fallbackCategories = Object.entries(categoryMapping).map(
          ([id, name]) => ({
            _id: id,
            name: name,
            slug: name.toLowerCase().replace(/\s+/g, "-"),
            description: `${name} collection`,
          })
        );
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  // State for success message
  const [successMessage, setSuccessMessage] = useState("");

  // Function to test MongoDB connection and products
  const testProductsConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      // Determine if we're in development or production
      const baseUrl = window.location.origin;
      const isDevelopment = !baseUrl.includes("onrender.com");
      const localServerUrl = "http://localhost:5000";

      // Use the appropriate URL based on environment
      const testUrl = isDevelopment
        ? `${localServerUrl}/api/test/products-page`
        : `${baseUrl}/api/test/products-page`;

      console.log("Testing products connection at:", testUrl);

      // Make the request
      const response = await axios.get(testUrl, { timeout: 30000 });

      console.log("Products connection test response:", response.data);

      if (response.data) {
        // Extract the products data based on the response structure
        let productsData = [];
        let productsCount = 0;
        let dataSource = "unknown";

        if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
          productsCount = response.data.count || productsData.length;
          dataSource = response.data.source || "api";
        } else if (Array.isArray(response.data)) {
          productsData = response.data;
          productsCount = productsData.length;
          dataSource = "direct_array";
        }

        if (productsData.length > 0) {
          // Filter out any invalid products
          const validProducts = productsData.filter(
            (product) => product && typeof product === "object" && product._id
          );

          if (validProducts.length !== productsData.length) {
            console.warn(
              `Filtered out ${
                productsData.length - validProducts.length
              } invalid products`
            );
          }

          // Set success message
          setSuccessMessage(
            `Products connection successful! Found ${productsCount} products from source: ${dataSource}`
          );

          // Set the products
          setProducts(validProducts);
          setTotalPages(Math.ceil(productsCount / 12));

          // Find the highest price for the price range filter
          const highestPrice = Math.max(
            ...productsData.map((product) =>
              typeof product.price === "number" ? product.price : 0
            )
          );
          setMaxPrice(highestPrice);
          setPriceRange([0, highestPrice]);
        } else {
          setError("No products found in the database");
        }
      } else {
        setError("Invalid response format from server");
      }
    } catch (error) {
      console.error("Products connection test failed:", error);
      setError(`Products connection test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products based on current filters
  const fetchProducts = async () => {
    try {
      console.log("Fetching products with filters:", filters);
      const params = {
        page: currentPage,
        limit: 12,
      };

      // Add category filter if selected
      if (filters.category) {
        // Always use the category ID for filtering if it's a MongoDB ObjectId
        if (
          filters.category.length === 24 &&
          /^[0-9a-f]+$/.test(filters.category)
        ) {
          params.category = filters.category;
          console.log(
            `Using MongoDB ObjectId for category filter: ${filters.category}`
          );
        } else {
          // For slug-based filtering, try to find the matching category ID first
          const matchingCategory = categories.find(
            (cat) =>
              cat.slug === filters.category ||
              cat.name.toLowerCase() === filters.category.toLowerCase()
          );

          if (matchingCategory && matchingCategory._id) {
            params.category = matchingCategory._id;
            console.log(
              `Mapped category slug "${filters.category}" to ID: ${matchingCategory._id}`
            );
          } else {
            params.category = filters.category;
            console.log(`Using category slug directly: ${filters.category}`);
          }
        }
      }

      // Add price range filter
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) {
        params.minPrice = filters.priceRange[0];
        params.maxPrice = filters.priceRange[1];
      }

      // Add sort parameter
      if (filters.sort === "price-low-high") {
        params.sort = "price";
      } else if (filters.sort === "price-high-low") {
        params.sort = "-price";
      } else if (filters.sort === "newest") {
        params.sort = "-createdAt";
      } else if (filters.sort === "rating") {
        params.sort = "-ratings";
      }

      // Add search parameter
      if (filters.search) {
        params.search = filters.search;
      }

      console.log("Sending API request with params:", params);
      const response = await productsAPI.getAll(params);
      console.log("Products API response:", response.data);

      // Extract the products data based on the response structure
      let productsData = [];
      let totalCount = 0;
      let dataSource = "unknown";

      console.log("API response structure:", {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        hasNestedData: response.data && response.data.data,
        nestedIsArray:
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data),
        source: response.data && response.data.source,
      });

      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        productsData = response.data.data;
        totalCount = response.data.count || productsData.length;
        dataSource = response.data.source || "api";
        console.log(
          `Using nested data array with ${productsData.length} products from ${dataSource}`
        );
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
        totalCount = productsData.length;
        dataSource = "direct_array";
        console.log(`Using direct array with ${productsData.length} products`);
      } else if (response.data && response.data.data) {
        // If data.data is not an array but exists, convert to array
        productsData = [response.data.data];
        totalCount = 1;
        dataSource = response.data.source || "single_item";
        console.log(
          `Converting nested non-array data to array from ${dataSource}`
        );
      } else if (response.data) {
        // If data exists but not in expected format, try to use it
        productsData = [response.data];
        totalCount = 1;
        dataSource = "unknown_format";
        console.log("Converting direct non-array data to array");
      }

      if (Array.isArray(productsData) && productsData.length > 0) {
        console.log(
          `Successfully fetched ${productsData.length} products from ${dataSource}`
        );

        // Filter out any invalid products
        const validProducts = productsData.filter(
          (product) => product && typeof product === "object" && product._id
        );

        if (validProducts.length !== productsData.length) {
          console.warn(
            `Filtered out ${
              productsData.length - validProducts.length
            } invalid products`
          );
        }

        setProducts(validProducts);
        setTotalPages(Math.ceil(totalCount / 12));

        // Find the highest price for the price range filter
        if (validProducts.length > 0) {
          const highestPrice = Math.max(
            ...validProducts.map((product) =>
              typeof product.price === "number" ? product.price : 0
            )
          );
          setMaxPrice(highestPrice);
          setPriceRange([0, highestPrice]);
        }
      } else {
        console.error(
          "Unexpected API response format or empty data:",
          response.data
        );
        setError(
          "No products found or received invalid data format from server"
        );
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(`Failed to load products: ${error.message || "Unknown error"}`);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value,
    }));

    // Reset to first page when filters change
    setCurrentPage(1);

    // Update URL query params
    const queryParams = new URLSearchParams(location.search);

    if (filterName === "category") {
      if (value) {
        queryParams.set("category", value);
      } else {
        queryParams.delete("category");
      }
    }

    navigate({
      pathname: location.pathname,
      search: queryParams.toString(),
    });

    // Fetch products with new filters
    fetchProducts();
  };

  // This function is intentionally left as a placeholder for future slider implementation

  // Apply price range filter when user stops dragging
  const handlePriceRangeChangeCommitted = () => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      priceRange,
    }));

    // Fetch products with new price range
    fetchProducts();
  };

  // Handle search input
  const handleSearch = (event) => {
    event.preventDefault();
    handleFilterChange("search", filters.search);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
    fetchProducts();
  };

  // Toggle mobile filters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="theme-bg-primary min-h-screen">
      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">
            {filters.category
              ? (() => {
                  // If it's a MongoDB ObjectId, map it to a proper category name
                  if (
                    filters.category.length === 24 &&
                    /^[0-9a-f]+$/.test(filters.category)
                  ) {
                    // First try to find the category in our loaded categories
                    const matchingCategory = categories.find(
                      (cat) => cat._id === filters.category
                    );

                    if (matchingCategory && matchingCategory.name) {
                      return `${matchingCategory.name} Collection`;
                    }

                    // If not found in loaded categories, use our mapping
                    const categoryMap = {
                      "680c9481ab11e96a288ef6d9": "Sofa Beds",
                      "680c9484ab11e96a288ef6da": "Tables",
                      "680c9486ab11e96a288ef6db": "Chairs",
                      "680c9489ab11e96a288ef6dc": "Wardrobes",
                    };
                    return `${
                      categoryMap[filters.category] || "Furniture"
                    } Collection`;
                  }

                  // Otherwise, capitalize the first letter
                  return `${
                    filters.category.charAt(0).toUpperCase() +
                    filters.category.slice(1).replace(/-/g, " ")
                  } Collection`;
                })()
              : "All Products"}
          </h1>
          <p className="theme-text-secondary">
            Discover our wide range of high-quality furniture for your home and
            office
          </p>

          {/* Test button - only visible in production */}
          {window.location.origin.includes("onrender.com") && (
            <div className="mt-4">
              <Button
                onClick={testProductsConnection}
                variant="secondary"
                size="small"
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                Test Products Connection
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={toggleFilters}
            className="w-full theme-bg-primary border theme-border rounded-md py-2 px-4 flex items-center justify-between"
          >
            <span className="font-medium">Filters & Sorting</span>
            <svg
              className={`w-5 h-5 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <motion.div
            className={`theme-bg-primary rounded-lg shadow-md p-4 md:p-6 md:w-1/4 ${
              showFilters ? "block" : "hidden md:block"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-bold mb-4 theme-text-primary">
              Filters
            </h2>

            {/* Search */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 theme-text-primary">Search</h3>
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="flex-grow border theme-border theme-bg-primary theme-text-primary rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-3 py-2 rounded-r-md hover:bg-primary-dark transition-colors"
                >
                  <svg
                    className="w-5 h-5"
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
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 theme-text-primary">
                Categories
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="all-categories"
                    name="category"
                    checked={filters.category === ""}
                    onChange={() => handleFilterChange("category", "")}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="all-categories"
                    className="ml-2 theme-text-primary"
                  >
                    All Categories
                  </label>
                </div>

                {categories && categories.length > 0 ? (
                  categories
                    .map((category) => {
                      // Skip invalid categories
                      if (!category || !category._id) {
                        console.warn(
                          "Invalid category in Products.jsx:",
                          category
                        );
                        return null;
                      }

                      return (
                        <div key={category._id} className="flex items-center">
                          <input
                            type="radio"
                            id={category._id}
                            name="category"
                            checked={
                              filters.category === category.slug ||
                              filters.category === category._id ||
                              // Check if the current filter is a MongoDB ID that matches this category
                              (filters.category.length === 24 &&
                                /^[0-9a-f]+$/.test(filters.category) &&
                                category._id === filters.category)
                            }
                            onChange={() =>
                              handleFilterChange("category", category._id)
                            }
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor={category._id}
                            className="ml-2 theme-text-primary"
                          >
                            {category.name}
                          </label>
                        </div>
                      );
                    })
                    .filter(Boolean) // Remove null values
                ) : (
                  <div className="text-sm theme-text-secondary">
                    No categories available
                  </div>
                )}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 theme-text-primary">
                Price Range
              </h3>
              <div className="px-2">
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    setPriceRange([priceRange[0], newValue]);
                  }}
                  onMouseUp={handlePriceRangeChangeCommitted}
                  onTouchEnd={handlePriceRangeChangeCommitted}
                  className="w-full h-2 theme-bg-secondary rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2">
                  <span className="theme-text-secondary">{formatPrice(0)}</span>
                  <span className="theme-text-secondary">
                    {formatPrice(priceRange[1])}
                  </span>
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="font-medium mb-2 theme-text-primary">Sort By</h3>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="w-full border theme-border theme-bg-primary theme-text-primary rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="newest">Newest</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </motion.div>

          {/* Products Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loading size="large" />
              </div>
            ) : error ? (
              <Alert type="error" message={error} />
            ) : successMessage ? (
              <div className="mb-4">
                <Alert type="success" message={successMessage} />
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="theme-bg-primary rounded-lg shadow-md p-8 text-center">
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <h3 className="text-xl font-bold mb-2">
                      No Products Found
                    </h3>
                    <p className="theme-text-secondary mb-4">
                      We couldn't find any products matching your criteria.
                    </p>
                    <button
                      onClick={() => {
                        setFilters({
                          category: "",
                          priceRange: [0, maxPrice],
                          sort: "newest",
                          search: "",
                        });
                        setPriceRange([0, maxPrice]);
                        fetchProducts();
                      }}
                      className="btn-primary"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            ) : products.length === 0 ? (
              <div className="theme-bg-primary rounded-lg shadow-md p-8 text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <h3 className="text-xl font-bold mb-2">No Products Found</h3>
                <p className="theme-text-secondary mb-4">
                  We couldn't find any products matching your criteria.
                </p>
                <button
                  onClick={() => {
                    setFilters({
                      category: "",
                      priceRange: [0, maxPrice],
                      sort: "newest",
                      search: "",
                    });
                    setPriceRange([0, maxPrice]);
                    fetchProducts();
                  }}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product._id || `product-${index}`}
                      product={product}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "theme-bg-primary theme-text-primary hover:bg-gray-50"
                        }`}
                      >
                        Previous
                      </button>

                      {[...Array(totalPages).keys()].map((page) => (
                        <button
                          key={page + 1}
                          onClick={() => handlePageChange(page + 1)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === page + 1
                              ? "bg-primary text-white"
                              : "theme-bg-primary theme-text-primary hover:bg-gray-50"
                          }`}
                        >
                          {page + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === totalPages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "theme-bg-primary theme-text-primary hover:bg-gray-50"
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
