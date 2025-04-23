import React, { useState, useEffect } from "react";
import { ordersAPI } from "../../utils/api";
import { formatPrice } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import Alert from "../../components/Alert";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        console.log("Fetching orders...");
        const response = await ordersAPI.getAll();
        console.log("Orders response:", response);

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

    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateOrderStatus(orderId, newStatus);
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update order status"
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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
    return isPaid
      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-800 font-semibold shadow-sm"
      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800 font-semibold shadow-sm";
  };

  // Ensure orders is always an array before filtering
  const ordersArray = Array.isArray(orders) ? orders : [];

  const filteredOrders = ordersArray.filter((order) => {
    // Apply status filter
    if (
      filter !== "all" &&
      order.status &&
      order.status.toLowerCase() !== filter
    ) {
      return false;
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (order._id && order._id.toLowerCase().includes(searchLower)) ||
        (order.shippingAddress &&
          order.shippingAddress.name &&
          order.shippingAddress.name.toLowerCase().includes(searchLower)) ||
        (order.shippingAddress &&
          order.shippingAddress.email &&
          order.shippingAddress.email.toLowerCase().includes(searchLower)) ||
        (order.shippingAddress &&
          order.shippingAddress.phone &&
          order.shippingAddress.phone.toLowerCase().includes(searchLower))
      );
    }

    return true;
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
        <Alert type="error" message={error} />
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
                      #{order._id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium theme-text-primary">
                        {order.shippingAddress.name}
                      </div>
                      <div className="text-sm theme-text-secondary">
                        {order.shippingAddress.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-text-primary">
                      {formatPrice(order.totalPrice)}
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
                          {order.paymentMethod}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          order.isPaid
                        )}`}
                      >
                        {order.isPaid ? "✓ Paid" : "⏱ Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className="block w-full pl-3 pr-10 py-2 text-base theme-border theme-bg-primary theme-text-primary focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      >
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
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
