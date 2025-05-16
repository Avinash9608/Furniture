const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Configure Mongoose globally
    mongoose.set('bufferCommands', false); // Disable buffering
    mongoose.set('maxTimeMS', 5000); // Set default operation timeout

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 10000, // Close sockets after 10 seconds
      connectTimeoutMS: 10000, // Retry initial connection after 10 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 0, // Don't maintain minimum connections
      maxIdleTimeMS: 10000, // Close idle connections after 10 seconds
      family: 4, // Use IPv4, skip trying IPv6
      autoIndex: false, // Don't build indexes
      heartbeatFrequencyMS: 5000, // Check connection every 5 seconds
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection errors after initial connection
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
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
    process.exit(1);
  }
};

module.exports = connectDB; 