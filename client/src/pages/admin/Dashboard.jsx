import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";

const Dashboard = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  // Get localStorage data for debugging
  const token = localStorage.getItem("token");
  const localUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  return (
    <AdminLayout title="Dashboard">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Admin Dashboard
        </h2>

        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Authentication Successful!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>You are now logged in as an admin user.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Authentication Details:
          </h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Context State:</span>
            </p>
            <ul className="list-disc pl-5 text-blue-700">
              <li>isAuthenticated: {isAuthenticated ? "Yes" : "No"}</li>
              <li>isAdmin: {isAdmin ? "Yes" : "No"}</li>
              <li>User: {user ? user.email : "None"}</li>
              <li>Role: {user?.role || "None"}</li>
            </ul>

            <p className="mt-2">
              <span className="font-medium">LocalStorage:</span>
            </p>
            <ul className="list-disc pl-5 text-blue-700">
              <li>Token: {token ? "Present" : "None"}</li>
              <li>User: {localUser ? localUser.email : "None"}</li>
              <li>Role: {localUser?.role || "None"}</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin/products"
                  className="text-blue-600 hover:underline"
                >
                  Manage Products
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/orders"
                  className="text-blue-600 hover:underline"
                >
                  View Orders
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/messages"
                  className="text-blue-600 hover:underline"
                >
                  Check Messages
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">System Status</h3>
            <div className="flex items-center text-green-600">
              <svg
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
