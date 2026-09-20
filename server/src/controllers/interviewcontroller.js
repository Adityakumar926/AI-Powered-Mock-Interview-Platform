const Groq = require("groq-sdk");
const Interview = require("../models/Interview.js");
const { COMPANY_PROFILES } = require("../config/companyProfiles.js");

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard", "Advanced"];

const scaleDifficulty = (currentDifficulty, score, isSkipped) => {
  const currentIndex = DIFFICULTY_LEVELS.indexOf(currentDifficulty);
  if (isSkipped || score < 50) {
    return DIFFICULTY_LEVELS[Math.max(0, currentIndex - 1)];
  }
  if (score >= 80) {
    return DIFFICULTY_LEVELS[Math.min(DIFFICULTY_LEVELS.length - 1, currentIndex + 1)];
  }
  return currentDifficulty;
};

const systemPrompt = (domain, difficulty = "Medium", askedQuestions = [], companyId = null) => {
  const company = companyId ? COMPANY_PROFILES[companyId] : null;
  let prompt = "";
  if (company) {
    prompt = `${company.promptStyle}
Target Company Interview: ${company.name} (${domain} Role).
Current Difficulty Level: ${difficulty}.
Key Evaluation Focus Areas: ${company.focusAreas.join(", ")}.`;
  } else {
    prompt = `You are a senior technical interviewer conducting an adaptive mock interview for a ${domain} developer role.
Current Difficulty Level: ${difficulty}.`;
  }

  prompt += `

STRICT CONSTRAINTS:
- Output ONLY EXACTLY ONE single technical interview question matching the ${difficulty} level for ${domain}.
- Do NOT answer the question.
- Do NOT provide markdown tables, guides, explanations, or code samples.
- Keep the question concise (1-2 sentences).
`;
  if (askedQuestions.length > 0) {
    prompt += `\nDo NOT ask any of these previously asked questions:\n` +
      askedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  }
  return prompt.trim();
};

// ── Start Interview ───────────────────────────────────────
const startInterview = async (req, res) => {
  try {
    const { domain = "General", companyId } = req.body;
    const company = companyId ? COMPANY_PROFILES[companyId] : null;
    const initialDifficulty = company?.difficulty || "Medium";

    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      messages: [
        { role: "system", content: systemPrompt(domain, initialDifficulty, [], companyId) },
        {
          role: "user",
          content: `Ask me the first ${initialDifficulty} level technical interview question for a ${company ? company.name : domain} position. Output ONLY the question in 1-2 sentences.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const firstQuestion =
      completion.choices[0].message.content.trim() ||
      `Can you explain the core concepts and architecture of ${domain}?`;

    const interview = await Interview.create({
      userId: req.userId,
      domain,
      companyId: company?.id || "",
      companyName: company?.name || "",
      currentDifficulty: initialDifficulty,
      questionHistory: [
        {
          question: firstQuestion,
          difficulty: initialDifficulty,
        },
      ],
      messages: [{ role: "ai", content: firstQuestion }],
    });

    res.status(201).json({
      sessionId: interview._id,
      question: firstQuestion,
      difficulty: initialDifficulty,
      companyId: company?.id || null,
      companyName: company?.name || null,
      companyLogo: company?.logo || null,
    });
  } catch (err) {
    console.error("startInterview error:", err);
    res
      .status(500)
      .json({ message: "Failed to start interview", error: err.message });
  }
};


// ── Submit Answer ─────────────────────────────────────────
const submitAnswer = async (req, res) => {
  try {
    const {
      sessionId,
      answer,
      domain = "General",
      questionsAnswered = 0,
    } = req.body;

    if (!sessionId)
      return res.status(400).json({ message: "Missing sessionId" });

    const interview = await Interview.findOne({
      _id: sessionId,
      userId: req.userId,
    });
    if (!interview)
      return res.status(404).json({ message: "Session not found" });

    const userText = (answer || "").trim();
    const isSkipped =
      !userText ||
      ["skip", "skipped", "pass", "skip question", "i don't know"].includes(
        userText.toLowerCase(),
      );

    // 1️⃣ Check for repeated user answers across session
    let isRepeated = false;
    if (!isSkipped && interview.questionHistory.length > 0) {
      isRepeated = interview.questionHistory.some(
        (q) =>
          q.answer &&
          q.answer.trim().toLowerCase() === userText.toLowerCase(),
      );
    }

    // 2️⃣ Evaluate score & generate feedback
    let score = 0;
    let feedback = "";

    if (isSkipped) {
      score = 0;
      feedback =
        "Question skipped. Shifting to foundational concepts to help build understanding.";
    } else {
      const evalPrompt = `You are an expert ${domain} interview evaluator.
Evaluate this candidate answer for a ${interview.currentDifficulty} level question.

Candidate Answer: "${userText}"
${isRepeated ? "NOTE: This candidate repeated a previous answer verbatim." : ""}

Respond ONLY with a JSON object in this format:
{
  "score": 85,
  "feedback": "2-3 sentence constructive feedback highlighting strengths and key improvements."
}`;

      try {
        const evalRes = await getGroq().chat.completions.create({
          model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
          messages: [{ role: "user", content: evalPrompt }],
          temperature: 0.5,
          max_tokens: 200,
        });

        const raw = evalRes.choices[0].message.content || "{}";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        score = Math.max(0, Math.min(100, parseInt(parsed.score) || 70));
        feedback =
          parsed.feedback ||
          "Good response! Your answer demonstrates foundational understanding.";
      } catch (evalErr) {
        score = isRepeated ? 40 : 75;
        feedback = isRepeated
          ? "Repeated response detected. Please provide an original answer."
          : "Response received and evaluated.";
      }
    }

    // 3️⃣ Update current question history entry
    const currentHistoryIndex = interview.questionHistory.length - 1;
    if (currentHistoryIndex >= 0) {
      interview.questionHistory[currentHistoryIndex].answer = userText;
      interview.questionHistory[currentHistoryIndex].feedback = feedback;
      interview.questionHistory[currentHistoryIndex].score = score;
      interview.questionHistory[currentHistoryIndex].isSkipped = isSkipped;
      interview.questionHistory[currentHistoryIndex].isRepeated = isRepeated;
    }

    // 4️⃣ Calculate Next Difficulty Level (Adaptive Scaling)
    const nextDifficulty = scaleDifficulty(
      interview.currentDifficulty,
      score,
      isSkipped,
    );
    const difficultyChanged = nextDifficulty !== interview.currentDifficulty;
    interview.currentDifficulty = nextDifficulty;

    const newCount = questionsAnswered + 1;
    interview.questionsAnswered = newCount;
    const isComplete = newCount >= 3;

    // Save user & AI messages to chat log
    interview.messages.push({
      role: "user",
      content: isSkipped ? "[Skipped Question]" : userText,
      timestamp: new Date(),
    });
    interview.messages.push({
      role: "ai",
      content: feedback,
      timestamp: new Date(),
    });

    // ── Completion Path: Generate Progression Report ──────
    if (isComplete) {
      const allScores = interview.questionHistory.map((q) => q.score || 0);
      const allDifficulties = interview.questionHistory.map(
        (q) => q.difficulty || "Medium",
      );
      const avgScore = Math.round(
        allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1),
      );

      interview.score = avgScore;
      interview.isComplete = true;
      interview.feedback = feedback;
      interview.duration = Math.max(
        1,
        Math.round((Date.now() - interview.createdAt.getTime()) / 60000),
      );

      // Generate Progression Report
      const reportPrompt = `Analyze this candidate's adaptive interview performance in ${domain}:
Question Difficulties: ${JSON.stringify(allDifficulties)}
Question Scores: ${JSON.stringify(allScores)}

Respond ONLY with a valid JSON object in this format:
{
  "summary": "3-4 sentence comprehensive progress summary analyzing how candidate difficulty scaled from start to finish.",
  "topicMastery": [
    { "topic": "Core Fundamentals", "mastery": "Proficient" },
    { "topic": "Advanced Optimization", "mastery": "Needs Improvement" }
  ]
}`;

      try {
        const reportRes = await getGroq().chat.completions.create({
          model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
          messages: [{ role: "user", content: reportPrompt }],
          temperature: 0.6,
          max_tokens: 300,
        });
        const rawReport = reportRes.choices[0].message.content || "{}";
        const match = rawReport.match(/\{[\s\S]*\}/);
        const parsedReport = match ? JSON.parse(match[0]) : {};

        interview.progressionReport = {
          difficultyTrajectory: allDifficulties,
          scoreTrajectory: allScores,
          summary:
            parsedReport.summary ||
            `Candidate started at ${allDifficulties[0]} difficulty and completed 3 adaptive questions with an average score of ${avgScore}%.`,
          topicMastery: parsedReport.topicMastery || [
            { topic: domain + " Concepts", mastery: avgScore >= 75 ? "Proficient" : "Developing" },
          ],
        };
      } catch (repErr) {
        interview.progressionReport = {
          difficultyTrajectory: allDifficulties,
          scoreTrajectory: allScores,
          summary: `Adaptive interview completed across ${allDifficulties.join(" → ")} levels with final average score of ${avgScore}%.`,
          topicMastery: [
            { topic: domain + " Fundamentals", mastery: avgScore >= 75 ? "Proficient" : "Needs Practice" },
          ],
        };
      }

      // Generate Company Hiring Bar Benchmark if applicable
      if (interview.companyId && COMPANY_PROFILES[interview.companyId]) {
        const company = COMPANY_PROFILES[interview.companyId];
        let result = "Hire";
        if (avgScore >= 85) result = "Strong Hire";
        else if (avgScore >= 70) result = "Hire";
        else if (avgScore >= 55) result = "Leaning No Hire";
        else result = "No Hire";

        interview.companyBenchmark = {
          hiringBarResult: result,
          benchmarkSummary: `Benchmarked against ${company.name} corporate hiring standards (${company.category}). Candidate achieved ${avgScore}% average score matching '${result}' threshold.`,
        };
      }

      await interview.save();

      return res.json({
        feedback,
        score: avgScore,
        isComplete: true,
        currentDifficulty: nextDifficulty,
        progressionReport: interview.progressionReport,
        companyBenchmark: interview.companyBenchmark,
        companyName: interview.companyName,
      });
    }

    // ── Continue Path: Generate Next Question with Adaptive Context ──────
    const askedQuestions = interview.questionHistory.map((q) => q.question);

    let adaptivePrompt = "";
    if (isSkipped || score < 50) {
      adaptivePrompt = `The candidate struggled or skipped the previous question. Ask an EASIER, foundational concept question for ${domain} at ${nextDifficulty} level.`;
    } else if (score >= 80) {
      adaptivePrompt = `The candidate answered strongly (${score}%). Ask a DEEPER, follow-up or advanced practical question for ${domain} at ${nextDifficulty} level.`;
    } else {
      adaptivePrompt = `Ask a standard technical question for ${domain} at ${nextDifficulty} level.`;
    }

    const nextQRes = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: systemPrompt(domain, nextDifficulty, askedQuestions, interview.companyId),
        },
        {
          role: "user",
          content: adaptivePrompt + " Output ONLY the question (1-2 sentences).",
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });


    const nextQuestion = nextQRes.choices[0].message.content.trim();

    // Push next question into history
    interview.questionHistory.push({
      question: nextQuestion,
      difficulty: nextDifficulty,
    });

    await interview.save();

    return res.json({
      feedback,
      nextQuestion,
      isComplete: false,
      currentDifficulty: nextDifficulty,
      difficultyChanged,
      score,
    });
  } catch (err) {
    console.error("submitAnswer error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
// ── Get All Completed Interviews ──────────────────────────
const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      userId: req.userId,
      isComplete: true,
    })
      .select("domain score duration questionsAnswered createdAt")
      .sort({ createdAt: -1 });

    const mapped = interviews.map((i) => ({
      id: i._id,
      topic: i.domain,
      score: i.score,
      duration: i.duration,
      date: i.createdAt,
    }));

    res.json({ interviews: mapped });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch interviews", error: err.message });
  }
};

// ── Get Single Interview ──────────────────────────────────
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!interview)
      return res.status(404).json({ message: "Interview not found" });
    res.json({ interview });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getCompanyProfiles = (req, res) => {
  res.json({
    success: true,
    companies: Object.values(COMPANY_PROFILES),
  });
};

module.exports = {
  startInterview,
  submitAnswer,
  getInterviews,
  getInterview,
  getCompanyProfiles,
};
