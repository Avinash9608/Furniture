import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { productsAPI, getImageUrl } from "../utils/api";
import { formatPrice, calculateDiscountPercentage } from "../utils/format";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import Button from "../components/Button";
import ProductCard from "../components/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  // Function to test MongoDB connection health
  const testMongoDbHealth = async () => {
    try {
      setLoading(true);
      setError("Testing MongoDB connection health...");

      // Determine if we're in development or production
      const baseUrl = window.location.origin;
      const isDevelopment = !baseUrl.includes("onrender.com");
      const localServerUrl = "http://localhost:5000";

      // Use the appropriate URL based on environment
      const healthUrl = isDevelopment
        ? `${localServerUrl}/api/health/mongodb`
        : `${baseUrl}/api/health/mongodb`;

      console.log("Testing MongoDB connection health at:", healthUrl);

      // Make the request
      const healthResponse = await axios.get(healthUrl, { timeout: 60000 });

      console.log("MongoDB health check response:", healthResponse.data);

      if (healthResponse.data && healthResponse.data.success) {
        setError(
          `MongoDB connection is healthy! Response time: ${healthResponse.data.connectionInfo.responseTimeMs}ms`
        );

        // Now test the product details endpoint
        await testProductDetails();
      } else {
        setError(
          `MongoDB health check failed: ${
            healthResponse.data.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("MongoDB health check failed:", error);
      setError(`MongoDB health check failed: ${error.message}`);
      setLoading(false);
    }
  };

  // Function to test database collections
  const testDatabaseCollections = async () => {
    try {
      setLoading(true);
      setError("Testing database collections...");

      // Determine if we're in development or production
      const baseUrl = window.location.origin;
      const isDevelopment = !baseUrl.includes("onrender.com");
      const localServerUrl = "http://localhost:5000";

      // Use the appropriate URL based on environment
      const testUrl = isDevelopment
        ? `${localServerUrl}/api/test/direct-db`
        : `${baseUrl}/api/test/direct-db`;

      console.log("Testing database collections at:", testUrl);

      // Make the request
      const response = await axios.get(testUrl, { timeout: 60000 });

      console.log("Database collections test response:", response.data);

      if (response.data && response.data.success) {
        const collections = response.data.collections || [];
        const collectionData = response.data.collectionData || {};

        let collectionInfo = `Database collections found: ${collections.join(
          ", "
        )}`;

        if (collections.includes("products")) {
          collectionInfo += `\nProducts collection: ${
            collectionData.products?.count || 0
          } items`;

          if (collectionData.products?.samples) {
            collectionInfo += `\nSample products: ${collectionData.products.samples
              .map((p) => p.name)
              .join(", ")}`;
          }
        }

        setError(collectionInfo);

        // Now test the product details endpoint
        await testProductDetails();
      } else {
        setError(
          `Database collections test failed: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Database collections test failed:", error);
      setError(`Database collections test failed: ${error.message}`);
      setLoading(false);
    }
  };

  // Function to test product details connection
  const testProductDetails = async () => {
    try {
      // Determine if we're in development or production
      const baseUrl = window.location.origin;
      const isDevelopment = !baseUrl.includes("onrender.com");
      const localServerUrl = "http://localhost:5000";

      // Use the appropriate URL based on environment
      const testUrl = isDevelopment
        ? `${localServerUrl}/api/test/product-details/${id}`
        : `${baseUrl}/api/test/product-details/${id}`;

      console.log("Testing product details connection at:", testUrl);

      // Make the request
      const response = await axios.get(testUrl, { timeout: 60000 });

      console.log("Product details connection test response:", response.data);

      if (response.data && response.data.data) {
        // Show success message
        setError(
          `Product connection successful! Found product: ${response.data.data.name} from source: ${response.data.source}`
        );

        // Ensure product has all required properties
        const productData = response.data.data;
        const safeProduct = {
          ...productData,
          name: productData.name || "Unknown Product",
          description: productData.description || "No description available",
          price: productData.price || 0,
          discountPrice: productData.discountPrice || null,
          stock: productData.stock || 0,
          ratings: productData.ratings || 0,
          numReviews: productData.numReviews || 0,
          images: Array.isArray(productData.images) ? productData.images : [],
          category: productData.category || null,
          reviews: Array.isArray(productData.reviews)
            ? productData.reviews
            : [],
          specifications: Array.isArray(productData.specifications)
            ? productData.specifications
            : [],
        };

        // Set the product
        setProduct(safeProduct);

        // Fetch related products if category exists
        const categoryId =
          response.data.data.category &&
          typeof response.data.data.category === "object"
            ? response.data.data.category._id
            : typeof response.data.data.category === "string"
            ? response.data.data.category
            : null;

        if (categoryId) {
          try {
            console.log(
              `Fetching related products for category: ${categoryId}`
            );
            const relatedResponse = await productsAPI.getAll({
              category: categoryId,
              limit: 3,
            });

            if (
              relatedResponse &&
              relatedResponse.data &&
              Array.isArray(relatedResponse.data.data)
            ) {
              // Filter out the current product from related products
              const filteredRelated = relatedResponse.data.data.filter(
                (item) => item && item._id !== response.data.data._id
              );

              console.log(`Found ${filteredRelated.length} related products`);
              setRelatedProducts(filteredRelated);
            }
          } catch (relatedError) {
            console.error("Error fetching related products:", relatedError);
          }
        }
      } else {
        setError("Product not found in the database");
      }
    } catch (error) {
      console.error("Product connection test failed:", error);
      setError(`Product connection test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching product details for ID: ${id}`);
        const response = await productsAPI.getById(id);

        // Check if we have valid product data
        if (!response || !response.data || !response.data.data) {
          console.error("Invalid product data received:", response);
          throw new Error("Product data is invalid or missing");
        }

        const productData = response.data.data;
        console.log("Product data received:", productData);

        // Ensure product has all required properties
        const safeProduct = {
          ...productData,
          name: productData.name || "Unknown Product",
          description: productData.description || "No description available",
          price: productData.price || 0,
          discountPrice: productData.discountPrice || null,
          stock: productData.stock || 0,
          ratings: productData.ratings || 0,
          numReviews: productData.numReviews || 0,
          images: Array.isArray(productData.images) ? productData.images : [],
          category: productData.category || null,
          reviews: Array.isArray(productData.reviews)
            ? productData.reviews
            : [],
          specifications: Array.isArray(productData.specifications)
            ? productData.specifications
            : [],
        };

        setProduct(safeProduct);
        console.log("Safe product data set:", safeProduct);

        // Fetch related products from the same category if category exists
        const categoryId =
          safeProduct.category && typeof safeProduct.category === "object"
            ? safeProduct.category._id
            : typeof safeProduct.category === "string"
            ? safeProduct.category
            : null;

        if (categoryId) {
          console.log(`Fetching related products for category: ${categoryId}`);
          const relatedResponse = await productsAPI.getAll({
            category: categoryId,
            limit: 3,
          });

          // Ensure we have valid related products data
          if (
            relatedResponse &&
            relatedResponse.data &&
            Array.isArray(relatedResponse.data.data)
          ) {
            // Filter out the current product from related products
            const filteredRelated = relatedResponse.data.data.filter(
              (item) => item && item._id !== safeProduct._id
            );

            console.log(`Found ${filteredRelated.length} related products`);
            setRelatedProducts(filteredRelated);
          } else {
            console.log("No valid related products data found");
            setRelatedProducts([]);
          }
        } else {
          console.log("No category ID found for related products");
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // Handle quantity change
  const handleQuantityChange = (value) => {
    const newQuantity = quantity + value;
    if (newQuantity > 0 && newQuantity <= (product?.stock || 10)) {
      setQuantity(newQuantity);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      // Show success message or redirect to cart
    }
  };

  // Handle review form change
  const handleReviewFormChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({
      ...reviewForm,
      [name]: value,
    });
  };

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setReviewError("Please login to submit a review");
      return;
    }

    if (!reviewForm.comment.trim()) {
      setReviewError("Please enter a comment");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError(null);

      await productsAPI.createReview(id, reviewForm);

      setReviewSuccess("Review submitted successfully!");
      setReviewForm({
        rating: 5,
        comment: "",
      });

      // Refresh product details to show the new review
      const response = await productsAPI.getById(id);
      setProduct(response.data.data);
    } catch (error) {
      console.error("Error submitting review:", error);
      setReviewError(
        error.response?.data?.message ||
          "Failed to submit review. Please try again."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-16 flex justify-center">
        <Loading size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-16">
        <Alert type="error" message={error} />
        <div className="mt-4 text-center flex flex-col gap-4 items-center">
          {/* Test buttons - only visible in production or when there's an error */}
          {(window.location.origin.includes("onrender.com") ||
            error.includes("Failed to load") ||
            error.includes("timed out")) && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={testMongoDbHealth}
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
                Test MongoDB Connection
              </Button>

              <Button
                onClick={testDatabaseCollections}
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
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  ></path>
                </svg>
                Test Database Collections
              </Button>

              <Button
                onClick={testProductDetails}
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
                Test Product Details
              </Button>
            </div>
          )}
          <Link to="/products" className="text-primary hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-16">
        <Alert type="error" message="Product not found" />
        <div className="mt-4 text-center">
          <Link to="/products" className="text-primary hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-bg-primary py-8">
      <div className="container-custom">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm">
          <Link to="/" className="theme-text-secondary hover:text-primary">
            Home
          </Link>
          <span className="mx-2 theme-text-secondary">/</span>
          <Link
            to="/products"
            className="theme-text-secondary hover:text-primary"
          >
            Products
          </Link>
          <span className="mx-2 theme-text-secondary">/</span>
          {product.category && typeof product.category === "object" ? (
            <Link
              to={`/products?category=${product.category.slug || ""}`}
              className="theme-text-secondary hover:text-primary"
            >
              {product.category.name || "Uncategorized"}
            </Link>
          ) : (
            <span className="theme-text-secondary">Uncategorized</span>
          )}
          <span className="mx-2 theme-text-secondary">/</span>
          <span className="theme-text-primary font-medium">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="theme-bg-primary rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div>
              <div className="relative h-80 md:h-96 rounded-lg overflow-hidden mb-4">
                {/* Main Product Image with defensive coding */}
                <img
                  src={
                    product &&
                    product.images &&
                    Array.isArray(product.images) &&
                    product.images.length > 0 &&
                    selectedImage < product.images.length
                      ? getImageUrl(product.images[selectedImage])
                      : `https://via.placeholder.com/800x600?text=${encodeURIComponent(
                          (product && product.name) || "Product"
                        )}`
                  }
                  alt={(product && product.name) || "Product"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log("Image load error:", e.target.src);
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/800x600?text=Image+Not+Found";
                  }}
                />
              </div>

              {/* Thumbnail Gallery with defensive coding */}
              {product &&
                product.images &&
                Array.isArray(product.images) &&
                product.images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        className={`w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 ${
                          selectedImage === index
                            ? "border-primary"
                            : "border-transparent"
                        }`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`${
                            (product && product.name) || "Product"
                          } - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log("Thumbnail load error:", e.target.src);
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/100x100?text=Image+Not+Found";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2 theme-text-primary">
                {product && product.name ? product.name : "Product"}
              </h1>

              <div className="flex items-center mb-4">
                {/* Rating Stars with defensive coding */}
                <div className="flex">
                  {[...Array(5)].map((_, index) => (
                    <svg
                      key={index}
                      className={`w-5 h-5 ${
                        product &&
                        product.ratings &&
                        index < Math.round(product.ratings)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>

                <span className="theme-text-secondary ml-2">
                  {product && typeof product.ratings === "number"
                    ? `${product.ratings.toFixed(1)} (${
                        product.numReviews || 0
                      } reviews)`
                    : "0.0 (0 reviews)"}
                </span>
              </div>

              {/* Price with defensive coding */}
              <div className="mb-6">
                {product &&
                product.discountPrice &&
                product.price &&
                product.discountPrice < product.price ? (
                  <div className="flex flex-wrap items-center">
                    <span className="text-3xl font-bold text-primary mr-3">
                      {formatPrice(product.discountPrice)}
                    </span>
                    <div>
                      <span className="text-lg theme-text-secondary line-through block">
                        {formatPrice(product.price)}
                      </span>
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded inline-block mt-1">
                        {calculateDiscountPercentage(
                          product.price,
                          product.discountPrice
                        )}
                        % OFF
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(product && product.price ? product.price : 0)}
                  </span>
                )}
              </div>

              {/* Stock Status with defensive coding */}
              <div className="mb-6">
                {product && product.stock && product.stock > 0 ? (
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Short Description with defensive coding */}
              <div className="mb-6">
                <p className="theme-text-primary">
                  {product && product.description
                    ? product.description.split(".")[0]
                    : "No description available"}
                </p>
              </div>

              {/* Quantity Selector with defensive coding */}
              {product && product.stock && product.stock > 0 && (
                <div className="mb-6">
                  <label className="block theme-text-primary font-medium mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="theme-bg-secondary theme-text-primary hover:bg-gray-300 h-10 w-10 rounded-l-md flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M20 12H4"
                        ></path>
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 1)
                      }
                      className="h-10 w-16 border-y theme-border theme-bg-primary theme-text-primary text-center"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="theme-bg-secondary theme-text-primary hover:bg-gray-300 h-10 w-10 rounded-r-md flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4"
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
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button with defensive coding */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product || !product.stock || product.stock === 0}
                  className="flex-grow sm:flex-grow-0"
                >
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
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                  Add to Cart
                </Button>

                <Button variant="outline" className="flex-grow sm:flex-grow-0">
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
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    ></path>
                  </svg>
                  Add to Wishlist
                </Button>
              </div>

              {/* Product Specifications with defensive coding */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium mb-2">Specifications</h3>
                <ul className="space-y-2 text-sm">
                  {/* Check for specifications array first */}
                  {product &&
                  product.specifications &&
                  Array.isArray(product.specifications) &&
                  product.specifications.length > 0 ? (
                    // Render from specifications array
                    product.specifications.map((spec, index) => (
                      <li key={`spec-${index}`} className="flex">
                        <span className="font-medium w-24">
                          {spec.name || "Spec"}:
                        </span>
                        <span className="theme-text-primary">
                          {spec.value || ""}
                        </span>
                      </li>
                    ))
                  ) : (
                    // Fallback to individual properties
                    <>
                      {product && product.material && (
                        <li className="flex">
                          <span className="font-medium w-24">Material:</span>
                          <span className="theme-text-primary">
                            {product.material}
                          </span>
                        </li>
                      )}
                      {product && product.color && (
                        <li className="flex">
                          <span className="font-medium w-24">Color:</span>
                          <span className="theme-text-primary">
                            {product.color}
                          </span>
                        </li>
                      )}
                      {product &&
                        product.dimensions &&
                        typeof product.dimensions === "object" && (
                          <li className="flex">
                            <span className="font-medium w-24">
                              Dimensions:
                            </span>
                            <span className="theme-text-primary">
                              {product.dimensions.length || 0} x{" "}
                              {product.dimensions.width || 0} x{" "}
                              {product.dimensions.height || 0} cm
                            </span>
                          </li>
                        )}
                    </>
                  )}
                  {/* Always show category */}
                  <li className="flex">
                    <span className="font-medium w-24">Category:</span>
                    {product &&
                    product.category &&
                    typeof product.category === "object" ? (
                      <Link
                        to={`/products?category=${product.category.slug || ""}`}
                        className="text-primary hover:underline"
                      >
                        {product.category.name || "Uncategorized"}
                      </Link>
                    ) : (
                      <span className="theme-text-primary">Uncategorized</span>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Product Description and Reviews Tabs */}
          <div className="border-t border-gray-200">
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-xl font-serif font-bold mb-4">
                  Description
                </h2>
                <div className="prose max-w-none theme-text-primary">
                  <p>{product.description || "No description available"}</p>
                </div>
              </div>

              {/* Reviews Section */}
              <div>
                <h2 className="text-xl font-serif font-bold mb-4">
                  Reviews (
                  {product.reviews && Array.isArray(product.reviews)
                    ? product.reviews.length
                    : 0}
                  )
                </h2>

                {/* Review Form */}
                <div className="theme-bg-secondary rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-2">Write a Review</h3>

                  {reviewSuccess && (
                    <Alert
                      type="success"
                      message={reviewSuccess}
                      onClose={() => setReviewSuccess(null)}
                    />
                  )}

                  {reviewError && (
                    <Alert
                      type="error"
                      message={reviewError}
                      onClose={() => setReviewError(null)}
                    />
                  )}

                  {!isAuthenticated ? (
                    <div className="text-center py-4">
                      <p className="theme-text-primary mb-2">
                        Please login to write a review
                      </p>
                      <Link
                        to="/login"
                        className="text-primary hover:underline font-medium"
                      >
                        Login here
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit}>
                      <div className="mb-4">
                        <label className="block theme-text-primary font-medium mb-2">
                          Rating
                        </label>
                        <div className="flex">
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <label key={rating} className="mr-4 cursor-pointer">
                              <input
                                type="radio"
                                name="rating"
                                value={rating}
                                checked={parseInt(reviewForm.rating) === rating}
                                onChange={handleReviewFormChange}
                                className="sr-only"
                              />
                              <div className="flex items-center">
                                <svg
                                  className={`w-8 h-8 ${
                                    parseInt(reviewForm.rating) >= rating
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                                <span className="ml-1">{rating}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="comment"
                          className="block theme-text-primary font-medium mb-2"
                        >
                          Your Review
                        </label>
                        <textarea
                          id="comment"
                          name="comment"
                          rows="4"
                          value={reviewForm.comment}
                          onChange={handleReviewFormChange}
                          className="w-full border theme-border theme-bg-primary theme-text-primary rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Share your experience with this product..."
                          required
                        ></textarea>
                      </div>

                      <Button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="w-full md:w-auto"
                      >
                        {reviewSubmitting ? "Submitting..." : "Submit Review"}
                      </Button>
                    </form>
                  )}
                </div>

                {/* Reviews List */}
                {!product.reviews ||
                !Array.isArray(product.reviews) ||
                product.reviews.length === 0 ? (
                  <div className="text-center py-8 theme-text-secondary">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  <div className="space-y-6">
                    {product.reviews.map((review, index) => (
                      <div
                        key={review._id || `review-${index}`}
                        className="border-b border-gray-200 pb-6 last:border-b-0"
                      >
                        <div className="flex items-center mb-2">
                          <div className="font-medium">
                            {review.name || "Anonymous"}
                          </div>
                          <span className="mx-2 text-gray-300">•</span>
                          <div className="text-sm theme-text-secondary">
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString()
                              : "Unknown date"}
                          </div>
                        </div>

                        <div className="flex mb-2">
                          {[...Array(5)].map((_, starIndex) => (
                            <svg
                              key={starIndex}
                              className={`w-4 h-4 ${
                                starIndex < (review.rating || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>

                        <p className="theme-text-primary">
                          {review.comment || "No comment provided"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-serif font-bold mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
