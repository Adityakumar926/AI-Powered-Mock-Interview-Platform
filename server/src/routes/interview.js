const express = require("express");
const {
  startInterview,
  submitAnswer,
  getInterviews,
  getInterview,
  getCompanyProfiles,
} = require("../controllers/interviewcontroller.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.use(protect); // all routes require auth

router.get("/companies", getCompanyProfiles);
router.post("/start", startInterview);
router.post("/submit-answer", submitAnswer);
router.get("/", getInterviews);
router.get("/:id", getInterview);

module.exports = router;

