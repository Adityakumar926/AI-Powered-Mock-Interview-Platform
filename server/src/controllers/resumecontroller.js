const Groq = require("groq-sdk");
const { PDFParse } = require("pdf-parse");
const Tesseract = require("tesseract.js");

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const DOMAINS = [
  "JavaScript/Node.js",
  "React",
  "Python",
  "Data Science",
  "DevOps",
  "System Design",
  "Database Design",
  "General",
];

async function extractTextFromDocument(buffer, mimetype) {
  // 1. If PDF file, use PDFParse
  if (mimetype === "application/pdf") {
    try {
      const uint8Array = new Uint8Array(buffer);
      const parser = new PDFParse(uint8Array);
      await parser.load();
      const result = await parser.getText();
      const extracted = typeof result === "string" ? result : result?.text;
      if (extracted && extracted.trim().length > 10) {
        return extracted;
      }
    } catch (err) {
      console.warn("PDFParse warning:", err.message);
    }
  }

  // 2. If image file (PNG/JPEG/WebP/BMP), run Tesseract OCR safely
  if (mimetype && mimetype.startsWith("image/")) {
    try {
      console.log("🔍 Scanning image resume with Tesseract OCR...");
      const ocrResult = await Tesseract.recognize(buffer, "eng");
      if (ocrResult?.data?.text && ocrResult.data.text.trim().length > 10) {
        return ocrResult.data.text;
      }
    } catch (ocrErr) {
      console.warn("Tesseract OCR warning:", ocrErr.message);
    }
  }

  // 3. Fallback: extract clean human-readable words from buffer
  const str = buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ");
  const words = str.match(/\b[A-Za-z][A-Za-z0-9+#.-]{1,}\b/g) || [];
  const pdfKeywords = new Set([
    "obj",
    "endobj",
    "stream",
    "endstream",
    "xref",
    "trailer",
    "startxref",
    "PDF",
  ]);
  const cleanWords = words.filter(
    (w) => !pdfKeywords.has(w) && !w.startsWith("PDF-") && w.length > 1,
  );

  return cleanWords.length > 5 ? cleanWords.join(" ") : "";
} 
const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        let resumeText = await extractTextFromDocument(
          req.file.buffer,
          req.file.mimetype,
        );
        if (!resumeText || resumeText.trim().length < 10) {
          resumeText = `Software Engineer Candidate Resume (${req.file.originalname}). Software engineering candidate with background in computer science, software development, data structures, and web technologies.`;
        }
        const truncated=resumeText.slice(0, 6000);
         const prompt = `
You are an expert technical recruiter and career coach.
Analyze the following resume and respond ONLY with a valid JSON object. No text outside JSON.

Available interview domains: ${DOMAINS.join(", ")}

Resume text:
"""
${truncated}
"""

Respond with this exact JSON structure:
{
  "summary": "2-3 sentence professional summary of the candidate",
  "experienceLevel": "Junior" | "Mid" | "Senior",
  "skillsDetected": ["skill1", "skill2", "skill3", ...],
  "strengths": ["strength1", "strength2", "strength3"],
  "recommendedDomains": [
    {
      "label": "exact domain name from the available list",
      "reason": "one sentence why this domain fits them",
      "confidence": 85
    }
  ]
}

Rules:
- experienceLevel must be exactly "Junior", "Mid", or "Senior"
- skillsDetected: list up to 12 actual skills found in the resume
- strengths: list 3 specific professional strengths
- recommendedDomains: recommend 3 domains ordered by best fit, confidence is 0-100
- domain label must exactly match one from the available domains list
- confidence scores should be realistic and different for each domain
`.trim();
        const modelsToTry = [
          process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
          "groq/compound-mini",
          "openai/gpt-oss-20b",
        ];
        let response;
        for (const modelName of modelsToTry) {
          try {
            response = await getGroq().chat.completions.create({
              model: modelName,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: 500,
            });
            if (response && response.choices && response.choices.length > 0) {
              break;
            }
          } catch (modelErr) {
            console.warn(`Model ${modelName} failed, trying next fallback:`, modelErr.message);
          }
        }
        if (!response) {
          return res.status(500).json({ error: "AI service currently busy. Please try again in a moment." });
        }
        const raw = response.choices[0].message.content || "{}";
        let analysis;
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          return res.status(500).json({ error: "Failed to parse analysis result" });
        }
        const validDomains = DOMAINS;
        if (analysis && analysis.recommendedDomains) {
          analysis.recommendedDomains = analysis.recommendedDomains.filter((d) =>
            validDomains.includes(d.label)
          );
        }
        res.json({ analysis });
    } catch (error) {
        console.error("Error analyzing resume:", error);
        res.status(500).json({ error: error?.message || "Internal server error" });
    }
}
module.exports = {
    analyzeResume,
}
