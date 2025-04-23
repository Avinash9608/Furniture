import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
// API imports removed as we're using mock data for now
import { formatPrice } from "../../utils/format";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Hardcoded data for demonstration
        const mockData = {
          totalOrders: 2,
          totalRevenue: 591090, // ₹5,91,090
          totalProducts: 5,
          totalUsers: 3,
          recentOrders: [
            {
              _id: "6807e4d9",
              createdAt: new Date().toISOString(),
              totalPrice: 1090,
              status: "pending",
              user: {
                name: "admin",
                phone: "9608989499",
              },
            },
            {
              _id: "6807ec32",
              createdAt: new Date().toISOString(),
              totalPrice: 590000,
              status: "pending",
              user: {
                name: "admin",
                phone: "9608989499",
              },
            },
          ],
        };

        // Set the stats
        setStats(mockData);

        console.log("Dashboard stats loaded (mock data):", mockData);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(
          "Failed to load dashboard statistics. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Stat Card Component
  const StatCard = ({ title, value, icon, color, isLoading }) => (
    <div
      className={`theme-bg-primary rounded-lg shadow p-4 sm:p-5 lg:p-6 border-l-4 ${color}`}
    >
      <div className="flex items-center">
        <div
          className={`p-2 sm:p-3 rounded-full ${color
            .replace("border", "bg")
            .replace("-500", "-100")} mr-3 sm:mr-4`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium theme-text-secondary">
            {title}
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold theme-text-primary">
            {isLoading ? "..." : value}
          </p>
        </div>
      </div>
    </div>
  );

  // Order Status Badge
  const OrderStatusBadge = ({ status }) => {
    let badgeClasses = "";

    if (status === "delivered" || status === "completed") {
      badgeClasses =
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800";
    } else if (status === "processing" || status === "shipped") {
      badgeClasses =
        "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
    } else if (status === "pending") {
      badgeClasses =
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800 font-semibold";
    } else if (status === "cancelled") {
      badgeClasses =
        "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800";
    } else {
      badgeClasses =
        "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold theme-text-primary">
            Admin Dashboard
          </h1>
          <div className="text-sm theme-text-secondary">
            Welcome back, {user?.name || "Admin"}!
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={
              <svg
                className="h-6 w-6 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
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
            }
            color="border-blue-500"
            isLoading={loading}
          />
          <StatCard
            title="Total Revenue"
            value={formatPrice(stats.totalRevenue)}
            icon={
              <svg
                className="h-6 w-6 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="border-green-500"
            isLoading={loading}
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={
              <svg
                className="h-6 w-6 text-purple-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            }
            color="border-purple-500"
            isLoading={loading}
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={
              <svg
                className="h-6 w-6 text-yellow-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
            color="border-yellow-500"
            isLoading={loading}
          />
        </div>

        {/* Order Summary */}
        <div className="theme-bg-primary rounded-lg shadow overflow-hidden mb-6 sm:mb-8">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b theme-border">
            <h3 className="text-base sm:text-lg font-medium theme-text-primary">
              Order Summary
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="text-base font-medium theme-text-primary mb-2">
                  Order Details
                </h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm theme-text-secondary">
                      Total Orders:
                    </span>
                    <span className="text-sm font-medium theme-text-primary">
                      {stats.totalOrders}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm theme-text-secondary">
                      Pending Orders:
                    </span>
                    <span className="text-sm font-medium theme-text-primary">
                      {
                        stats.recentOrders.filter((o) => o.status === "pending")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm theme-text-secondary">
                      Completed Orders:
                    </span>
                    <span className="text-sm font-medium theme-text-primary">
                      {
                        stats.recentOrders.filter(
                          (o) => o.status === "completed"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-base font-medium theme-text-primary mb-2">
                  Revenue Details
                </h4>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm theme-text-secondary">
                      Total Revenue:
                    </span>
                    <span className="text-sm font-medium theme-text-primary">
                      {formatPrice(stats.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm theme-text-secondary">
                      Average Order Value:
                    </span>
                    <span className="text-sm font-medium theme-text-primary">
                      {stats.totalOrders > 0
                        ? formatPrice(stats.totalRevenue / stats.totalOrders)
                        : formatPrice(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm theme-text-secondary">
                      Pending Revenue:
                    </span>
                    <span className="text-sm font-medium theme-text-primary">
                      {formatPrice(
                        stats.recentOrders
                          .filter((o) => o.status === "pending")
                          .reduce(
                            (sum, order) => sum + (order.totalPrice || 0),
                            0
                          )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 theme-bg-primary rounded-lg shadow overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b theme-border">
              <h3 className="text-base sm:text-lg font-medium theme-text-primary">
                Recent Orders
              </h3>
            </div>
            <div className="divide-y theme-divide">
              {loading ? (
                <div className="p-6 text-center theme-text-secondary">
                  Loading recent orders...
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-500">
                  Failed to load recent orders
                </div>
              ) : stats.recentOrders?.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="px-4 sm:px-6 py-3 sm:py-4 hover:theme-bg-secondary transition-colors duration-150"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-blue-600">
                          #
                          {typeof order._id === "string" && order._id.length > 6
                            ? order._id.substring(order._id.length - 6)
                            : order._id}
                        </p>
                        <p className="text-sm theme-text-secondary">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs theme-text-tertiary">
                          {order.user?.name || "Unknown"} •{" "}
                          {order.user?.phone || "No phone"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold theme-text-primary">
                          {formatPrice(order.totalPrice)}
                        </p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center theme-text-secondary">
                  No recent orders
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t theme-border theme-bg-secondary">
              <Link
                to="/admin/orders"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
              >
                View all orders →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="theme-bg-primary rounded-lg shadow overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b theme-border">
              <h3 className="text-base sm:text-lg font-medium theme-text-primary">
                Quick Actions
              </h3>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <Link
                to="/admin/products/add"
                className="flex items-center p-3 border theme-border rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-colors"
              >
                <svg
                  className="h-5 w-5 text-blue-500 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span className="text-sm font-medium theme-text-primary">
                  Add New Product
                </span>
              </Link>
              <Link
                to="/admin/orders"
                className="flex items-center p-3 border theme-border rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 transition-colors"
              >
                <svg
                  className="h-5 w-5 text-green-500 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span className="text-sm font-medium theme-text-primary">
                  Manage Orders
                </span>
              </Link>
              <Link
                to="/admin/messages"
                className="flex items-center p-3 border theme-border rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 transition-colors"
              >
                <svg
                  className="h-5 w-5 text-purple-500 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span className="text-sm font-medium theme-text-primary">
                  Check Messages
                </span>
              </Link>
              <Link
                to="/admin/payment-requests"
                className="flex items-center p-3 border theme-border rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-200 transition-colors"
              >
                <svg
                  className="h-5 w-5 text-yellow-500 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-sm font-medium theme-text-primary">
                  Payment Requests
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Product & User Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8 mb-6 sm:mb-8">
          <div className="theme-bg-primary rounded-lg shadow overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b theme-border">
              <h3 className="text-base sm:text-lg font-medium theme-text-primary">
                Product Summary
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm theme-text-secondary">
                    Total Products:
                  </span>
                  <span className="text-sm font-medium theme-text-primary">
                    {stats.totalProducts}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm theme-text-secondary">
                    Categories:
                  </span>
                  <span className="text-sm font-medium theme-text-primary">
                    4
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm theme-text-secondary">
                    Featured Products:
                  </span>
                  <span className="text-sm font-medium theme-text-primary">
                    2
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to="/admin/products"
                  className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500"
                >
                  Manage products →
                </Link>
              </div>
            </div>
          </div>

          <div className="theme-bg-primary rounded-lg shadow overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b theme-border">
              <h3 className="text-base sm:text-lg font-medium theme-text-primary">
                User Summary
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm theme-text-secondary">
                    Total Users:
                  </span>
                  <span className="text-sm font-medium theme-text-primary">
                    {stats.totalUsers}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm theme-text-secondary">Admins:</span>
                  <span className="text-sm font-medium theme-text-primary">
                    1
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm theme-text-secondary">
                    Customers:
                  </span>
                  <span className="text-sm font-medium theme-text-primary">
                    {stats.totalUsers - 1}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to="/admin/users"
                  className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-500"
                >
                  Manage users →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="theme-bg-primary rounded-lg shadow overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b theme-border">
            <h3 className="text-base sm:text-lg font-medium theme-text-primary">
              System Status
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-3 w-3 rounded-full bg-green-500"></div>
              <div className="ml-2">
                <p className="text-sm font-medium theme-text-primary">
                  All systems operational
                </p>
                <p className="text-sm theme-text-secondary">
                  Last checked {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
