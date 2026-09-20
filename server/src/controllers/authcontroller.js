const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User.js");

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const validatePasswordStrength = (password) => {
  if (!password || password.length < 6) return false;
  return true;
};

// ── Register ──────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already in use" });

    const userRole = ["Student", "Mentor", "Administrator"].includes(role) ? role : "Student";

    const user = await User.create({ name, email, password, role: userRole });
    const token = signToken(user._id.toString());

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role || "Student" },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ── Login with Account Lockout & Activity Tracking ────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Browser Client";

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 1️⃣ Account Lockout Check
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      user.loginHistory.push({
        ip: clientIp,
        userAgent,
        status: "Locked",
      });
      await user.save();
      return res.status(423).json({
        message: `Account temporarily locked due to multiple failed attempts. Please try again in ${remainingMins} minutes.`,
      });
    }

    // 2️⃣ Verify Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      user.loginHistory.push({
        ip: clientIp,
        userAgent,
        status: "Failed",
      });

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        await user.save();
        return res.status(423).json({
          message: "Account locked after 5 consecutive failed login attempts. Try again in 15 minutes.",
        });
      }

      await user.save();
      return res.status(401).json({
        message: `Invalid credentials. (${5 - user.failedLoginAttempts} attempts remaining before account lockout)`,
      });
    }

    // 3️⃣ Successful Login Cleanup & Active Session Tracking
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    user.loginHistory.push({
      ip: clientIp,
      userAgent,
      status: "Success",
    });

    const sessionId = crypto.randomBytes(16).toString("hex");
    const deviceType = userAgent.includes("Mobile")
      ? "Mobile Device"
      : userAgent.includes("Macintosh")
      ? "macOS Browser"
      : "Windows PC Browser";

    user.activeSessions.push({
      sessionId,
      device: deviceType,
      ip: clientIp,
      lastActive: new Date(),
    });

    // Limit active sessions list to 5
    if (user.activeSessions.length > 5) {
      user.activeSessions = user.activeSessions.slice(-5);
    }

    await user.save();

    const token = signToken(user._id.toString());

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role || "Student" },
      sessionId,
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── Get User Profile ──────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Forgot Password Request ───────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    res.json({
      success: true,
      message: "Password reset token generated successfully",
      resetToken, // for testing / dev integration
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to request password reset", error: err.message });
  }
};

// ── Reset Password ────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired password reset token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    res.json({ success: true, message: "Password updated successfully. Please log in with your new password." });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password", error: err.message });
  }
};

// ── Security Profile (Login History & Sessions) ───────────
const getSecurityProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "email loginHistory activeSessions failedLoginAttempts lockUntil"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const isLocked = !!(user.lockUntil && user.lockUntil > Date.now());

    res.json({
      success: true,
      email: user.email,
      failedAttempts: user.failedLoginAttempts,
      isLocked,
      lockUntil: user.lockUntil,
      loginHistory: user.loginHistory.slice(-10).reverse(),
      activeSessions: user.activeSessions,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch security profile", error: err.message });
  }
};

// ── Revoke Session ────────────────────────────────────────
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.activeSessions = user.activeSessions.filter(
      (s) => s.sessionId !== sessionId
    );
    await user.save();

    res.json({
      success: true,
      message: "Session revoked successfully",
      activeSessions: user.activeSessions,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to revoke session", error: err.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  getSecurityProfile,
  revokeSession,
};
