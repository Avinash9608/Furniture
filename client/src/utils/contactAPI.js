/**
 * Enhanced Contact API
 *
 * This module provides robust contact form submission with multiple fallback mechanisms
 * for handling MongoDB connection issues in both development and production environments.
 */

import axios from "axios";

// Create a contact message with enhanced error handling
export const createContact = async (contactData) => {
  console.log("Creating contact message with data:", contactData);

  try {
    const baseUrl = window.location.origin;
    console.log("Current origin:", baseUrl);
    const deployedUrl = "https://furniture-q3nb.onrender.com";

    // Create a new axios instance without baseURL and with reasonable timeout
    const directApi = axios.create({
      timeout: 30000, // 30 seconds timeout (more reasonable for user experience)
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // List of endpoints to try (in order)
    const endpoints = [
      // Direct contact endpoint (most reliable, always returns success)
      `${baseUrl}/direct-contact`,
      // Direct URL with /api prefix (standard API route)
      `${baseUrl}/api/contact`,
      // Direct URL without /api prefix (fallback route)
      `${baseUrl}/contact`,
      // Direct URL with double /api prefix (for misconfigured environments)
      `${baseUrl}/api/api/contact`,
      // Absolute direct contact endpoint on deployed URL
      `${deployedUrl}/direct-contact`,
      // Absolute URL to the deployed backend
      `${deployedUrl}/api/contact`,
      // Absolute URL without /api prefix
      `${deployedUrl}/contact`,
      // Additional fallback with api prefix
      `${deployedUrl}/api/api/contact`,
    ];

    // Try each endpoint until one works
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      console.log(`Attempt ${i + 1}: Trying endpoint ${endpoint}`);

      try {
        const response = await directApi.post(endpoint, contactData);
        console.log(`Success with endpoint ${endpoint}:`, response);

        // Check if the response indicates success
        if (response.data && response.data.success === false) {
          console.warn("Server returned success: false", response.data);
          return {
            error: response.data.message || "Failed to send message",
            data: null,
          };
        }

        // Check for warnings in the response
        if (response.data && response.data.warning) {
          console.warn("Server returned warning:", response.data.warning);
          return {
            data: response.data.data,
            warning: response.data.warning,
            message: response.data.message || "Message sent with warning",
          };
        }

        // Return successful response
        return {
          data: response.data.data,
          message: response.data.message || "Message sent successfully",
        };
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error.message);

        // If we have a response with error message, return it
        if (error.response && error.response.data) {
          // Even if status is 500, try to extract useful information
          if (error.response.data.message || error.response.data.error) {
            return {
              error:
                error.response.data.message ||
                error.response.data.error ||
                "Failed to send message",
              data: null,
            };
          }
        }

        // If this is the last endpoint, throw the error to be caught by the outer catch
        if (i === endpoints.length - 1) {
          throw error;
        }
        // Otherwise, continue to the next endpoint
      }
    }

    // If all endpoints fail, throw a generic error
    throw new Error("All contact form submission endpoints failed");
  } catch (error) {
    console.error("Error creating contact message:", error);

    // Return a structured error response
    return {
      error:
        "We're having trouble sending your message. Please try again later or contact us directly.",
      data: null,
    };
  }
};

// Export the createContact function as the default export
export default { create: createContact };
