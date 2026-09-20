"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // ── 1. Lenis Heavy Inertia Smooth Scroll ──
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    });

    let animationId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationId = requestAnimationFrame(raf);
    }

    animationId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(animationId);
      lenis.destroy();
    };
  }, []);

  // Framer Motion Scroll Progress
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    if (getToken()) {
      router.push("/dashboard");
    }
  }, [router]);

  // ── 2. Production LERP Target Video & Canvas Engine (High-Contrast 60FPS) ──
  useEffect(() => {
    const vid = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId: number;

    let targetTime = 0;
    let currentTime = 0;

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    const renderCanvas = () => {
      if (!vid || !ctx || !canvas) return;
      if (vid.readyState >= 2) {
        const vWidth = vid.videoWidth || 1280;
        const vHeight = vid.videoHeight || 720;
        const cWidth = canvas.width;
        const cHeight = canvas.height;

        const vAspect = vWidth / vHeight;
        const cAspect = cWidth / cHeight;

        let drawWidth = cWidth;
        let drawHeight = cHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (cAspect > vAspect) {
          drawHeight = cWidth / vAspect;
          offsetY = (cHeight - drawHeight) / 2;
        } else {
          drawWidth = cHeight * vAspect;
          offsetX = (cWidth - drawWidth) / 2;
        }

        ctx.clearRect(0, 0, cWidth, cHeight);
        ctx.drawImage(vid, offsetX, offsetY, drawWidth, drawHeight);
      }
    };

    const updateVideoLoop = () => {
      if (vid && vid.duration && !isNaN(vid.duration)) {
        const progress = scrollYProgress.get();
        targetTime = Math.max(0, Math.min(vid.duration - 0.05, progress * vid.duration));

        // LERP Smooth Target Interpolation
        const diff = targetTime - currentTime;
        currentTime += diff * 0.12;

        if (vid.readyState >= 2 && !vid.seeking && Math.abs(vid.currentTime - currentTime) > 0.02) {
          vid.currentTime = currentTime;
        }

        renderCanvas();
      }

      animationFrameId = requestAnimationFrame(updateVideoLoop);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    animationFrameId = requestAnimationFrame(updateVideoLoop);

    const onSeeked = () => renderCanvas();
    vid.addEventListener("seeked", onSeeked);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (vid) vid.removeEventListener("seeked", onSeeked);
    };
  }, [scrollYProgress]);

  // Stage Card Animations linked to scrollProgress
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18, 0.24], [1, 1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const feature1Opacity = useTransform(scrollYProgress, [0.22, 0.28, 0.42, 0.48], [0, 1, 1, 0]);
  const feature1Y = useTransform(scrollYProgress, [0.22, 0.28, 0.42, 0.48], [40, 0, 0, -40]);

  const feature2Opacity = useTransform(scrollYProgress, [0.49, 0.54, 0.68, 0.73], [0, 1, 1, 0]);
  const feature2Y = useTransform(scrollYProgress, [0.49, 0.54, 0.68, 0.73], [40, 0, 0, -40]);

  const feature3Opacity = useTransform(scrollYProgress, [0.74, 0.79, 0.92, 0.98], [0, 1, 1, 0]);
  const feature3Y = useTransform(scrollYProgress, [0.74, 0.79, 0.92, 0.98], [40, 0, 0, -40]);

  // Auto rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const companySimulators = [
    { name: "Google", icon: "🌐", role: "L4 SDE / Staff System Design", bar: "92% Threshold" },
    { name: "Amazon", icon: "📦", role: "SDE-II Leadership Principles", bar: "88% Threshold" },
    { name: "Microsoft", icon: "💻", role: "Software Engineer II Core CS", bar: "85% Threshold" },
    { name: "TCS / Infosys", icon: "🏢", role: "Digital & Technical Aptitude", bar: "75% Threshold" },
  ];

  const aiCapabilities = [
    {
      icon: "🧠",
      title: "Natural Language Understanding",
      description: "Our Groq AI engine comprehends technical depth, structure, and intent — not just keyword matching.",
      highlight: "Groq LLM Engine",
    },
    {
      icon: "🎯",
      title: "Adaptive Difficulty Scaling",
      description: "Questions dynamically scale from Easy ➔ Medium ➔ Hard ➔ Advanced based on your performance.",
      highlight: "Dynamic AI Tree",
    },
    {
      icon: "📊",
      title: "Placement Readiness Engine",
      description: "Calculates overall readiness %, benchmarks against tier companies, and generates tailored roadmaps.",
      highlight: "Career Tiering",
    },
    {
      icon: "🏆",
      title: "Peer Challenge Arena",
      description: "Compete in daily tech sprints, build streak points, unlock skill badges, and scale global leaderboards.",
      highlight: "Daily Sprints",
    },
  ];

  const testimonials = [
    {
      name: "Rohan Sharma",
      role: "Frontend Developer @ Flipkart",
      avatar: "RS",
      text: "After 10 mock sessions, I walked into my Flipkart interview feeling genuinely prepared. The AI's feedback on my React answers was shockingly accurate.",
      rating: 5,
    },
    {
      name: "Priya Nair",
      role: "Data Scientist @ Razorpay",
      avatar: "PN",
      text: "I used to ramble in interviews. The AI flagged this after my second session and I actively worked on it. Got the offer after targeting exactly those weak spots.",
      rating: 5,
    },
    {
      name: "Arjun Mehta",
      role: "DevOps Engineer @ Infosys",
      avatar: "AM",
      text: "The system design questions were spot-on for what I faced in actual interviews. The follow-up questions especially felt like a real technical round.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: "How does the 3D AI engine evaluate my answers?",
      a: "Our platform leverages high-speed Groq LLM inference to analyze your answers across 4 core dimensions: Technical Accuracy, Communication Clarity, Problem-Solving Structure, and Seniority Benchmark.",
    },
    {
      q: "Can I practice specific company hiring bars?",
      a: "Yes! Our Recruiter Simulator lets you select company profiles like Google, Amazon, Microsoft, TCS, Infosys, and high-growth startups, applying their exact evaluation rubrics.",
    },
    {
      q: "What is the Placement Readiness Score?",
      a: "The Readiness Engine aggregates your interview history, domain consistency, and company benchmarks into an overall readiness % score, placing you in readiness tiers with AI roadmap recommendations.",
    },
    {
      q: "Is there a peer competitive mode?",
      a: "Yes! The Peer Challenge Arena lets candidates solve daily time-bound technical sprint challenges, earn XP rank points, maintain practice streaks, and climb global leaderboards.",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-600 selection:text-white">
      
      {/* ── 3D HEAVY INERTIA LERP SCROLLYTETLLING CANVAS & STICKY HERO WRAPPER (600vh) ── */}
      <div ref={containerRef} className="relative h-[600vh] w-full">
        
        {/* Sticky 3D Background Canvas Layer */}
        <div className="sticky top-0 h-screen w-full overflow-hidden z-0 bg-black">
          
          {/* Hidden preloading video element */}
          <video
            ref={videoRef}
            src="/hero-video.mp4"
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            className="hidden"
          />

          {/* Ultra Crisp High-Contrast 60FPS Canvas Layer */}
          <canvas
            ref={canvasRef}
            className="h-full w-full object-cover opacity-100 filter brightness-105 contrast-110 saturate-110 transition-opacity duration-500"
          />
          
          {/* Minimal Pure Black Vignettes */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
          
          {/* Fallback loading indicator */}
          {!videoLoaded && (
            <div className="absolute inset-0 bg-black animate-pulse flex items-center justify-center">
              <p className="text-xs text-blue-400 font-mono">Loading 3D Crisp Graphics…</p>
            </div>
          )}
        </div>

        {/* ── OVERLAY STAGE 1: MAIN HERO CARD (SLEEK DARK GLASS CONTAINER) ── */}
        <div className="absolute top-0 inset-x-0 h-screen flex items-center justify-center z-10 px-4 pointer-events-none">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="text-center max-w-4xl space-y-6 pointer-events-auto bg-slate-950/85 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-blue-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-white"
          >
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-300 bg-blue-950/70 border border-blue-500/40 backdrop-blur-md px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
              <span>✨</span> 3D AI-Powered Placement Engine
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1] drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
              Master Technical Interviews With{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent drop-shadow-none">
                3D Real-Time AI
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              Experience adaptive AI recruiters, target company hiring bars, placement readiness tiering, and peer competitive arena.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-3">
              <Button
                size="lg"
                onClick={() => router.push("/register")}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white rounded-full px-8 py-6 font-bold text-base shadow-xl shadow-blue-600/30 transition-all hover:scale-105 border border-blue-400/30"
              >
                Start Free Practice ⚡
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/login")}
                className="rounded-full px-8 py-6 font-semibold bg-slate-900/80 text-white border-slate-700/80 hover:bg-slate-800 backdrop-blur-md shadow-lg"
              >
                Sign In 🔒
              </Button>
            </div>

            {/* Scroll Indicator Prompt */}
            <div className="pt-6 flex flex-col items-center gap-2 text-xs text-blue-300 font-mono animate-bounce drop-shadow">
              <span>Scroll for 3D Feature Fly-Through</span>
              <span>↓</span>
            </div>
          </motion.div>
        </div>

        {/* ── OVERLAY STAGE 2: RECRUITER SIMULATOR (SLEEK DARK CARD) ── */}
        <div className="absolute top-[150vh] inset-x-0 h-screen flex items-center justify-center z-10 px-4 pointer-events-none">
          <motion.div
            style={{ opacity: feature1Opacity, y: feature1Y }}
            className="max-w-3xl w-full pointer-events-auto bg-slate-950/80 backdrop-blur-md p-8 rounded-3xl border border-blue-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-6 text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl font-black">
                  🏢
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">AI Recruiter Simulator</h2>
                  <p className="text-xs text-slate-300">Simulate specific hiring bars & benchmark rubrics</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-500/30">
                Stage 01 / 03
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {companySimulators.map((comp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 hover:border-blue-500/50 transition-colors">
                  <span className="text-3xl">{comp.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{comp.name} Simulator</h3>
                    <p className="text-xs text-slate-300">{comp.role}</p>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 mt-1 block">
                      Target Bar: {comp.bar}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── OVERLAY STAGE 3: ADAPTIVE ENGINE & NLP (SLEEK DARK CARD) ── */}
        <div className="absolute top-[300vh] inset-x-0 h-screen flex items-center justify-center z-10 px-4 pointer-events-none">
          <motion.div
            style={{ opacity: feature2Opacity, y: feature2Y }}
            className="max-w-3xl w-full pointer-events-auto bg-slate-950/80 backdrop-blur-md p-8 rounded-3xl border border-purple-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-6 text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl font-black">
                  🎯
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Adaptive Difficulty & NLP Engine</h2>
                  <p className="text-xs text-slate-300">Questions scale dynamically based on response quality</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-500/30">
                Stage 02 / 03
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { level: "Easy", color: "text-emerald-400", desc: "Core Fundamentals" },
                { level: "Medium", color: "text-blue-400", desc: "Practical Application" },
                { level: "Hard", color: "text-amber-400", desc: "Edge Cases & Optimization" },
                { level: "Advanced", color: "text-purple-400", desc: "Architecture & Scale" },
              ].map((lvl, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className={`text-lg font-black ${lvl.color}`}>{lvl.level}</span>
                  <p className="text-[11px] text-slate-300 mt-1">{lvl.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-white">⚡ Groq LLM Inference Speed: ~800 tokens/sec</span>
              <span className="text-purple-200">Real-Time Question Branching & Instant Feedback</span>
            </div>
          </motion.div>
        </div>

        {/* ── OVERLAY STAGE 4: READINESS & PEER ARENA (SLEEK DARK CARD) ── */}
        <div className="absolute top-[450vh] inset-x-0 h-screen flex items-center justify-center z-10 px-4 pointer-events-none">
          <motion.div
            style={{ opacity: feature3Opacity, y: feature3Y }}
            className="max-w-3xl w-full pointer-events-auto bg-slate-950/80 backdrop-blur-md p-8 rounded-3xl border border-emerald-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-6 text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-black">
                  🏆
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Placement Readiness & Peer Arena</h2>
                  <p className="text-xs text-slate-300">Track score growth, career roadmaps, and compete in daily sprints</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                Stage 03 / 03
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <span className="text-3xl">📈</span>
                <p className="text-sm font-bold text-white">Readiness Tiering</p>
                <p className="text-xs text-slate-300">Placed into Interview Ready, Preparing, or Gap Remediation</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <span className="text-3xl">🔥</span>
                <p className="text-sm font-bold text-white">Daily Sprint Streaks</p>
                <p className="text-xs text-slate-300">Earn XP rank points and unlock achievements</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                <span className="text-3xl">🛡️</span>
                <p className="text-sm font-bold text-white">Enterprise Security</p>
                <p className="text-xs text-slate-300">IP tracking, brute-force lockout, & session management</p>
              </div>
            </div>
          </motion.div>
        </div>

      </div>

      {/* ── SECTION 2: AI CAPABILITIES DEEP DIVE ── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-20 bg-black">
        <div className="text-center mb-16 space-y-3">
          <div className="inline-block text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-500/30 px-4 py-1.5 rounded-full uppercase tracking-wider">
            Under The Hood
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            How Our AI Architecture Operates
          </h2>
          <p className="text-base text-slate-400 max-w-2xl mx-auto">
            Not a static question bank. A genuine 3D intelligence engine designed for engineering mastery.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {aiCapabilities.map((cap, index) => (
            <Card key={index} className="p-8 border border-neutral-900 bg-neutral-950/80 hover:border-blue-500/50 transition-all text-white shadow-lg">
              <div className="flex gap-5 items-start">
                <div className="text-4xl flex-shrink-0">{cap.icon}</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{cap.title}</h3>
                    <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                      {cap.highlight}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{cap.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: CANDIDATE SUCCESS STORIES ── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-20 border-t border-neutral-900 bg-black">
        <div className="text-center mb-12 space-y-2">
          <div className="inline-block text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-500/30 px-4 py-1.5 rounded-full uppercase tracking-wider">
            Candidate Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Real Candidates. Real Offers.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <Card
              key={index}
              className={`p-6 border transition-all duration-300 bg-neutral-950/80 text-white ${
                activeTab === index ? "border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]" : "border-neutral-900"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
              <div className="flex mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed italic">"{t.text}"</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: FREQUENTLY ASKED QUESTIONS ── */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-20 border-t border-neutral-900 bg-black">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-400">Everything you need to know about our 3D AI platform</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index} className="border border-neutral-900 bg-neutral-950/80 overflow-hidden text-white">
              <button
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full p-5 text-left flex items-center justify-between hover:bg-neutral-900/50 transition-colors"
              >
                <p className="font-bold text-white text-sm pr-4">{faq.q}</p>
                <span className={`text-blue-400 text-xl flex-shrink-0 transition-transform duration-200 ${activeFaq === index ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {activeFaq === index && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-neutral-900 pt-3">
                  {faq.a}
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: FINAL CTA BANNER ── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-20 bg-black">
        <div className="bg-gradient-to-r from-blue-950/80 via-neutral-950 to-purple-950/80 rounded-3xl p-10 md:p-16 text-center border border-blue-500/30 shadow-2xl space-y-6 text-white">
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Ready to Master Your Next Technical Round?
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto">
            Start practicing immediately with your personalized 3D AI interviewer. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 text-white rounded-full px-8 py-6 font-bold shadow-xl shadow-blue-600/30 border border-blue-400/30"
            >
              Start Practice Now ⚡
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/login")}
              className="rounded-full px-8 py-6 font-semibold bg-neutral-900/80 text-white border-neutral-800 hover:bg-neutral-800"
            >
              Already Registered? Sign In
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
