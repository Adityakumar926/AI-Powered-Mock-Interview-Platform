const User = require("../models/User.js");
const Interview = require("../models/Interview.js");
const PlacementReadiness = require("../models/PlacementReadiness.js");

// ── Admin: Get All Platform Users ─────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("_id name email role createdAt failedLoginAttempts lockUntil")
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// ── Admin: Update User Role ───────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role are required" });
    }

    if (!["Student", "Mentor", "Administrator"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("_id name email role createdAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("updateUserRole error:", err);
    res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
};

// ── Mentor: Get Student Interview Sessions ─────────────────────
const getMentorStudentSessions = async (req, res) => {
  try {
    const completedInterviews = await Interview.find({ isComplete: true })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, sessions: completedInterviews });
  } catch (err) {
    console.error("getMentorStudentSessions error:", err);
    res.status(500).json({ message: "Failed to fetch student sessions", error: err.message });
  }
};

// ── Mentor: Submit Feedback for Student Session ───────────────
const submitMentorFeedback = async (req, res) => {
  try {
    const { interviewId, mentorNotes, scoreAdjustment } = req.body;
    if (!interviewId) {
      return res.status(400).json({ message: "interviewId is required" });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    const mentorName = req.user ? req.user.name : "Senior Technical Mentor";

    interview.feedback = `${interview.feedback || ""}\n\n👨‍🏫 Mentor Evaluation (${mentorName}): ${mentorNotes || "Reviewed and approved."}`;
    if (scoreAdjustment !== undefined && scoreAdjustment !== null) {
      interview.score = Math.max(0, Math.min(100, scoreAdjustment));
    }

    await interview.save();

    res.json({ success: true, interview });
  } catch (err) {
    console.error("submitMentorFeedback error:", err);
    res.status(500).json({ message: "Failed to submit mentor feedback", error: err.message });
  }
};

// ── Admin: System Analytics ──────────────────────────────────
const getSystemAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: "Student" });
    const mentorCount = await User.countDocuments({ role: "Mentor" });
    const adminCount = await User.countDocuments({ role: "Administrator" });

    const totalInterviews = await Interview.countDocuments({ isComplete: true });

    const allInterviews = await Interview.find({ isComplete: true }).select("score");
    const avgScore = allInterviews.length > 0
      ? Math.round(allInterviews.reduce((a, b) => a + (b.score || 0), 0) / allInterviews.length)
      : 75;

    res.json({
      success: true,
      analytics: {
        totalUsers,
        studentCount,
        mentorCount,
        adminCount,
        totalInterviewsCompleted: totalInterviews,
        platformAvgScore: avgScore,
      },
    });
  } catch (err) {
    console.error("getSystemAnalytics error:", err);
    res.status(500).json({ message: "Failed to fetch analytics", error: err.message });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  getMentorStudentSessions,
  submitMentorFeedback,
  getSystemAnalytics,
};
