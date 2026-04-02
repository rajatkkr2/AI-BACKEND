// ============================================
// Database Configuration
// Connects to MongoDB using Mongoose
// ============================================

const mongoose = require("mongoose");

/**
 * connectDB - Establishes connection to MongoDB
 * Uses the MONGO_URI from environment variables
 * Exits the process if connection fails (can't run without DB)
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit with failure code
  }
};

module.exports = connectDB;
