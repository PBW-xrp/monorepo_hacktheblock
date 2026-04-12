"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  glowColor: "blue" | "cyan" | "purple";
  delay?: number;
}

const glowMap = {
  blue: {
    border: "border-brand-blue/20",
    shadowHover: "0 0 48px rgba(107,143,255,0.25)",
    iconBg: "bg-brand-blue/10",
    iconColor: "text-brand-blue",
    titleColor: "text-brand-blue",
    spotlightColor: "rgba(107,143,255,0.18)",
    borderRgb: "107,143,255",
  },
  cyan: {
    border: "border-brand-cyan/20",
    shadowHover: "0 0 48px rgba(0,229,255,0.25)",
    iconBg: "bg-brand-cyan/10",
    iconColor: "text-brand-cyan",
    titleColor: "text-brand-cyan",
    spotlightColor: "rgba(0,229,255,0.16)",
    borderRgb: "0,229,255",
  },
  purple: {
    border: "border-brand-purple/20",
    shadowHover: "0 0 48px rgba(155,107,255,0.25)",
    iconBg: "bg-brand-purple/10",
    iconColor: "text-brand-purple",
    titleColor: "text-brand-purple",
    spotlightColor: "rgba(155,107,255,0.18)",
    borderRgb: "155,107,255",
  },
};

export default function FeatureCard({
  icon,
  title,
  description,
  glowColor,
  delay = 0,
}: FeatureCardProps) {
  const styles = glowMap[glowColor];
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse position tracking for spotlight
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  // 3D tilt — spring-smoothed
  const rotateX = useSpring(useTransform(mouseY, [0, 300], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 350], [-8, 8]), { stiffness: 200, damping: 20 });

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-200);
    mouseY.set(-200);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
        boxShadow: isHovered ? styles.shadowHover : "none",
      }}
      className={`relative glass-card p-7 border border-white/[0.08] ${styles.border} transition-shadow duration-300 cursor-default overflow-hidden group`}
    >
      {/* Spotlight gradient that follows the cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(360px circle at ${x}px ${y}px, ${styles.spotlightColor}, transparent 50%)`
          ),
        }}
      />

      {/* Animated rotating border gradient */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{
          background: `conic-gradient(from var(--angle, 0deg), transparent 0deg, rgba(${styles.borderRgb},0.4) 60deg, transparent 120deg)`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
          animation: "spin-border 4s linear infinite",
        }}
      />

      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.15, rotate: 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`relative inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 ${styles.iconBg} ${styles.iconColor}`}
        style={{ transform: "translateZ(20px)" }}
      >
        {icon}
      </motion.div>

      {/* Title */}
      <h3
        className={`relative text-lg font-semibold mb-2.5 ${styles.titleColor} tracking-tight`}
        style={{ transform: "translateZ(15px)" }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="relative text-brand-text/60 text-sm leading-relaxed"
        style={{ transform: "translateZ(10px)" }}
      >
        {description}
      </p>

      <style jsx>{`
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spin-border {
          to {
            --angle: 360deg;
          }
        }
      `}</style>
    </motion.div>
  );
}
