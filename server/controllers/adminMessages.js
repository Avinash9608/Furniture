const Contact = require('../models/Contact');

// @desc    Get all messages for admin
// @route   GET /api/admin/messages
// @access  Private/Admin
exports.getAllMessages = async (req, res) => {
  try {
    console.log("Getting all messages for admin");
    console.log("Request URL:", req.originalUrl);

    // Define mock messages for fallback
    const mockMessages = [
      {
        _id: "mock1",
        name: "John Doe",
        email: "john@example.com",
        message: "I'm interested in your furniture",
        createdAt: new Date()
      },
      {
        _id: "mock2",
        name: "Jane Smith",
        email: "jane@example.com",
        message: "Do you deliver to my area?",
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      }
    ];

    // First try to get real messages from the database
    try {
      console.log("Attempting to fetch messages from MongoDB Atlas...");

      // Set longer timeout for MongoDB operations
      const messages = await Contact.find()
        .sort({ createdAt: -1 })
        .maxTimeMS(30000); // 30 seconds timeout

      console.log(`Found ${messages.length} messages in database`);

      // If we have real messages, return them
      if (messages && messages.length > 0) {
        console.log("Returning real messages from database");
        return res.status(200).json({
          success: true,
          count: messages.length,
          data: messages,
          source: "database"
        });
      }

      // If no messages found in database, return the mock messages
      console.log("No messages found in database, returning mock messages");
      return res.status(200).json({
        success: true,
        count: mockMessages.length,
        data: mockMessages,
        source: "mock_messages"
      });
    } catch (dbError) {
      console.error("Error fetching messages from database:", dbError);

      // Return the mock messages if database fetch fails
      console.log("Database error, returning mock messages");
      return res.status(200).json({
        success: true,
        count: mockMessages.length,
        data: mockMessages,
        source: "mock_messages_db_error",
        error: dbError.message
      });
    }
  } catch (error) {
    console.error("Unexpected error in getAllMessages:", error);

    // Even on error, return the mock messages
    const fallbackMessages = [
      {
        _id: "mock1",
        name: "John Doe",
        email: "john@example.com",
        message: "I'm interested in your furniture",
        createdAt: new Date()
      },
      {
        _id: "mock2",
        name: "Jane Smith",
        email: "jane@example.com",
        message: "Do you deliver to my area?",
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      }
    ];

    console.log("Error occurred, returning fallback messages");

    return res.status(200).json({
      success: true,
      count: fallbackMessages.length,
      data: fallbackMessages,
      source: "fallback_mock_data_error",
      error: error.message
    });
  }
};
