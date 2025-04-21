import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import { productsAPI, categoriesAPI } from "../utils/api";
import { formatPrice } from "../utils/format";

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

        // Fetch categories
        const categoriesResponse = await categoriesAPI.getAll();
        const validCategories = (categoriesResponse.data.data || []).filter(
          (cat) => cat && cat._id && cat.name && cat.slug
        );
        setCategories(validCategories);

        // Fetch products with filters
        await fetchProducts();
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  // Fetch products based on current filters
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 12,
      };

      // Add category filter if selected
      if (filters.category) {
        params.category = filters.category;
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

      const response = await productsAPI.getAll(params);

      // Handle different API response formats
      const productsData = response.data.data || response.data;
      const totalCount = response.data.count || productsData.length;

      if (Array.isArray(productsData)) {
        const validProducts = productsData.filter(
          (product) => product && product._id
        );
        setProducts(validProducts);
        setTotalPages(Math.ceil(totalCount / 12));

        // Find the highest price for the price range filter
        if (validProducts.length > 0) {
          const highestPrice = Math.max(
            ...validProducts.map((product) => product.price || 0)
          );
          setMaxPrice(Math.max(highestPrice, 100000));
          setPriceRange([0, Math.max(highestPrice, 100000)]);
        }
      } else {
        console.error("Unexpected API response format:", response.data);
        setError("Received invalid data format from server");
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(`Failed to load products: ${error.message || "Unknown error"}`);
      setProducts([]);
    } finally {
      setLoading(false);
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

  // Handle price range change
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

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

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: "",
      priceRange: [0, maxPrice],
      sort: "newest",
      search: "",
    });
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);

    // Update URL
    navigate({
      pathname: location.pathname,
      search: "",
    });

    fetchProducts();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">
            {filters.category
              ? `${
                  filters.category.charAt(0).toUpperCase() +
                  filters.category.slice(1)
                } Collection`
              : "All Products"}
          </h1>
          <p className="text-gray-600">
            Discover our wide range of high-quality furniture for your home and
            office
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={toggleFilters}
            className="w-full bg-white border border-gray-300 rounded-md py-2 px-4 flex items-center justify-between"
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
            className={`bg-white rounded-lg shadow-md p-4 md:p-6 md:w-1/4 ${
              showFilters ? "block" : "hidden md:block"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Search</h3>
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="flex-grow border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
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
              <h3 className="font-medium mb-2">Categories</h3>
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
                    className="ml-2 text-gray-700"
                  >
                    All Categories
                  </label>
                </div>

                {categories.map((category) => (
                  <div key={category._id} className="flex items-center">
                    <input
                      type="radio"
                      id={category._id}
                      name="category"
                      checked={filters.category === category.slug}
                      onChange={() =>
                        handleFilterChange("category", category.slug)
                      }
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={category._id}
                      className="ml-2 text-gray-700"
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Price Range</h3>
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">{formatPrice(0)}</span>
                  <span className="text-gray-600">
                    {formatPrice(priceRange[1])}
                  </span>
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="font-medium mb-2">Sort By</h3>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
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
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
                <p className="text-gray-600 mb-4">
                  We couldn't find any products matching your criteria.
                </p>
                <button onClick={clearFilters} className="btn-primary">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
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
                            : "bg-white text-gray-700 hover:bg-gray-50"
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
                              : "bg-white text-gray-700 hover:bg-gray-50"
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
                            : "bg-white text-gray-700 hover:bg-gray-50"
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
