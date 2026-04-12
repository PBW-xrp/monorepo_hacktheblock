"use client";

import { useEffect, useState } from "react";

interface QuoteCountdownProps {
  /** Unix timestamp (ms) when the quote expires */
  validUntil: number;
  /** Total duration of the quote in ms (default 30s) */
  duration?: number;
}

/**
 * Circular countdown ring that drains from full → empty as the quote expires.
 * Built with SVG strokeDasharray.
 */
export default function QuoteCountdown({ validUntil, duration = 30000 }: QuoteCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, validUntil - now);
  const fraction = Math.max(0, Math.min(1, remaining / duration));
  const seconds = Math.ceil(remaining / 1000);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  // Color shifts as time runs out: cyan → blue → purple → red
  const color =
    fraction > 0.5 ? "#2aab63" :
    fraction > 0.3 ? "#25292E" :
    fraction > 0.15 ? "#FF494A" :
    "#ff5577";

  const expired = remaining <= 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="44" height="44" viewBox="0 0 44 44">
        {/* Background ring */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2.5"
        />
        {/* Progress ring */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 22 22)"
          style={{
            transition: "stroke-dashoffset 0.1s linear, stroke 0.3s",
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-xs font-mono font-bold tabular-nums"
          style={{ color: expired ? "#ff5577" : color, textShadow: `0 0 8px ${color}80` }}
        >
          {expired ? "0s" : `${seconds}s`}
        </span>
      </div>
    </div>
  );
}
