import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ordersAPI } from "../../utils/api";
import { formatPrice, formatDate } from "../../utils/format";
import { formatId, safeSubstring, capitalize } from "../../utils/stringUtils";
import AdminLayout from "../../components/admin/AdminLayout";
import Alert from "../../components/Alert";
import SweetAlert from "sweetalert2";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Ensure orders is always an array
  const ordersArray = Array.isArray(orders) ? orders : [];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        console.log("Fetching orders from database...");

        // Add cache busting parameter to prevent caching
        const cacheBuster = new Date().getTime();

        // Use the improved ordersAPI utility which has better error handling and debugging
        console.log(
          "Using ordersAPI to fetch orders with improved error handling..."
        );
        const response = await ordersAPI.getAll({ _cb: cacheBuster });

        console.log("Orders API response:", response);

        // Check if we have valid data
        if (response?.data?.data && Array.isArray(response.data.data)) {
          console.log(
            `Successfully fetched ${response.data.data.length} orders from API`
          );
          console.log(`Data source: ${response.data.source || "unknown"}`);

          // Process the orders to ensure all required fields are present
          const processedOrders = response.data.data.map((order) => {
            // Ensure status is lowercase
            const status = order.status
              ? order.status.toLowerCase()
              : "pending";

            // Ensure dates are in proper format
            const createdAt = order.createdAt
              ? new Date(order.createdAt).toISOString()
              : new Date().toISOString();

            // Return processed order
            return {
              ...order,
              status,
              createdAt,
              // Add any missing fields with defaults
              isPaid: order.isPaid === true,
              totalPrice: order.totalPrice || 0,
              // Ensure user object exists
              user: order.user || {
                name: "Unknown User",
                email: "unknown@example.com",
              },
              // Ensure orderItems exists
              orderItems: order.orderItems || [],
              // Ensure shippingAddress exists
              shippingAddress: order.shippingAddress || {},
            };
          });

          console.log("Processed orders:", processedOrders);
          setOrders(processedOrders);

          // Show a message if using mock data
          if (response.data.isMockData) {
            setError({
              type: "mockData",
              message:
                "⚠️ USING MOCK DATA - Database connection issue. The data shown is for demonstration purposes only and does not represent real orders from customers. Please check server logs for details.",
            });
          } else {
            setError(null);
          }

          // Add data source information
          if (response.data.source) {
            console.log(`Data source confirmed: ${response.data.source}`);
            // You could display this information in the UI if needed
          }
        } else {
          console.error("Invalid data format received from API");
          setError({
            type: "error",
            message:
              "Failed to fetch orders from the database. The API returned an invalid data format. Please check server logs for details.",
          });
          setOrders([]);
        }
      } catch (err) {
        console.error("Error in fetchOrders:", err);
        setError({
          type: "error",
          message:
            err.message ||
            "An unexpected error occurred while fetching orders. Please check server logs for details.",
        });
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Using imported getMockOrders from utils/mockData.js

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setLoading(true);
      console.log(`Updating order ${orderId} status to ${newStatus}`);

      // Show loading alert
      SweetAlert.fire({
        title: "Updating Order Status",
        text: `Changing order status to ${newStatus}...`,
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          SweetAlert.showLoading();
        },
      });

      const response = await ordersAPI.updateOrderStatus(orderId, newStatus);
      console.log("Update status response:", response);

      // Update the order in the state
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Show success alert
      SweetAlert.fire({
        title: "Success!",
        text: `Order status updated to ${newStatus}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error updating order status:", err);

      // Show error alert
      SweetAlert.fire({
        title: "Error!",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to update order status",
        icon: "error",
        confirmButtonText: "OK",
      });

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update order status"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
      case "processing":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800";
      case "shipped":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
      case "delivered":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
    }
  };

  const getPaymentStatusColor = (isPaid) => {
    // Handle undefined/null isPaid values
    const paid = isPaid === true;

    return paid
      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-800 font-semibold shadow-sm"
      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800 font-semibold shadow-sm";
  };

  // Filter orders by status and search term
  const filteredOrders = ordersArray
    .filter((order) => {
      if (filter === "all") return true;

      // Handle case where status might be undefined or null
      const orderStatus = order.status || "";
      return orderStatus.toString().toLowerCase() === filter.toLowerCase();
    })
    .filter((order) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();

      // Safely check all searchable fields
      const orderId = order._id ? order._id.toString().toLowerCase() : "";
      const userName = order.user?.name ? order.user.name.toLowerCase() : "";
      const userEmail = order.user?.email ? order.user.email.toLowerCase() : "";
      const shippingName = order.shippingAddress?.name
        ? order.shippingAddress.name.toLowerCase()
        : "";
      const shippingPhone = order.shippingAddress?.phone
        ? order.shippingAddress.phone.toLowerCase()
        : "";
      const paymentMethod = order.paymentMethod
        ? order.paymentMethod.toLowerCase()
        : "";

      return (
        orderId.includes(searchLower) ||
        userName.includes(searchLower) ||
        userEmail.includes(searchLower) ||
        shippingName.includes(searchLower) ||
        shippingPhone.includes(searchLower) ||
        paymentMethod.includes(searchLower)
      );
    });

  if (loading) {
    return (
      <AdminLayout title="Orders">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Orders">
        <Alert
          type={error.type || "error"}
          message={error.message || error}
          autoClose={false}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Orders">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold theme-text-primary">Manage Orders</h1>
        <div className="text-sm theme-text-secondary">
          Total Orders:{" "}
          <span className="font-medium theme-text-primary">
            {ordersArray.length}
          </span>
        </div>
      </div>

      <div className="theme-bg-primary rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4 md:mb-0">
            <div>
              <label
                htmlFor="filter"
                className="block text-sm font-medium theme-text-primary mb-1"
              >
                Filter by Status
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base theme-border theme-bg-primary theme-text-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="all">All Orders</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-64">
            <label
              htmlFor="search"
              className="block text-sm font-medium theme-text-primary mb-1"
            >
              Search Orders
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by ID, name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border theme-border rounded-md leading-5 theme-bg-primary theme-text-primary placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-primary focus:border-primary sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 theme-text-secondary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto theme-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium theme-text-primary">
              No orders found
            </h3>
            <p className="mt-1 text-sm theme-text-secondary">
              {filter !== "all"
                ? `No ${filter} orders found.`
                : searchTerm
                ? "No orders match your search criteria."
                : "There are no orders yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y theme-divide">
              <thead className="theme-bg-secondary">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider"
                  >
                    Order ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider"
                  >
                    Payment
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="theme-bg-primary divide-y theme-divide">
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:theme-bg-secondary transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      <div className="font-medium theme-text-primary">
                        #
                        {order._id && order._id.startsWith("mock")
                          ? formatId(order._id, 8, false)
                          : formatId(order._id, 12, true)}
                      </div>
                      <div className="text-xs theme-text-secondary mt-1">
                        {order.orderItems?.length || 0} item(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium theme-text-primary">
                        {order.user?.name ||
                          order.shippingAddress?.name ||
                          "Unknown"}
                      </div>
                      <div className="text-xs theme-text-secondary">
                        {order.user?.email || "No email"}
                      </div>
                      <div className="text-xs theme-text-secondary mt-1">
                        {order.shippingAddress?.phone || "No phone"}
                      </div>
                      {order.sourceAddress && (
                        <div className="text-xs text-green-600 mt-1">
                          Source: {order.sourceAddress.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm theme-text-primary">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "Date not available"}
                      </div>
                      {order.createdAt && (
                        <div className="text-xs theme-text-secondary">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      )}
                      {order.deliveredAt && (
                        <div className="text-xs text-green-600 mt-1">
                          Delivered:{" "}
                          {new Date(order.deliveredAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium theme-text-primary">
                        {formatPrice(order.totalPrice)}
                      </div>
                      {order.taxPrice > 0 && (
                        <div className="text-xs theme-text-secondary">
                          Inc. GST: {formatPrice(order.taxPrice)}
                        </div>
                      )}
                      {order.shippingPrice > 0 && (
                        <div className="text-xs theme-text-secondary">
                          Shipping: {formatPrice(order.shippingPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm theme-text-primary capitalize font-medium">
                        <span
                          className={`${
                            order.paymentMethod === "upi"
                              ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                              : ""
                          }`}
                        >
                          {order.paymentMethod
                            ? order.paymentMethod.toString().replace(/_/g, " ")
                            : "Unknown Method"}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          order.isPaid === true
                        )}`}
                      >
                        {order.isPaid === true ? "✓ Paid" : "⏱ Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status || "unknown"
                          )}`}
                        >
                          {capitalize(order.status) || "Unknown"}
                        </span>

                        {/* Order tracking progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                          <div
                            className={`h-2.5 rounded-full ${
                              order.status === "cancelled"
                                ? "bg-red-600"
                                : "bg-primary"
                            }`}
                            style={{
                              width:
                                order.status === "processing"
                                  ? "25%"
                                  : order.status === "shipped"
                                  ? "50%"
                                  : order.status === "delivered"
                                  ? "100%"
                                  : order.status === "cancelled"
                                  ? "100%"
                                  : "10%",
                            }}
                          ></div>
                        </div>

                        {/* Order tracking steps */}
                        <div className="flex justify-between text-xs theme-text-secondary mt-1">
                          <span
                            className={
                              order.status === "processing" ||
                              order.status === "shipped" ||
                              order.status === "delivered"
                                ? "font-bold text-primary"
                                : ""
                            }
                          >
                            Processing
                          </span>
                          <span
                            className={
                              order.status === "shipped" ||
                              order.status === "delivered"
                                ? "font-bold text-primary"
                                : ""
                            }
                          >
                            Shipped
                          </span>
                          <span
                            className={
                              order.status === "delivered"
                                ? "font-bold text-primary"
                                : ""
                            }
                          >
                            Delivered
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={(order.status || "pending").toLowerCase()}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className="block w-full pl-3 pr-10 py-2 text-base theme-border theme-bg-primary theme-text-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <div className="mt-2 flex flex-col space-y-2">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="block text-center px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-dark transition-colors"
                        >
                          Edit Order
                        </Link>

                        <Link
                          to={`/order/${order._id}`}
                          className="block text-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
