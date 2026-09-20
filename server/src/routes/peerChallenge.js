const express = require("express");
const {
  getActiveChallenges,
  submitChallengeAttempt,
  getGlobalLeaderboard,
} = require("../controllers/peerChallengeController.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.use(protect); // require auth

router.get("/active", getActiveChallenges);
router.post("/submit", submitChallengeAttempt);
router.get("/leaderboard", getGlobalLeaderboard);

module.exports = router;
