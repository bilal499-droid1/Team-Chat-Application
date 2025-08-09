const mongoose = require("mongoose");
const path = require("path");

// Load environment variables from the backend directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", process.env.MONGODB_URI);

    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/collaboration-tool";
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    // Don't exit process, let the server handle the error
    throw error;
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("📡 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("📴 Mongoose disconnected from MongoDB");
});

// Handle app termination
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
    process.exit(1);
  }
});

module.exports = connectDB;
