const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Configure Mongoose globally
    mongoose.set("bufferCommands", true); // Enable buffering
    mongoose.set("maxTimeMS", 30000); // Set default operation timeout to 30 seconds

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
      connectTimeoutMS: 30000, // Retry initial connection after 30 seconds
      maxPoolSize: 50, // Maintain up to 50 socket connections
      minPoolSize: 5, // Maintain minimum 5 connections
      maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
      family: 4, // Use IPv4, skip trying IPv6
      autoIndex: true, // Build indexes
      heartbeatFrequencyMS: 10000, // Check connection every 10 seconds
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Add global timeout plugin
    const timeoutPlugin = require("../utils/mongooseTimeoutPlugin");
    mongoose.plugin(timeoutPlugin, { timeout: 30000 }); // 30 second timeout

    // Handle connection errors after initial connection
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      // Try to reconnect
      setTimeout(() => {
        mongoose.connect(process.env.MONGO_URI).catch(console.error);
      }, 5000);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      // Try to reconnect
      setTimeout(() => {
        mongoose.connect(process.env.MONGO_URI).catch(console.error);
      }, 5000);
    });

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // Don't exit process, try to reconnect
    setTimeout(() => {
      connectDB().catch(console.error);
    }, 5000);
  }
};

module.exports = connectDB;
