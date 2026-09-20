const User = require("../models/User.js");
const Interview = require("../models/Interview.js");

// ── Admin: Get All Platform Users ─────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("_id name email role createdAt failedLoginAttempts lockUntil loginHistory")
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

// ── Admin: Lock / Unlock User Account ────────────────────────
const toggleUserLock = async (req, res) => {
  try {
    const { userId, action } = req.body; // action: "lock" | "unlock"
    if (!userId || !action) {
      return res.status(400).json({ message: "userId and action are required" });
    }

    let update = {};
    if (action === "lock") {
      update = { lockUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }; // 30 days lock
    } else {
      update = { lockUntil: null, failedLoginAttempts: 0 };
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select("_id name email role lockUntil failedLoginAttempts");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user, message: `User account ${action === "lock" ? "locked" : "unlocked"} successfully` });
  } catch (err) {
    console.error("toggleUserLock error:", err);
    res.status(500).json({ message: "Failed to toggle account lock state", error: err.message });
  }
};

// ── Admin: Delete User ───────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    // Prevent deleting self
    if (req.user && req.user._id.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot delete your own administrator account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Also remove user's interviews
    await Interview.deleteMany({ userId });

    res.json({ success: true, message: "User and associated interview data deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};

// ── Mentor & Admin: Get Student Interview Sessions ────────────
const getMentorStudentSessions = async (req, res) => {
  try {
    const completedInterviews = await Interview.find({ isComplete: true })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, sessions: completedInterviews });
  } catch (err) {
    console.error("getMentorStudentSessions error:", err);
    res.status(500).json({ message: "Failed to fetch student sessions", error: err.message });
  }
};

// ── Mentor & Admin: Get Detailed Single Session ───────────────
const getSessionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Interview.findById(id).populate("userId", "name email role");
    if (!session) return res.status(404).json({ message: "Interview session not found" });

    res.json({ success: true, session });
  } catch (err) {
    console.error("getSessionDetails error:", err);
    res.status(500).json({ message: "Failed to fetch session details", error: err.message });
  }
};

// ── Mentor: Submit Feedback for Student Session ───────────────
const submitMentorFeedback = async (req, res) => {
  try {
    const { interviewId, mentorNotes, scoreAdjustment, rubricScores } = req.body;
    if (!interviewId) {
      return res.status(400).json({ message: "interviewId is required" });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    const mentorName = req.user ? req.user.name : "Senior Technical Mentor";

    let rubricText = "";
    if (rubricScores) {
      rubricText = ` [Technical: ${rubricScores.technical}/10, Communication: ${rubricScores.communication}/10, Problem Solving: ${rubricScores.problemSolving}/10]`;
    }

    interview.feedback = `${interview.feedback || ""}\n\n👨‍🏫 Mentor Evaluation by ${mentorName}${rubricText}:\n${mentorNotes || "Reviewed and approved."}`;
    
    if (scoreAdjustment !== undefined && scoreAdjustment !== null && !isNaN(scoreAdjustment)) {
      interview.score = Math.max(0, Math.min(100, scoreAdjustment));
    }

    await interview.save();

    res.json({ success: true, interview });
  } catch (err) {
    console.error("submitMentorFeedback error:", err);
    res.status(500).json({ message: "Failed to submit mentor feedback", error: err.message });
  }
};

// ── Admin: Comprehensive System Analytics ─────────────────────
const getSystemAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: "Student" });
    const mentorCount = await User.countDocuments({ role: "Mentor" });
    const adminCount = await User.countDocuments({ role: "Administrator" });
    const lockedCount = await User.countDocuments({ lockUntil: { $gt: new Date() } });

    const totalInterviews = await Interview.countDocuments({ isComplete: true });

    const allInterviews = await Interview.find({ isComplete: true }).select("score domain duration createdAt");
    const avgScore = allInterviews.length > 0
      ? Math.round(allInterviews.reduce((a, b) => a + (b.score || 0), 0) / allInterviews.length)
      : 75;

    // Domain breakdown
    const domainCounts = {};
    allInterviews.forEach((inv) => {
      domainCounts[inv.domain] = (domainCounts[inv.domain] || 0) + 1;
    });

    const domainAnalytics = Object.keys(domainCounts).map((domain) => ({
      domain,
      count: domainCounts[domain],
    }));

    res.json({
      success: true,
      analytics: {
        totalUsers,
        studentCount,
        mentorCount,
        adminCount,
        lockedCount,
        totalInterviewsCompleted: totalInterviews,
        platformAvgScore: avgScore,
        domainAnalytics,
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
  toggleUserLock,
  deleteUser,
  getMentorStudentSessions,
  getSessionDetails,
  submitMentorFeedback,
  getSystemAnalytics,
};

