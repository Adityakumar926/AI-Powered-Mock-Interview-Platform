const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ["Student", "Mentor", "Administrator"],
    default: "Student",
  },
  failedLoginAttempts: { type: Number, default: 0 },

  lockUntil: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  loginHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      ip: { type: String, default: "127.0.0.1" },
      userAgent: { type: String, default: "Browser" },
      status: { type: String, enum: ["Success", "Failed", "Locked"], default: "Success" },
    },
  ],
  activeSessions: [
    {
      sessionId: { type: String, required: true },
      device: { type: String, default: "Web Browser" },
      ip: { type: String, default: "127.0.0.1" },
      lastActive: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model("User", userSchema);
