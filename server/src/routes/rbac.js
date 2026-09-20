const express = require("express");
const {
  getAllUsers,
  updateUserRole,
  toggleUserLock,
  deleteUser,
  getMentorStudentSessions,
  getSessionDetails,
  submitMentorFeedback,
  getSystemAnalytics,
} = require("../controllers/rbacController.js");
const { protect, authorize } = require("../middleware/auth.js");

const router = express.Router();

router.use(protect); // require authentication

// Admin routes
router.get("/users", authorize("Administrator"), getAllUsers);
router.post("/users/role", authorize("Administrator"), updateUserRole);
router.post("/users/lock", authorize("Administrator"), toggleUserLock);
router.delete("/users/:userId", authorize("Administrator"), deleteUser);
router.get("/analytics", authorize("Administrator", "Mentor"), getSystemAnalytics);

// Mentor & Admin routes
router.get("/mentor/sessions", authorize("Mentor", "Administrator"), getMentorStudentSessions);
router.get("/mentor/sessions/:id", authorize("Mentor", "Administrator"), getSessionDetails);
router.post("/mentor/feedback", authorize("Mentor", "Administrator"), submitMentorFeedback);

module.exports = router;

