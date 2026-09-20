"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { isLoggedIn, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLandingPage = pathname === "/";

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => pathname === path;

  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const primaryNavLinks = isLoggedIn
    ? [
        { href: "/dashboard", label: "Dashboard", icon: "⚡" },
        { href: "/practice", label: "Practice", icon: "🎯" },
        { href: "/recruiter-simulator", label: "Companies", icon: "🏢" },
        { href: "/readiness", label: "Readiness", icon: "📈" },
        { href: "/peer-arena", label: "Arena", icon: "🏆" },
      ]
    : [
        { href: "/#features", label: "Features", icon: "✨" },
        { href: "/#how-it-works", label: "How It Works", icon: "🔍" },
        { href: "/#domains", label: "Domains", icon: "🧩" },
      ];

  const userAccountLinks = [
    { href: "/history", label: "My Sessions", icon: "📊" },
    { href: "/security", label: "Security & Audit", icon: "🔒" },
    { href: "/rbac", label: "Role Control", icon: "🛡️" },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isLandingPage
          ? scrolled
            ? "bg-black/90 backdrop-blur-xl border-b border-neutral-800 shadow-2xl text-white"
            : "bg-black/80 backdrop-blur-md border-b border-neutral-900 text-white"
          : scrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-border/80 shadow-md text-foreground"
            : "bg-background/90 backdrop-blur-md border-b border-border/50 text-foreground"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl rotate-6 opacity-40 group-hover:rotate-12 transition-transform duration-300" />
              <div className="relative w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-black text-sm tracking-tight">
                  AI
                </span>
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
                MockInterview
              </span>
              <span className={`text-[10px] font-semibold tracking-widest uppercase ${isLandingPage ? "text-neutral-400" : "text-muted-foreground"}`}>
                AI Powered
              </span>
            </div>
          </Link>

          {/* ── Desktop Primary Nav Links ── */}
          <div className="hidden md:flex items-center gap-1.5">
            {primaryNavLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href}>
                  <button
                    className={`relative px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isLandingPage
                        ? "text-neutral-300 hover:text-white hover:bg-white/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{link.icon}</span>
                      {link.label}
                    </span>
                  </button>
                </Link>
              );
            })}
          </div>

          {/* ── Desktop Right Controls & User Dropdown ── */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                {/* User Pill Button */}
                <button
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  className={`flex items-center gap-2 border rounded-full pl-1.5 pr-3 py-1 transition-all ${
                    isLandingPage
                      ? "bg-neutral-900/90 border-neutral-700 text-white hover:border-primary/50"
                      : "bg-card border-border/80 text-foreground hover:border-primary/50 shadow-sm"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-black">
                      {initial}
                    </span>
                  </div>
                  <span className="text-xs font-medium">
                    Hi, <span className="font-bold">{firstName}</span>
                  </span>
                  <span className="text-[10px] opacity-70">▾</span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-52 rounded-2xl shadow-2xl py-2 z-50 space-y-1 border ${
                    isLandingPage
                      ? "bg-neutral-950 border-neutral-800 text-white"
                      : "bg-background border-border/80 text-foreground"
                  }`}>
                    <div className="px-4 py-2 border-b border-border/40">
                      <p className="text-xs font-bold truncate">{user?.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    </div>

                    {userAccountLinks.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <div className={`flex items-center gap-2.5 px-4 py-2 text-xs font-semibold transition-colors ${
                          isLandingPage
                            ? "text-neutral-300 hover:text-white hover:bg-white/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}>
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    ))}

                    <div className="h-px bg-border/40 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        router.push("/login");
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/login")}
                  className={`text-xs font-bold rounded-full ${
                    isLandingPage ? "text-neutral-200 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Login
                </Button>

                <Button
                  size="sm"
                  onClick={() => router.push("/register")}
                  className="bg-gradient-to-r from-primary to-accent text-white text-xs font-bold rounded-full px-4 shadow-md hover:opacity-90 transition-all"
                >
                  Get Started →
                </Button>
              </div>
            )}
          </div>

          {/* ── Mobile Hamburger Button ── */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className={`p-2 rounded-xl transition-colors ${
                isLandingPage ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted/60"
              }`}
            >
              <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className={`md:hidden px-4 pt-2 pb-6 space-y-2 border-t ${
          isLandingPage ? "bg-neutral-950 border-neutral-800 text-white" : "bg-background border-border/60 text-foreground"
        }`}>
          {primaryNavLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold ${
                isActive(link.href)
                  ? "bg-primary text-primary-foreground"
                  : isLandingPage
                  ? "text-neutral-300 hover:bg-white/10"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}>
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </div>
            </Link>
          ))}

          {isLoggedIn && (
            <>
              <div className="h-px bg-border/40 my-2" />
              {userAccountLinks.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    isLandingPage ? "text-neutral-300 hover:bg-white/10" : "text-muted-foreground hover:bg-muted/60"
                  }`}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}

              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
