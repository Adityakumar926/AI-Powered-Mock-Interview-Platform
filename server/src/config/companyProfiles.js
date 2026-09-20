const COMPANY_PROFILES = {
  google: {
    id: "google",
    name: "Google",
    logo: "🌐",
    tagline: "High Algorithmic Rigor & System Scalability",
    difficulty: "Advanced",
    category: "FAANG / Big Tech",
    focusAreas: [
      "Data Structures & Graph Algorithms",
      "System Scalability & Distributed Systems",
      "Optimal Time & Space Complexity",
    ],
    hiringBarDescription:
      "Evaluates deep computer science fundamentals, boundary condition handling, and optimal O(N) or O(log N) algorithm design.",
    promptStyle:
      "You are a Senior Principal Engineer at Google. Conduct a highly technical interview focusing on algorithm optimization, clean scalable code, and edge case resiliency.",
  },
  amazon: {
    id: "amazon",
    name: "Amazon",
    logo: "📦",
    tagline: "Leadership Principles & Customer Obsession Tech",
    difficulty: "Hard",
    category: "FAANG / Big Tech",
    focusAreas: [
      "Amazon Leadership Principles in Tech",
      "Object-Oriented Architecture & Clean Code",
      "Trade-offs under Scale & Constraints",
    ],
    hiringBarDescription:
      "Evaluates technical competency alongside Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep).",
    promptStyle:
      "You are a Bar Raiser Interviewer at Amazon. Evaluate answers using both technical criteria and Amazon Leadership Principles (Ownership, Customer Obsession, Dive Deep).",
  },
  microsoft: {
    id: "microsoft",
    name: "Microsoft",
    logo: "🪟",
    tagline: "Robust Code, Design Patterns & Pragmatic Engineering",
    difficulty: "Hard",
    category: "FAANG / Big Tech",
    focusAreas: [
      "Data Structures & Dynamic Programming",
      "Modular Architecture & Design Patterns",
      "Production Error Handling & Testing",
    ],
    hiringBarDescription:
      "Focuses on practical problem solving, clear modular code structure, and solid system architecture principles.",
    promptStyle:
      "You are a Principal Software Engineer at Microsoft. Focus on clean code, software design patterns, maintainability, and structured problem-solving.",
  },
  tcs: {
    id: "tcs",
    name: "TCS (Tata Consultancy Services)",
    logo: "🏢",
    tagline: "Core CS Fundamentals, DBMS & Logical Aptitude",
    difficulty: "Medium",
    category: "IT Services / Mass Recruiter",
    focusAreas: [
      "Core Programming Fundamentals (OOPs, C++/Java)",
      "Database Queries & SQL Joins",
      "Logical Aptitude & Pseudo-code Analysis",
    ],
    hiringBarDescription:
      "Assesses strong foundation in computer science basics, database query accuracy, and clear communication.",
    promptStyle:
      "You are a Technical Lead Recruiter at TCS. Ask fundamental, clear technical questions testing core OOPs, DBMS SQL queries, and baseline coding skills.",
  },
  infosys: {
    id: "infosys",
    name: "Infosys",
    logo: "💼",
    tagline: "Core Languages, Web Basics & Problem Solving",
    difficulty: "Medium",
    category: "IT Services / Mass Recruiter",
    focusAreas: [
      "Java / Python / JavaScript Concepts",
      "Relational Databases & Indexing Basics",
      "Problem Solving & Code Logic Walkthrough",
    ],
    hiringBarDescription:
      "Evaluates core programming concepts, logical problem solving, and baseline software engineering aptitude.",
    promptStyle:
      "You are a Senior Technical Recruiter at Infosys. Ask clear, foundational software development and problem-solving questions.",
  },
  startups: {
    id: "startups",
    name: "High-Growth Tech Startup",
    logo: "🚀",
    tagline: "Full-Stack Velocity, Modern Frameworks & Product Sense",
    difficulty: "Hard",
    category: "High-Growth Startup",
    focusAreas: [
      "Modern Web Frameworks (React, Next.js, Node.js)",
      "API Design & Asynchronous State Management",
      "Fast Execution & Pragmatic Architecture",
    ],
    hiringBarDescription:
      "Tests hands-on framework proficiency, rapid debugging ability, product sense, and production-ready code delivery.",
    promptStyle:
      "You are the VP of Engineering at a fast-growing Y-Combinator startup. Focus on practical full-stack capabilities, modern framework trade-offs, and rapid execution skills.",
  },
};

module.exports = { COMPANY_PROFILES };
