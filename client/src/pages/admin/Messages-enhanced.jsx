/**
 * Enhanced Messages Component
 * 
 * This component displays contact messages with robust error handling
 * and fallback mechanisms for MongoDB connection issues.
 */

import React, { useState, useEffect } from "react";
import { fetchContactMessages } from "../../utils/api-enhanced";
import { FaEnvelope, FaEnvelopeOpen, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-toastify";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTemporaryData, setIsTemporaryData] = useState(false);
  const [dataSource, setDataSource] = useState(null);

  useEffect(() => {
    const getMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsTemporaryData(false);
        
        console.log("Fetching contact messages...");
        const response = await fetchContactMessages();
        console.log("Contact API response:", response);

        // Check for error in the response
        if (response.error) {
          console.error("Error in API response:", response.error);
          
          // Check if this is temporary data due to a database timeout
          if (response.isTemporaryData) {
            console.warn("Displaying temporary data due to database timeout");
            setIsTemporaryData(true);
            // We'll still show the messages but with a warning
            setError(response.error);
            setMessages(response.data || []);
          } else {
            setError(response.error);
            setMessages([]);
          }
          
          // Show toast notification for error
          toast.error(response.error);
        } else {
          // Set messages from the response
          setMessages(response.data || []);
          
          // Set data source for debugging
          if (response.source) {
            setDataSource(response.source);
            console.log(`Data source: ${response.source} (${response.format})`);
          }
          
          // Show success toast
          toast.success("Messages loaded successfully");
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to fetch messages. Please try again later.");
        setMessages([]);
        
        // Show toast notification for error
        toast.error("Failed to fetch messages");
      } finally {
        setLoading(false);
      }
    };

    getMessages();
  }, []);

  const handleStatusChange = async (id, currentStatus) => {
    try {
      // Find the message in the state
      const messageIndex = messages.findIndex((msg) => msg._id === id);
      
      if (messageIndex === -1) {
        console.error("Message not found:", id);
        return;
      }
      
      // Update the status locally first (optimistic update)
      const newStatus = currentStatus === "read" ? "unread" : "read";
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        status: newStatus,
      };
      
      setMessages(updatedMessages);
      
      // Show toast notification
      toast.success(`Message marked as ${newStatus}`);
      
      // In a real implementation, you would update the status in the database here
      // For now, we're just updating the local state
      console.log(`Message ${id} status changed from ${currentStatus} to ${newStatus}`);
      
    } catch (err) {
      console.error("Error updating message status:", err);
      toast.error("Failed to update message status");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
        <h2 className="text-xl font-semibold">Loading messages...</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Contact Messages</h1>
      
      {/* Error or temporary data notification */}
      {(error || isTemporaryData) && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-yellow-500 mr-2" />
            <p className="font-bold">Warning</p>
          </div>
          <p>{error || "Displaying temporary data due to database connection issues."}</p>
          {dataSource && (
            <p className="text-sm mt-1">Data source: {dataSource}</p>
          )}
        </div>
      )}
      
      {messages.length === 0 ? (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <p className="text-xl text-gray-600">No messages found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`border rounded-lg shadow-sm p-6 ${
                message.status === "unread"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{message.subject}</h2>
                  <p className="text-gray-600">
                    From: {message.name} ({message.email})
                  </p>
                  {message.phone && (
                    <p className="text-gray-600">Phone: {message.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => handleStatusChange(message._id, message.status)}
                  className={`p-2 rounded-full ${
                    message.status === "unread"
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title={
                    message.status === "unread"
                      ? "Mark as read"
                      : "Mark as unread"
                  }
                >
                  {message.status === "unread" ? (
                    <FaEnvelope />
                  ) : (
                    <FaEnvelopeOpen />
                  )}
                </button>
              </div>
              <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                <p className="whitespace-pre-wrap">{message.message}</p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Received:{" "}
                {new Date(message.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
