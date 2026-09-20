const Groq = require("groq-sdk");
const PlacementReadiness = require("../models/PlacementReadiness.js");
const Interview = require("../models/Interview.js");

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const determineTier = (score) => {
  if (score >= 80) return "Placement Ready";
  if (score >= 60) return "High Potential";
  return "Needs Improvement";
};

// ── Calculate/Update Placement Readiness Profile ──────────────
const calculateReadinessProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { careerStage: requestedStage } = req.body || {};

    // 1️⃣ Fetch completed interviews for the user
    const completedInterviews = await Interview.find({
      userId,
      isComplete: true,
    }).sort({ createdAt: -1 });

    let interviewScore = 50; // default baseline if no interviews
    if (completedInterviews.length > 0) {
      const totalScore = completedInterviews.reduce(
        (sum, item) => sum + (item.score || 0),
        0
      );
      interviewScore = Math.round(totalScore / completedInterviews.length);
    }

    // 2️⃣ Base scores for Resume & Skill assessment
    // Dynamic calculation: interview activity boosts resume & skill scores
    const resumeScore = Math.min(
      95,
      Math.max(60, 65 + completedInterviews.length * 5)
    );
    const skillScore = Math.min(
      95,
      Math.max(55, Math.round(interviewScore * 0.9 + 5))
    );

    // 3️⃣ Overall Weighted Score Calculation
    const overallReadinessScore = Math.round(
      resumeScore * 0.3 + interviewScore * 0.5 + skillScore * 0.2
    );
    const performanceTier = determineTier(overallReadinessScore);

    // Existing profile stage fallback
    let existingProfile = await PlacementReadiness.findOne({ userId });
    const careerStage =
      requestedStage || existingProfile?.careerStage || "Fresher";

    // 4️⃣ Generate Groq AI Personalized Roadmap
    let roadmap = {
      recommendedTechStack: [
        "React.js",
        "Next.js",
        "Node.js & Express",
        "TypeScript",
        "MongoDB",
        "System Architecture",
      ],
      recommendedProjects: [
        {
          title: "Full-Stack AI Interview Portal",
          description:
            "Build an adaptive web application integrating LLM evaluation APIs, responsive UI, and JWT authentication.",
          impact: "Demonstrates production full-stack & AI integration capability.",
        },
        {
          title: "Real-Time Collaborative Code Editor",
          description:
            "Develop a multi-user editor using WebSockets (Socket.io) and Redispub/sub messaging.",
          impact: "Highlights system design and live concurrency skills.",
        },
      ],
      recommendedCertifications: [
        "AWS Certified Cloud Practitioner",
        "MongoDB Certified Developer",
        "Meta Front-End Developer Certificate",
      ],
      priorityTopics: [
        "Data Structures & Algorithms (Trees, Graphs, Dynamic Programming)",
        "Database Indexing & Query Optimization",
        "REST API Security & Microservices Architecture",
      ],
    };

    try {
      const roadmapPrompt = `You are a top technical career mentor and placement advisor.
Generate a structured placement readiness roadmap for a candidate with:
- Career Stage: ${careerStage}
- Overall Readiness Score: ${overallReadinessScore}% (${performanceTier})
- Mock Interview Score: ${interviewScore}% across ${completedInterviews.length} sessions

Respond ONLY with a valid JSON object in this exact format:
{
  "recommendedTechStack": ["Tech 1", "Tech 2", "Tech 3", "Tech 4"],
  "recommendedProjects": [
    {
      "title": "Project Title 1",
      "description": "Short 1-2 sentence description",
      "impact": "Career impact outcome"
    },
    {
      "title": "Project Title 2",
      "description": "Short 1-2 sentence description",
      "impact": "Career impact outcome"
    }
  ],
  "recommendedCertifications": ["Cert 1", "Cert 2"],
  "priorityTopics": ["Topic 1", "Topic 2", "Topic 3"]
}`;

      const aiRes = await getGroq().chat.completions.create({
        model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
        messages: [{ role: "user", content: roadmapPrompt }],
        temperature: 0.6,
        max_tokens: 350,
      });

      const raw = aiRes.choices[0].message.content || "{}";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.recommendedTechStack) roadmap = parsed;
      }
    } catch (aiErr) {
      console.warn("Groq AI Roadmap generation fallback triggered:", aiErr.message);
    }

    // 5️⃣ Update or Create PlacementReadiness Document
    const historicalSnapshots = existingProfile?.historicalSnapshots || [];
    
    // Add current snapshot
    const lastInterviewDomain =
      completedInterviews.length > 0 ? completedInterviews[0].domain : "General";
    
    historicalSnapshots.push({
      date: new Date(),
      score: overallReadinessScore,
      tier: performanceTier,
      interviewDomain: lastInterviewDomain,
    });

    // Limit snapshots array to last 10 entries
    const trimmedSnapshots = historicalSnapshots.slice(-10);

    const profileData = {
      userId,
      overallReadinessScore,
      performanceTier,
      careerStage,
      breakdown: {
        resumeScore,
        interviewScore,
        skillScore,
      },
      personalizedRoadmap: roadmap,
      historicalSnapshots: trimmedSnapshots,
    };

    let updatedProfile = await PlacementReadiness.findOneAndUpdate(
      { userId },
      profileData,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      profile: updatedProfile,
      totalInterviewsCompleted: completedInterviews.length,
    });
  } catch (err) {
    console.error("calculateReadinessProfile error:", err);
    res.status(500).json({
      message: "Failed to calculate placement readiness profile",
      error: err.message,
    });
  }
};

// ── Get Placement Readiness Profile ─────────────────────────
const getReadinessProfile = async (req, res) => {
  try {
    const userId = req.userId;
    let profile = await PlacementReadiness.findOne({ userId });

    if (!profile) {
      // Auto-compute baseline profile for new users
      return await calculateReadinessProfile(req, res);
    }

    const completedCount = await Interview.countDocuments({
      userId,
      isComplete: true,
    });

    res.json({
      success: true,
      profile,
      totalInterviewsCompleted: completedCount,
    });
  } catch (err) {
    console.error("getReadinessProfile error:", err);
    res.status(500).json({
      message: "Failed to fetch placement readiness profile",
      error: err.message,
    });
  }
};

module.exports = {
  getReadinessProfile,
  calculateReadinessProfile,
};
