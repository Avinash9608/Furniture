import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { productsAPI, getImageUrl } from "../utils/api";
import { formatPrice } from "../utils/format";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import Button from "../components/Button";

/**
 * A simplified version of the ProductDetail component with minimal dependencies
 * and robust error handling to ensure it works in all environments
 */
const ProductDetailSimple = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product details with robust error handling
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`[ProductDetailSimple] Fetching product details for ID: ${id}`);
        
        // Direct fetch to avoid any middleware issues
        const response = await fetch(`https://furniture-q3nb.onrender.com/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("[ProductDetailSimple] Product data received:", data);
        
        if (!data || !data.data) {
          throw new Error("Invalid product data received");
        }
        
        // Create a safe product object with fallbacks for all properties
        const safeProduct = {
          _id: data.data._id || id,
          name: data.data.name || "Product",
          description: data.data.description || "No description available",
          price: data.data.price || 0,
          stock: data.data.stock || 0,
          images: Array.isArray(data.data.images) ? data.data.images : [],
        };
        
        setProduct(safeProduct);
      } catch (error) {
        console.error("[ProductDetailSimple] Error fetching product:", error);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

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

  // Simplified product detail view
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
            {/* Product Image */}
            <div>
              <div className="relative h-80 md:h-96 rounded-lg overflow-hidden mb-4">
                <img
                  src={
                    product.images && product.images.length > 0
                      ? getImageUrl(product.images[0])
                      : `https://via.placeholder.com/800x600?text=${encodeURIComponent(
                          product.name || "Product"
                        )}`
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log("[ProductDetailSimple] Image load error:", e.target.src);
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/800x600?text=Image+Not+Found";
                  }}
                />
              </div>
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2 theme-text-primary">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mb-6">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
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

              {/* Back to Products Button */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Link to="/products">
                  <Button variant="outline" className="flex-grow sm:flex-grow-0">
                    Back to Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSimple;
