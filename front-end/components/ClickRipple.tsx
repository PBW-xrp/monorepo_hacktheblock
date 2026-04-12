"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/**
 * Global click ripple effect — every click anywhere on the page leaves
 * an expanding cyan ring at the cursor position. Auto-cleans up.
 */
export default function ClickRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    let counter = 0;

    const onClick = (e: MouseEvent) => {
      // Skip clicks on canvas (R3F handles its own) and inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "CANVAS" || target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      const id = counter++;
      const ripple: Ripple = { id, x: e.clientX, y: e.clientY };
      setRipples((prev) => [...prev, ripple]);

      // Auto-cleanup after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 800);
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ opacity: 0.7, scale: 0 }}
            animate={{ opacity: 0, scale: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute w-16 h-16 rounded-full border-2 border-brand-cyan"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 20px rgba(0,229,255,0.5)",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
