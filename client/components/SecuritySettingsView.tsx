"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginHistoryItem {
  timestamp: string;
  ip: string;
  userAgent: string;
  status: "Success" | "Failed" | "Locked";
}

interface ActiveSessionItem {
  sessionId: string;
  device: string;
  ip: string;
  lastActive: string;
}

interface SecurityProfile {
  email: string;
  failedAttempts: number;
  isLocked: boolean;
  lockUntil?: string;
  loginHistory: LoginHistoryItem[];
  activeSessions: ActiveSessionItem[];
}

export default function SecuritySettingsView() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<SecurityProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Password Strength check state
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetTokenInput, setResetTokenInput] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) fetchSecurityProfile();
  }, [isLoggedIn]);

  const fetchSecurityProfile = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/api/auth/security");
      if (data?.success) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching security profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const { data } = await axiosInstance.post("/api/auth/sessions/revoke", { sessionId });
      if (data?.success) {
        setProfile((prev) => prev ? { ...prev, activeSessions: data.activeSessions } : null);
      }
    } catch (err) {
      console.error("Error revoking session:", err);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!profile?.email) return;
    try {
      const { data } = await axiosInstance.post("/api/auth/forgot-password", { email: profile.email });
      if (data?.resetToken) {
        setGeneratedToken(data.resetToken);
        setResetTokenInput(data.resetToken);
        setResetMsg({ type: "success", text: "Reset token generated! Enter your new password below." });
      }
    } catch (err: any) {
      setResetMsg({ type: "error", text: err.response?.data?.message || "Failed to generate token" });
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resetTokenInput || !newPassword) return;
    try {
      const { data } = await axiosInstance.post("/api/auth/reset-password", {
        token: resetTokenInput,
        newPassword,
      });
      if (data?.success) {
        setResetMsg({ type: "success", text: "Password reset successfully!" });
        setNewPassword("");
        setShowForgotModal(false);
      }
    } catch (err: any) {
      setResetMsg({ type: "error", text: err.response?.data?.message || "Failed to reset password" });
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: "Empty", pct: 0, color: "bg-border" };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score >= 100) return { label: "Bulletproof 🛡️", pct: 100, color: "bg-emerald-500" };
    if (score >= 75) return { label: "Strong 💪", pct: 75, color: "bg-blue-500" };
    if (score >= 50) return { label: "Fair ⚠️", pct: 50, color: "bg-amber-500" };
    return { label: "Weak ❌", pct: 25, color: "bg-red-500" };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">
            Auditing Security Policies...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const pwdStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="border-b border-border/60 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🔒</span>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Enterprise Security & Account Audit
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage account lockout rules, audit device activity logs, and revoke active sessions.
          </p>
        </div>

        {/* Security Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="p-6 border border-border/60 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Account Lockout Policy
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${profile.isLocked ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
              <span className="text-base font-bold text-foreground">
                {profile.isLocked ? "Account Locked" : "Protected & Active"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Failed Attempts: <strong className="text-foreground">{profile.failedAttempts} / 5</strong>
            </p>
          </Card>

          <Card className="p-6 border border-border/60 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Connected Devices
            </span>
            <p className="text-2xl font-black text-primary">
              {profile.activeSessions?.length || 1} Device(s)
            </p>
            <p className="text-xs text-muted-foreground">
              Real-time token revocation enabled
            </p>
          </Card>

          <Card className="p-6 border border-border/60 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Password Security
              </span>
              <p className="text-xs text-foreground font-semibold">
                Time-Limited Crypto Token Reset
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowForgotModal(true)}
              className="w-full rounded-full text-xs font-bold bg-primary text-primary-foreground"
            >
              Reset Password 🔑
            </Button>
          </Card>

        </div>

        {/* Active Connected Sessions */}
        <Card className="p-6 border border-border/60 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            💻 Active Device Sessions & Token Management
          </h2>

          <div className="space-y-3">
            {profile.activeSessions && profile.activeSessions.length > 0 ? (
              profile.activeSessions.map((session, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-muted/30 border border-border/40 rounded-xl gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📱</span>
                    <div>
                      <p className="font-bold text-foreground">{session.device}</p>
                      <p className="text-[11px] text-muted-foreground">
                        IP: <span className="font-mono">{session.ip}</span> • Last Active:{" "}
                        {new Date(session.lastActive).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.sessionId)}
                    className="rounded-full text-xs border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 self-end sm:self-auto"
                  >
                    Revoke Session 🚫
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No active extra sessions registered.</p>
            )}
          </div>
        </Card>

        {/* Login Activity Audit Log */}
        <Card className="p-6 border border-border/60 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            📋 Recent Login Activity Audit Log
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Client IP Address</th>
                  <th className="py-3 px-4">User Agent / Device</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {profile.loginHistory && profile.loginHistory.length > 0 ? (
                  profile.loginHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        {item.ip}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-xs">
                        {item.userAgent}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === "Success"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : item.status === "Failed"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-xs text-muted-foreground">
                      No recent activity recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Forgot / Reset Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 border border-border bg-background shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-base font-bold text-foreground">
                  🔑 Secure Password Reset
                </h3>
                <button onClick={() => setShowForgotModal(false)} className="text-muted-foreground hover:text-foreground font-bold">
                  ✕
                </button>
              </div>

              {resetMsg && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  resetMsg.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
                }`}>
                  {resetMsg.text}
                </div>
              )}

              <div className="space-y-3">
                {!generatedToken ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Generate a time-limited crypto reset token for <strong>{profile.email}</strong>.
                    </p>
                    <Button
                      onClick={handleRequestPasswordReset}
                      className="w-full rounded-full text-xs font-bold bg-primary text-primary-foreground"
                    >
                      Generate Crypto Reset Token 🚀
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        New Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter new strong password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="text-xs"
                      />

                      {/* Strength Meter */}
                      {newPassword && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-muted-foreground">Strength:</span>
                            <span className="text-foreground">{pwdStrength.label}</span>
                          </div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div className={`h-full ${pwdStrength.color} transition-all duration-500`} style={{ width: `${pwdStrength.pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      disabled={!newPassword}
                      onClick={handleConfirmResetPassword}
                      className="w-full rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Confirm Password Update ✨
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
