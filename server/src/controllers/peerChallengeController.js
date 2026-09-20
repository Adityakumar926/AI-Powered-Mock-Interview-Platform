const PeerChallenge = require("../models/PeerChallenge.js");
const ChallengeSubmission = require("../models/ChallengeSubmission.js");
const User = require("../models/User.js");

const calculateRankTier = (points) => {
  if (points >= 1500) return "Grandmaster 👑";
  if (points >= 800) return "Master 🥇";
  if (points >= 300) return "Contender 🥈";
  return "Novice 🥉";
};

// ── Seed Initial Default Challenges if needed ────────────────
const seedDefaultChallenges = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const defaultDaily = {
    title: "Daily Tech Sprint: Data Structures & State",
    description: "Test your speed and precision on React hooks, async patterns, and queue operations.",
    type: "Daily",
    round: "Technical",
    difficulty: "Medium",
    timeLimit: 3,
    expiryDate: tomorrow,
    questions: [
      {
        question: "Which React hook is designed to memoize expensive computations between renders?",
        options: ["useCallback", "useMemo", "useEffect", "useRef"],
        correctAnswer: 1,
        explanation: "useMemo caches the result of a calculation between renders.",
      },
      {
        question: "What is the time complexity of looking up a key in a hash table on average?",
        options: ["O(N)", "O(log N)", "O(1)", "O(N^2)"],
        correctAnswer: 2,
        explanation: "Average time complexity for hash table lookup is O(1).",
      },
      {
        question: "In Node.js event loop, which queue processes resolved Promise callbacks?",
        options: ["Check Queue", "Microtask Queue", "Timers Queue", "I/O Queue"],
        correctAnswer: 1,
        explanation: "Promises (and process.nextTick) execute in the Microtask Queue.",
      },
    ],
  };

  const defaultWeekly = {
    title: "Weekly Arena Championship: System Design & Aptitude",
    description: "Compete globally in high-level system architecture trade-offs and logical reasoning.",
    type: "Weekly",
    round: "Domain",
    difficulty: "Hard",
    timeLimit: 5,
    expiryDate: nextWeek,
    questions: [
      {
        question: "In distributed systems, what does the CAP Theorem state you CANNOT simultaneously achieve?",
        options: [
          "Consistency, Availability, and Partition Tolerance",
          "Concurrency, Authentication, and Performance",
          "Caching, Analytics, and Persistence",
          "Compression, Aggregation, and Protection",
        ],
        correctAnswer: 0,
        explanation: "CAP theorem states a distributed system can only guarantee 2 of Consistency, Availability, Partition Tolerance.",
      },
      {
        question: "Which database indexing strategy is best suited for write-heavy log append operations?",
        options: ["B+ Tree Indexing", "LSM Tree (Log-Structured Merge-tree)", "Clustered Primary Key", "Bitmap Index"],
        correctAnswer: 1,
        explanation: "LSM trees optimize write performance by sequentially buffering writes.",
      },
      {
        question: "What is the primary benefit of HTTP/2 over HTTP/1.1?",
        options: [
          "Replaces TCP with UDP",
          "Multiplexing multiple requests over a single TCP connection",
          "Disables SSL encryption overhead",
          "Removes JSON payloads",
        ],
        correctAnswer: 1,
        explanation: "HTTP/2 enables header compression and request multiplexing over a single connection.",
      },
    ],
  };

  await PeerChallenge.create([defaultDaily, defaultWeekly]);
};

// ── Get Active Challenges ────────────────────────────────────
const getActiveChallenges = async (req, res) => {
  try {
    let challenges = await PeerChallenge.find({
      expiryDate: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (challenges.length === 0) {
      await seedDefaultChallenges();
      challenges = await PeerChallenge.find({
        expiryDate: { $gt: new Date() },
      }).sort({ createdAt: -1 });
    }

    res.json({ success: true, challenges });
  } catch (err) {
    console.error("getActiveChallenges error:", err);
    res.status(500).json({ message: "Failed to fetch active challenges", error: err.message });
  }
};

// ── Submit Challenge Attempt ─────────────────────────────────
const submitChallengeAttempt = async (req, res) => {
  try {
    const { challengeId, answers = [], durationSeconds = 0 } = req.body;
    const userId = req.userId;

    const challenge = await PeerChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Score evaluation
    let correctCount = 0;
    challenge.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const totalQuestions = challenge.questions.length || 1;
    const scorePct = Math.round((correctCount / totalQuestions) * 100);

    // Rank Points Calculation
    let pointsEarned = 30;
    if (scorePct >= 90) pointsEarned = 100;
    else if (scorePct >= 70) pointsEarned = 70;
    else if (scorePct >= 50) pointsEarned = 50;

    // Award Badges
    const badges = [];
    if (scorePct === 100) badges.push("Perfect Score 🎯");
    if (durationSeconds > 0 && durationSeconds < 60) badges.push("Speed Demon ⚡");
    if (challenge.type === "Daily") badges.push("Daily Grinder 🔥");

    // Fetch User to update global stats
    const user = await User.findById(userId);
    let userName = user ? user.name : "Candidate Developer";

    const submission = await ChallengeSubmission.create({
      challengeId,
      userId,
      userName,
      score: scorePct,
      totalQuestions,
      durationSeconds,
      rankPointsEarned: pointsEarned,
      badgesUnlocked: badges,
    });

    res.json({
      success: true,
      submission,
      scorePct,
      correctCount,
      totalQuestions,
      pointsEarned,
      badges,
    });
  } catch (err) {
    console.error("submitChallengeAttempt error:", err);
    res.status(500).json({ message: "Failed to submit challenge attempt", error: err.message });
  }
};

// ── Get Global Leaderboard ───────────────────────────────────
const getGlobalLeaderboard = async (req, res) => {
  try {
    // Aggregate top candidate submissions
    const submissions = await ChallengeSubmission.find()
      .sort({ rankPointsEarned: -1, score: -1, createdAt: -1 })
      .limit(20);

    // Group by user for clean leaderboard display
    const userMap = {};
    submissions.forEach((sub) => {
      const uId = sub.userId.toString();
      if (!userMap[uId]) {
        userMap[uId] = {
          userId: uId,
          name: sub.userName || "Developer Candidate",
          totalPoints: 0,
          challengesCompleted: 0,
          badges: new Set(),
          highestScore: 0,
        };
      }
      userMap[uId].totalPoints += sub.rankPointsEarned;
      userMap[uId].challengesCompleted += 1;
      userMap[uId].highestScore = Math.max(userMap[uId].highestScore, sub.score);
      (sub.badgesUnlocked || []).forEach((b) => userMap[uId].badges.add(b));
    });

    const leaderboard = Object.values(userMap)
      .map((u) => ({
        ...u,
        badges: Array.from(u.badges),
        rankTier: calculateRankTier(u.totalPoints),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Fallback seed entries for vibrant leaderboard experience
    if (leaderboard.length < 3) {
      const mockPeers = [
        {
          userId: "mock1",
          name: "Aditya Kumar",
          totalPoints: 1650,
          challengesCompleted: 18,
          highestScore: 100,
          badges: ["Grandmaster 👑", "Perfect Score 🎯", "Speed Demon ⚡"],
          rankTier: "Grandmaster 👑",
        },
        {
          userId: "mock2",
          name: "Priya Sharma",
          totalPoints: 920,
          challengesCompleted: 11,
          highestScore: 95,
          badges: ["Master 🥇", "Daily Grinder 🔥"],
          rankTier: "Master 🥇",
        },
        {
          userId: "mock3",
          name: "Rohan Verma",
          totalPoints: 540,
          challengesCompleted: 7,
          highestScore: 88,
          badges: ["Contender 🥈"],
          rankTier: "Contender 🥈",
        },
      ];
      leaderboard.push(...mockPeers);
    }

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error("getGlobalLeaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch global leaderboard", error: err.message });
  }
};

module.exports = {
  getActiveChallenges,
  submitChallengeAttempt,
  getGlobalLeaderboard,
};
