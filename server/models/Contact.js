const mongoose = require("mongoose");
const timeoutPlugin = require("../utils/mongooseTimeoutPlugin");

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add your name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Please add your email"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  phone: {
    type: String,
    maxlength: [20, "Phone number cannot be longer than 20 characters"],
  },
  subject: {
    type: String,
    required: [true, "Please add a subject"],
    maxlength: [100, "Subject cannot be more than 100 characters"],
  },
  message: {
    type: String,
    required: [true, "Please add your message"],
    maxlength: [1000, "Message cannot be more than 1000 characters"],
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add mock data for fallback
ContactSchema.statics.mockData = [
  {
    _id: "mock-contact-1",
    name: "John Doe",
    email: "john@example.com",
    phone: "1234567890",
    subject: "Product Inquiry",
    message:
      "I'm interested in your furniture collection. Do you deliver to my area?",
    status: "unread",
    createdAt: new Date(),
  },
  {
    _id: "mock-contact-2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "9876543210",
    subject: "Delivery Question",
    message: "What's the estimated delivery time for a sofa?",
    status: "read",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    _id: "mock-contact-3",
    name: "Robert Johnson",
    email: "robert@example.com",
    phone: "5551234567",
    subject: "Warranty Information",
    message:
      "I'd like to know more about your warranty policy for wooden furniture.",
    status: "unread",
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
  },
];

// Apply the timeout plugin
ContactSchema.plugin(timeoutPlugin, { timeout: 60000 });

// Check if model exists before creating a new one
const Contact =
  mongoose.models.Contact || mongoose.model("Contact", ContactSchema);

// Export the model
module.exports = Contact;
