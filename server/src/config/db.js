const mongoose = require("mongoose");

const seedAccounts = async () => {
  try {
    const User = require("../models/User");
    const adminExists = await User.findOne({ email: "admin@example.com" });
    if (!adminExists) {
      const admin = new User({
        name: "Aditya Kumar (Admin)",
        email: "admin@example.com",
        password: "password123",
        role: "Administrator",
      });
      await admin.save();

      const mentor = new User({
        name: "Senior Technical Mentor",
        email: "mentor@example.com",
        password: "password123",
        role: "Mentor",
      });
      await mentor.save();

      const student = new User({
        name: "Candidate Student",
        email: "student@example.com",
        password: "password123",
        role: "Student",
      });
      await student.save();

      console.log("🌱 Default accounts seeded: admin@example.com, mentor@example.com, student@example.com (password: password123)");
    }
  } catch (e) {
    console.error("Seeding warning:", e.message);
  }
};

const connectDB = async () => {
  if (process.env.MONGO_URI) {
    try {
      console.log("Connecting to MongoDB Atlas...");
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 3500,
      });
      console.log("✅ MongoDB Atlas connected successfully");
      await seedAccounts();
      return;
    } catch (err) {
      console.error("⚠️ MongoDB Atlas connection failed (IP Whitelist check):", err.message);
    }
  }

  // Automatic Fallback 1: Local MongoDB
  try {
    console.log("Attempting local MongoDB connection...");
    await mongoose.connect("mongodb://127.0.0.1:27017/ai-assistant", {
      serverSelectionTimeoutMS: 1500,
    });
    console.log("✅ Local MongoDB connected successfully");
    await seedAccounts();
    return;
  } catch (err) {
    // ignore
  }

  // Automatic Fallback 2: MongoMemoryServer
  try {
    console.log("Initializing In-Memory MongoDB Server...");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log("✅ In-Memory MongoDB connected successfully (Zero-Downtime Offline Mode)");
    await seedAccounts();
  } catch (err) {
    console.error("❌ MongoMemoryServer initialization error:", err.message);
  }
};

module.exports = connectDB;
