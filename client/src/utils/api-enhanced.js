/**
 * Enhanced API utilities for the client
 * 
 * This module provides robust API functions with fallback mechanisms
 * for handling MongoDB connection issues.
 */

import axios from "axios";

// Create axios instances with different configurations
const api = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

const directApi = axios.create({
  timeout: 60000, // 60 seconds for direct API calls
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Fetch contact messages with multiple fallback mechanisms
 */
export const fetchContactMessages = async () => {
  console.log("Fetching contact messages with enhanced API");
  
  try {
    // Determine the current environment
    const baseUrl = window.location.origin;
    const isProduction = baseUrl.includes("onrender.com");
    
    // In production, all API calls should be relative to the current origin
    const apiBase = baseUrl;
    
    console.log(`Current environment: ${isProduction ? "Production" : "Development"}`);
    console.log(`Using API base URL: ${apiBase}`);
    
    // Define endpoints in order of preference - prioritize direct MongoDB driver endpoints
    const endpoints = [
      // Direct database query endpoint (using MongoDB driver directly)
      `${apiBase}/api/direct/contacts`,
      // Admin-specific endpoints (also using MongoDB driver directly)
      `${apiBase}/api/admin/messages`,
      // Database test endpoint (using MongoDB driver directly)
      `${apiBase}/api/db-test`,
      // Regular contact endpoints (using Mongoose)
      `${apiBase}/api/contact`,
      `${apiBase}/contact`,
      // Health check endpoint
      `${apiBase}/api/health`,
    ];
    
    console.log('Endpoints to try:', endpoints);
    
    // Try each endpoint in sequence
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        // Use the direct API instance for longer timeout
        const response = await directApi.get(endpoint);
        
        console.log(`Response from ${endpoint}:`, response.status);
        
        // Check if response is HTML (contains DOCTYPE or html tags)
        if (
          typeof response.data === "string" &&
          (response.data.includes("<!DOCTYPE") ||
            response.data.includes("<html"))
        ) {
          console.warn(`Endpoint ${endpoint} returned HTML instead of JSON`);
          console.log('HTML response:', response.data.substring(0, 200) + "...");
          continue; // Skip this endpoint and try the next one
        }
        
        // Check if response is empty
        if (!response.data) {
          console.warn(`Endpoint ${endpoint} returned empty data`);
          continue; // Skip this endpoint and try the next one
        }
        
        console.log("Contact messages fetched successfully:", response.data);
        
        // Handle different response formats
        
        // 1. Direct array of contacts
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log(`Successfully fetched ${response.data.length} messages from ${endpoint} (array format)`);
          return {
            data: response.data,
            source: endpoint,
            format: "array"
          };
        }
        
        // 2. Object with data array
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Check if this is temporary data
          if (response.data.isTemporaryData) {
            console.warn("Displaying temporary data due to database connection issues");
            return {
              data: response.data.data,
              error: response.data.message || "Displaying temporary data due to database connection issues",
              isTemporaryData: true,
              source: endpoint,
              format: "object-temporary"
            };
          }
          
          console.log(`Successfully fetched ${response.data.data.length} messages from ${endpoint} (object format)`);
          return {
            data: response.data.data,
            source: endpoint,
            format: "object"
          };
        }
        
        // 3. Direct MongoDB driver response
        if (response.data && response.data.success === true && response.data.method === "direct") {
          console.log(`Successfully fetched data from ${endpoint} using direct MongoDB driver`);
          
          if (response.data.count !== undefined && response.data.data) {
            console.log(`Direct driver returned ${response.data.count} items`);
            return {
              data: response.data.data,
              source: endpoint,
              format: "direct-mongodb"
            };
          }
        }
        
        // 4. Database test endpoint
        if (response.data && response.data.success === true && response.data.sampleContact) {
          console.log(`Successfully connected to database via ${endpoint}`);
          // This endpoint doesn't return contacts, so continue to the next one
          continue;
        }
        
        // If we got here but couldn't extract data in a known format, try the next endpoint
        console.warn(`Endpoint ${endpoint} returned data in an unknown format:`, response.data);
      } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error.message);
        // Continue to the next endpoint
      }
    }
    
    // If all endpoints failed, try a direct database query as a last resort
    try {
      console.log("All standard endpoints failed, trying direct database query");
      
      // Use the current origin for the direct endpoint to avoid CORS issues
      const directEndpoint = `${baseUrl}/api/direct/contacts?timestamp=${Date.now()}`;
      console.log(`Trying direct database query: ${directEndpoint}`);
      
      const directResponse = await directApi.get(directEndpoint);
      
      if (directResponse.data && Array.isArray(directResponse.data)) {
        console.log("Direct database query successful:", directResponse.data);
        return {
          data: directResponse.data,
          source: directEndpoint,
          format: "direct-query"
        };
      } else if (directResponse.data) {
        console.log("Direct database query returned non-array data:", directResponse.data);
        // Try to extract data from the response
        let extractedData = [];
        
        if (directResponse.data.data && Array.isArray(directResponse.data.data)) {
          extractedData = directResponse.data.data;
        } else if (typeof directResponse.data === 'object') {
          // If it's an object but not an array, wrap it in an array
          extractedData = [directResponse.data];
        }
        
        if (extractedData.length > 0) {
          console.log("Extracted data from direct query:", extractedData);
          return {
            data: extractedData,
            source: directEndpoint,
            format: "direct-query-extracted"
          };
        }
      }
    } catch (directError) {
      console.error("Direct database query failed:", directError);
      console.log("Error details:", directError.message);
      if (directError.response) {
        console.log("Response status:", directError.response.status);
        console.log("Response data:", directError.response.data);
      }
    }
    
    // If all else fails, return mock data with a helpful error message
    console.error("All attempts to fetch contact messages failed");
    
    // Create mock messages for testing in case of MongoDB connection issues
    const mockMessages = [
      {
        _id: `temp_${Date.now()}_1`,
        name: "System Message",
        email: "system@example.com",
        subject: "Database Connection Issue",
        message: "The application is currently experiencing issues connecting to the database. This is likely due to a MongoDB connection issue. Please try again later.",
        status: "unread",
        createdAt: new Date().toISOString(),
      },
      {
        _id: `temp_${Date.now()}_2`,
        name: "System Message",
        email: "system@example.com",
        subject: "Temporary Data",
        message: "This is temporary data displayed while the application is unable to connect to the database. Your actual messages will be displayed once the connection is restored.",
        status: "unread",
        createdAt: new Date().toISOString(),
      },
    ];
    
    return {
      data: mockMessages,
      error: "Unable to fetch messages from the database. The server may be experiencing issues or the database connection may be down. Please try again later or contact support.",
      isTemporaryData: true,
      source: "fallback",
      format: "mock"
    };
  } catch (error) {
    console.error("Unexpected error in fetchContactMessages:", error);
    
    // Return mock data in case of unexpected errors
    const mockMessages = [
      {
        _id: `temp_${Date.now()}_1`,
        name: "System Message",
        email: "system@example.com",
        subject: "Unexpected Error",
        message: "An unexpected error occurred while fetching messages. Please try again later or contact support.",
        status: "unread",
        createdAt: new Date().toISOString(),
      }
    ];
    
    return {
      data: mockMessages,
      error: `Unexpected error: ${error.message}`,
      isTemporaryData: true,
      source: "error",
      format: "mock"
    };
  }
};

/**
 * Submit a contact form with enhanced error handling
 */
export const submitContactForm = async (formData) => {
  try {
    // Determine the current environment
    const baseUrl = window.location.origin;
    
    // Define endpoints in order of preference
    const endpoints = [
      `${baseUrl}/api/contact`,
      `${baseUrl}/contact`,
    ];
    
    // Try each endpoint in sequence
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying to submit contact form to: ${endpoint}`);
        const response = await api.post(endpoint, formData);
        
        if (response.data && response.status === 200) {
          console.log("Contact form submitted successfully:", response.data);
          return {
            success: true,
            data: response.data,
            message: "Your message has been sent successfully!"
          };
        }
      } catch (error) {
        console.error(`Error submitting to ${endpoint}:`, error.message);
        // Continue to the next endpoint
      }
    }
    
    // If all endpoints failed
    return {
      success: false,
      error: "Unable to submit your message. Please try again later or contact us directly."
    };
  } catch (error) {
    console.error("Unexpected error in submitContactForm:", error);
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`
    };
  }
};

// Export other API functions as needed...
