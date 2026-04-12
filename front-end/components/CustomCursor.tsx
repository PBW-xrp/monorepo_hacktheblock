"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Custom cursor — a thin cyan ring that follows the mouse with spring delay,
 * plus a small dot at the exact mouse position.
 * Expands on hover over interactive elements (a, button, input, etc.)
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, { stiffness: 350, damping: 30, mass: 0.8 });
  const ringY = useSpring(dotY, { stiffness: 350, damping: 30, mass: 0.8 });

  useEffect(() => {
    // Disable on touch devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);

      // Detect if hovering over interactive element
      const target = e.target as HTMLElement;
      const interactive = target?.closest("a, button, input, select, textarea, [role='button'], canvas");
      setIsHovering(!!interactive);
    };

    const onDown = () => setIsClicking(true);
    const onUp = () => setIsClicking(false);
    const onLeave = () => {
      dotX.set(-100);
      dotY.set(-100);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);

    // Hide native cursor
    document.body.style.cursor = "none";

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.body.style.cursor = "";
    };
  }, [dotX, dotY]);

  if (!enabled) return null;

  return (
    <>
      {/* Outer ring with spring delay */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] mix-blend-difference"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          animate={{
            width: isClicking ? 24 : isHovering ? 48 : 32,
            height: isClicking ? 24 : isHovering ? 48 : 32,
            opacity: isHovering ? 0.9 : 0.6,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-full border border-brand-cyan"
          style={{
            boxShadow: "0 0 12px rgba(0,229,255,0.4)",
          }}
        />
      </motion.div>

      {/* Inner dot — exact mouse position */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999]"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          animate={{
            scale: isClicking ? 0.5 : isHovering ? 0 : 1,
          }}
          transition={{ duration: 0.15 }}
          className="w-1.5 h-1.5 rounded-full bg-brand-cyan"
          style={{ boxShadow: "0 0 8px rgba(0,229,255,0.8)" }}
        />
      </motion.div>
    </>
  );
}
