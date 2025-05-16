const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
      connectTimeoutMS: 30000, // Retry initial connection after 30 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain at least 5 socket connections
      maxIdleTimeMS: 10000, // Close idle connections after 10 seconds
      family: 4 // Use IPv4, skip trying IPv6
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection errors after initial connection
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      // Attempt to reconnect
      mongoose.connect(process.env.MONGO_URI).catch(console.error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected, attempting to reconnect...");
      mongoose.connect(process.env.MONGO_URI).catch(console.error);
    });

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB; 