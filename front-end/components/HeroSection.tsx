"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import AuroraBackground from "@/components/AuroraBackground";
import Meteors from "@/components/Meteors";
import MagneticButton from "@/components/MagneticButton";

// ─── Particle canvas ─────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const W = 480;
    const H = 480;
    canvas.width = W;
    canvas.height = H;

    const COLORS = ["#6b8fff", "#00e5ff", "#9b6bff"];

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      color: string;
      twinkleSpeed: number;
      twinkleOffset: number;
    };

    const particles: Particle[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      twinkleSpeed: Math.random() * 0.02 + 0.008,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 1;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(107,143,255,${0.06 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const twinkle = Math.sin(t * p.twinkleSpeed + p.twinkleOffset);
        const alpha = p.alpha + twinkle * 0.15;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, p.color + Math.floor(alpha * 180).toString(16).padStart(2, "0"));
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(Math.min(1, alpha + 0.3) * 255).toString(16).padStart(2, "0");
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-70 pointer-events-none"
    />
  );
}

// ─── Mouse parallax hook ──────────────────────────────────────────────────────
function useMagneticMouse() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseX.set((e.clientX - cx) / cx * 14);
      mouseY.set((e.clientY - cy) / cy * 10);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  return { springX, springY };
}

// ─── Hero section ─────────────────────────────────────────────────────────────
export default function HeroSection() {
  const { scrollY } = useScroll();

  // Parallax transforms — text moves slower than scroll, logo faster
  const textY = useTransform(scrollY, [0, 500], [0, -60]);
  const logoY = useTransform(scrollY, [0, 500], [0, -110]);
  const bgBlobY = useTransform(scrollY, [0, 600], [0, 140]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Mouse parallax on logo
  const { springX, springY } = useMagneticMouse();
  const logoMX = useTransform(springX, v => v * 0.7);
  const logoMY = useTransform(springY, v => v * 0.7);
  const blobMX = useTransform(springX, v => v * -0.4);
  const blobMY = useTransform(springY, v => v * -0.4);

  return (
    <section className="relative min-h-screen w-full flex items-center px-6 overflow-hidden">
      {/* Aurora gradient background */}
      <AuroraBackground />

      {/* Meteor shower */}
      <Meteors number={6} />

      {/* Parallax background glows */}
      <motion.div
        style={{ y: bgBlobY, x: blobMX }}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/4 left-1/3 w-[700px] h-[700px] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "radial-gradient(circle, #6b8fff 0%, #9b6bff 50%, transparent 80%)" }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-[350px] h-[350px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "radial-gradient(circle, #00e5ff 0%, transparent 70%)" }}
        />
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-brand-text/20 tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-brand-text/20 to-transparent"
        />
      </motion.div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 items-center pt-16">

        {/* ── LEFT: Brand + copy with scroll parallax ── */}
        <motion.div
          style={{ y: textY, opacity }}
          className="flex flex-col items-center lg:items-start order-2 lg:order-1"
        >
          {/* VeraFi wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none text-center lg:text-left">
              <span
                className="text-brand-text shimmer-text"
                style={{
                  backgroundImage: "linear-gradient(110deg, #f0f4ff 40%, #ffffff 50%, #f0f4ff 60%)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "shimmer-sweep 4s linear infinite",
                }}
              >
                Vera
              </span>
              <motion.span
                style={{
                  background: "linear-gradient(90deg, #6b8fff 0%, #00e5ff 60%, #6b8fff 100%)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "inline-block",
                  animation: "shimmer-sweep 4s linear infinite",
                  animationDelay: "0.5s",
                }}
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                Fi
              </motion.span>
            </h1>
            <style>{`
              @keyframes shimmer-sweep {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </motion.div>

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-5"
          >
            <motion.span
              whileHover={{ scale: 1.03, borderColor: "rgba(0,229,255,0.5)" }}
              className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan text-xs font-medium tracking-widest uppercase cursor-default overflow-hidden"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-glow-pulse relative" />
              <span className="relative">ZK-Verified Options on XRPL</span>
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(110deg, transparent 30%, rgba(0,229,255,0.25) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer-sweep 3s linear infinite",
                }}
              />
            </motion.span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-brand-text/60 text-lg md:text-xl max-w-lg leading-relaxed mb-3 text-center lg:text-left"
          >
            The first decentralized options protocol on XRPL.{" "}
            <span className="text-brand-text/90 font-medium">Black-Scholes pricing verified on-chain via Boundless ZK proofs.</span>{" "}
            No vault, no intermediary, no trust assumption.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-brand-text/35 text-sm mb-10 text-center lg:text-left"
          >
            Trustless Settlement · 4 Transactions · Fully On-Chain
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="flex flex-col sm:flex-row gap-4 mb-14 justify-center lg:justify-start"
          >
            <MagneticButton strength={0.35} className="w-full sm:w-auto">
              <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Link href="/login" className="btn-primary text-white w-full sm:w-auto">
                  Launch App
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </motion.div>
            </MagneticButton>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.25)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-brand-text/70 hover:text-brand-text border border-white/[0.1] transition-colors duration-200 w-full sm:w-auto"
            >
              How it works
            </motion.a>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                href="/board"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-brand-cyan/70 hover:text-brand-cyan border border-brand-cyan/10 hover:border-brand-cyan/30 transition-all duration-200 w-full sm:w-auto"
              >
                Option Board
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.52 }}
            className="grid grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.08] rounded-2xl overflow-hidden w-full max-w-md mx-auto lg:mx-0 relative"
          >
            <div className="absolute inset-0 pointer-events-none opacity-50" style={{
              background: "linear-gradient(110deg, transparent 30%, rgba(0,229,255,0.04) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "shimmer-sweep 5s linear infinite",
            }} />
            {[
              { label: "ZK Proof per Option", value: "1:1", color: "#6b8fff", glow: "rgba(107,143,255,0.5)" },
              { label: "Transactions / Lifecycle", value: "4", color: "#00e5ff", glow: "rgba(0,229,255,0.5)" },
              { label: "EVM Wallet Required", value: "0", color: "#9b6bff", glow: "rgba(155,107,255,0.5)" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                whileHover={{ backgroundColor: "rgba(107,143,255,0.08)", scale: 1.02 }}
                className="relative bg-brand-bg px-4 py-4 text-center cursor-default transition-colors group"
              >
                <p
                  className="font-bold text-2xl font-mono"
                  style={{ color: s.color, textShadow: `0 0 16px ${s.glow}` }}
                >
                  {s.value}
                </p>
                <p className="text-brand-text/40 text-[10px] mt-0.5 uppercase tracking-wider">{s.label}</p>
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-brand-cyan group-hover:w-3/4 transition-all duration-500"
                  style={{ boxShadow: "0 0 8px rgba(0,229,255,0.6)" }}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Logo with parallax + mouse tracking ── */}
        <motion.div
          style={{ y: logoY, x: logoMX }}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center justify-center order-1 lg:order-2"
        >
          {/* Container — bigger on desktop */}
          <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] lg:w-[540px] lg:h-[540px]">
            <ParticleCanvas />

            {/* Orbiting rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-6 rounded-full border border-brand-blue/10"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="absolute inset-12 rounded-full border border-brand-cyan/[0.08]"
            />

            {/* Center glow */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #6b8fff 0%, #9b6bff 40%, transparent 70%)" }}
            />

            {/* Mouse-tracking wrapper (Y only, no keyframe here) */}
            <motion.div
              style={{ y: logoMY }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Float keyframe — separate div so it doesn't conflict with spring */}
              <motion.div
                animate={{ y: [-12, 12, -12] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Glow pulse — own transition so it doesn't bleed into hover */}
                <motion.div
                  animate={{
                    filter: [
                      "drop-shadow(0 0 22px rgba(107,143,255,0.5))",
                      "drop-shadow(0 0 48px rgba(0,229,255,0.8))",
                      "drop-shadow(0 0 22px rgba(107,143,255,0.5))",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Hover scale — innermost */}
                  <motion.div
                    whileHover={{ scale: 1.07 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="relative w-44 h-44 sm:w-52 sm:h-52 lg:w-80 lg:h-80 cursor-pointer"
                  >
                    <Image
                      src="/Verafi_Hero_Logo.png"
                      alt="VeraFi"
                      fill
                      priority
                      className="object-contain rounded-3xl"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
