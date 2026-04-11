"use client";

import { motion } from "framer-motion";

/**
 * Aurora background — animated gradient blobs with blur.
 * Lightweight version: 2 layers, lower blur, longer durations.
 */
export default function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Aurora layer 1 — blue/cyan */}
      <motion.div
        className="absolute -top-1/2 -left-1/4 w-[140%] h-[140%]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(107,143,255,0.18) 0%, rgba(0,229,255,0.12) 30%, transparent 70%)",
          filter: "blur(60px)",
          willChange: "transform",
        }}
        animate={{
          x: [0, 80, 0],
          y: [0, -60, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Aurora layer 2 — purple/blue */}
      <motion.div
        className="absolute top-1/3 right-0 w-[70%] h-[70%]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(155,107,255,0.16) 0%, rgba(107,143,255,0.1) 40%, transparent 70%)",
          filter: "blur(70px)",
          willChange: "transform",
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 0.95, 1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
