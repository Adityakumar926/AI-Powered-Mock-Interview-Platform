const mongoose = require("mongoose");

const challengeSubmissionSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PeerChallenge",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, default: "Anonymous Developer" },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    durationSeconds: { type: Number, default: 0 },
    rankPointsEarned: { type: Number, default: 0 },
    badgesUnlocked: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChallengeSubmission", challengeSubmissionSchema);
