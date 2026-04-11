"use client";

import React from "react";
import { motion } from "framer-motion";

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
    shadowHover: "0 0 32px rgba(107,143,255,0.18)",
    iconBg: "bg-brand-blue/10",
    iconColor: "text-brand-blue",
    titleColor: "text-brand-blue",
    glowColor: "rgba(107,143,255,0.12)",
  },
  cyan: {
    border: "border-brand-cyan/20",
    shadowHover: "0 0 32px rgba(0,229,255,0.18)",
    iconBg: "bg-brand-cyan/10",
    iconColor: "text-brand-cyan",
    titleColor: "text-brand-cyan",
    glowColor: "rgba(0,229,255,0.10)",
  },
  purple: {
    border: "border-brand-purple/20",
    shadowHover: "0 0 32px rgba(155,107,255,0.18)",
    iconBg: "bg-brand-purple/10",
    iconColor: "text-brand-purple",
    titleColor: "text-brand-purple",
    glowColor: "rgba(155,107,255,0.12)",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -6,
        boxShadow: styles.shadowHover,
        borderColor: styles.glowColor,
      }}
      className={`glass-card p-7 border border-white/[0.08] ${styles.border} transition-colors duration-300 group cursor-default`}
    >
      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.15, rotate: 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 ${styles.iconBg} ${styles.iconColor}`}
      >
        {icon}
      </motion.div>

      {/* Title */}
      <h3 className={`text-lg font-semibold mb-2.5 ${styles.titleColor} tracking-tight`}>
        {title}
      </h3>

      {/* Description */}
      <p className="text-brand-text/60 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
