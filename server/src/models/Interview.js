const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["ai", "user"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const QuestionStepSchema = new mongoose.Schema({
  question: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard", "Advanced"], default: "Medium" },
  answer: { type: String, default: "" },
  feedback: { type: String, default: "" },
  score: { type: Number, default: 0 },
  isSkipped: { type: Boolean, default: false },
  isRepeated: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const InterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  domain: { type: String, required: true },
  companyId: { type: String, default: "" },
  companyName: { type: String, default: "" },
  score: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // minutes
  questionsAnswered: { type: Number, default: 0 },
  currentDifficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard", "Advanced"],
    default: "Medium",
  },
  questionHistory: [QuestionStepSchema],
  progressionReport: {
    difficultyTrajectory: [{ type: String }],
    scoreTrajectory: [{ type: Number }],
    summary: { type: String, default: "" },
    topicMastery: [
      {
        topic: String,
        mastery: String,
      },
    ],
  },
  companyBenchmark: {
    hiringBarResult: { type: String, default: "" },
    benchmarkSummary: { type: String, default: "" },
  },
  messages: [MessageSchema],
  feedback: { type: String, default: "" },
  isComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model("Interview", InterviewSchema);
