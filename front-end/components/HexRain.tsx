"use client";

import { useEffect, useRef } from "react";

interface HexRainProps {
  className?: string;
  density?: number;
  speed?: number;
}

const CHARS = "0123456789ABCDEF";

/**
 * Hex digit rain — Matrix-style falling characters in the background.
 * Subtle, low-density, designed to evoke "ZK proof being computed".
 */
export default function HexRain({ className = "", density = 0.5, speed = 0.4 }: HexRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let columns: { y: number; speed: number; chars: string[]; trailLength: number }[] = [];
    let dimensions = { w: 0, h: 0 };

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
      dimensions = { w: rect.width, h: rect.height };

      // Initialize columns
      const fontSize = 14;
      const colCount = Math.floor((rect.width / fontSize) * density);
      columns = Array.from({ length: colCount }).map(() => ({
        y: Math.random() * rect.height,
        speed: speed * (0.5 + Math.random() * 1.5),
        chars: Array.from({ length: 12 }).map(() => CHARS[Math.floor(Math.random() * CHARS.length)]),
        trailLength: 8 + Math.floor(Math.random() * 8),
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let lastTime = 0;
    const animate = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      const { w, h } = dimensions;
      // Faded background instead of clear — creates trail effect
      ctx.fillStyle = "rgba(10, 13, 20, 0.08)";
      ctx.fillRect(0, 0, w, h);

      const fontSize = 14;
      const colWidth = w / columns.length;

      ctx.font = `${fontSize}px JetBrains Mono, monospace`;
      ctx.textBaseline = "top";

      columns.forEach((col, i) => {
        const x = i * colWidth;
        // Draw trail
        for (let j = 0; j < col.trailLength; j++) {
          const charY = col.y - j * fontSize;
          if (charY < -fontSize || charY > h) continue;
          const ch = col.chars[j % col.chars.length];
          const fade = 1 - j / col.trailLength;
          if (j === 0) {
            // Head — bright cyan
            ctx.fillStyle = `rgba(0, 229, 255, ${0.7 * fade})`;
          } else {
            // Trail — fading blue
            ctx.fillStyle = `rgba(107, 143, 255, ${0.35 * fade})`;
          }
          ctx.fillText(ch, x, charY);
        }

        // Move down
        col.y += col.speed * dt * 0.06;

        // Mutate chars occasionally
        if (Math.random() < 0.05) {
          col.chars[0] = CHARS[Math.floor(Math.random() * CHARS.length)];
        }

        // Reset when off screen
        if (col.y - col.trailLength * fontSize > h) {
          col.y = -fontSize;
          col.speed = speed * (0.5 + Math.random() * 1.5);
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [density, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 opacity-20 ${className}`}
    />
  );
}
