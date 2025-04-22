import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/format";
import Button from "../components/Button";
import Alert from "../components/Alert";

const Cart = () => {
  const {
    cartItems,
    totalItems,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState(null);
  const [couponSuccess, setCouponSuccess] = useState(null);
  const [discount, setDiscount] = useState(0);

  // Calculate shipping cost (free shipping over ₹10,000)
  const shippingCost = totalPrice > 10000 ? 0 : 500;

  // Calculate tax (18% GST)
  const taxRate = 0.18;
  const taxAmount = (totalPrice - discount) * taxRate;

  // Calculate final total
  const finalTotal = totalPrice - discount + shippingCost + taxAmount;

  // Handle quantity change
  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity);
    }
  };

  // Handle remove item
  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  // Handle apply coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault();

    // Reset previous messages
    setCouponError(null);
    setCouponSuccess(null);

    // Simple coupon validation (in a real app, this would be validated on the server)
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    // Example coupon codes
    const validCoupons = {
      WELCOME10: 0.1, // 10% off
      SUMMER20: 0.2, // 20% off
      FLAT500: 500, // ₹500 off
    };

    if (validCoupons[couponCode]) {
      const discountValue =
        typeof validCoupons[couponCode] === "number" &&
        validCoupons[couponCode] < 1
          ? totalPrice * validCoupons[couponCode]
          : validCoupons[couponCode];

      setDiscount(discountValue);
      setCouponSuccess(
        `Coupon applied successfully! You saved ${formatPrice(discountValue)}`
      );
    } else {
      setCouponError("Invalid coupon code");
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login page with a return URL
      navigate("/login?redirect=checkout");
    } else {
      // Proceed to checkout
      navigate("/checkout");
    }
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-serif font-bold mb-6">
          Your Shopping Cart
        </h1>

        {cartItems.length === 0 ? (
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link to="/products" className="btn-primary inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                      Cart Items ({totalItems})
                    </h2>
                    <button
                      onClick={() => clearCart()}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Clear Cart
                    </button>
                  </div>

                  {/* Cart Items List */}
                  <div className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="py-4 flex flex-col sm:flex-row"
                      >
                        {/* Product Image */}
                        <div className="w-full sm:w-24 h-24 mb-4 sm:mb-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-md"
                            onError={(e) => {
                              console.log(
                                "Cart image load error:",
                                e.target.src
                              );
                              e.target.onerror = null;
                              e.target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(
                                item.name || "Product"
                              )}`;
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-grow sm:ml-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <div>
                              <h3 className="text-lg font-medium">
                                <Link
                                  to={`/products/${item._id}`}
                                  className="hover:text-primary"
                                >
                                  {item.name}
                                </Link>
                              </h3>
                              <p className="text-gray-600 text-sm">
                                Price: {formatPrice(item.price)}
                              </p>
                            </div>

                            <div className="mt-2 sm:mt-0 flex items-center">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item._id,
                                      item.quantity - 1
                                    )
                                  }
                                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                >
                                  -
                                </button>
                                <span className="px-2 py-1 border-x border-gray-300">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item._id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveItem(item._id)}
                                className="ml-4 text-red-600 hover:text-red-800"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  ></path>
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div className="mt-2 text-right">
                            <span className="font-medium">
                              Subtotal:{" "}
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Continue Shopping */}
              <div className="mt-4">
                <Link
                  to="/products"
                  className="text-primary hover:underline flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    ></path>
                  </svg>
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18% GST)</span>
                    <span className="font-medium">
                      {formatPrice(taxAmount)}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-xl text-primary">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Apply Coupon</h3>

                  {couponError && (
                    <Alert
                      type="error"
                      message={couponError}
                      onClose={() => setCouponError(null)}
                    />
                  )}

                  {couponSuccess && (
                    <Alert
                      type="success"
                      message={couponSuccess}
                      onClose={() => setCouponSuccess(null)}
                    />
                  )}

                  <form onSubmit={handleApplyCoupon} className="flex">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-grow border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-r-md transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                </div>

                {/* Checkout Button */}
                <Button onClick={handleCheckout} fullWidth className="mb-4">
                  Proceed to Checkout
                </Button>

                {/* Payment Methods */}
                <div className="text-center text-sm text-gray-500">
                  <p className="mb-2">We accept:</p>
                  <div className="flex justify-center space-x-2">
                    <span className="bg-gray-100 rounded px-2 py-1">
                      Credit Card
                    </span>
                    <span className="bg-gray-100 rounded px-2 py-1">
                      PayPal
                    </span>
                    <span className="bg-gray-100 rounded px-2 py-1">
                      Cash on Delivery
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
