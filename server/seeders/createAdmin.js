require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Error: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const createAdmin = async () => {
  try {
    console.log("Checking for existing admin...");
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (adminExists) {
      console.log("ℹ️ Admin user already exists");
      return process.exit();
    }

    console.log("Creating admin user...");
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    await User.create({
      name: process.env.ADMIN_NAME || "Admin User",
      email: process.env.ADMIN_EMAIL,
      password,
      role: "admin",
    });

    console.log("✅ Admin user created successfully");
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    mongoose.disconnect();
    process.exit();
  }
};

createAdmin();
