import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productsAPI } from "../utils/api";
import { getAssetUrl } from "../utils/apiUrlHelper";
import { formatPrice, calculateDiscountPercentage } from "../utils/format";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import Button from "../components/Button";
import Swal from "sweetalert2";

/**
 * A simplified version of the ProductDetail component with minimal dependencies
 * and robust error handling to ensure it works in all environments
 */
const ProductDetailSimple = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // Fetch product details with robust error handling
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(
          `[ProductDetailSimple] Fetching product details for ID: ${id}`
        );

        // Direct fetch to avoid any middleware issues
        const response = await fetch(
          `https://furniture-q3nb.onrender.com/api/products/${id}`
        );

        if (!response.ok) {
          throw new Error(
            `Server responded with ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("[ProductDetailSimple] Product data received:", data);

        if (!data || !data.data) {
          throw new Error("Invalid product data received");
        }

        const productData = data.data;
        console.log("[ProductDetailSimple] Raw product data:", productData);

        // Create a safe product object with fallbacks for all properties
        const safeProduct = {
          _id: productData._id || id,
          name: productData.name || "Product",
          description: productData.description || "No description available",
          price: productData.price || 0,
          discountPrice: productData.discountPrice || null,
          stock: productData.stock || 0,
          ratings: productData.ratings || 0,
          numReviews: productData.numReviews || 0,
          material: productData.material || "",
          color: productData.color || "",
          featured: productData.featured || false,
          createdAt: productData.createdAt || new Date().toISOString(),

          // Handle dimensions with proper fallbacks
          dimensions: productData.dimensions
            ? {
                length: parseFloat(productData.dimensions.length) || 0,
                width: parseFloat(productData.dimensions.width) || 0,
                height: parseFloat(productData.dimensions.height) || 0,
              }
            : {
                length: 0,
                width: 0,
                height: 0,
              },

          // Handle category with proper population check
          category: productData.category
            ? typeof productData.category === "object"
              ? productData.category
              : { _id: productData.category, name: "Loading...", slug: "" }
            : null,

          // Include categoryInfo if available
          categoryInfo: productData.categoryInfo || null,

          images: Array.isArray(productData.images) ? productData.images : [],
          reviews: Array.isArray(productData.reviews)
            ? productData.reviews
            : [],
        };

        // Log dimensions for debugging
        console.log(
          "[ProductDetailSimple] Product dimensions:",
          safeProduct.dimensions
        );

        // If category is just an ID, try to fetch the category details
        if (productData.category && typeof productData.category !== "object") {
          console.log(
            "[ProductDetailSimple] Category is not populated, fetching category details"
          );
          try {
            const categoryResponse = await fetch(
              `https://furniture-q3nb.onrender.com/api/categories/${productData.category}`
            );

            if (categoryResponse.ok) {
              const categoryData = await categoryResponse.json();
              if (categoryData && categoryData.data) {
                safeProduct.category = categoryData.data;
                console.log(
                  "[ProductDetailSimple] Fetched category details:",
                  categoryData.data
                );
              }
            }
          } catch (categoryError) {
            console.error(
              "[ProductDetailSimple] Error fetching category:",
              categoryError
            );
            // Keep the default category object
          }
        }

        setProduct(safeProduct);

        // Fetch related products if category exists
        try {
          const categoryId =
            safeProduct.category && typeof safeProduct.category === "object"
              ? safeProduct.category._id
              : typeof safeProduct.category === "string"
              ? safeProduct.category
              : null;

          if (categoryId) {
            console.log(
              `[ProductDetailSimple] Fetching related products for category: ${categoryId}`
            );

            const relatedResponse = await fetch(
              `https://furniture-q3nb.onrender.com/api/products?category=${categoryId}&limit=3`
            );

            if (relatedResponse.ok) {
              const relatedData = await relatedResponse.json();

              if (
                relatedData &&
                relatedData.data &&
                Array.isArray(relatedData.data)
              ) {
                // Filter out the current product
                const filteredRelated = relatedData.data.filter(
                  (item) => item && item._id !== safeProduct._id
                );

                console.log(
                  `[ProductDetailSimple] Found ${filteredRelated.length} related products`
                );
                setRelatedProducts(filteredRelated);
              }
            }
          }
        } catch (relatedError) {
          console.error(
            "[ProductDetailSimple] Error fetching related products:",
            relatedError
          );
          // Don't set an error state, just log it - related products are not critical
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error("[ProductDetailSimple] Error fetching product:", error);
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

  // Handle add to cart with SweetAlert
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);

      // Show SweetAlert success message
      Swal.fire({
        title: "Added to Cart!",
        text: `${product.name} has been added to your cart.`,
        icon: "success",
        confirmButtonText: "Continue Shopping",
        confirmButtonColor: "#4F46E5",
        showCancelButton: true,
        cancelButtonText: "View Cart",
        cancelButtonColor: "#10B981",
        timer: 3000,
        timerProgressBar: true,
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
          navigate("/cart");
        }
      });
    }
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);

      // Show brief SweetAlert before redirecting
      Swal.fire({
        title: "Redirecting to Cart",
        text: `${product.name} has been added to your cart.`,
        icon: "success",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      }).then(() => {
        navigate("/cart");
      });
    }
  };

  // Handle add to wishlist with SweetAlert
  const handleAddToWishlist = () => {
    // This would normally add to a wishlist context
    Swal.fire({
      title: "Added to Wishlist!",
      text: `${product.name} has been added to your wishlist.`,
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#4F46E5",
      timer: 2000,
      timerProgressBar: true,
    });
  };

  // Handle review form change
  const handleReviewFormChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({
      ...reviewForm,
      [name]: value,
    });
  };

  // Enhanced review submission with better error handling and SweetAlert
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setReviewError("Please login to submit a review");
      Swal.fire({
        title: "Authentication Required",
        text: "Please login to submit a review",
        icon: "warning",
        confirmButtonText: "Login",
        showCancelButton: true,
        cancelButtonText: "Cancel",
        confirmButtonColor: "#4F46E5",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return;
    }

    if (!reviewForm.comment.trim()) {
      setReviewError("Please enter a comment");
      Swal.fire({
        title: "Review Incomplete",
        text: "Please enter a comment for your review",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#4F46E5",
      });
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError(null);

      // Show loading state with SweetAlert
      Swal.fire({
        title: "Submitting Review",
        text: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Get the token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Try to submit the review using the API
      const reviewData = {
        rating: parseInt(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      };

      console.log("[ProductDetailSimple] Submitting review:", reviewData);
      console.log(
        "[ProductDetailSimple] Using token:",
        token.substring(0, 10) + "..."
      );

      // Use the correct API endpoint for reviews
      console.log("[ProductDetailSimple] Submitting review to API endpoint");

      // Use relative URL for API calls
      const response = await fetch(`/api/products/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewData),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      let responseData;

      if (contentType && contentType.includes("application/json")) {
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error(
            "[ProductDetailSimple] Error parsing JSON response:",
            jsonError
          );
          throw new Error(
            "Invalid response from server. Please try again later."
          );
        }
      } else {
        // Not JSON, likely HTML error page
        const textResponse = await response.text();
        console.error(
          "[ProductDetailSimple] Non-JSON response:",
          textResponse.substring(0, 200) + "..."
        );
        throw new Error(
          `Server returned invalid response format (${response.status})`
        );
      }

      if (!response.ok) {
        console.error(
          "[ProductDetailSimple] Review submission error:",
          responseData
        );
        throw new Error(
          responseData?.message || `Server responded with ${response.status}`
        );
      }

      // Success - show success message
      Swal.fire({
        title: "Review Submitted!",
        text: "Thank you for your feedback",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#4F46E5",
      });

      setReviewSuccess("Review submitted successfully!");
      setReviewForm({
        rating: 5,
        comment: "",
      });

      // Refresh product details to show the new review
      try {
        const productResponse = await fetch(
          `https://furniture-q3nb.onrender.com/api/products/${id}`
        );

        if (productResponse.ok) {
          const data = await productResponse.json();
          if (data && data.data) {
            setProduct({
              ...product,
              reviews: data.data.reviews || [],
              ratings: data.data.ratings || 0,
              numReviews: data.data.numReviews || 0,
            });
          }
        }
      } catch (refreshError) {
        console.error(
          "[ProductDetailSimple] Error refreshing product data:",
          refreshError
        );
        // Don't show an error for this, as the review was still submitted successfully
      }
    } catch (error) {
      console.error("[ProductDetailSimple] Error submitting review:", error);
      setReviewError(
        error.message || "Failed to submit review. Please try again."
      );

      // Show error message
      Swal.fire({
        title: "Review Submission Failed",
        text: error.message || "Failed to submit review. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#4F46E5",
      });
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

  // Enhanced product detail view with all features
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
          <span className="theme-text-primary font-medium">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="theme-bg-primary rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div>
              <div className="relative h-80 md:h-96 rounded-lg overflow-hidden mb-4">
                <img
                  src={
                    product.images &&
                    Array.isArray(product.images) &&
                    product.images.length > 0 &&
                    selectedImage < product.images.length
                      ? getAssetUrl(product.images[selectedImage])
                      : `https://via.placeholder.com/800x600?text=${encodeURIComponent(
                          product.name || "Product"
                        )}`
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log(
                      "[ProductDetailSimple] Image load error:",
                      e.target.src
                    );
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/800x600?text=Image+Not+Found";
                  }}
                />
              </div>

              {/* Thumbnail Gallery */}
              {product.images &&
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
                          src={getAssetUrl(image)}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log(
                              "[ProductDetailSimple] Thumbnail load error:",
                              e.target.src
                            );
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
                {product.name}
              </h1>

              {/* Ratings */}
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, index) => (
                    <svg
                      key={index}
                      className={`w-5 h-5 ${
                        index < Math.round(product.ratings || 0)
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
                  {(product.ratings || 0).toFixed(1)} ({product.numReviews || 0}{" "}
                  reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                {product.discountPrice &&
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
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="theme-text-primary">{product.description}</p>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-6">
                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
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

                {/* Buy Now Button */}
                <Button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-grow sm:flex-grow-0 bg-green-600 hover:bg-green-700"
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
                </Button>

                {/* Wishlist Button */}
                <Button
                  variant="outline"
                  onClick={handleAddToWishlist}
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
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    ></path>
                  </svg>
                  Add to Wishlist
                </Button>
              </div>

              {/* Enhanced Product Specifications */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <h3 className="text-lg font-medium mb-2">Specifications</h3>
                <ul className="space-y-2 text-sm">
                  {/* SKU/ID */}
                  <li className="flex">
                    <span className="font-medium w-24">Product ID:</span>
                    <span className="theme-text-primary">
                      {product._id || "N/A"}
                    </span>
                  </li>

                  {/* Category with improved handling */}
                  <li className="flex">
                    <span className="font-medium w-24">Category:</span>
                    {product.category ? (
                      typeof product.category === "object" &&
                      product.category.name ? (
                        <Link
                          to={`/products?category=${
                            product.category.slug || ""
                          }`}
                          className="text-primary hover:underline"
                        >
                          {product.category.name}
                        </Link>
                      ) : product.categoryInfo && product.categoryInfo.name ? (
                        <Link
                          to={`/products?category=${
                            product.categoryInfo.slug || ""
                          }`}
                          className="text-primary hover:underline"
                        >
                          {product.categoryInfo.name}
                        </Link>
                      ) : (
                        <span className="theme-text-primary">
                          {typeof product.category === "string"
                            ? "Loading category..."
                            : "Uncategorized"}
                        </span>
                      )
                    ) : (
                      <span className="theme-text-primary">Uncategorized</span>
                    )}
                  </li>

                  {/* Material */}
                  {product.material && (
                    <li className="flex">
                      <span className="font-medium w-24">Material:</span>
                      <span className="theme-text-primary">
                        {product.material}
                      </span>
                    </li>
                  )}

                  {/* Color */}
                  {product.color && (
                    <li className="flex">
                      <span className="font-medium w-24">Color:</span>
                      <span className="theme-text-primary">
                        {product.color}
                      </span>
                    </li>
                  )}

                  {/* Dimensions with improved display */}
                  <li className="flex">
                    <span className="font-medium w-24">Dimensions:</span>
                    <span className="theme-text-primary">
                      {product.dimensions &&
                      typeof product.dimensions === "object" ? (
                        <>
                          {/* Check if any dimension has a non-zero value */}
                          {product.dimensions.length > 0 ||
                          product.dimensions.width > 0 ||
                          product.dimensions.height > 0
                            ? `${product.dimensions.length || 0} × ${
                                product.dimensions.width || 0
                              } × ${product.dimensions.height || 0} cm`
                            : "Dimensions not specified"}
                        </>
                      ) : (
                        "Dimensions not specified"
                      )}
                    </span>
                  </li>

                  {/* Stock */}
                  <li className="flex">
                    <span className="font-medium w-24">Availability:</span>
                    <span
                      className={`theme-text-primary ${
                        product.stock > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {product.stock > 0
                        ? `In Stock (${product.stock} available)`
                        : "Out of Stock"}
                    </span>
                  </li>

                  {/* Featured */}
                  {product.featured !== undefined && (
                    <li className="flex">
                      <span className="font-medium w-24">Featured:</span>
                      <span className="theme-text-primary">
                        {product.featured ? "Yes" : "No"}
                      </span>
                    </li>
                  )}

                  {/* Date Added */}
                  {product.createdAt && (
                    <li className="flex">
                      <span className="font-medium w-24">Date Added:</span>
                      <span className="theme-text-primary">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  )}

                  {/* Ratings Summary */}
                  <li className="flex">
                    <span className="font-medium w-24">Rating:</span>
                    <span className="theme-text-primary flex items-center">
                      <span className="mr-1">
                        {(product.ratings || 0).toFixed(1)}
                      </span>
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <span className="ml-1">
                        ({product.numReviews || 0} reviews)
                      </span>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Product Description and Reviews Tabs */}
          <div className="border-t border-gray-200">
            <div className="p-6">
              {/* Reviews Section */}
              <div className="mb-8">
                <h2 className="text-xl font-serif font-bold mb-4">
                  Customer Reviews
                </h2>

                {/* Reviews List */}
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {product.reviews.map((review, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-4"
                      >
                        <div className="flex items-center mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
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
                          <span className="ml-2 text-sm font-medium">
                            {review.user ? review.user.name : "Anonymous"}
                          </span>
                          <span className="ml-auto text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm theme-text-primary">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="theme-text-secondary mb-6">
                    No reviews yet. Be the first to review this product!
                  </p>
                )}

                {/* Write a Review Form */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Write a Review</h3>

                  {!isAuthenticated ? (
                    <div className="text-center py-4">
                      <p className="mb-3 theme-text-secondary">
                        Please log in to write a review
                      </p>
                      <Link
                        to="/login"
                        className="text-primary hover:underline"
                      >
                        Login here
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit}>
                      {reviewSuccess && (
                        <div className="mb-4">
                          <Alert type="success" message={reviewSuccess} />
                        </div>
                      )}

                      {reviewError && (
                        <div className="mb-4">
                          <Alert type="error" message={reviewError} />
                        </div>
                      )}

                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">
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
                                  className={`w-6 h-6 ${
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
                          className="block mb-2 text-sm font-medium"
                        >
                          Your Review
                        </label>
                        <textarea
                          id="comment"
                          name="comment"
                          rows="4"
                          value={reviewForm.comment}
                          onChange={handleReviewFormChange}
                          className="w-full px-3 py-2 border theme-border rounded-md theme-bg-primary theme-text-primary"
                          placeholder="Share your experience with this product..."
                          required
                        ></textarea>
                      </div>

                      <Button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="w-full sm:w-auto"
                      >
                        {reviewSubmitting ? "Submitting..." : "Submit Review"}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-serif font-bold mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct._id}
                  className="theme-bg-primary rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link to={`/products/${relatedProduct._id}`}>
                    <div className="relative h-48">
                      <img
                        src={
                          relatedProduct.images &&
                          relatedProduct.images.length > 0
                            ? getAssetUrl(relatedProduct.images[0])
                            : `https://via.placeholder.com/300x200?text=${encodeURIComponent(
                                relatedProduct.name || "Product"
                              )}`
                        }
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/300x200?text=Image+Not+Found";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium mb-2 theme-text-primary">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">
                          {formatPrice(relatedProduct.price)}
                        </span>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          <span className="ml-1 text-sm theme-text-secondary">
                            {(relatedProduct.ratings || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailSimple;
