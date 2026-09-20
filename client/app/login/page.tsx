"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoading, isLoggedIn, user } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      const userRole = user?.role || "Student";
      if (userRole === "Mentor" || userRole === "Administrator") {
        router.push("/rbac");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isLoggedIn, isLoading, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        "Invalid email or password. Please try again.";
      setError(serverMsg);
    }
  };

  const handleQuickLogin = async (email: string) => {
    setFormData({ email, password: "password123" });
    setError("");
    try {
      await login(email, "password123");
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        "Login failed. Please verify server status.";
      setError(serverMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
        </div>

        <Card className="p-8 border border-border/50 shadow-lg">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              Welcome Back
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              Sign in to access your AI mock interview dashboard
            </p>
          </div>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mb-6 p-3 bg-muted/40 rounded-xl border border-border/50 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
              ⚡ Quick Demo 1-Click Login
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("student@example.com")}
                className="py-1.5 px-2 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-center"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("mentor@example.com")}
                className="py-1.5 px-2 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-center"
              >
                👨‍🏫 Mentor
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@example.com")}
                className="py-1.5 px-2 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-center"
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20 font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2 text-foreground"
              >
                Email Address
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="rounded-lg"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2 text-foreground"
              >
                Password
              </label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="rounded-lg"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-full py-2.5 mt-6 shadow-md"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline"
            >
              Create one
            </Link>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
};

export default page;
