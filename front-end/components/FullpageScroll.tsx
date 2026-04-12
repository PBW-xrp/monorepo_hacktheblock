"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FullpageScrollProps {
  children: ReactNode[];
}

/**
 * Fullpage section-by-section scroll.
 * Each wheel/touch event moves exactly one section. Locked during transition.
 * No Lenis, no CSS snap — pure JS control.
 */
export default function FullpageScroll({ children }: FullpageScrollProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartY = useRef(0);
  const total = children.length;

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating) return;
      if (index < 0 || index >= total) return;
      setIsAnimating(true);
      setCurrent(index);
      // Unlock after transition completes
      setTimeout(() => setIsAnimating(false), 900);
    },
    [isAnimating, total]
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Wheel handler — one section per scroll
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimating) return;
      if (e.deltaY > 20) goNext();
      else if (e.deltaY < -20) goPrev();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [isAnimating, goNext, goPrev]);

  // Touch handler — swipe up/down
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimating) return;
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (delta > 50) goNext();
      else if (delta < -50) goPrev();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isAnimating, goNext, goPrev]);

  // Keyboard handler — arrow keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-brand-bg">
      {/* Section dots — right side */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 border border-black transition-all duration-300 ${
              i === current ? "bg-brand-green w-2 h-4" : "bg-brand-surface hover:bg-brand-muted"
            }`}
            aria-label={`Go to section ${i + 1}`}
          />
        ))}
      </div>

      {/* Animated section transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="h-screen w-screen flex items-center justify-center overflow-hidden"
        >
          <div className="w-full max-h-screen overflow-y-auto">
            {children[current]}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
