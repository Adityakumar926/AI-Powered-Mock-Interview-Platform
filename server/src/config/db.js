const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("⚠️ MONGO_URI is not set in .env file");
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.warn("⚠️ Server running without MongoDB connection. Update MONGO_URI in .env when ready.");
  }
};

module.exports = connectDB;
