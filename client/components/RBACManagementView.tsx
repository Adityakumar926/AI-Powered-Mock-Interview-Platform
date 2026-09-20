"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "Student" | "Mentor" | "Administrator";
  createdAt: string;
}

interface StudentSession {
  _id: string;
  domain: string;
  score: number;
  createdAt: string;
  userId?: { name?: string; email?: string };
  feedback?: string;
  companyName?: string;
}

interface SystemAnalytics {
  totalUsers: number;
  studentCount: number;
  mentorCount: number;
  adminCount: number;
  totalInterviewsCompleted: number;
  platformAvgScore: number;
}

const roleBadges: Record<string, { label: string; style: string }> = {
  Student: { label: "Student 🎓", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  Mentor: { label: "Mentor 👨‍🏫", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  Administrator: { label: "Administrator 🛡️", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
};

export default function RBACManagementView() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  
  const [activeRole, setActiveRole] = useState<"Student" | "Mentor" | "Administrator">("Student");
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [studentSessions, setStudentSessions] = useState<StudentSession[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Mentor Review Modal State
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null);
  const [mentorNotes, setMentorNotes] = useState("");
  const [adjustedScore, setAdjustedScore] = useState<number>(75);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (user?.role) {
      setActiveRole(user.role as any);
    }
  }, [user]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchRoleData(activeRole);
    }
  }, [isLoggedIn, activeRole]);


  const fetchRoleData = async (role: string) => {
    try {
      setLoading(true);
      if (role === "Administrator") {
        const [uRes, aRes] = await Promise.all([
          axiosInstance.get("/api/rbac/users"),
          axiosInstance.get("/api/rbac/analytics"),
        ]);
        if (uRes.data?.users) setUsersList(uRes.data.users);
        if (aRes.data?.analytics) setAnalytics(aRes.data.analytics);
      } else if (role === "Mentor") {
        const sRes = await axiosInstance.get("/api/rbac/mentor/sessions");
        if (sRes.data?.sessions) setStudentSessions(sRes.data.sessions);
      }
    } catch (err) {
      console.error("Error fetching RBAC role data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { data } = await axiosInstance.post("/api/rbac/users/role", {
        userId,
        role: newRole,
      });
      if (data?.success) {
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole as any } : u))
        );
      }
    } catch (err) {
      console.error("Error updating user role:", err);
    }
  };

  const handleSubmitMentorFeedback = async () => {
    if (!selectedSession) return;
    try {
      setSubmittingFeedback(true);
      const { data } = await axiosInstance.post("/api/rbac/mentor/feedback", {
        interviewId: selectedSession._id,
        mentorNotes,
        scoreAdjustment: adjustedScore,
      });
      if (data?.success) {
        setSelectedSession(null);
        fetchRoleData("Mentor");
      }
    } catch (err) {
      console.error("Error submitting mentor feedback:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title & Role View Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Role-Based Access Control (RBAC) Dashboard
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Dynamic role authorization allowing candidates, mentors, and administrators to access dedicated workspaces.
            </p>
          </div>

          {/* Role Switcher */}
          <div className="bg-muted/40 p-1.5 rounded-2xl border border-border/60 flex items-center gap-1 self-start md:self-auto">
            {(["Student", "Mentor", "Administrator"] as const).map((r) => {
              const active = activeRole === r;
              const badge = roleBadges[r];
              return (
                <button
                  key={r}
                  onClick={() => setActiveRole(r)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {badge.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ROLE VIEW 1: STUDENT VIEW */}
        {activeRole === "Student" && (
          <div className="space-y-6">
            <Card className="p-6 border border-border/60 space-y-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black">
                  🎓
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Candidate Workspace ({user?.name || "Student"})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Access practice interviews, target company simulations, and placement readiness tracking.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Card className="p-4 border border-border/50 text-center space-y-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push("/readiness")}>
                  <span className="text-2xl">📈</span>
                  <p className="text-sm font-bold text-foreground">Placement Readiness</p>
                  <p className="text-[11px] text-muted-foreground">View overall score & roadmap</p>
                </Card>

                <Card className="p-4 border border-border/50 text-center space-y-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push("/recruiter-simulator")}>
                  <span className="text-2xl">🏢</span>
                  <p className="text-sm font-bold text-foreground">Target Companies</p>
                  <p className="text-[11px] text-muted-foreground">Practice company hiring bars</p>
                </Card>

                <Card className="p-4 border border-border/50 text-center space-y-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push("/peer-arena")}>
                  <span className="text-2xl">🏆</span>
                  <p className="text-sm font-bold text-foreground">Peer Arena</p>
                  <p className="text-[11px] text-muted-foreground">Compete in daily tech sprints</p>
                </Card>
              </div>
            </Card>
          </div>
        )}

        {/* ROLE VIEW 2: MENTOR WORKSPACE */}
        {activeRole === "Mentor" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  👨‍🏫 Mentor Evaluation Panel
                </h2>
                <p className="text-xs text-muted-foreground">
                  Review student mock interview recordings, assess AI scores, and attach manual mentor feedback.
                </p>
              </div>
            </div>

            <Card className="border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Domain / Target Company</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">AI Score</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {studentSessions && studentSessions.length > 0 ? (
                      studentSessions.map((session, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {session.userId?.name || "Student Candidate"}
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              {session.userId?.email || "student@example.com"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-foreground">
                            {session.domain} {session.companyName ? `(${session.companyName})` : ""}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                            {session.score}%
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSession(session);
                                setAdjustedScore(session.score || 75);
                                setMentorNotes("");
                              }}
                              className="rounded-full text-xs font-semibold bg-primary text-primary-foreground"
                            >
                              Review & Grade 📝
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                          No student interview sessions pending mentor evaluation.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ROLE VIEW 3: ADMINISTRATOR CONTROL PANEL */}
        {activeRole === "Administrator" && (
          <div className="space-y-6">
            
            {/* System Analytics Cards */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Registered Users</span>
                  <p className="text-2xl font-black text-foreground">{analytics.totalUsers}</p>
                </Card>

                <Card className="p-4 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Students / Candidates</span>
                  <p className="text-2xl font-black text-blue-500">{analytics.studentCount}</p>
                </Card>

                <Card className="p-4 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Mentors</span>
                  <p className="text-2xl font-black text-purple-500">{analytics.mentorCount}</p>
                </Card>

                <Card className="p-4 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Interviews Completed</span>
                  <p className="text-2xl font-black text-emerald-500">{analytics.totalInterviewsCompleted}</p>
                </Card>
              </div>
            )}

            {/* User Role Management Table */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                🛡️ User Role Assignment & Access Control
              </h2>

              <Card className="border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">User Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4">Assigned Role</th>
                        <th className="py-3 px-4 text-right">Change Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {usersList && usersList.length > 0 ? (
                        usersList.map((u) => {
                          const badge = roleBadges[u.role] || roleBadges["Student"];
                          return (
                            <tr key={u._id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-foreground">{u.name}</td>
                              <td className="py-3.5 px-4 font-mono text-muted-foreground">{u.email}</td>
                              <td className="py-3.5 px-4 text-muted-foreground">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.style}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                  className="bg-background border border-border/60 rounded-md px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-primary"
                                >
                                  <option value="Student">Student 🎓</option>
                                  <option value="Mentor">Mentor 👨‍🏫</option>
                                  <option value="Administrator">Administrator 🛡️</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-xs text-muted-foreground">
                            No users registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* Mentor Evaluation Modal */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 border border-border bg-background shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-base font-bold text-foreground">
                  👨‍🏫 Mentor Evaluation & Grading
                </h3>
                <button onClick={() => setSelectedSession(null)} className="text-muted-foreground hover:text-foreground font-bold">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Student: </span>
                  <strong className="text-foreground">{selectedSession.userId?.name || "Student"}</strong>
                </div>

                <div>
                  <span className="text-muted-foreground">Domain: </span>
                  <strong className="text-foreground">{selectedSession.domain}</strong>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Score Adjustment (0-100%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={adjustedScore}
                    onChange={(e) => setAdjustedScore(parseInt(e.target.value) || 0)}
                    className="w-full bg-background border border-border/60 rounded-md p-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Mentor Feedback & Growth Recommendations:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide constructive mentor feedback regarding architecture design, code cleanliness, and communication clarity..."
                    value={mentorNotes}
                    onChange={(e) => setMentorNotes(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-md p-2 text-xs font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSession(null)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={submittingFeedback}
                  onClick={handleSubmitMentorFeedback}
                  className="rounded-full text-xs font-bold bg-primary text-primary-foreground"
                >
                  {submittingFeedback ? "Saving..." : "Submit Evaluation ✨"}
                </Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
