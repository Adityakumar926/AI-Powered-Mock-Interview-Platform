const express = require("express");
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  getSecurityProfile,
  revokeSession,
} = require("../controllers/authController.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", protect, getMe);
router.get("/security", protect, getSecurityProfile);
router.post("/sessions/revoke", protect, revokeSession);

module.exports = router;