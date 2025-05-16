import React, { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getAssetUrl } from "../utils/apiUrlHelper";
import { formatPrice, calculateDiscountPercentage } from "../utils/format";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import Button from "../components/Button";
import ProductCard from "../components/ProductCard";
import ProductDetailFallback from "../components/ProductDetailFallback";
import ReviewForm from "../components/ReviewForm";
import ReviewsList from "../components/ReviewsList";
import { motion } from "framer-motion";

const ProductDetail = () => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // State for product details
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [currentProduct, setCurrentProduct] = useState(null);
  const imageRef = useRef(null);
  const productLoadedRef = useRef(false);

  // State for related products
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { id } = useParams();

  // Reset productLoadedRef and auto-refresh when the component mounts or when the product ID changes
  useEffect(() => {
    // Reset the ref when the product ID changes
    productLoadedRef.current = false;

    // Auto-refresh the page once to ensure we get fresh data
    const shouldRefresh =
      sessionStorage.getItem(`product-${id}-refreshed`) !== "true";

    if (shouldRefresh) {
      console.log(`Auto-refreshing product page for ID: ${id}`);
      // Mark this product as refreshed in this session
      sessionStorage.setItem(`product-${id}-refreshed`, "true");

      // Use a short timeout to allow the component to mount first
      const refreshTimer = setTimeout(() => {
        window.location.reload();
      }, 100);

      // Clear the timer if the component unmounts
      return () => {
        clearTimeout(refreshTimer);
        productLoadedRef.current = false;
      };
    }

    // Cleanup function to reset the ref when the component unmounts
    return () => {
      productLoadedRef.current = false;
    };
  }, [id]);

  // Handle product loaded callback
  const handleProductLoaded = (loadedProduct, source) => {
    // Prevent multiple calls for the same product
    if (productLoadedRef.current) {
      console.log("Product already loaded, skipping callback");
      return;
    }

    productLoadedRef.current = true;
    console.log(`Product loaded from source: ${source}`, loadedProduct);

    // Store the product data
    setCurrentProduct(loadedProduct);

    // Fetch related products if category exists
    const categoryId =
      loadedProduct.category && typeof loadedProduct.category === "object"
        ? loadedProduct.category._id
        : typeof loadedProduct.category === "string"
        ? loadedProduct.category
        : null;

    if (categoryId) {
      // Use setTimeout to delay the fetch of related products
      // This prevents the UI from blinking due to immediate state updates
      setTimeout(() => {
        // Fetch related products using the API
        fetch(`/api/products?category=${categoryId}&limit=3`)
          .then((response) => response.json())
          .then((data) => {
            if (data && data.data && Array.isArray(data.data)) {
              // Filter out the current product
              const filtered = data.data.filter(
                (item) => item._id !== loadedProduct._id
              );
              setRelatedProducts(filtered);
            }
          })
          .catch((error) => {
            console.error("Error fetching related products:", error);
            setRelatedProducts([]);
          });
      }, 500); // 500ms delay to ensure the main product is rendered first
    }
  };

  // Handle quantity change
  const handleQuantityChange = (value) => {
    const newQuantity = quantity + value;
    if (newQuantity > 0 && newQuantity <= (product?.stock || 10)) {
      setQuantity(newQuantity);
    }
  };

  // Handle add to cart
  const handleAddToCart = (product) => {
    if (product) {
      addToCart(product, quantity);
      // Show success message
      alert(`${product.name} added to cart!`);
    }
  };

  // Handle buy now
  const handleBuyNow = (product) => {
    if (product) {
      addToCart(product, quantity);
      // Redirect to checkout
      window.location.href = "/cart";
    }
  };

  // Handle image zoom
  const handleImageMouseMove = (e) => {
    if (!imageRef.current) return;

    const { left, top, width, height } =
      imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  };

  const handleImageMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleImageMouseLeave = () => {
    setIsZoomed(false);
  };

  // Load reviews from localStorage when the component mounts or product ID changes
  useEffect(() => {
    // Skip if no product is loaded yet
    if (!currentProduct) return;

    try {
      // Get stored reviews for this product
      const storedReviews = JSON.parse(
        localStorage.getItem(`product-reviews-${id}`) || "[]"
      );

      // Only proceed if there are stored reviews
      if (storedReviews.length === 0) return;

      // Clone the current product
      const updatedProduct = { ...currentProduct };

      // Initialize reviews array if it doesn't exist
      if (!updatedProduct.reviews) {
        updatedProduct.reviews = [];
      }

      // Track if we need to update the product
      let needsUpdate = false;

      // Add stored reviews that aren't already in the product
      storedReviews.forEach((storedReview) => {
        // Check if this review is already in the product
        const exists = updatedProduct.reviews.some(
          (r) =>
            r._id === storedReview._id ||
            (r.user === storedReview.user && r.comment === storedReview.comment)
        );

        // If it doesn't exist, add it
        if (!exists) {
          updatedProduct.reviews.push(storedReview);
          needsUpdate = true;
        }
      });

      // Only update the product data if needed
      if (needsUpdate) {
        setCurrentProduct(updatedProduct);
      }
    } catch (error) {
      console.error("Error loading reviews from localStorage:", error);
    }
  }, [id]); // Only depend on the product ID, not currentProduct

  // Handle review submission callback
  const handleReviewSubmitted = (newReview) => {
    console.log("Review submitted callback with:", newReview);

    // Refresh the product data to show the new review
    if (currentProduct) {
      // Clone the current product
      const updatedProduct = { ...currentProduct };

      // Add the new review to the reviews array
      if (!updatedProduct.reviews) {
        updatedProduct.reviews = [];
      }

      // Check if this review already exists (to avoid duplicates)
      const reviewExists = updatedProduct.reviews.some(
        (review) =>
          (review._id && review._id === newReview._id) ||
          (review.name === newReview.name &&
            review.comment === newReview.comment &&
            review.rating === newReview.rating)
      );

      // Only add the review if it doesn't already exist
      if (!reviewExists) {
        // Add the new review
        updatedProduct.reviews.push(newReview);

        // Update ratings
        updatedProduct.numReviews = updatedProduct.reviews.length;
        updatedProduct.ratings =
          updatedProduct.reviews.reduce(
            (acc, review) => acc + review.rating,
            0
          ) / updatedProduct.reviews.length;

        console.log("Updated product with new review:", updatedProduct);
      }

      // Update the product data
      setCurrentProduct(updatedProduct);

      // Also update localStorage to ensure persistence
      try {
        localStorage.setItem(`product-${id}`, JSON.stringify(updatedProduct));
      } catch (error) {
        console.error("Error saving updated product to localStorage:", error);
      }
    }
  };

  return (
    <ProductDetailFallback onProductLoaded={handleProductLoaded}>
      {({ product, loading, error, source }) => {
        // Add console log to see what's being received from ProductDetailFallback
        console.log("ProductDetail render received:", {
          productExists: !!product,
          productId: product?._id,
          productName: product?.name,
          loading,
          error,
          source,
        });

        if (loading) {
          return (
            <div className="container-custom py-16 flex justify-center">
              <Loading size="large" />
            </div>
          );
        }

        if (error && !product) {
          return (
            <div className="container-custom py-16">
              <Alert type="error" message={error} />
              <div className="mt-4 text-center">
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
            {/* Data Source Indicator - hidden in production */}
            {false && source && (
              <div className="container-custom mb-2 text-xs text-gray-500">
                Data source: {source}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="container-custom mb-6">
                <Alert type="info" message={error} />
              </div>
            )}

            <div className="container-custom">
              {/* Breadcrumbs */}
              <nav className="flex mb-6 text-sm">
                <Link
                  to="/"
                  className="theme-text-secondary hover:text-primary"
                >
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
                {/* Display category name with link */}
                {product.category && product.category.name ? (
                  <Link
                    to={`/products?category=${
                      product.category._id || product.category.slug || ""
                    }`}
                    className="theme-text-secondary hover:text-primary"
                  >
                    {product.category.name}
                  </Link>
                ) : (
                  <span className="theme-text-secondary">Uncategorized</span>
                )}
                <span className="mx-2 theme-text-secondary">/</span>
                <span className="theme-text-primary font-medium">
                  {product.name}
                </span>
              </nav>

              {/* Product Details */}
              <div className="theme-bg-primary rounded-lg shadow-md overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                  {/* Product Images with Zoom Feature */}
                  <div>
                    <div
                      className="relative h-80 md:h-96 rounded-lg overflow-hidden mb-4 cursor-zoom-in"
                      ref={imageRef}
                      onMouseMove={handleImageMouseMove}
                      onMouseEnter={handleImageMouseEnter}
                      onMouseLeave={handleImageMouseLeave}
                    >
                      {/* Main Product Image with defensive coding */}
                      <img
                        src={
                          product &&
                          product.images &&
                          Array.isArray(product.images) &&
                          product.images.length > 0 &&
                          selectedImage < product.images.length
                            ? getAssetUrl(product.images[selectedImage])
                            : "https://placehold.co/800x600/gray/white?text=Product"
                        }
                        alt={(product && product.name) || "Product"}
                        className="w-full h-full object-cover transition-transform duration-200"
                        onError={(e) => {
                          console.log("Image load error:", e.target.src);
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/800x600/gray/white?text=Image+Not+Found";
                        }}
                      />

                      {/* Zoom overlay */}
                      {isZoomed && (
                        <div className="absolute inset-0 bg-white bg-opacity-0 pointer-events-none">
                          <div
                            className="absolute inset-0 bg-no-repeat bg-origin-border"
                            style={{
                              backgroundImage: `url(${
                                product &&
                                product.images &&
                                Array.isArray(product.images) &&
                                product.images.length > 0 &&
                                selectedImage < product.images.length
                                  ? getAssetUrl(product.images[selectedImage])
                                  : "https://placehold.co/800x600/gray/white?text=Product"
                              })`,
                              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                              backgroundSize: "200%",
                            }}
                          ></div>
                        </div>
                      )}

                      {/* Zoom indicator */}
                      <div className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-2 shadow-md">
                        <svg
                          className="w-5 h-5 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          ></path>
                        </svg>
                      </div>
                    </div>

                    {/* Thumbnail Gallery with defensive coding */}
                    {product &&
                      product.images &&
                      Array.isArray(product.images) &&
                      product.images.length > 1 && (
                        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                          {product.images.map((image, index) => (
                            <motion.div
                              key={index}
                              className={`w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 ${
                                selectedImage === index
                                  ? "border-primary"
                                  : "border-transparent"
                              }`}
                              onClick={() => setSelectedImage(index)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <img
                                src={getAssetUrl(image)}
                                alt={`${
                                  (product && product.name) || "Product"
                                } - Image ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log(
                                    "Thumbnail load error:",
                                    e.target.src
                                  );
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://placehold.co/100x100/gray/white?text=Image+Not+Found";
                                }}
                              />
                            </motion.div>
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
                          {formatPrice(
                            product && product.price ? product.price : 0
                          )}
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

                    {/* Purchase Actions with defensive coding */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      {/* Add to Cart Button */}
                      <motion.button
                        onClick={() => handleAddToCart(product)}
                        disabled={
                          !product || !product.stock || product.stock === 0
                        }
                        className={`flex items-center justify-center px-4 py-2 rounded-md text-white font-medium ${
                          !product || !product.stock || product.stock === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-primary hover:bg-primary-dark"
                        } transition-colors duration-200 flex-grow sm:flex-grow-0`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
                      </motion.button>

                      {/* Buy Now Button */}
                      <motion.button
                        onClick={() => handleBuyNow(product)}
                        disabled={
                          !product || !product.stock || product.stock === 0
                        }
                        className={`flex items-center justify-center px-4 py-2 rounded-md font-medium ${
                          !product || !product.stock || product.stock === 0
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-secondary text-white hover:bg-secondary-dark"
                        } transition-colors duration-200 flex-grow sm:flex-grow-0`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        Buy Now
                      </motion.button>

                      {/* Wishlist Button */}
                      <motion.button
                        className="flex items-center justify-center p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Add to Wishlist"
                      >
                        <svg
                          className="w-6 h-6 text-red-500"
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
                      </motion.button>
                    </div>

                    {/* Product Specifications with defensive coding */}
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-medium mb-4">
                        Key Specifications
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                        <ul className="space-y-3 text-sm">
                          {/* Check for specifications array first */}
                          {product &&
                          product.specifications &&
                          Array.isArray(product.specifications) &&
                          product.specifications.length > 0 ? (
                            // Render from specifications array
                            product.specifications.map((spec, index) => (
                              <li
                                key={`spec-${index}`}
                                className="flex items-center"
                              >
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary bg-opacity-10 rounded-full mr-3">
                                  <svg
                                    className="w-4 h-4 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    ></path>
                                  </svg>
                                </div>
                                <div className="flex-1 flex flex-wrap">
                                  <span className="font-medium w-28 mr-2">
                                    {spec.name || "Spec"}:
                                  </span>
                                  <span className="theme-text-primary flex-1">
                                    {spec.value || ""}
                                  </span>
                                </div>
                              </li>
                            ))
                          ) : (
                            // Fallback to individual properties
                            <>
                              {product && product.material && (
                                <li className="flex items-center">
                                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary bg-opacity-10 rounded-full mr-3">
                                    <svg
                                      className="w-4 h-4 text-primary"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                      ></path>
                                    </svg>
                                  </div>
                                  <div className="flex-1 flex flex-wrap">
                                    <span className="font-medium w-28 mr-2">
                                      Material:
                                    </span>
                                    <span className="theme-text-primary flex-1">
                                      {product.material}
                                    </span>
                                  </div>
                                </li>
                              )}
                              {product && product.color && (
                                <li className="flex items-center">
                                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary bg-opacity-10 rounded-full mr-3">
                                    <svg
                                      className="w-4 h-4 text-primary"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                      ></path>
                                    </svg>
                                  </div>
                                  <div className="flex-1 flex flex-wrap">
                                    <span className="font-medium w-28 mr-2">
                                      Color:
                                    </span>
                                    <span className="theme-text-primary flex-1">
                                      {product.color}
                                    </span>
                                  </div>
                                </li>
                              )}
                              {product &&
                                product.dimensions &&
                                typeof product.dimensions === "object" && (
                                  <li className="flex items-center">
                                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary bg-opacity-10 rounded-full mr-3">
                                      <svg
                                        className="w-4 h-4 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M5 13l4 4L19 7"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="flex-1 flex flex-wrap">
                                      <span className="font-medium w-28 mr-2">
                                        Dimensions:
                                      </span>
                                      <span className="theme-text-primary flex-1">
                                        {product.dimensions.length || 0} x{" "}
                                        {product.dimensions.width || 0} x{" "}
                                        {product.dimensions.height || 0} cm
                                      </span>
                                    </div>
                                  </li>
                                )}
                            </>
                          )}
                          {/* Always show category */}
                          <li className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary bg-opacity-10 rounded-full mr-3">
                              <svg
                                className="w-4 h-4 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                            </div>
                            <div className="flex-1 flex flex-wrap">
                              <span className="font-medium w-28 mr-2">
                                Category:
                              </span>
                              {/* Display category name with link */}
                              {product.category && product.category.name ? (
                                <Link
                                  to={`/products?category=${
                                    product.category._id ||
                                    product.category.slug ||
                                    ""
                                  }`}
                                  className="text-primary hover:underline flex-1"
                                >
                                  {product.category.name}
                                </Link>
                              ) : (
                                <span className="theme-text-primary flex-1">
                                  Uncategorized
                                </span>
                              )}
                            </div>
                          </li>

                          {/* Stock Status */}
                          <li className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary bg-opacity-10 rounded-full mr-3">
                              <svg
                                className="w-4 h-4 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                            </div>
                            <div className="flex-1 flex flex-wrap">
                              <span className="font-medium w-28 mr-2">
                                Availability:
                              </span>
                              {product && product.stock && product.stock > 0 ? (
                                <span className="text-green-600 font-medium flex-1">
                                  In Stock ({product.stock} available)
                                </span>
                              ) : (
                                <span className="text-red-600 font-medium flex-1">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </li>
                        </ul>
                      </div>
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
                        <p>
                          {product.description || "No description available"}
                        </p>
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
                      <ReviewForm
                        productId={id}
                        isAuthenticated={isAuthenticated}
                        onReviewSubmitted={handleReviewSubmitted}
                      />

                      {/* Reviews List */}
                      <ReviewsList reviews={product.reviews} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Products Section */}
              <div className="mt-12">
                <h2 className="text-2xl font-serif font-bold mb-6 flex items-center">
                  <span className="mr-2">Related Products</span>
                  <div className="h-1 flex-grow bg-gray-200 dark:bg-gray-700 rounded ml-4"></div>
                </h2>

                {relatedProducts.length > 0 ? (
                  <div className="relative">
                    {/* Scrollable container for related products */}
                    <div className="flex overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 space-x-6">
                      {relatedProducts.map((relatedProduct) => (
                        <motion.div
                          key={relatedProduct._id}
                          className="flex-shrink-0 w-64 md:w-72"
                          whileHover={{ y: -5 }}
                        >
                          <ProductCard product={relatedProduct} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Gradient overlays to indicate scrollable content */}
                    <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
                    <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No related products found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </ProductDetailFallback>
  );
};

export default ProductDetail;
