const express = require("express");
const {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
} = require("../controllers/contact");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

// Check if we should bypass auth in development mode
const bypassAuth =
  process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true";
console.log("Contact Routes - Bypass Auth:", bypassAuth);

// Create middleware arrays based on environment
const adminMiddleware = bypassAuth ? [] : [protect, authorize("admin")];

router
  .route("/")
  .post(createContact)
  .get(...adminMiddleware, getContacts);

router
  .route("/:id")
  .get(...adminMiddleware, getContact)
  .put(...adminMiddleware, updateContact)
  .delete(...adminMiddleware, deleteContact);

module.exports = router;
