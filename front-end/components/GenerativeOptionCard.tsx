"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface GenerativeOptionCardProps {
  strike: number;
  vol: number;        // basis points (e.g. 4300 = 43%)
  expiryDays: number;
  isPut: boolean;
  size?: number;
}

/**
 * Deterministic seedable PRNG (mulberry32) — produces same output for same seed.
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * GenerativeOptionCard — produces unique SVG art from option parameters.
 * Same params → same art. Visual identity for each on-chain option.
 */
export default function GenerativeOptionCard({
  strike,
  vol,
  expiryDays,
  isPut,
  size = 200,
}: GenerativeOptionCardProps) {
  const art = useMemo(() => {
    // Hash params into a seed
    const seed = Math.floor(strike * 1000) ^ vol ^ (expiryDays * 7) ^ (isPut ? 0xff : 0x00);
    const rand = mulberry32(seed);

    const center = size / 2;
    const baseColor = isPut ? "#9b6bff" : "#00e5ff";
    const accentColor = isPut ? "#6b8fff" : "#6b8fff";

    // Generate orbits — count and complexity based on vol
    const orbitCount = 3 + Math.floor((vol / 10000) * 4);
    const orbits = Array.from({ length: orbitCount }).map((_, i) => {
      const radius = 25 + (i / orbitCount) * (size * 0.35);
      const points = 6 + Math.floor(rand() * 6);
      const rotation = rand() * 360;
      const dotCount = 3 + Math.floor(rand() * 4);
      const dotPositions = Array.from({ length: dotCount }).map(() => rand() * Math.PI * 2);
      return { radius, points, rotation, dotPositions };
    });

    // Generate connecting lines forming an inner geometric shape based on expiry
    const innerPoints = 3 + (expiryDays % 5);
    const innerRadius = size * 0.18;
    const innerVertices = Array.from({ length: innerPoints }).map((_, i) => {
      const angle = (i / innerPoints) * Math.PI * 2 - Math.PI / 2;
      return {
        x: center + Math.cos(angle) * innerRadius,
        y: center + Math.sin(angle) * innerRadius,
      };
    });

    return { orbits, innerVertices, baseColor, accentColor, center };
  }, [strike, vol, expiryDays, isPut, size]);

  return (
    <motion.div
      whileHover={{ scale: 1.04, rotate: isPut ? -1 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className="relative inline-block rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a0d14] to-[#0d1325] border border-white/10"
      style={{ width: size, height: size }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${art.baseColor}30 0%, transparent 70%)`,
        }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id={`grad-${strike}-${vol}`}>
            <stop offset="0%" stopColor={art.baseColor} stopOpacity="1" />
            <stop offset="100%" stopColor={art.baseColor} stopOpacity="0" />
          </radialGradient>
          <filter id={`glow-${strike}-${vol}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Orbits */}
        {art.orbits.map((orbit, i) => (
          <g key={`orbit-${i}`} transform={`rotate(${orbit.rotation} ${art.center} ${art.center})`}>
            <circle
              cx={art.center}
              cy={art.center}
              r={orbit.radius}
              fill="none"
              stroke={art.accentColor}
              strokeWidth="0.5"
              opacity={0.3 + (i / art.orbits.length) * 0.3}
            />
            {/* Dots on orbit */}
            {orbit.dotPositions.map((angle, j) => (
              <circle
                key={`dot-${i}-${j}`}
                cx={art.center + Math.cos(angle) * orbit.radius}
                cy={art.center + Math.sin(angle) * orbit.radius}
                r={1.5 + (i / art.orbits.length) * 1.5}
                fill={art.baseColor}
                filter={`url(#glow-${strike}-${vol})`}
              />
            ))}
          </g>
        ))}

        {/* Inner geometric shape */}
        <polygon
          points={art.innerVertices.map((v) => `${v.x},${v.y}`).join(" ")}
          fill="none"
          stroke={art.baseColor}
          strokeWidth="1.2"
          opacity="0.8"
          filter={`url(#glow-${strike}-${vol})`}
        />
        {art.innerVertices.map((v, i) => (
          <circle
            key={`vertex-${i}`}
            cx={v.x}
            cy={v.y}
            r="2.5"
            fill={art.baseColor}
            filter={`url(#glow-${strike}-${vol})`}
          />
        ))}

        {/* Center core */}
        <circle
          cx={art.center}
          cy={art.center}
          r="6"
          fill={`url(#grad-${strike}-${vol})`}
        />
        <circle
          cx={art.center}
          cy={art.center}
          r="2"
          fill={art.baseColor}
          filter={`url(#glow-${strike}-${vol})`}
        />
      </svg>

      {/* Footer label */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className={isPut ? "text-brand-purple" : "text-brand-cyan"}>
            {isPut ? "PUT" : "CALL"}
          </span>
          <span className="text-brand-text/60">${strike.toFixed(2)}</span>
          <span className="text-brand-text/40">{expiryDays}d</span>
        </div>
      </div>
    </motion.div>
  );
}
