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

  // User's first initial for avatar
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
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "bg-background border-b border-border/40"
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
              <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                AI Powered
              </span>
            </div>
          </Link>

          {/* ── Desktop Primary Nav Links ── */}
          <div className="hidden md:flex items-center gap-1">
            {primaryNavLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <button
                  className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                    isActive(link.href)
                      ? "text-primary bg-primary/10 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{link.icon}</span>
                    {link.label}
                  </span>
                </button>
              </Link>
            ))}
          </div>

          {/* ── Desktop Right Controls & User Dropdown ── */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                {/* User Pill Button */}
                <button
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 bg-muted/60 border border-border/60 hover:border-primary/40 rounded-full pl-1.5 pr-3 py-1 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-black">
                      {initial}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Hi, <span className="text-foreground font-bold">{firstName}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">▾</span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-background border border-border/80 rounded-2xl shadow-xl py-2 z-50 space-y-1">
                    <div className="px-4 py-2 border-b border-border/40">
                      <p className="text-xs font-bold text-foreground truncate">{user?.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    </div>

                    {userAccountLinks.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <div className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    ))}

                    <div className="h-px bg-border/40 my-1" />

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-md text-xs font-bold"
                  >
                    Get Started →
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden relative w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-muted/50 transition-colors"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 origin-center ${
                mobileOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 ${
                mobileOpen ? "opacity-0 scale-x-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-foreground rounded-full transition-all duration-300 origin-center ${
                mobileOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Mobile Menu Panel ── */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-border/50 px-4 py-4 space-y-1">
          {primaryNavLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </div>
            </Link>
          ))}

          {isLoggedIn && (
            <>
              <div className="h-px bg-border/40 my-2" />
              <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account & Settings</p>
              {userAccountLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                </Link>
              ))}

              <button
                onClick={logout}
                className="w-full mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-500/10"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
