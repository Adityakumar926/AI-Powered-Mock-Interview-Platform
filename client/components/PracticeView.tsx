"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const INTERVIEW_DOMAINS = [
  {
    label: "JavaScript/Node.js",
    icon: "🟨",
    desc: "ES6+, async/await, closures, event loop, Node runtime",
    popular: true,
  },
  {
    label: "React",
    icon: "⚛️",
    desc: "Hooks, custom hooks, state management, memoization, fiber",
    popular: true,
  },
  {
    label: "Python",
    icon: "🐍",
    desc: "OOP, generators, decorators, GIL, data structures",
    popular: false,
  },
  {
    label: "Data Science",
    icon: "📊",
    desc: "Machine Learning, pandas, numpy, statistics, feature engineering",
    popular: false,
  },
  {
    label: "DevOps",
    icon: "⚙️",
    desc: "CI/CD pipelines, Docker, Kubernetes, Terraform, cloud security",
    popular: false,
  },
  {
    label: "System Design",
    icon: "🏗️",
    desc: "Scalability, microservices, load balancing, caching, sharding",
    popular: true,
  },
  {
    label: "Database Design",
    icon: "🗄️",
    desc: "SQL, NoSQL, indexing strategies, transactions, ACID compliance",
    popular: false,
  },
  {
    label: "General",
    icon: "🎯",
    desc: "Behavioral questions, problem solving, STAR method fundamentals",
    popular: false,
  },
];

export default function PracticeView() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<string>("JavaScript/Node.js");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Medium");

  const handleStartPractice = () => {
    router.push(`/interview?domain=${encodeURIComponent(selectedDomain)}&difficulty=${selectedDifficulty}`);
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-border/60 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎯</span>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Mock Interview Practice Arena
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Select your target technical domain and starting difficulty to launch an adaptive AI mock interview session.
          </p>
        </div>

        {/* Domain Selection Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            1. Select Tech Domain
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INTERVIEW_DOMAINS.map((domain) => {
              const active = selectedDomain === domain.label;
              return (
                <Card
                  key={domain.label}
                  onClick={() => setSelectedDomain(domain.label)}
                  className={`p-5 border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
                    active
                      ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/30"
                      : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{domain.icon}</span>
                      {domain.popular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Popular
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      {domain.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {domain.desc}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selection & Start Action */}
        <Card className="p-6 border border-border/60 space-y-6 bg-muted/20">
          <div>
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              2. Choose Starting Difficulty
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Easy 🟢", value: "Easy", desc: "Foundational & core basics" },
                { label: "Medium 🔵", value: "Medium", desc: "Standard industry questions" },
                { label: "Hard 🟠", value: "Hard", desc: "Deep architectural trade-offs" },
                { label: "Advanced 🔴", value: "Advanced", desc: "Complex systems & edge cases" },
              ].map((diff) => {
                const active = selectedDifficulty === diff.value;
                return (
                  <button
                    key={diff.value}
                    onClick={() => setSelectedDifficulty(diff.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                        : "border-border/60 bg-background hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <p className="text-xs font-bold">{diff.label}</p>
                    <p className={`text-[10px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {diff.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border/60">
            <div>
              <p className="text-xs text-muted-foreground">
                Selected Configuration: <strong className="text-foreground">{selectedDomain}</strong> ({selectedDifficulty} Level)
              </p>
            </div>
            <Button
              onClick={handleStartPractice}
              className="w-full sm:w-auto rounded-full px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold text-xs"
            >
              Start Practice Session →
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
