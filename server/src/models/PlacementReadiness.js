const mongoose = require("mongoose");

const placementReadinessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    overallReadinessScore: {
      type: Number,
      default: 0,
    },
    performanceTier: {
      type: String,
      enum: ["Placement Ready", "High Potential", "Needs Improvement"],
      default: "Needs Improvement",
    },
    careerStage: {
      type: String,
      enum: ["Fresher", "Internship Seeker", "Experienced"],
      default: "Fresher",
    },
    breakdown: {
      resumeScore: { type: Number, default: 60 },
      interviewScore: { type: Number, default: 50 },
      skillScore: { type: Number, default: 55 },
    },
    personalizedRoadmap: {
      recommendedTechStack: [{ type: String }],
      recommendedProjects: [
        {
          title: { type: String },
          description: { type: String },
          impact: { type: String },
        },
      ],
      recommendedCertifications: [{ type: String }],
      priorityTopics: [{ type: String }],
    },
    historicalSnapshots: [
      {
        date: { type: Date, default: Date.now },
        score: { type: Number },
        tier: { type: String },
        interviewDomain: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlacementReadiness", placementReadinessSchema);
