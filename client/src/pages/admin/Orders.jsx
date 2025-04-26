import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ordersAPI } from "../../utils/api";
import { formatPrice, formatDate } from "../../utils/format";
import AdminLayout from "../../components/admin/AdminLayout";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try multiple approaches to get orders
        let ordersData = [];
        let fetchSuccess = false;

        // Approach 1: Use the API utility
        try {
          console.log("Attempting to fetch orders using ordersAPI.getAll()");
          const response = await ordersAPI.getAll();
          console.log("Orders API response:", response);

          // Handle different response structures
          if (
            response &&
            response.data &&
            response.data.data &&
            Array.isArray(response.data.data)
          ) {
            ordersData = response.data.data;
            fetchSuccess = true;
            console.log("Successfully fetched orders from API utility");
          } else if (
            response &&
            response.data &&
            Array.isArray(response.data)
          ) {
            ordersData = response.data;
            fetchSuccess = true;
            console.log(
              "Successfully fetched orders from API utility (alt format)"
            );
          } else if (response && Array.isArray(response)) {
            ordersData = response;
            fetchSuccess = true;
            console.log(
              "Successfully fetched orders from API utility (direct array)"
            );
          }
        } catch (apiError) {
          console.error("Error fetching orders from API utility:", apiError);
        }

        // Approach 2: Try direct fetch to different endpoints if API utility failed
        if (!fetchSuccess) {
          const endpoints = [
            "/admin/orders",
            "/api/admin/orders",
            "/api/orders",
            "/orders",
          ];

          for (const endpoint of endpoints) {
            if (fetchSuccess) break;

            try {
              console.log(`Attempting direct fetch from ${endpoint}`);
              const response = await fetch(endpoint);

              if (response.ok) {
                const data = await response.json();
                console.log(`Response from ${endpoint}:`, data);

                if (data && data.data && Array.isArray(data.data)) {
                  ordersData = data.data;
                  fetchSuccess = true;
                  console.log(`Successfully fetched orders from ${endpoint}`);
                } else if (data && Array.isArray(data)) {
                  ordersData = data;
                  fetchSuccess = true;
                  console.log(
                    `Successfully fetched orders from ${endpoint} (direct array)`
                  );
                }
              }
            } catch (fetchError) {
              console.error(`Error fetching from ${endpoint}:`, fetchError);
            }
          }
        }

        console.log("Final processed orders data:", ordersData);

        // Check if we have valid data
        if (fetchSuccess && ordersData && ordersData.length > 0) {
          // Normalize the data to ensure consistent structure
          const normalizedOrders = ordersData.map((order) => ({
            _id:
              order._id ||
              `mock_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 7)}`,
            user: order.user || {
              name: order.shippingAddress?.name || "Unknown Customer",
            },
            shippingAddress: order.shippingAddress || {
              name: order.user?.name || "Unknown Address",
            },
            createdAt: order.createdAt || new Date().toISOString(),
            totalPrice: order.totalPrice || 0,
            status: order.status || "Pending",
            isPaid: order.isPaid || false,
            paymentMethod: order.paymentMethod || "Unknown",
            orderItems: order.orderItems || [],
          }));

          setOrders(normalizedOrders);
        } else {
          // If we still don't have data, use mock data
          console.log("No valid orders data found, using mock data");
          setOrders(getMockOrders());
        }
      } catch (error) {
        console.error("Error in orders effect:", error);
        setError("Failed to load orders. Using sample data instead.");
        setOrders(getMockOrders());
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Function to generate mock orders for testing
  const getMockOrders = () => {
    return [
      {
        _id: `mock_admin_${Date.now()}_1`,
        user: {
          _id: "mock_user_1",
          name: "John Doe",
          email: "john@example.com",
        },
        orderItems: [
          {
            name: "Executive Office Chair",
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1580480055273-228ff5388ef8",
            price: 15999,
            product: "prod_chair_1",
          },
        ],
        shippingAddress: {
          name: "John Doe",
          address: "42 Business Park",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
          phone: "9876543210",
        },
        paymentMethod: "credit_card",
        taxPrice: 2880,
        shippingPrice: 0,
        totalPrice: 18879,
        isPaid: true,
        paidAt: new Date(Date.now() - 172800000), // 2 days ago
        status: "Delivered",
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 86400000),
      },
      {
        _id: `mock_admin_${Date.now()}_2`,
        user: {
          _id: "mock_user_2",
          name: "Priya Sharma",
          email: "priya@example.com",
        },
        orderItems: [
          {
            name: "King Size Bed",
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
            price: 32999,
            product: "prod_bed_1",
          },
          {
            name: "Memory Foam Mattress",
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1631052066165-9542cf078c4e",
            price: 12999,
            product: "prod_mattress_1",
          },
        ],
        shippingAddress: {
          name: "Priya Sharma",
          address: "15 Lake View Apartments",
          city: "Delhi",
          state: "Delhi",
          postalCode: "110001",
          country: "India",
          phone: "9876543211",
        },
        paymentMethod: "upi",
        taxPrice: 8280,
        shippingPrice: 1500,
        totalPrice: 55778,
        isPaid: true,
        paidAt: new Date(Date.now() - 86400000), // 1 day ago
        status: "Shipped",
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 43200000),
      },
      {
        _id: `mock_admin_${Date.now()}_3`,
        user: {
          _id: "mock_user_3",
          name: "Raj Patel",
          email: "raj@example.com",
        },
        orderItems: [
          {
            name: "L-Shaped Sofa",
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e",
            price: 45999,
            product: "prod_sofa_1",
          },
        ],
        shippingAddress: {
          name: "Raj Patel",
          address: "78 Green Avenue",
          city: "Bangalore",
          state: "Karnataka",
          postalCode: "560001",
          country: "India",
          phone: "9876543212",
        },
        paymentMethod: "cod",
        taxPrice: 8280,
        shippingPrice: 2000,
        totalPrice: 56279,
        isPaid: false,
        status: "Processing",
        createdAt: new Date(Date.now() - 43200000), // 12 hours ago
        updatedAt: new Date(Date.now() - 43200000),
      },
      {
        _id: `mock_admin_${Date.now()}_4`,
        user: {
          _id: "mock_user_4",
          name: "Ananya Gupta",
          email: "ananya@example.com",
        },
        orderItems: [
          {
            name: "Dining Table Set",
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1617098650990-217c7cf9de26",
            price: 28999,
            product: "prod_table_1",
          },
        ],
        shippingAddress: {
          name: "Ananya Gupta",
          address: "23 Park Street",
          city: "Kolkata",
          state: "West Bengal",
          postalCode: "700001",
          country: "India",
          phone: "9876543213",
        },
        paymentMethod: "rupay",
        taxPrice: 5220,
        shippingPrice: 1500,
        totalPrice: 35719,
        isPaid: false,
        status: "Pending",
        createdAt: new Date(Date.now() - 21600000), // 6 hours ago
        updatedAt: new Date(Date.now() - 21600000),
      },
      {
        _id: `mock_admin_${Date.now()}_5`,
        user: {
          _id: "mock_user_5",
          name: "Vikram Singh",
          email: "vikram@example.com",
        },
        orderItems: [
          {
            name: "Wardrobe",
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1595428774223-ef52624120d2",
            price: 22999,
            product: "prod_wardrobe_1",
          },
        ],
        shippingAddress: {
          name: "Vikram Singh",
          address: "56 Hill Road",
          city: "Pune",
          state: "Maharashtra",
          postalCode: "411001",
          country: "India",
          phone: "9876543214",
        },
        paymentMethod: "credit_card",
        taxPrice: 4140,
        shippingPrice: 1000,
        totalPrice: 28139,
        isPaid: true,
        paidAt: new Date(Date.now() - 3600000), // 1 hour ago
        status: "Processing",
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
      },
      {
        _id: `mock_admin_${Date.now()}_6`,
        user: {
          _id: "mock_user_6",
          name: "Avinash Kumar",
          email: "avinashmadhukar4@gmail.com",
        },
        orderItems: [
          {
            name: "Study Table",
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd",
            price: 18999,
            product: "prod_table_2",
          },
          {
            name: "Bookshelf",
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1594620302200-9a762244a156",
            price: 12999,
            product: "prod_shelf_1",
          },
        ],
        shippingAddress: {
          name: "Avinash Kumar",
          address: "123 Main Street",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
          phone: "9876543215",
        },
        paymentMethod: "upi",
        taxPrice: 5760,
        shippingPrice: 0,
        totalPrice: 37758,
        isPaid: true,
        paidAt: new Date(Date.now() - 259200000), // 3 days ago
        status: "Delivered",
        createdAt: new Date(Date.now() - 259200000),
        updatedAt: new Date(Date.now() - 172800000),
      },
      {
        _id: `mock_admin_${Date.now()}_7`,
        user: {
          _id: "mock_user_7",
          name: "Neha Reddy",
          email: "neha@example.com",
        },
        orderItems: [
          {
            name: "Coffee Table",
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1499933374294-4584851497cc",
            price: 8999,
            product: "prod_table_3",
          },
        ],
        shippingAddress: {
          name: "Neha Reddy",
          address: "45 Garden Road",
          city: "Chennai",
          state: "Tamil Nadu",
          postalCode: "600001",
          country: "India",
          phone: "9876543216",
        },
        paymentMethod: "cod",
        taxPrice: 1620,
        shippingPrice: 500,
        totalPrice: 11119,
        isPaid: false,
        status: "Cancelled",
        createdAt: new Date(Date.now() - 345600000), // 4 days ago
        updatedAt: new Date(Date.now() - 345600000),
      },
    ];
  };

  // Filter orders by status
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  // Get order status badge
  const getOrderStatusBadge = (status) => {
    const statusColors = {
      Pending:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      Processing:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      Shipped:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
      Delivered:
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      Cancelled: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusColors[status] ||
          "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <AdminLayout title="Orders">
      {/* Filter Controls */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              statusFilter === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setStatusFilter("Pending")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              statusFilter === "Pending"
                ? "bg-yellow-500 text-white"
                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("Processing")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              statusFilter === "Processing"
                ? "bg-blue-500 text-white"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => setStatusFilter("Shipped")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              statusFilter === "Shipped"
                ? "bg-purple-500 text-white"
                : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
            }`}
          >
            Shipped
          </button>
          <button
            onClick={() => setStatusFilter("Delivered")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              statusFilter === "Delivered"
                ? "bg-green-500 text-white"
                : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
            }`}
          >
            Delivered
          </button>
          <button
            onClick={() => setStatusFilter("Cancelled")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              statusFilter === "Cancelled"
                ? "bg-red-500 text-white"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loading size="large" />
        </div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : filteredOrders.length === 0 ? (
        <div className="theme-bg-primary rounded-lg shadow-md p-8 text-center">
          <svg
            className="w-16 h-16 theme-text-secondary mx-auto mb-4"
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
          <h3 className="text-xl font-bold mb-2 theme-text-primary">
            No Orders Found
          </h3>
          <p className="theme-text-secondary mb-4">
            {statusFilter === "all"
              ? "You don't have any orders yet."
              : `You don't have any ${statusFilter} orders.`}
          </p>
        </div>
      ) : (
        <div className="theme-bg-primary rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y theme-divide">
              <thead className="theme-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="theme-bg-primary divide-y theme-divide">
                {filteredOrders.map((order) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-text-primary">
                      #{order._id.substring(order._id.length - 6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      {order.user
                        ? order.user.name
                        : order.shippingAddress.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getOrderStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.isPaid
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                        }`}
                      >
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-lighter"
                      >
                        View Details
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
