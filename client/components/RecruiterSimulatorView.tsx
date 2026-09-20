"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompanyProfile {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  difficulty: "Medium" | "Hard" | "Advanced" | string;
  category: string;
  focusAreas: string[];
  hiringBarDescription: string;
}

const difficultyBadges: Record<string, { label: string; style: string }> = {
  Medium: { label: "Medium 🔵", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  Hard: { label: "Hard 🟠", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  Advanced: { label: "Advanced 🔴", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
};

export default function RecruiterSimulatorView() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) fetchCompanyProfiles();
  }, [isLoggedIn]);

  const fetchCompanyProfiles = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/api/interviews/companies");
      if (data?.companies) {
        setCompanies(data.companies);
      }
    } catch (err) {
      console.error("Error fetching company profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", "FAANG / Big Tech", "IT Services / Mass Recruiter", "High-Growth Startup"];

  const filteredCompanies = selectedCategory === "All"
    ? companies
    : companies.filter((c) => c.category.toLowerCase().includes(selectedCategory.toLowerCase().split("/")[0].trim()));

  const handleStartCompanyInterview = (companyId: string) => {
    router.push(`/interview?companyId=${companyId}&domain=System Design`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading Target Corporate Recruiter Profiles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏢</span>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                AI Recruiter Simulator
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Select target companies to practice company-specific mock interview rounds benchmarked against real hiring standards.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/60 self-start md:self-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Company Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => {
            const diffBadge = difficultyBadges[company.difficulty] || difficultyBadges["Medium"];
            return (
              <Card
                key={company.id}
                className="p-6 border border-border/60 flex flex-col justify-between hover:border-primary/50 transition-all duration-300 hover:shadow-lg space-y-4"
              >
                <div>
                  {/* Card Header: Logo, Name & Difficulty */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border/50 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                        {company.logo}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground leading-tight">
                          {company.name}
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {company.category}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold flex-shrink-0 ${diffBadge.style}`}>
                      {diffBadge.label}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-primary mb-3">
                    {company.tagline}
                  </p>

                  {/* Focus Areas */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Evaluation Focus Areas:
                    </p>
                    <ul className="space-y-1">
                      {company.focusAreas.map((area, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-xs text-foreground">
                          <span className="text-primary text-[10px]">🔹</span>
                          <span className="truncate">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hiring Bar Box */}
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Hiring Bar: </span>
                    {company.hiringBarDescription}
                  </div>
                </div>

                {/* Start Interview CTA */}
                <Button
                  onClick={() => handleStartCompanyInterview(company.id)}
                  className="w-full rounded-full text-xs font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                >
                  Start {company.name} Interview →
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Company Benchmark Explanation Card */}
        <Card className="p-6 border border-border/60 bg-muted/20 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            🎯 Corporate Hiring Bar Benchmarking System
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every candidate answer during a Company Mock Round is scored directly against historical recruiter evaluation metrics for that target organization. Upon completion, candidates receive official hiring decision classifications (<strong>Strong Hire</strong>, <strong>Hire</strong>, <strong>Leaning No Hire</strong>, <strong>No Hire</strong>) along with tailored feedback to bridge performance gaps before actual technical rounds.
          </p>
        </Card>

      </div>
    </div>
  );
}
