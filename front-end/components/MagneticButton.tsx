"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** Max pixels the element can move from its origin */
  maxDistance?: number;
}

/**
 * Global magnetic effect — the element always leans toward the cursor,
 * no matter where on screen it is. Closer = stronger pull.
 * Never leaves its original position beyond maxDistance.
 */
export default function MagneticButton({ children, className = "", maxDistance = 12 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 150, damping: 20, mass: 0.5 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Strength falls off with distance — closer = stronger
      // At 0px away: full maxDistance. At 800px+ away: ~1-2px lean.
      const strength = maxDistance / (1 + distance * 0.004);

      const angle = Math.atan2(dy, dx);
      x.set(Math.cos(angle) * strength);
      y.set(Math.sin(angle) * strength);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y, maxDistance]);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}
