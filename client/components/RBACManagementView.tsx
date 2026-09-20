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
  lockUntil?: string | null;
  failedLoginAttempts?: number;
  loginHistory?: Array<{ ip: string; timestamp: string }>;
}

interface QuestionStep {
  question: string;
  answer?: string;
  difficulty?: string;
  score?: number;
  isSkipped?: boolean;
}

interface StudentSession {
  _id: string;
  domain: string;
  score: number;
  createdAt: string;
  userId?: { _id?: string; name?: string; email?: string };
  feedback?: string;
  companyName?: string;
  duration?: number;
  questionHistory?: QuestionStep[];
  progressionReport?: {
    summary?: string;
    topicMastery?: Array<{ topic: string; mastery: string }>;
  };
  companyBenchmark?: {
    hiringBarResult?: string;
    benchmarkSummary?: string;
  };
}

interface SystemAnalytics {
  totalUsers: number;
  studentCount: number;
  mentorCount: number;
  adminCount: number;
  lockedCount: number;
  totalInterviewsCompleted: number;
  platformAvgScore: number;
  domainAnalytics: Array<{ domain: string; count: number }>;
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
  const [activeAdminTab, setActiveAdminTab] = useState<"overview" | "users" | "audit">("users");
  const [activeMentorTab, setActiveMentorTab] = useState<"queue" | "roster">("queue");

  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [studentSessions, setStudentSessions] = useState<StudentSession[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");

  // Mentor Review & Inspection Modal
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null);
  const [inspectingSession, setInspectingSession] = useState<StudentSession | null>(null);
  const [mentorNotes, setMentorNotes] = useState("");
  const [adjustedScore, setAdjustedScore] = useState<number>(75);
  const [technicalScore, setTechnicalScore] = useState<number>(8);
  const [commScore, setCommScore] = useState<number>(8);
  const [problemScore, setProblemScore] = useState<number>(8);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Admin Audit Log Modal
  const [selectedUserAudit, setSelectedUserAudit] = useState<UserItem | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (user?.role) {
      if (user.role !== "Administrator") {
        setActiveRole(user.role as any);
      } else {
        setActiveRole(user.role as any);
      }
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

  const handleToggleLock = async (userId: string, isCurrentlyLocked: boolean) => {
    try {
      const action = isCurrentlyLocked ? "unlock" : "lock";
      const { data } = await axiosInstance.post("/api/rbac/users/lock", {
        userId,
        action,
      });
      if (data?.success) {
        setUsersList((prev) =>
          prev.map((u) =>
            u._id === userId
              ? {
                  ...u,
                  lockUntil: action === "lock" ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
                  failedLoginAttempts: 0,
                }
              : u
          )
        );
      }
    } catch (err) {
      console.error("Error toggling user lock status:", err);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"? This cannot be undone.`)) {
      return;
    }
    try {
      const { data } = await axiosInstance.delete(`/api/rbac/users/${userId}`);
      if (data?.success) {
        setUsersList((prev) => prev.filter((u) => u._id !== userId));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
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
        rubricScores: {
          technical: technicalScore,
          communication: commScore,
          problemSolving: problemScore,
        },
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

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredSessions = studentSessions.filter((s) => {
    const sName = s.userId?.name || "Student Candidate";
    const sEmail = s.userId?.email || "";
    const sDomain = s.domain || "";
    return (
      sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sDomain.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">🛡️</span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  {user?.role === "Administrator" ? "Administrator Command Center" : user?.role === "Mentor" ? "Mentor Operational Workspace" : "Candidate Dashboard"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Role-Based Management Portal · Account: <strong className="text-foreground">{user?.email}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Role Badge Indicator */}
          <div className="flex items-center gap-3">
            {user?.role === "Administrator" ? (
              <div className="bg-muted/40 p-1.5 rounded-2xl border border-border/60 flex items-center gap-1">
                {(["Administrator", "Mentor", "Student"] as const).map((r) => {
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
            ) : user?.role === "Mentor" ? (
              <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                Mentor 👨‍🏫
              </div>
            ) : (
              <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                Student 🎓
              </div>
            )}
          </div>
        </div>

        {/* ── ROLE VIEW 1: STUDENT / CANDIDATE WORKSPACE ── */}
        {activeRole === "Student" && (
          <div className="space-y-6">
            <Card className="p-6 border border-border/60 space-y-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black">
                  🎓
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Candidate Practice & Readiness Workspace
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Simulate real-world technical interviews, company hiring bars, and track placement readiness.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Card className="p-5 border border-border/50 text-center space-y-2 hover:border-primary/50 transition-all cursor-pointer bg-card shadow-sm hover:shadow-md" onClick={() => router.push("/readiness")}>
                  <span className="text-3xl">📈</span>
                  <p className="text-sm font-bold text-foreground">Placement Readiness Engine</p>
                  <p className="text-xs text-muted-foreground">Aggregated readiness %, tiering & career roadmap</p>
                </Card>

                <Card className="p-5 border border-border/50 text-center space-y-2 hover:border-primary/50 transition-all cursor-pointer bg-card shadow-sm hover:shadow-md" onClick={() => router.push("/recruiter-simulator")}>
                  <span className="text-3xl">🏢</span>
                  <p className="text-sm font-bold text-foreground">AI Recruiter Simulator</p>
                  <p className="text-xs text-muted-foreground">Practice Google, Amazon, Microsoft & TCS benchmarks</p>
                </Card>

                <Card className="p-5 border border-border/50 text-center space-y-2 hover:border-primary/50 transition-all cursor-pointer bg-card shadow-sm hover:shadow-md" onClick={() => router.push("/peer-arena")}>
                  <span className="text-3xl">🏆</span>
                  <p className="text-sm font-bold text-foreground">Peer Challenge Arena</p>
                  <p className="text-xs text-muted-foreground">Compete in daily tech sprints & rank leaderboards</p>
                </Card>
              </div>
            </Card>
          </div>
        )}

        {/* ── ROLE VIEW 2: MENTOR WORKSPACE ── */}
        {activeRole === "Mentor" && (
          <div className="space-y-6">
            
            {/* Mentor Overview Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 border border-border/60 space-y-1 bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Candidate Sessions Queue</span>
                <p className="text-2xl font-black text-foreground">{studentSessions.length}</p>
                <p className="text-[11px] text-muted-foreground">Mock interview submissions pending mentor grading</p>
              </Card>

              <Card className="p-4 border border-border/60 space-y-1 bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Average Candidate Score</span>
                <p className="text-2xl font-black text-emerald-500">
                  {studentSessions.length
                    ? Math.round(studentSessions.reduce((s, i) => s + (i.score || 0), 0) / studentSessions.length)
                    : 78}%
                </p>
                <p className="text-[11px] text-muted-foreground">Aggregated across recent candidate evaluations</p>
              </Card>

              <Card className="p-4 border border-border/60 space-y-1 bg-card">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Evaluated Submissions</span>
                <p className="text-2xl font-black text-purple-500">
                  {studentSessions.filter((s) => s.feedback && s.feedback.includes("Mentor Evaluation")).length}
                </p>
                <p className="text-[11px] text-muted-foreground">Sessions with custom mentor notes & rubrics</p>
              </Card>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveMentorTab("queue")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeMentorTab === "queue"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  📋 Candidate Submissions Queue ({studentSessions.length})
                </button>
              </div>

              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search candidate name, domain, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card border border-border/60 rounded-xl px-3.5 py-1.5 text-xs focus:outline-none focus:border-primary w-full sm:w-64"
              />
            </div>

            {/* Candidate Queue Table */}
            <Card className="border border-border/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Domain / Target Company</th>
                      <th className="py-3 px-4">Date & Duration</th>
                      <th className="py-3 px-4">AI Score</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredSessions && filteredSessions.length > 0 ? (
                      filteredSessions.map((session, idx) => {
                        const isEvaluated = session.feedback && session.feedback.includes("Mentor Evaluation");
                        return (
                          <tr key={session._id || idx} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              {session.userId?.name || "Candidate"}
                              <span className="block text-[10px] text-muted-foreground font-normal font-mono">
                                {session.userId?.email || "candidate@example.com"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-foreground">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px] mr-1.5">
                                {session.domain}
                              </span>
                              {session.companyName && (
                                <span className="text-[11px] text-muted-foreground">
                                  🏢 {session.companyName}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground">
                              {new Date(session.createdAt).toLocaleDateString()}
                              <span className="block text-[10px] text-muted-foreground">
                                ⏱️ {session.duration || 15} mins
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`font-mono font-bold text-xs ${
                                session.score >= 80 ? "text-emerald-500" : session.score >= 60 ? "text-amber-500" : "text-rose-500"
                              }`}>
                                {session.score}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {isEvaluated ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                                  ✓ Evaluated
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                  ⏳ Pending Grade
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setInspectingSession(session)}
                                className="rounded-xl text-[11px] font-semibold"
                              >
                                👁️ View Transcript
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedSession(session);
                                  setAdjustedScore(session.score || 75);
                                  setMentorNotes("");
                                }}
                                className="rounded-xl text-[11px] font-semibold bg-primary text-primary-foreground"
                              >
                                📝 Grade Session
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                          {loading ? "Loading sessions..." : "No candidate interview sessions found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── ROLE VIEW 3: ADMINISTRATOR CONTROL PANEL ── */}
        {activeRole === "Administrator" && (
          <div className="space-y-6">
            
            {/* System Metrics Cards */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 border border-border/60 space-y-1 bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Users</span>
                  <p className="text-2xl font-black text-foreground">{analytics.totalUsers}</p>
                  <p className="text-[10px] text-muted-foreground">Registered candidates & staff</p>
                </Card>

                <Card className="p-4 border border-border/60 space-y-1 bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Students</span>
                  <p className="text-2xl font-black text-blue-500">{analytics.studentCount}</p>
                  <p className="text-[10px] text-muted-foreground">Active interview candidates</p>
                </Card>

                <Card className="p-4 border border-border/60 space-y-1 bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mentors</span>
                  <p className="text-2xl font-black text-purple-500">{analytics.mentorCount}</p>
                  <p className="text-[10px] text-muted-foreground">Technical evaluators</p>
                </Card>

                <Card className="p-4 border border-border/60 space-y-1 bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Interviews Completed</span>
                  <p className="text-2xl font-black text-emerald-500">{analytics.totalInterviewsCompleted}</p>
                  <p className="text-[10px] text-muted-foreground">System-wide AI sessions</p>
                </Card>

                <Card className="p-4 border border-border/60 space-y-1 bg-card">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Security Lockouts</span>
                  <p className="text-2xl font-black text-rose-500">{analytics.lockedCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Locked user accounts</p>
                </Card>
              </div>
            )}

            {/* Admin Sub-Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveAdminTab("users")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeAdminTab === "users"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  🛡️ User Directory & Access Controls ({usersList.length})
                </button>

                <button
                  onClick={() => setActiveAdminTab("overview")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeAdminTab === "overview"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  📊 Domain & System Analytics
                </button>
              </div>

              {/* Filters & Search */}
              {activeAdminTab === "users" && (
                <div className="flex items-center gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-card border border-border/60 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="All">All Roles</option>
                    <option value="Student">Students 🎓</option>
                    <option value="Mentor">Mentors 👨‍🏫</option>
                    <option value="Administrator">Administrators 🛡️</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-card border border-border/60 rounded-xl px-3.5 py-1.5 text-xs focus:outline-none focus:border-primary w-full sm:w-56"
                  />
                </div>
              )}
            </div>

            {/* ADMIN TAB 1: USER MANAGEMENT TABLE */}
            {activeAdminTab === "users" && (
              <Card className="border border-border/60 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">User Name</th>
                        <th className="py-3 px-4">Email Address</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4">Assigned Role</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredUsers && filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => {
                          const badge = roleBadges[u.role] || roleBadges["Student"];
                          const isLocked = Boolean(u.lockUntil && new Date(u.lockUntil) > new Date());
                          return (
                            <tr key={u._id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-foreground">
                                {u.name}
                                 {(user?.id === u._id || user?._id === u._id) && (
                                  <span className="ml-2 text-[10px] text-emerald-500 font-normal">(You)</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-muted-foreground">{u.email}</td>
                              <td className="py-3.5 px-4 text-muted-foreground">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.style}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {isLocked ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                    🔒 Account Locked
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    ✓ Active Normal
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                {/* Role Selector */}
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                  className="bg-background border border-border/60 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-primary mr-1"
                                >
                                  <option value="Student">Student 🎓</option>
                                  <option value="Mentor">Mentor 👨‍🏫</option>
                                  <option value="Administrator">Administrator 🛡️</option>
                                </select>

                                {/* Lock / Unlock Toggle */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleLock(u._id, isLocked)}
                                  className="rounded-lg text-[11px] font-semibold"
                                >
                                  {isLocked ? "🔓 Unlock" : "🔒 Lock"}
                                </Button>

                                {/* Audit Info */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedUserAudit(u)}
                                  className="rounded-lg text-[11px] font-semibold"
                                >
                                  🔍 Audit IP
                                </Button>

                                {/* Delete User */}
                                {user?.id !== u._id && user?._id !== u._id && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(u._id, u.name)}
                                    className="rounded-lg text-[11px] font-semibold px-2 py-1"
                                  >
                                    🗑️
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                            No matching platform users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ADMIN TAB 2: SYSTEM & DOMAIN ANALYTICS */}
            {activeAdminTab === "overview" && analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border border-border/60 space-y-4">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    🎯 Domain Popularity & Interview Breakdown
                  </h3>
                  <div className="space-y-3">
                    {analytics.domainAnalytics && analytics.domainAnalytics.length > 0 ? (
                      analytics.domainAnalytics.map((item, idx) => (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-foreground">
                            <span>{item.domain}</span>
                            <span>{item.count} interviews</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.min(100, (item.count / (analytics.totalInterviewsCompleted || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No interview domain data recorded yet.</p>
                    )}
                  </div>
                </Card>

                <Card className="p-6 border border-border/60 space-y-4">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    ⚡ Operational System Health & Security
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                      <span className="font-semibold text-foreground">Auth API Status</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                        ● Operational 100%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                      <span className="font-semibold text-foreground">AI Speech & NLP Pipeline</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                        ● Active (Groq API Connected)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                      <span className="font-semibold text-foreground">Platform Average Score</span>
                      <span className="font-mono font-bold text-emerald-500">
                        {analytics.platformAvgScore}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                      <span className="font-semibold text-foreground">Account Lockout Policy</span>
                      <span className="text-muted-foreground font-medium">5 failed attempts = 30d lock</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

          </div>
        )}

        {/* ── MODAL 1: MENTOR GRADING & EVALUATION ── */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-xl p-6 border border-border bg-background shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    👨‍🏫 Mentor Evaluation & Grading
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Candidate: <strong className="text-foreground">{selectedSession.userId?.name || "Candidate"}</strong> · Domain: <strong className="text-foreground">{selectedSession.domain}</strong>
                  </p>
                </div>
                <button onClick={() => setSelectedSession(null)} className="text-muted-foreground hover:text-foreground font-bold text-lg">
                  ✕
                </button>
              </div>

              {/* Rubric Evaluation Sliders */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Technical (1-10):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={technicalScore}
                      onChange={(e) => setTechnicalScore(parseInt(e.target.value) || 1)}
                      className="w-full bg-background border border-border/60 rounded-lg p-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Comm (1-10):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={commScore}
                      onChange={(e) => setCommScore(parseInt(e.target.value) || 1)}
                      className="w-full bg-background border border-border/60 rounded-lg p-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Problem Solving:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={problemScore}
                      onChange={(e) => setProblemScore(parseInt(e.target.value) || 1)}
                      className="w-full bg-background border border-border/60 rounded-lg p-2 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Final Overall Score Adjustment (0-100%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={adjustedScore}
                    onChange={(e) => setAdjustedScore(parseInt(e.target.value) || 0)}
                    className="w-full bg-background border border-border/60 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Detailed Mentor Feedback & Actionable Recommendations:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write detailed recommendations regarding architecture patterns, code efficiency, communication clarity, and next steps..."
                    value={mentorNotes}
                    onChange={(e) => setMentorNotes(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSession(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={submittingFeedback}
                  onClick={handleSubmitMentorFeedback}
                  className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
                >
                  {submittingFeedback ? "Saving Evaluation..." : "Save Mentor Feedback ✨"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ── MODAL 2: INTERVIEW TRANSCRIPT INSPECTION ── */}
        {inspectingSession && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl p-6 border border-border bg-background shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    👁️ Interview Transcript & Response Inspection
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Candidate: <strong className="text-foreground">{inspectingSession.userId?.name || "Candidate"}</strong> · Domain: <strong className="text-foreground">{inspectingSession.domain}</strong>
                  </p>
                </div>
                <button onClick={() => setInspectingSession(null)} className="text-muted-foreground hover:text-foreground font-bold text-lg">
                  ✕
                </button>
              </div>

              {/* Questions & Answers */}
              <div className="space-y-4 text-xs">
                {inspectingSession.questionHistory && inspectingSession.questionHistory.length > 0 ? (
                  inspectingSession.questionHistory.map((q, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">Q{idx + 1}: {q.question}</span>
                        {q.difficulty && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                            {q.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground font-mono bg-card p-2 rounded border border-border/40 whitespace-pre-wrap">
                        {q.answer || "No response provided."}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No detailed question breakdown recorded for this session.
                  </p>
                )}

                {/* Existing Feedback */}
                {inspectingSession.feedback && (
                  <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-1">
                    <span className="font-bold text-primary block">Existing Feedback Notes:</span>
                    <p className="text-foreground text-xs whitespace-pre-wrap">{inspectingSession.feedback}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-border/60">
                <Button
                  size="sm"
                  onClick={() => setInspectingSession(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  Close Inspection
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ── MODAL 3: ADMIN USER SECURITY & IP AUDIT ── */}
        {selectedUserAudit && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 border border-border bg-background shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    🔍 Security Audit & IP History
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    User: <strong className="text-foreground">{selectedUserAudit.name}</strong> ({selectedUserAudit.email})
                  </p>
                </div>
                <button onClick={() => setSelectedUserAudit(null)} className="text-muted-foreground hover:text-foreground font-bold text-lg">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                  <p className="font-bold text-foreground">Account Status Summary:</p>
                  <p className="text-muted-foreground">Assigned Role: <strong className="text-foreground">{selectedUserAudit.role}</strong></p>
                  <p className="text-muted-foreground">Failed Attempts: <strong className="text-foreground">{selectedUserAudit.failedLoginAttempts || 0}</strong></p>
                  <p className="text-muted-foreground">Joined: <strong className="text-foreground">{new Date(selectedUserAudit.createdAt).toLocaleString()}</strong></p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-foreground">Recent IP Tracking Log:</p>
                  {selectedUserAudit.loginHistory && selectedUserAudit.loginHistory.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                      {selectedUserAudit.loginHistory.map((item, idx) => (
                        <div key={idx} className="p-2 rounded bg-card border border-border/40 flex justify-between">
                          <span>🌐 IP: {item.ip || "127.0.0.1"}</span>
                          <span className="text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-[11px]">No external IP addresses recorded yet (Localhost session).</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/60">
                <Button
                  size="sm"
                  onClick={() => setSelectedUserAudit(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  Close Audit
                </Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
