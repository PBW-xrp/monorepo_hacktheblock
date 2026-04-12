"use client";

import { useEffect, useState } from "react";

interface ComputingValueProps {
  /** The final value to display */
  value: number | string;
  /** How many "scrambling" frames before settling */
  scrambleFrames?: number;
  /** Delay before starting */
  delay?: number;
  className?: string;
}

const SCRAMBLE_CHARS = "0123456789ABCDEF";

/**
 * Displays a value with a "computing" / scramble effect — characters cycle
 * randomly before settling on the final value. Mimics the look of a ZK proof
 * being computed in real-time.
 */
export default function ComputingValue({
  value,
  scrambleFrames = 14,
  delay = 0,
  className = "",
}: ComputingValueProps) {
  const target = String(value);
  const [display, setDisplay] = useState<string>(target.replace(/[0-9A-Fa-f]/g, "0"));
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(false);
    let frame = 0;
    let raf: number;
    const start = performance.now() + delay;

    const tick = (now: number) => {
      if (now < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (frame >= scrambleFrames) {
        setDisplay(target);
        setDone(true);
        return;
      }
      const progress = frame / scrambleFrames;
      // As progress increases, more characters lock in to the target
      const lockedCount = Math.floor(target.length * progress);
      let next = "";
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (i < lockedCount || /[^0-9A-Fa-f]/.test(ch)) {
          next += ch;
        } else {
          next += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      setDisplay(next);
      frame++;
      setTimeout(() => {
        raf = requestAnimationFrame(tick);
      }, 50);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, scrambleFrames, delay]);

  return (
    <span className={className} style={{ opacity: done ? 1 : 0.85 }}>
      {display}
    </span>
  );
}
