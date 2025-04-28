import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatPrice, formatDate } from "../utils/format";
import Button from "../components/Button";
import Alert from "../components/Alert";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock order data - would fetch from API in real implementation
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data
        const mockOrders = [
          {
            _id: "ord123456",
            createdAt: new Date("2023-05-15"),
            totalPrice: 24999,
            status: "Delivered",
            isPaid: true,
            items: [
              {
                product: {
                  _id: "prod1",
                  name: "Modern Sofa Set",
                  images: [
                    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
                  ],
                },
                quantity: 1,
                price: 24999,
              },
            ],
          },
          {
            _id: "ord789012",
            createdAt: new Date("2023-06-20"),
            totalPrice: 18999,
            status: "Shipped",
            isPaid: true,
            items: [
              {
                product: {
                  _id: "prod2",
                  name: "Wooden Dining Table",
                  images: [
                    "https://images.unsplash.com/photo-1533090161767-e6ffed986c88",
                  ],
                },
                quantity: 1,
                price: 18999,
              },
            ],
          },
          {
            _id: "ord345678",
            createdAt: new Date(),
            totalPrice: 9999,
            status: "Processing",
            isPaid: true,
            items: [
              {
                product: {
                  _id: "prod3",
                  name: "Ergonomic Office Chair",
                  images: [
                    "https://images.unsplash.com/photo-1580480055273-228ff5388ef8",
                  ],
                },
                quantity: 1,
                price: 9999,
              },
            ],
          },
        ];

        setOrders(mockOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "Processing":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "Shipped":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
      case "Delivered":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "Cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="container-custom py-4 sm:py-8 px-4 sm:px-6 dark:bg-gray-900">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
        My Orders
      </h1>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {loading ? (
        <div className="flex justify-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary dark:border-primary-light"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8 text-center border border-gray-200 dark:border-gray-700">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            ></path>
          </svg>
          <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            No Orders Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
            You haven't placed any orders yet.
          </p>
          <Link to="/products" className="inline-block">
            <Button className="w-full sm:w-auto">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Order #{order._id.substring(order._id.length - 6)}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row sm:items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <Link
                      to={`/orders/${order._id}`}
                      className="mt-2 sm:mt-0 sm:ml-4 text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-lighter font-medium text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 dark:bg-gray-800">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className={`flex flex-col sm:flex-row items-start sm:items-center py-4 ${
                      index !== order.items.length - 1
                        ? "border-b border-gray-200 dark:border-gray-700"
                        : ""
                    }`}
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover object-center"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/300x300/gray/white?text=Product";
                        }}
                      />
                    </div>

                    <div className="mt-4 sm:mt-0 sm:ml-4 flex-1 flex flex-col w-full">
                      <div>
                        <div className="flex flex-col sm:flex-row justify-between text-base font-medium text-gray-900 dark:text-gray-100">
                          <h3 className="mb-1 sm:mb-0">
                            <Link
                              to={`/products/${item.product._id}`}
                              className="hover:text-primary dark:hover:text-primary-light"
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="sm:ml-4">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between text-sm mt-2">
                        <p className="text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
                          Qty {item.quantity}
                        </p>

                        {order.status === "Delivered" && (
                          <button
                            className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-lighter font-medium py-1 px-2 border border-primary dark:border-primary-light rounded-md sm:border-none sm:p-0 text-center sm:text-left"
                            onClick={() =>
                              alert("Review functionality would go here")
                            }
                          >
                            Write a Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between text-base font-medium text-gray-900 dark:text-gray-100">
                  <div className="flex justify-between sm:block">
                    <p className="sm:mb-1">Total</p>
                    <p className="sm:hidden">{formatPrice(order.totalPrice)}</p>
                  </div>
                  <div className="flex justify-between sm:block mt-1 sm:mt-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-right sm:mb-1">
                      {order.isPaid ? "Paid" : "Payment pending"}
                    </p>
                    <p className="hidden sm:block font-bold text-primary dark:text-primary-light">
                      {formatPrice(order.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
