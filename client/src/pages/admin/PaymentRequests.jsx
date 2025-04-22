import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { paymentRequestsAPI } from "../../utils/api";
import { formatPrice } from "../../utils/format";
import Alert from "../../components/Alert";

const PaymentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState("all");

  // Fetch payment requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log("Fetching payment requests...");
      const response = await paymentRequestsAPI.getAll();
      console.log("Payment requests response:", response);

      // Check if response.data exists and has the expected structure
      if (response && response.data) {
        // Check if response.data.data is an array (API returns {success, count, data})
        if (response.data.data && Array.isArray(response.data.data)) {
          setRequests(response.data.data);
        } else if (Array.isArray(response.data)) {
          // If response.data is directly an array
          setRequests(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
          setRequests([]);
          setError("Received invalid data format from server");
        }
      } else {
        console.error("No data received from API");
        setRequests([]);
        setError("No data received from server");
      }
    } catch (err) {
      console.error("Error fetching payment requests:", err);
      setRequests([]);
      setError(
        err.response?.data?.message || "Failed to load payment requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (id, status) => {
    try {
      setLoading(true);
      console.log(`Updating payment request ${id} status to ${status}`);
      const response = await paymentRequestsAPI.updateStatus(id, { status });
      console.log("Status update response:", response);

      // Show success message based on status
      if (status === "completed") {
        setSuccess(
          "Payment approved successfully! Order has been marked as paid."
        );
      } else if (status === "rejected") {
        setSuccess("Payment request rejected.");
      } else {
        setSuccess(`Payment request status updated to ${status}`);
      }

      // Fetch updated requests after status change
      await fetchRequests();
    } catch (err) {
      console.error("Error updating payment request status:", err);
      setError(
        err.response?.data?.message || "Failed to update payment request status"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on status
  // Ensure requests is always an array before filtering
  const requestsArray = Array.isArray(requests) ? requests : [];
  const filteredRequests =
    filter === "all"
      ? requestsArray
      : requestsArray.filter((request) => request.status === filter);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout title="Payment Requests">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Payment Requests</h1>
          <div className="flex items-center">
            <label
              htmlFor="filter"
              className="mr-2 text-sm font-medium text-gray-700"
            >
              Filter:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Payment Requests List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading && <p>Loading...</p>}
          {!loading && filteredRequests.length === 0 && (
            <p className="text-gray-500">No payment requests found.</p>
          )}
          {!loading && filteredRequests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request._id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.user?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.user?.email || "No email"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          #{request.order?._id?.substring(0, 8) || "N/A"}
                        </div>
                        {request.order && (
                          <div className="text-xs text-gray-500">
                            Status: {request.order.status || "Unknown"}
                            <br />
                            Total: {formatPrice(request.order.totalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(request.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize font-medium">
                          {request.paymentMethod.replace("_", " ")}
                        </div>
                        {request.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            Note:{" "}
                            {request.notes.length > 30
                              ? request.notes.substring(0, 30) + "..."
                              : request.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === "pending" && (
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() =>
                                handleStatusUpdate(request._id, "completed")
                              }
                              className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                            >
                              Approve Payment
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(request._id, "rejected")
                              }
                              className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                            >
                              Reject Payment
                            </button>
                          </div>
                        )}
                        {request.status === "completed" && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md inline-block">
                            Payment Approved
                          </span>
                        )}
                        {request.status === "rejected" && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-md inline-block">
                            Payment Rejected
                          </span>
                        )}
                        {request.status === "cancelled" && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md inline-block">
                            Payment Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PaymentRequests;
