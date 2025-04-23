import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ordersAPI } from "../utils/api";
import { formatPrice } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import PaymentRequestForm from "../components/PaymentRequestForm";
import Alert from "../components/Alert";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await ordersAPI.getMyOrders();

        // Check if response.data exists and has the expected structure
        if (response && response.data) {
          // Check if response.data.data is an array (API returns {success, count, data})
          if (response.data.data && Array.isArray(response.data.data)) {
            setOrders(response.data.data);
          } else if (Array.isArray(response.data)) {
            // If response.data is directly an array
            setOrders(response.data);
          } else {
            console.error("Unexpected API response format:", response.data);
            setOrders([]);
            setError("Received invalid data format from server");
          }
        } else {
          console.error("No data received from API");
          setOrders([]);
          setError("No data received from server");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders([]);
        setError(
          err.response?.data?.message || err.message || "Failed to fetch orders"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  const getPaymentStatusColor = (isPaid) => {
    return isPaid
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-8">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-bg-secondary py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-serif font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              No Orders Found
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet.
            </p>
            <Link to="/products" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-gray-50 px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <div className="flex items-center">
                      <h2 className="text-lg font-medium text-gray-900">
                        Order #{order._id.substring(0, 8)}
                      </h2>
                      <span
                        className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                          order.isPaid
                        )}`}
                      >
                        {order.isPaid ? "Paid" : "Payment Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}{" "}
                      at {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span className="font-medium text-primary">
                      {formatPrice(order.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Shipping Address
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.name}
                        <br />
                        {order.shippingAddress.address}
                        <br />
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.postalCode}
                        <br />
                        {order.shippingAddress.country}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Payment Method
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.paymentMethod}
                        {order.isPaid ? (
                          <span className="block text-green-600 text-xs mt-1">
                            Paid on{" "}
                            {new Date(order.paidAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="block text-yellow-600 text-xs mt-1">
                            {order.paymentMethod === "cod"
                              ? "Pay on delivery"
                              : "Payment pending"}
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Order Status
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              order.status === "processing" ||
                              order.status === "shipped" ||
                              order.status === "delivered"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span className="ml-2 text-sm text-gray-600">
                            Processing
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              order.status === "shipped" ||
                              order.status === "delivered"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span className="ml-2 text-sm text-gray-600">
                            Shipped
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              order.status === "delivered"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span className="ml-2 text-sm text-gray-600">
                            Delivered
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Order Items
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Product
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Quantity
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {order.orderItems.map((item) => (
                            <tr key={item._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <img
                                      className="h-10 w-10 rounded-md object-cover"
                                      src={item.image}
                                      alt={item.name}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src =
                                          "https://via.placeholder.com/300x300?text=Image+Not+Found";
                                      }}
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {item.quantity}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {formatPrice(item.price * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <th
                              scope="row"
                              colSpan="2"
                              className="px-6 py-3 text-right text-sm font-medium text-gray-900"
                            >
                              Subtotal
                            </th>
                            <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                              {formatPrice(order.itemsPrice)}
                            </td>
                          </tr>
                          <tr>
                            <th
                              scope="row"
                              colSpan="2"
                              className="px-6 py-3 text-right text-sm font-medium text-gray-900"
                            >
                              Shipping
                            </th>
                            <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                              {order.shippingPrice === 0
                                ? "Free"
                                : formatPrice(order.shippingPrice)}
                            </td>
                          </tr>
                          <tr>
                            <th
                              scope="row"
                              colSpan="2"
                              className="px-6 py-3 text-right text-sm font-medium text-gray-900"
                            >
                              Tax
                            </th>
                            <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                              {formatPrice(order.taxPrice)}
                            </td>
                          </tr>
                          <tr>
                            <th
                              scope="row"
                              colSpan="2"
                              className="px-6 py-3 text-right text-sm font-medium text-gray-900"
                            >
                              Total
                            </th>
                            <td className="px-6 py-3 text-right text-sm font-medium text-primary">
                              {formatPrice(order.totalPrice)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {!order.isPaid &&
                    (order.paymentMethod === "upi" ||
                      order.paymentMethod === "rupay" ||
                      order.paymentMethod === "bank_transfer") && (
                      <div className="mt-6 border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Payment Information
                        </h3>
                        <PaymentRequestForm
                          orderId={order._id}
                          amount={order.totalPrice}
                          onSuccess={() => {
                            // Refresh orders after successful payment request
                            const fetchOrders = async () => {
                              try {
                                const response = await ordersAPI.getMyOrders();

                                // Check if response.data exists and has the expected structure
                                if (response && response.data) {
                                  // Check if response.data.data is an array (API returns {success, count, data})
                                  if (
                                    response.data.data &&
                                    Array.isArray(response.data.data)
                                  ) {
                                    setOrders(response.data.data);
                                  } else if (Array.isArray(response.data)) {
                                    // If response.data is directly an array
                                    setOrders(response.data);
                                  } else {
                                    console.error(
                                      "Unexpected API response format:",
                                      response.data
                                    );
                                    setOrders([]);
                                  }
                                } else {
                                  console.error("No data received from API");
                                  setOrders([]);
                                }
                              } catch (err) {
                                console.error("Error fetching orders:", err);
                              }
                            };
                            fetchOrders();
                          }}
                        />
                        <div className="mt-4 text-center">
                          <Link
                            to="/payment-requests"
                            className="text-primary hover:underline"
                          >
                            View all my payment requests
                          </Link>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
