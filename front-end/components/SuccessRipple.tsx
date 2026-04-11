"use client";

import { motion } from "framer-motion";

interface SuccessRippleProps {
  /** Trigger key — change this to fire the animation again */
  triggerKey?: string | number;
  className?: string;
}

/**
 * Expanding rings + radial flash celebration effect.
 * Designed to be absolutely positioned over a success card.
 */
export default function SuccessRipple({ triggerKey, className = "" }: SuccessRippleProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Radial flash */}
      <motion.div
        key={`flash-${triggerKey}`}
        initial={{ opacity: 0.8, scale: 0.5 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,229,255,0.6) 0%, rgba(0,229,255,0.2) 30%, transparent 70%)",
        }}
      />

      {/* Expanding rings */}
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={`ring-${i}-${triggerKey}`}
          initial={{ opacity: 1, scale: 0.3 }}
          animate={{ opacity: 0, scale: 3 }}
          transition={{ duration: 1.4, delay, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-brand-cyan"
        />
      ))}

      {/* Burst particles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 120;
        return (
          <motion.div
            key={`particle-${i}-${triggerKey}`}
            initial={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
            }}
            animate={{
              opacity: 0,
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: 0.3,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-brand-cyan"
            style={{
              boxShadow: "0 0 12px rgba(0,229,255,0.8)",
            }}
          />
        );
      })}
    </div>
  );
}
