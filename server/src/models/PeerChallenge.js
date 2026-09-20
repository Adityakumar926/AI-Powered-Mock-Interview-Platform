const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // index of correct option
  explanation: { type: String, default: "" },
});

const peerChallengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["Daily", "Weekly"],
      required: true,
    },
    round: {
      type: String,
      enum: ["Technical", "HR", "Aptitude", "Domain"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Advanced"],
      default: "Medium",
    },
    timeLimit: { type: Number, default: 5 }, // minutes
    questions: [questionSchema],
    expiryDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PeerChallenge", peerChallengeSchema);
