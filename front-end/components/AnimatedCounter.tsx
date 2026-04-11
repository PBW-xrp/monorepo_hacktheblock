"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Counter that animates from 0 (or previous value) to the target value.
 * Uses Framer Motion's spring for a natural, weighted feel.
 */
export default function AnimatedCounter({
  value,
  decimals = 4,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 90,
    damping: 22,
    mass: 1.2,
  });
  const display = useTransform(spring, (current) => {
    return prefix + current.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;
  });

  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return display.on("change", (latest) => {
      if (ref.current) ref.current.textContent = latest;
    });
  }, [display]);

  return (
    <motion.span ref={ref} className={className}>
      {prefix}{(0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </motion.span>
  );
}
