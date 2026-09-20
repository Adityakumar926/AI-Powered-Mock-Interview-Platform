"use client";
import ChatContainer from "@/components/ChatContainer";
import { InputBox } from "@/components/InputBox";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}
interface InterviewSession {
  id: string;
  score?: number;
  feedback?: string;
  isComplete?: boolean;
}

const TOTAL_QUESTIONS = 3;

const domainEmoji: Record<string, string> = {
  JavaScript: "🟨",
  "JavaScript/Node.js": "🟨",
  React: "⚛️",
  Python: "🐍",
  "Data Science": "📊",
  DevOps: "⚙️",
  "System Design": "🏗️",
  "Database Design": "🗄️",
  General: "🎯",
};
interface TopicMastery {
  topic: string;
  mastery: string;
}

interface ProgressionReport {
  difficultyTrajectory?: string[];
  scoreTrajectory?: number[];
  summary?: string;
  topicMastery?: TopicMastery[];
}

interface CompanyBenchmark {
  hiringBarResult?: string;
  benchmarkSummary?: string;
}

const difficultyBadges: Record<string, { label: string; style: string }> = {
  Easy: { label: "Easy 🟢", style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  Medium: { label: "Medium 🔵", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  Hard: { label: "Hard 🟠", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  Advanced: { label: "Advanced 🔴", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
};

const InterviewContent = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "General";
  const companyId = searchParams.get("companyId");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [interviewScore, setInterviewScore] = useState<number | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<string>("Easy");
  const [progressionReport, setProgressionReport] = useState<ProgressionReport | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyBenchmark, setCompanyBenchmark] = useState<CompanyBenchmark | null>(null);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) startInterview();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isInterviewComplete) return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isInterviewComplete]);

  const startInterview = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.post("/api/interviews/start", {
        domain,
        companyId,
      });
      if (data) {
        setSessionId(data.sessionId);
        setQuestionsAnswered(0);
        if (data.difficulty) setCurrentDifficulty(data.difficulty);
        if (data.companyName) setCompanyName(data.companyName);
        setProgressionReport(null);
        setCompanyBenchmark(null);
        setMessages([
          {
            id: "1",
            content: data.question || "Tell me about yourself",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setMessages([
        {
          id: "1",
          content: "Connection error. Please check your network",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || !sessionId) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: userMessage,
        isUser: true,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post(
        "/api/interviews/submit-answer",
        { sessionId, answer: userMessage, domain, questionsAnswered },
      );
      if (data) {
        if (data.currentDifficulty) setCurrentDifficulty(data.currentDifficulty);
        if (data.progressionReport) setProgressionReport(data.progressionReport);
        if (data.companyBenchmark) setCompanyBenchmark(data.companyBenchmark);
        if (data.companyName) setCompanyName(data.companyName);

        const newCount = questionsAnswered + 1;
        setQuestionsAnswered(newCount);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content:
              data.feedback ||
              "Good answer! Your response demonstrates solid understanding",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        if (data.isComplete || newCount >= TOTAL_QUESTIONS) {
          setInterviewScore(data.score || 75);
          setIsInterviewComplete(true);
        } else if (data.nextQuestion) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: (Date.now() + 2).toString(),
                content: data.nextQuestion,
                isUser: false,
                timestamp: new Date(),
              },
            ]);
          }, 500);
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Connection error. Please try again",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleEndInterview = () => router.push("/dashboard");
  if (authLoading) return null;
  if (!isLoggedIn) return null;

  const score = interviewScore ?? 0;
  const scoreLabel =
    score >= 80
      ? {
          text: "Excellent! You're interview-ready 🚀",
          color: "text-green-600 dark:text-green-400",
        }
      : score >= 60
        ? {
            text: "Good effort! A few more sessions will get you there 💪",
            color: "text-blue-600 dark:text-blue-400",
          }
        : {
            text: "Keep practicing! Every session makes you stronger 🌟",
            color: "text-orange-600 dark:text-orange-400",
          };

  const diffBadge = difficultyBadges[currentDifficulty] || difficultyBadges["Easy"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Domain info & Dynamic Difficulty Badge */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">
                {domainEmoji[domain] || "🎯"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-bold text-foreground truncate">
                    {domain} Interview
                  </h1>
                  {!isInterviewComplete && (
                    <>
                      <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold flex-shrink-0 ${diffBadge.style}`}>
                        {diffBadge.label}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Adaptive AI Mock Interview Engine
                </p>
              </div>
            </div>

            {/* Center: Progress */}
            {!isInterviewComplete && (
              <div className="hidden sm:flex flex-col items-center gap-1.5">
                <ProgressDots
                  current={questionsAnswered}
                  total={TOTAL_QUESTIONS}
                />
                <p className="text-xs text-muted-foreground">
                  Question {Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of{" "}
                  {TOTAL_QUESTIONS}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isInterviewComplete && (
                <div className="hidden sm:flex items-center gap-1.5 bg-muted/50 border border-border/60 px-3 py-1.5 rounded-full">
                  <span className="text-xs text-muted-foreground">⏱</span>
                  <span className="text-sm font-mono font-semibold text-foreground tabular-nums">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  isInterviewComplete
                    ? handleEndInterview()
                    : setShowExitConfirm(true)
                }
                className="rounded-full text-xs border-border/60 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                {isInterviewComplete ? "Go to Dashboard" : "Exit"}
              </Button>
            </div>
          </div>
          {!isInterviewComplete && (
            <div className="sm:hidden mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>
                  Q{Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of{" "}
                  {TOTAL_QUESTIONS}
                </span>
                <span className="font-mono">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                  style={{
                    width: `${(questionsAnswered / TOTAL_QUESTIONS) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col">
        {isInterviewComplete ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-xl space-y-5">
              {/* Score card */}
              <Card className="p-8 border border-border/60 text-center">
                <div className="text-3xl mb-3">🎉</div>
                <h2 className="text-2xl font-black text-foreground mb-1">
                  Interview Complete!
                </h2>
                <p className="text-sm text-muted-foreground mb-8">
                  Adaptive Engine Performance Report
                </p>

                <ScoreRing score={score} />

                <p className={`text-sm font-semibold mt-6 ${scoreLabel.color}`}>
                  {scoreLabel.text}
                </p>
              </Card>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Questions", value: questionsAnswered, icon: "❓" },
                  {
                    label: "Domain",
                    value: domain.split("/")[0],
                    icon: domainEmoji[domain] || "🎯",
                  },
                  {
                    label: "Duration",
                    value: formatTime(elapsedSeconds),
                    icon: "⏱",
                  },
                ].map((stat, i) => (
                  <Card
                    key={i}
                    className="p-4 text-center border border-border/50"
                  >
                    <div className="text-lg mb-1">{stat.icon}</div>
                    <p className="text-base font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Adaptive Progression Trajectory Card */}
              {progressionReport && (
                <Card className="p-6 border border-border/50 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                      📈 Adaptive Difficulty Trajectory
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      How question difficulty adapted based on your answers:
                    </p>
                    {progressionReport.difficultyTrajectory && (
                      <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                        {progressionReport.difficultyTrajectory.map((diff, idx) => {
                          const badge = difficultyBadges[diff] || difficultyBadges["Easy"];
                          return (
                            <React.Fragment key={idx}>
                              <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${badge.style}`}>
                                Q{idx + 1}: {badge.label}
                              </span>
                              {idx < progressionReport.difficultyTrajectory!.length - 1 && (
                                <span className="text-muted-foreground font-bold text-xs">➔</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {progressionReport.summary && (
                    <div className="bg-muted/40 p-3.5 rounded-lg border border-border/40 text-xs text-foreground leading-relaxed">
                      <span className="font-semibold text-primary">AI Evaluation: </span>
                      {progressionReport.summary}
                    </div>
                  )}

                  {progressionReport.topicMastery && progressionReport.topicMastery.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Topic Mastery Assessment:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {progressionReport.topicMastery.map((tm, idx) => (
                          <div key={idx} className="bg-background border border-border/60 p-2.5 rounded-md flex justify-between items-center text-xs">
                            <span className="font-medium text-foreground truncate">{tm.topic}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tm.mastery.toLowerCase().includes("proficient") 
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}>
                              {tm.mastery}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Company Hiring Bar Benchmark Card */}
              {companyBenchmark && (
                <Card className="p-6 border border-border/60 space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      🏢 {companyName || "Company"} Hiring Bar Benchmark
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        companyBenchmark.hiringBarResult?.includes("Hire") &&
                        !companyBenchmark.hiringBarResult?.includes("No")
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {companyBenchmark.hiringBarResult}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {companyBenchmark.benchmarkSummary}
                  </p>
                </Card>
              )}


              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInterviewComplete(false);
                    setInterviewScore(null);
                    setQuestionsAnswered(0);
                    setMessages([]);
                    setElapsedSeconds(0);
                    startInterview();
                  }}
                  className="rounded-full border-border/60"
                >
                  🔄 Try Again
                </Button>
                <Button
                  onClick={handleEndInterview}
                  className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
                >
                  Dashboard →
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ChatContainer messages={messages} isLoading={isLoading} />
            <div className="border-t border-border/50 bg-background">
              {/* Tip bar */}
              <div className="max-w-4xl mx-auto px-4 pt-2">
                <p className="text-xs text-muted-foreground text-center">
                  💡 Tip: Be specific with code/architecture examples. Use "Skip" if unsure to shift to foundational questions.
                </p>
              </div>
              <InputBox
                onSend={handleSendMessage}
                onSkip={() => handleSendMessage("skip")}
                disabled={isLoading}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : "#f97316";

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-border"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
          Score
        </span>
      </div>
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-500 ${
            i < current
              ? "bg-gradient-to-r from-primary to-accent w-6"
              : i === current
                ? "bg-primary/40 w-4 animate-pulse"
                : "bg-border w-2"
          }`}
        />
      ))}
    </div>
  );
}
export default InterviewContent;
