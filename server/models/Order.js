const mongoose = require("mongoose");
const timeoutPlugin = require("../utils/mongooseTimeoutPlugin");

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  orderItems: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: "Product",
      },
    },
  ],
  shippingAddress: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    phone: { type: String, required: true },
  },
  sourceAddress: {
    type: mongoose.Schema.ObjectId,
    ref: "SourceAddress",
  },
  paymentMethod: {
    type: String,
    required: true,
    default: "Cash on Delivery",
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
    lowercase: true, // Ensure status is always stored as lowercase
  },
  deliveredAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add mock data for fallback
OrderSchema.statics.mockData = [
  {
    _id: "mock-order-1",
    user: "mock-user-1",
    orderItems: [
      {
        name: "Luxury Sofa",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
        price: 12999,
        product: "mock-product-1",
      },
    ],
    shippingAddress: {
      name: "John Doe",
      address: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India",
      phone: "1234567890",
    },
    paymentMethod: "Cash on Delivery",
    itemsPrice: 12999,
    taxPrice: 2340,
    shippingPrice: 500,
    totalPrice: 15839,
    isPaid: false,
    status: "pending",
    createdAt: new Date(),
  },
  {
    _id: "mock-order-2",
    user: "mock-user-2",
    orderItems: [
      {
        name: "Wooden Dining Table",
        quantity: 1,
        image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88",
        price: 8999,
        product: "mock-product-2",
      },
      {
        name: "Executive Office Chair",
        quantity: 2,
        image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8",
        price: 5999,
        product: "mock-product-3",
      },
    ],
    shippingAddress: {
      name: "Jane Smith",
      address: "456 Park Ave",
      city: "Delhi",
      state: "Delhi",
      postalCode: "110001",
      country: "India",
      phone: "9876543210",
    },
    paymentMethod: "UPI",
    paymentResult: {
      id: "mock-payment-1",
      status: "completed",
      update_time: new Date().toISOString(),
      email_address: "jane@example.com",
    },
    itemsPrice: 20997,
    taxPrice: 3780,
    shippingPrice: 0,
    totalPrice: 24777,
    isPaid: true,
    paidAt: new Date(Date.now() - 86400000), // 1 day ago
    status: "shipped",
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
  },
];

// Apply the timeout plugin
OrderSchema.plugin(timeoutPlugin, { timeout: 60000 });

module.exports = mongoose.model("Order", OrderSchema);
