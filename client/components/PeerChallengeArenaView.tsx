"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Question {
  question: string;
  options: string[];
  explanation?: string;
}

interface PeerChallenge {
  _id: string;
  title: string;
  description: string;
  type: "Daily" | "Weekly";
  round: "Technical" | "HR" | "Aptitude" | "Domain";
  difficulty: string;
  timeLimit: number;
  questions: Question[];
  expiryDate: string;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  totalPoints: number;
  challengesCompleted: number;
  highestScore: number;
  badges: string[];
  rankTier: string;
}

export default function PeerChallengeArenaView() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const [challenges, setChallenges] = useState<PeerChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Challenge Modal state
  const [activeChallenge, setActiveChallenge] = useState<PeerChallenge | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchArenaData();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (activeChallenge && !submissionResult) {
      t = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [activeChallenge, submissionResult]);

  const fetchArenaData = async () => {
    try {
      setLoading(true);
      const [resCh, resLb] = await Promise.all([
        axiosInstance.get("/api/peer-challenges/active"),
        axiosInstance.get("/api/peer-challenges/leaderboard"),
      ]);

      if (resCh.data?.challenges) setChallenges(resCh.data.challenges);
      if (resLb.data?.leaderboard) setLeaderboard(resLb.data.leaderboard);
    } catch (err) {
      console.error("Error fetching Arena data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChallenge = (ch: PeerChallenge) => {
    setActiveChallenge(ch);
    setCurrentQIndex(0);
    setSelectedAnswers(new Array(ch.questions.length).fill(-1));
    setSubmissionResult(null);
    setTimerSeconds(0);
  };

  const handleSelectOption = (optIdx: number) => {
    const updated = [...selectedAnswers];
    updated[currentQIndex] = optIdx;
    setSelectedAnswers(updated);
  };

  const handleSubmitChallenge = async () => {
    if (!activeChallenge) return;
    try {
      setIsSubmitting(true);
      const { data } = await axiosInstance.post("/api/peer-challenges/submit", {
        challengeId: activeChallenge._id,
        answers: selectedAnswers,
        durationSeconds: timerSeconds,
      });

      if (data?.success) {
        setSubmissionResult(data);
        fetchArenaData(); // refresh leaderboard & stats
      }
    } catch (err) {
      console.error("Error submitting challenge:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeChallengeModal = () => {
    setActiveChallenge(null);
    setSubmissionResult(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">
            Entering Peer Challenge Arena...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title & Gamification Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏆</span>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Peer Challenge Arena
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Compete in AI-generated daily & weekly technical sprints, earn rank points, and climb the global leaderboard.
            </p>
          </div>

          {/* Candidate Gamification Stats */}
          <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/60">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
              <span>🔥 5-Day Streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full text-xs font-bold">
              <span>👑 Master Tier</span>
            </div>
          </div>
        </div>

        {/* Active Challenges Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              ⚡ Live Competitions & Sprints
            </h2>
            <span className="text-xs text-muted-foreground font-semibold">
              Updated Live
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((ch) => (
              <Card
                key={ch._id}
                className="p-6 border border-border/60 flex flex-col justify-between hover:border-primary/50 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ch.type === "Daily"
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                    }`}>
                      {ch.type} Challenge
                    </span>
                    <span className="text-xs font-mono font-semibold text-muted-foreground flex items-center gap-1">
                      <span>⏱</span> {ch.timeLimit} mins
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-1">
                    {ch.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {ch.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded border border-border/40 font-medium">
                      Round: {ch.round}
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded border border-border/40 font-medium">
                      Level: {ch.difficulty}
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded border border-border/40 font-medium">
                      Questions: {ch.questions?.length || 0}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleStartChallenge(ch)}
                  className="w-full rounded-full text-xs font-bold bg-primary text-primary-foreground hover:opacity-90"
                >
                  Enter Challenge Arena ⚔️
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Global Peer Leaderboard */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            🥇 Global Peer Leaderboard
          </h2>

          <Card className="border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Rank Tier</th>
                    <th className="py-3 px-4">Highest Score</th>
                    <th className="py-3 px-4">Badges</th>
                    <th className="py-3 px-4 text-right">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {leaderboard.map((peer, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-black text-sm">
                        {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {peer.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted border border-border/50">
                          {peer.rankTier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600">
                        {peer.highestScore}%
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {peer.badges.map((b, bIdx) => (
                            <span key={bIdx} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-foreground">
                        {peer.totalPoints} RP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Active Challenge Modal Overlay */}
        {activeChallenge && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-xl p-6 border border-border bg-background shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
              
              {!submissionResult ? (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {activeChallenge.type} Sprint • Question {currentQIndex + 1} of {activeChallenge.questions.length}
                      </span>
                      <h3 className="text-base font-bold text-foreground">
                        {activeChallenge.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                        ⏱ {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
                      </span>
                      <button onClick={closeChallengeModal} className="text-muted-foreground hover:text-foreground font-bold text-sm">
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      {activeChallenge.questions[currentQIndex]?.question}
                    </p>

                    {/* Options list */}
                    <div className="space-y-2">
                      {activeChallenge.questions[currentQIndex]?.options.map((opt, oIdx) => {
                        const selected = selectedAnswers[currentQIndex] === oIdx;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectOption(oIdx)}
                            className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                              selected
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                : "border-border/60 hover:bg-muted/40 text-foreground"
                            }`}
                          >
                            <span className="mr-2 opacity-60">[{String.fromCharCode(65 + oIdx)}]</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation / Submit buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentQIndex === 0}
                      onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                      className="rounded-full text-xs"
                    >
                      ← Previous
                    </Button>

                    {currentQIndex < activeChallenge.questions.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={() => setCurrentQIndex((i) => i + 1)}
                        className="rounded-full text-xs bg-primary text-primary-foreground"
                      >
                        Next Question →
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isSubmitting}
                        onClick={handleSubmitChallenge}
                        className="rounded-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Challenge 🚀"}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                /* Submission Result Screen */
                <div className="text-center space-y-5 py-4">
                  <div className="text-4xl">🎉</div>
                  <h3 className="text-xl font-black text-foreground">
                    Challenge Completed!
                  </h3>

                  <div className="p-4 bg-muted/40 border border-border/50 rounded-xl space-y-2 max-w-sm mx-auto">
                    <p className="text-3xl font-black text-primary">
                      {submissionResult.scorePct}% Score
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {submissionResult.correctCount} of {submissionResult.totalQuestions} questions answered correctly
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
                      +{submissionResult.pointsEarned} Rank Points Earned!
                    </span>
                  </div>

                  {submissionResult.badges && submissionResult.badges.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-foreground">Badges Unlocked:</p>
                      <div className="flex justify-center flex-wrap gap-2">
                        {submissionResult.badges.map((b: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-full text-xs font-bold">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={closeChallengeModal}
                    className="rounded-full px-8 bg-gradient-to-r from-primary to-accent text-white font-bold text-xs"
                  >
                    Back to Arena Leaderboard →
                  </Button>
                </div>
              )}

            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
