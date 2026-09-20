const express = require("express");
const {
  getReadinessProfile,
  calculateReadinessProfile,
} = require("../controllers/placementReadinessController.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.use(protect); // require auth

router.get("/", getReadinessProfile);
router.post("/calculate", calculateReadinessProfile);

module.exports = router;
