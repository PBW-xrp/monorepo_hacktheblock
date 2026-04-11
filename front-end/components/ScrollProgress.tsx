"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Thin gradient progress bar at the top of the page showing scroll position.
 * Spring-smoothed for organic motion.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[9997] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #6b8fff 0%, #00e5ff 50%, #9b6bff 100%)",
        boxShadow: "0 0 12px rgba(0,229,255,0.6)",
      }}
    />
  );
}
