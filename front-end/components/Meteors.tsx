"use client";

import { useMemo } from "react";

interface MeteorsProps {
  number?: number;
  className?: string;
}

/**
 * Meteor shower effect — diagonal animated streaks.
 * Inspired by Aceternity UI meteors, pure CSS animations.
 */
export default function Meteors({ number = 20, className = "" }: MeteorsProps) {
  const meteors = useMemo(() => {
    return Array.from({ length: number }).map((_, idx) => ({
      id: idx,
      top: Math.floor(Math.random() * 100),
      left: Math.floor(Math.random() * 100),
      delay: (Math.random() * 5).toFixed(2),
      duration: (Math.random() * 6 + 4).toFixed(2),
    }));
  }, [number]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {meteors.map((m) => (
        <span
          key={m.id}
          className="absolute h-0.5 w-0.5 rounded-full bg-brand-text/40 rotate-[215deg]"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            animationName: "meteor",
            animationIterationCount: "infinite",
            animationTimingFunction: "linear",
          }}
        >
          <span className="absolute top-1/2 left-0 h-[1px] w-[60px] -translate-y-1/2 bg-gradient-to-r from-brand-text/30 to-transparent" />
        </span>
      ))}

      <style jsx>{`
        @keyframes meteor {
          0% {
            transform: rotate(215deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(215deg) translateX(-500px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
