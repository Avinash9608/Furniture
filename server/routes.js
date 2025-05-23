const express = require("express");
const router = express.Router();

// Import all routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const contactRoutes = require("./routes/contact");
const orderRoutes = require("./routes/orders");
const paymentSettingsRoutes = require("./routes/paymentSettings");
const paymentRequestsRoutes = require("./routes/paymentRequests");
const productFixRoute = require("./routes/productFixRoute"); // Add our fix route

// Mount routes
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/contact", contactRoutes);
router.use("/orders", orderRoutes);
router.use("/payment-settings", paymentSettingsRoutes);
router.use("/payment-requests", paymentRequestsRoutes);
router.use("/fix/products", productFixRoute); // Mount our fix route
module.exports = router;
