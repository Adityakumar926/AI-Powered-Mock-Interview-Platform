"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InterviewSession {
  _id: string;
  domain: string;
  companyName?: string;
  score: number;
  currentDifficulty: string;
  createdAt: string;
  isComplete: boolean;
  duration?: number;
  feedback?: string;
}

export default function HistoryView() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) fetchSessionsHistory();
  }, [isLoggedIn]);

  const fetchSessionsHistory = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/api/interviews");
      if (Array.isArray(data)) {
        setSessions(data);
      } else if (data?.interviews) {
        setSessions(data.interviews);
      }
    } catch (err) {
      console.error("Error fetching sessions history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading Interview History...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📊</span>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                My Session History
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Review all completed and ongoing mock interview sessions, scores, and evaluation feedback.
            </p>
          </div>

          <Button
            onClick={() => router.push("/practice")}
            className="rounded-full text-xs font-bold bg-primary text-primary-foreground self-start sm:self-auto"
          >
            New Practice Session +
          </Button>
        </div>

        {/* Sessions Table */}
        <Card className="border border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Domain / Target</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Difficulty Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {sessions && sessions.length > 0 ? (
                  sessions.map((s) => (
                    <tr key={s._id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {s.domain} {s.companyName ? `(${s.companyName})` : ""}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {s.currentDifficulty || "Medium"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.isComplete
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}>
                          {s.isComplete ? "Completed" : "In Progress"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-foreground">
                        {s.score || 0}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                      No interview sessions recorded yet. Start a practice session to see your results!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}
