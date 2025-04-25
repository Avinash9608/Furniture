import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { contactAPI } from "../../utils/api";
import { formatDate } from "../../utils/format";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import Alert from "../../components/Alert";

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching contact messages from API...");
        const response = await contactAPI.getAll();
        console.log("Contact API response:", response);

        // Handle different API response structures
        let messagesData = [];

        if (response && response.data && Array.isArray(response.data)) {
          messagesData = response.data;
        } else if (
          response &&
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          messagesData = response.data.data;
        } else if (response && Array.isArray(response)) {
          messagesData = response;
        }

        console.log("Processed messages data:", messagesData);

        if (messagesData && messagesData.length > 0) {
          // Process messages to ensure they have all required fields
          const processedMessages = messagesData.map((message) => {
            // Ensure message has a status
            if (!message.status) {
              message.status = "unread";
            }

            // Ensure message has a createdAt date
            if (!message.createdAt) {
              message.createdAt = new Date().toISOString();
            }

            // Ensure message has a subject
            if (!message.subject) {
              message.subject = "No Subject";
            }

            return message;
          });

          console.log(
            `Successfully processed ${processedMessages.length} messages`
          );
          setMessages(processedMessages);
        } else {
          console.log("No messages found or invalid data format");
          setError("No messages found");
          setMessages([]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError(
          `Failed to load messages: ${error.message || "Unknown error"}`
        );
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Filter messages by status
  const filteredMessages =
    statusFilter === "all"
      ? messages
      : messages.filter((message) => message.status === statusFilter);

  // Handle mark as read
  const handleMarkAsRead = async (id) => {
    try {
      setUpdateLoading(true);
      setUpdateError(null);

      console.log(`Marking message ${id} as read...`);
      await contactAPI.update(id, { status: "read" });
      console.log(`Message ${id} marked as read successfully`);

      // Update message in state
      setMessages(
        messages.map((message) =>
          message._id === id ? { ...message, status: "read" } : message
        )
      );

      // Show success message
      setSuccessMessage("Message marked as read");

      // Update selected message if modal is open
      if (showModal && selectedMessage && selectedMessage._id === id) {
        setSelectedMessage({ ...selectedMessage, status: "read" });
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating message:", error);
      setUpdateError(
        `Failed to update message status: ${error.message || "Unknown error"}`
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (id) => {
    try {
      setUpdateLoading(true);
      setUpdateError(null);

      console.log(`Deleting message ${id}...`);
      await contactAPI.delete(id);
      console.log(`Message ${id} deleted successfully`);

      // Remove message from state
      setMessages(messages.filter((message) => message._id !== id));

      // Show success message
      setSuccessMessage("Message deleted successfully");

      // Close modal if open
      if (showModal && selectedMessage && selectedMessage._id === id) {
        setShowModal(false);
        setSelectedMessage(null);
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting message:", error);
      setUpdateError(
        `Failed to delete message: ${error.message || "Unknown error"}`
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <AdminLayout title="Messages">
      {/* Success Message */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-4"
        />
      )}

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
            All Messages
          </button>
          <button
            onClick={() => setStatusFilter("unread")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              statusFilter === "unread"
                ? "bg-yellow-500 text-white"
                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setStatusFilter("read")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              statusFilter === "read"
                ? "bg-green-500 text-white"
                : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
            }`}
          >
            Read
          </button>
        </div>
      </div>

      {/* Messages Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loading size="large" />
        </div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : filteredMessages.length === 0 ? (
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
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            ></path>
          </svg>
          <h3 className="text-xl font-bold mb-2 theme-text-primary">
            No Messages Found
          </h3>
          <p className="theme-text-secondary mb-4">
            {statusFilter === "all"
              ? "You don't have any messages yet."
              : `You don't have any ${statusFilter} messages.`}
          </p>
        </div>
      ) : (
        <div className="theme-bg-primary rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y theme-divide">
              <thead className="theme-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="theme-bg-primary divide-y theme-divide">
                {filteredMessages.map((message) => (
                  <motion.tr
                    key={message._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`hover:theme-bg-secondary transition-colors duration-150 ${
                      message.status === "unread"
                        ? "font-semibold bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          message.status === "unread"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                        }`}
                      >
                        {message.status === "unread" ? "Unread" : "Read"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                      {message.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      {message.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                      {message.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      {formatDate(message.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedMessage(message);
                          setShowModal(true);
                        }}
                        className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-lighter mr-3"
                      >
                        View
                      </button>
                      {message.status === "unread" && (
                        <button
                          onClick={() => handleMarkAsRead(message._id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                          disabled={updateLoading}
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        disabled={updateLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-800 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom theme-bg-primary rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="theme-bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium theme-text-primary flex justify-between items-center">
                      <span>Message Details</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          selectedMessage.status === "unread"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}
                      >
                        {selectedMessage.status === "unread"
                          ? "Unread"
                          : "Read"}
                      </span>
                    </h3>

                    {updateError && (
                      <div className="mt-2">
                        <Alert
                          type="error"
                          message={updateError}
                          onClose={() => setUpdateError(null)}
                        />
                      </div>
                    )}

                    <div className="mt-4 border-t theme-border pt-4">
                      <div className="mb-4">
                        <p className="text-sm font-medium theme-text-secondary">
                          From:
                        </p>
                        <p className="text-sm theme-text-primary">
                          {selectedMessage.name} ({selectedMessage.email})
                        </p>
                        {selectedMessage.phone && (
                          <p className="text-sm theme-text-primary">
                            {selectedMessage.phone}
                          </p>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium theme-text-secondary">
                          Subject:
                        </p>
                        <p className="text-sm theme-text-primary">
                          {selectedMessage.subject}
                        </p>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium theme-text-secondary">
                          Date:
                        </p>
                        <p className="text-sm theme-text-primary">
                          {formatDate(selectedMessage.createdAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium theme-text-secondary">
                          Message:
                        </p>
                        <p className="text-sm theme-text-primary whitespace-pre-line mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          {selectedMessage.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="theme-bg-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedMessage.status === "unread" && (
                  <Button
                    onClick={() => handleMarkAsRead(selectedMessage._id)}
                    disabled={updateLoading}
                    className="ml-3"
                  >
                    Mark as Read
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => handleDeleteMessage(selectedMessage._id)}
                  disabled={updateLoading}
                  className="ml-3"
                >
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedMessage(null);
                    setUpdateError(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMessages;
