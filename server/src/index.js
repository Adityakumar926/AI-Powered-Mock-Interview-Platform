const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db.js");
require("dotenv").config();
const authRoutes = require("./routes/auth.js");
const interviewRoutes = require("./routes/interview.js");
const resumeRoutes = require("./routes/resume.js");
const placementReadinessRoutes = require("./routes/placementReadiness.js");
const peerChallengeRoutes = require("./routes/peerChallenge.js");
const rbacRoutes = require("./routes/rbac.js");

connectDB();
const app = express();
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/placement-readiness", placementReadinessRoutes);
app.use("/api/peer-challenges", peerChallengeRoutes);
app.use("/api/rbac", rbacRoutes);



const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend is running!");
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`),
);
