/**
 * Enhanced Contact Controller
 *
 * This controller provides robust error handling and fallback mechanisms
 * for contact form submissions in both development and production environments.
 */

const Contact = require("../models/Contact");
const mongoose = require("mongoose");
const { getCollection } = require("../utils/directDbAccess");

// Collection name
const COLLECTION = "contacts";

// @desc    Create new contact message with enhanced error handling
// @route   POST /api/contact/enhanced
// @access  Public
exports.createContactEnhanced = async (req, res) => {
  try {
    console.log("Creating contact message with enhanced error handling");
    console.log("Request body:", req.body);

    // Validate required fields
    const requiredFields = ["name", "email", "subject", "message"];
    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Try to save using Mongoose first
    try {
      console.log("Attempting to save using Mongoose model");
      const contact = new Contact(req.body);
      const savedContact = await contact.save();
      console.log("Contact saved successfully with Mongoose:", savedContact._id);

      return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: savedContact,
        source: "mongoose",
      });
    } catch (mongooseError) {
      console.error("Error saving contact with Mongoose:", mongooseError);

      // Try direct MongoDB driver as fallback
      try {
        console.log("Attempting to save using direct MongoDB driver");

        // Get collection
        const collection = await getCollection(COLLECTION);

        // Prepare document with proper timestamps
        const contactDoc = {
          ...req.body,
          status: "unread",
          createdAt: new Date(),
        };

        // Insert document with increased timeout options
        const insertOptions = {
          maxTimeMS: 300000, // 300 seconds (5 minutes) timeout
          wtimeout: 300000, // 300 seconds (5 minutes) write timeout
          w: 1, // Write acknowledgment from primary only
          j: false, // Don't wait for journal commit (faster)
        };

        // Try the insert operation with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        let result = null;

        while (retryCount < maxRetries) {
          try {
            result = await collection.insertOne(contactDoc, insertOptions);
            break;
          } catch (insertError) {
            console.error(
              `Insert attempt ${retryCount + 1} failed:`,
              insertError
            );
            retryCount++;
            if (retryCount === maxRetries) {
              throw insertError;
            }
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );
          }
        }

        if (!result || !result.acknowledged) {
          throw new Error("Insert operation not acknowledged");
        }

        console.log("Contact saved successfully with MongoDB driver");

        return res.status(201).json({
          success: true,
          message: "Message sent successfully",
          data: { _id: result.insertedId, ...contactDoc },
          source: "mongodb_driver",
        });
      } catch (mongoError) {
        console.error("Error with MongoDB driver:", mongoError);
        throw mongoError;
      }
    }
  } catch (error) {
    console.error("Error in createContactEnhanced:", error);

    return res.status(500).json({
      success: false,
      message: "Error sending message. Please try again later.",
      error: error.message,
    });
  }
};

// @desc    Get all contact messages with enhanced error handling
// @route   GET /api/contact/enhanced
// @access  Private/Admin
exports.getAllContactsEnhanced = async (req, res) => {
  try {
    console.log("Getting all contact messages with enhanced error handling");

    // Try to get messages using Mongoose first
    try {
      console.log("Attempting to fetch contacts using Mongoose model");
      const contacts = await Contact.find().sort({ createdAt: -1 });
      console.log(`Found ${contacts.length} contacts using Mongoose`);

      return res.status(200).json({
        success: true,
        count: contacts.length,
        data: contacts,
        source: "mongoose",
      });
    } catch (mongooseError) {
      console.error("Error fetching contacts with Mongoose:", mongooseError);

      // Try direct MongoDB driver as fallback
      try {
        console.log("Attempting to fetch contacts using direct MongoDB driver");

        // Get collection
        const collection = await getCollection(COLLECTION);

        // Find all contacts
        const contacts = await collection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        console.log(
          `Found ${contacts.length} contacts using direct MongoDB driver`
        );

        return res.status(200).json({
          success: true,
          count: contacts.length,
          data: contacts,
          source: "direct_database",
        });
      } catch (mongoError) {
        console.error("Error with MongoDB driver:", mongoError);
        throw mongoError;
      }
    }
  } catch (error) {
    console.error("Error in getAllContactsEnhanced:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching messages. Please try again later.",
      error: error.message,
    });
  }
};

// Export other controller methods from the original contact controller
const originalController = require("./contact");

exports.getContact = originalController.getContact;
exports.updateContact = originalController.updateContact;
exports.deleteContact = originalController.deleteContact;
