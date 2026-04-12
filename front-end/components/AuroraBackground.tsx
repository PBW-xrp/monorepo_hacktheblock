"use client";

import { motion } from "framer-motion";

/**
 * Aurora background — extremely subtle on warm beige.
 * Just a hint of green and warmth moving slowly.
 */
export default function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Warm green wash */}
      <motion.div
        className="absolute -top-1/2 -left-1/4 w-[140%] h-[140%]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(42,171,99,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
          willChange: "transform",
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Warm beige accent */}
      <motion.div
        className="absolute top-1/3 right-0 w-[50%] h-[50%]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,0.02) 0%, transparent 70%)",
          filter: "blur(50px)",
          willChange: "transform",
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
