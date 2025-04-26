import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ordersAPI } from "../utils/api";
import { formatPrice } from "../utils/format";
import Loading from "../components/Loading";
import Alert from "../components/Alert";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching order details for ID: ${id}`);
        const response = await ordersAPI.getById(id);
        
        // Check if we have valid order data
        if (!response || !response.data || !response.data.data) {
          console.error("Invalid order data received:", response);
          throw new Error("Order data is invalid or missing");
        }
        
        setOrder(response.data.data);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(err.message || "Failed to load order details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get payment status color
  const getPaymentStatusColor = (isPaid) => {
    return isPaid
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  // Render order tracking progress bar
  const renderTrackingProgress = () => {
    const statuses = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"];
    const currentStatusIndex = statuses.findIndex(
      (s) => s.toLowerCase() === (order?.status || "").toLowerCase()
    );
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status</h3>
        <div className="relative">
          {/* Progress bar background */}
          <div className="h-2 bg-gray-200 rounded-full">
            {/* Active progress */}
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${Math.max(5, ((currentStatusIndex + 1) / statuses.length) * 100)}%` }}
            ></div>
          </div>
          
          {/* Status points */}
          <div className="flex justify-between mt-2">
            {statuses.map((status, index) => (
              <div key={status} className="flex flex-col items-center">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                    index <= currentStatusIndex 
                      ? "bg-primary text-white" 
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index <= currentStatusIndex ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs text-center ${
                  index <= currentStatusIndex ? "text-primary font-medium" : "text-gray-500"
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert type="error" message={error} />
        <div className="mt-4 text-center">
          <Link to="/orders" className="text-primary hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert type="error" message="Order not found" />
        <div className="mt-4 text-center">
          <Link to="/orders" className="text-primary hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Order Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order._id.substring(0, 8)}
          </h1>
          <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="mt-2 md:mt-0 flex flex-col sm:flex-row items-start sm:items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <span className={`mt-1 sm:mt-0 sm:ml-2 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.isPaid)}`}>
            {order.isPaid ? "Paid" : "Payment Pending"}
          </span>
          <button 
            onClick={() => navigate("/orders")}
            className="mt-2 sm:mt-0 sm:ml-4 text-primary hover:text-primary-dark"
          >
            Back to Orders
          </button>
        </div>
      </div>

      {/* Order Tracking */}
      {renderTrackingProgress()}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Details and Items */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
            </div>
            <div className="p-6">
              <div className="divide-y divide-gray-200">
                {order.orderItems && order.orderItems.map((item) => (
                  <div key={item._id || item.product} className="py-4 flex">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/300x300?text=Image+Not+Found";
                        }}
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            <Link to={`/products/${item.product}`}>
                              {item.name}
                            </Link>
                          </h3>
                          <p className="ml-4">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <p className="text-gray-500">Qty {item.quantity}</p>
                        <p className="text-gray-500">
                          Subtotal: {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Shipping Information</h2>
            </div>
            <div className="p-6">
              {order.shippingAddress && (
                <div>
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="mt-2">
                    <span className="font-medium">Phone:</span> {order.shippingAddress.phone}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1 space-y-6">
          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
            </div>
            <div className="p-6">
              <p>
                <span className="font-medium">Method:</span>{" "}
                {order.paymentMethod}
              </p>
              <p className="mt-2">
                <span className="font-medium">Status:</span>{" "}
                <span className={order.isPaid ? "text-green-600" : "text-yellow-600"}>
                  {order.isPaid ? "Paid" : "Payment Pending"}
                </span>
              </p>
              {order.isPaid && order.paidAt && (
                <p className="mt-2">
                  <span className="font-medium">Paid on:</span>{" "}
                  {formatDate(order.paidAt)}
                </p>
              )}
              {order.paymentResult && (
                <div className="mt-2">
                  <p>
                    <span className="font-medium">Transaction ID:</span>{" "}
                    {order.paymentResult.id}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {order.paymentResult.status}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
            </div>
            <div className="p-6">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{formatPrice(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">{formatPrice(order.shippingPrice)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">{formatPrice(order.taxPrice)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200 mt-2 pt-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-primary">{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Delivery Information</h2>
            </div>
            <div className="p-6">
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span className={`font-medium ${
                  order.status === "Delivered" ? "text-green-600" : "text-blue-600"
                }`}>
                  {order.status}
                </span>
              </p>
              {order.status === "Delivered" && order.deliveredAt && (
                <p className="mt-2">
                  <span className="font-medium">Delivered on:</span>{" "}
                  {formatDate(order.deliveredAt)}
                </p>
              )}
              {order.status === "Shipped" && (
                <p className="mt-2 text-gray-600">
                  Your order is on the way! You will receive it soon.
                </p>
              )}
              {order.status === "Processing" && (
                <p className="mt-2 text-gray-600">
                  Your order is being processed and will be shipped soon.
                </p>
              )}
              {order.status === "Pending" && (
                <p className="mt-2 text-gray-600">
                  Your order is pending confirmation.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
