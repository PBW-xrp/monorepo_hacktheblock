"use client";

import { useEffect, useRef } from "react";

interface TxBurst {
  type: string;
  hash: string;
}

interface TxParticleFieldProps {
  /** Latest transactions — when this changes, new bursts fire */
  transactions: TxBurst[];
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glow: number;
}

interface AmbientStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  twinkleOffset: number;
}

const COLOR_MAP: Record<string, string> = {
  EscrowCreate: "#00e5ff",   // cyan
  EscrowFinish: "#00ff9d",   // green
  EscrowCancel: "#ff5577",   // red
  Payment: "#6b8fff",        // blue
  OfferCreate: "#9b6bff",    // purple
};

const DEFAULT_COLOR = "#6b8fff";

export default function TxParticleField({ transactions, className = "" }: TxParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ambientRef = useRef<AmbientStar[]>([]);
  const seenHashesRef = useRef<Set<string>>(new Set());
  const animIdRef = useRef<number>(0);
  const dimensionsRef = useRef({ w: 0, h: 0 });

  // Initialize ambient stars
  useEffect(() => {
    const stars: AmbientStar[] = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.2 + 0.4,
        alpha: Math.random() * 0.4 + 0.15,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
    ambientRef.current = stars;
  }, []);

  // Setup canvas + animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      dimensionsRef.current = { w: rect.width, h: rect.height };
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const animate = () => {
      const { w, h } = dimensionsRef.current;
      ctx.clearRect(0, 0, w, h);
      t += 1;

      // Draw ambient stars (subtle background field)
      for (const star of ambientRef.current) {
        const twinkle = Math.sin(t * 0.02 + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(star.x % w, star.y % h, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(107, 143, 255, ${alpha})`;
        ctx.fill();
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0) star.x = w;
        if (star.x > w) star.x = 0;
        if (star.y < 0) star.y = h;
        if (star.y > h) star.y = 0;
      }

      // Draw + update bursts
      const remaining: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life -= 1;
        if (p.life <= 0) continue;

        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio * 0.9;
        const size = p.size * lifeRatio;

        // Glow halo
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * p.glow);
        grad.addColorStop(0, p.color + Math.floor(alpha * 200).toString(16).padStart(2, "0"));
        grad.addColorStop(0.4, p.color + Math.floor(alpha * 60).toString(16).padStart(2, "0"));
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * p.glow, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(Math.min(1, alpha + 0.3) * 255).toString(16).padStart(2, "0");
        ctx.fill();

        // Update physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.01; // gravity
        p.vx *= 0.98;
        p.vy *= 0.98;

        remaining.push(p);
      }
      particlesRef.current = remaining;

      animIdRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Watch for new transactions and fire bursts
  useEffect(() => {
    const newTxs: TxBurst[] = [];
    for (const tx of transactions) {
      if (!seenHashesRef.current.has(tx.hash)) {
        seenHashesRef.current.add(tx.hash);
        newTxs.push(tx);
      }
    }

    // Fire a burst for each new transaction
    const { w, h } = dimensionsRef.current;
    if (w === 0 || h === 0) return;

    newTxs.forEach((tx, idx) => {
      // Stagger bursts slightly
      setTimeout(() => {
        const color = COLOR_MAP[tx.type] || DEFAULT_COLOR;
        const cx = w * (0.15 + Math.random() * 0.7);
        const cy = h * (0.15 + Math.random() * 0.7);
        const particleCount = 18 + Math.floor(Math.random() * 8);

        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
          const speed = 0.8 + Math.random() * 2.2;
          particlesRef.current.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 60 + Math.floor(Math.random() * 40),
            maxLife: 100,
            size: 1.5 + Math.random() * 2,
            color,
            glow: 4 + Math.random() * 3,
          });
        }
      }, idx * 120);
    });
  }, [transactions]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}
