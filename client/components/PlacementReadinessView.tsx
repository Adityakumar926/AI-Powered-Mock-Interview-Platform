"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecommendedProject {
  title: string;
  description: string;
  impact: string;
}

interface PersonalizedRoadmap {
  recommendedTechStack: string[];
  recommendedProjects: RecommendedProject[];
  recommendedCertifications: string[];
  priorityTopics: string[];
}

interface HistoricalSnapshot {
  date: string;
  score: number;
  tier: string;
  interviewDomain?: string;
}

interface PlacementProfile {
  overallReadinessScore: number;
  performanceTier: "Placement Ready" | "High Potential" | "Needs Improvement" | string;
  careerStage: "Fresher" | "Internship Seeker" | "Experienced" | string;
  breakdown: {
    resumeScore: number;
    interviewScore: number;
    skillScore: number;
  };
  personalizedRoadmap: PersonalizedRoadmap;
  historicalSnapshots: HistoricalSnapshot[];
}

const tierConfig: Record<string, { label: string; badge: string; border: string; glow: string }> = {
  "Placement Ready": {
    label: "Placement Ready 🚀",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    border: "border-emerald-500/40",
    glow: "from-emerald-500/20 to-emerald-500/5",
  },
  "High Potential": {
    label: "High Potential ⚡",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    border: "border-blue-500/40",
    glow: "from-blue-500/20 to-blue-500/5",
  },
  "Needs Improvement": {
    label: "Needs Improvement 💪",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    border: "border-amber-500/40",
    glow: "from-amber-500/20 to-amber-500/5",
  },
};

export default function PlacementReadinessView() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PlacementProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [totalInterviews, setTotalInterviews] = useState(0);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) fetchReadinessProfile();
  }, [isLoggedIn]);

  const fetchReadinessProfile = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/api/placement-readiness");
      if (data?.profile) {
        setProfile(data.profile);
        setTotalInterviews(data.totalInterviewsCompleted || 0);
      }
    } catch (err) {
      console.error("Error fetching readiness profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (stage: string) => {
    try {
      setCalculating(true);
      const { data } = await axiosInstance.post("/api/placement-readiness/calculate", {
        careerStage: stage,
      });
      if (data?.profile) {
        setProfile(data.profile);
        setTotalInterviews(data.totalInterviewsCompleted || 0);
      }
    } catch (err) {
      console.error("Error calculating placement readiness:", err);
    } finally {
      setCalculating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">
            Analyzing Placement Readiness Profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const currentTier = tierConfig[profile.performanceTier] || tierConfig["Needs Improvement"];
  const score = profile.overallReadinessScore || 0;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title & Stage Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📈</span>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                AI Placement Readiness Engine
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Aggregated assessment combining resume metrics, mock interview accuracy, and technical skills.
            </p>
          </div>

          {/* Career Stage Selector */}
          <div className="bg-muted/40 p-1.5 rounded-full border border-border/60 flex items-center gap-1 self-start md:self-auto">
            {["Fresher", "Internship Seeker", "Experienced"].map((stage) => {
              const active = profile.careerStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => handleStageChange(stage)}
                  disabled={calculating}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {stage}
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Score Gauge Card */}
          <Card className={`p-6 border ${currentTier.border} bg-gradient-to-br ${currentTier.glow} relative overflow-hidden flex flex-col items-center justify-center text-center`}>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Overall Placement Readiness
            </span>

            {/* Score Ring */}
            <div className="relative w-36 h-36 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-border/40"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : "#f59e0b"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - score / 100)}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black tracking-tight text-foreground">{score}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Readiness
                </span>
              </div>
            </div>

            {/* Performance Tier Badge */}
            <span className={`px-3.5 py-1 rounded-full border text-xs font-bold ${currentTier.badge}`}>
              {currentTier.label}
            </span>

            <p className="text-xs text-muted-foreground mt-3">
              Tailored target role: <strong className="text-foreground">{profile.careerStage}</strong>
            </p>
          </Card>

          {/* Multi-Source Data Aggregation Breakdown */}
          <Card className="lg:col-span-2 p-6 border border-border/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  📊 Multi-Source Performance Breakdown
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStageChange(profile.careerStage)}
                  disabled={calculating}
                  className="text-xs rounded-full border-border/60"
                >
                  {calculating ? "Re-calculating..." : "🔄 Refresh Profile"}
                </Button>
              </div>

              <div className="space-y-4">
                {/* Resume Score */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      📄 Resume Impact & Domain Alignment
                    </span>
                    <span className="text-foreground">{profile.breakdown?.resumeScore}%</span>
                  </div>
                  <div className="h-2 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-1000"
                      style={{ width: `${profile.breakdown?.resumeScore}%` }}
                    />
                  </div>
                </div>

                {/* Interview Score */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      🎙️ Mock Interview Accuracy ({totalInterviews} sessions)
                    </span>
                    <span className="text-foreground">{profile.breakdown?.interviewScore}%</span>
                  </div>
                  <div className="h-2 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${profile.breakdown?.interviewScore}%` }}
                    />
                  </div>
                </div>

                {/* Skill Score */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      🧠 Technical Skill Depth
                    </span>
                    <span className="text-foreground">{profile.breakdown?.skillScore}%</span>
                  </div>
                  <div className="h-2 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-1000"
                      style={{ width: `${profile.breakdown?.skillScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Prompt */}
            <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-xs text-muted-foreground flex items-center justify-between">
              <span>💡 Complete more mock interviews to continuously elevate your readiness score.</span>
              <Button
                size="sm"
                onClick={() => router.push("/practice")}
                className="rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 ml-3"
              >
                Start Practice →
              </Button>
            </div>
          </Card>
        </div>

        {/* Personalized AI Roadmap */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <h2 className="text-xl font-black text-foreground">
              AI-Generated Placement Roadmap ({profile.careerStage})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tech Stack & Focus Topics */}
            <Card className="p-6 border border-border/60 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  💻 Recommended Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.personalizedRoadmap?.recommendedTechStack?.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  🎯 Priority Topic Focus Areas
                </h3>
                <ul className="space-y-2">
                  {profile.personalizedRoadmap?.priorityTopics?.map((topic, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <span className="text-primary font-bold">•</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  🏆 Recommended Certifications
                </h3>
                <div className="space-y-1.5">
                  {profile.personalizedRoadmap?.recommendedCertifications?.map((cert, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-muted/40 border border-border/40 rounded-md text-xs font-medium text-foreground flex items-center gap-2"
                    >
                      <span>🏅</span>
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Actionable Portfolio Projects */}
            <Card className="p-6 border border-border/60 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                🚀 Recommended High-Impact Portfolio Projects
              </h3>

              <div className="space-y-4">
                {profile.personalizedRoadmap?.recommendedProjects?.map((proj, i) => (
                  <div
                    key={i}
                    className="p-4 bg-muted/30 border border-border/50 rounded-xl space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <h4 className="text-sm font-bold text-foreground">{proj.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {proj.description}
                    </p>
                    <div className="pt-1">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold">
                        Impact: {proj.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>

        {/* Historical Progress Tracking */}
        {profile.historicalSnapshots && profile.historicalSnapshots.length > 0 && (
          <Card className="p-6 border border-border/60 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              📈 Historical Performance & Progression Timeline
            </h3>
            <p className="text-xs text-muted-foreground">
              Track how your placement readiness score has evolved over completed practice interviews:
            </p>

            <div className="space-y-3 pt-2">
              {profile.historicalSnapshots.map((snap, idx) => {
                const tierInfo = tierConfig[snap.tier] || tierConfig["Needs Improvement"];
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 border border-border/40 rounded-lg gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">
                          {snap.interviewDomain ? `${snap.interviewDomain} Session` : "Assessment Snapshot"}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {new Date(snap.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${tierInfo.badge}`}>
                        {snap.tier}
                      </span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {snap.score}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
