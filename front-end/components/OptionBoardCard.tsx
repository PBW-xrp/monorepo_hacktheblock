"use client";

import { useRef, useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Clock, Wallet, ArrowUpRight } from "lucide-react";
import GenerativeOptionCard from "./GenerativeOptionCard";

interface OptionBoardCardProps {
  id: string;
  type: "CALL" | "PUT";
  strike: number;
  collateral: number;
  expiryEpoch: number;
  writer: string;
  buyer: string;
  spot?: number;
  index?: number;
  onSelect?: () => void;
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function formatTimeLeft(expiryEpoch: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = expiryEpoch - now;
  if (diff <= 0) return "expired";
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function OptionBoardCard({
  id,
  type,
  strike,
  collateral,
  expiryEpoch,
  writer,
  buyer,
  spot = 1.40,
  index = 0,
  onSelect,
}: OptionBoardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const rotateX = useSpring(useTransform(mouseY, [0, 320], [6, -6]), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [0, 280], [-6, 6]), { stiffness: 200, damping: 22 });

  const isCall = type === "CALL";
  const accentColor = isCall ? "#00e5ff" : "#9b6bff";
  const accentRgb = isCall ? "0,229,255" : "155,107,255";

  // Compute moneyness
  const intrinsic = isCall ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  const isItm = intrinsic > 0;
  const moneynessLabel = isItm ? "ITM" : "OTM";

  // Days until expiry for the generative art
  const expiryDays = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(1, Math.floor((expiryEpoch - now) / 86400));
  }, [expiryEpoch]);

  // Vol estimate from collateral (just for art seed variety)
  const volBps = useMemo(() => 3000 + ((Number(strike) * 1000 + collateral) % 5000), [strike, collateral]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-200);
    mouseY.set(-200);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
        boxShadow: isHovered ? `0 0 48px rgba(${accentRgb},0.25)` : "none",
      }}
      className="relative glass-card border border-white/[0.08] rounded-2xl overflow-hidden cursor-pointer group transition-shadow duration-300"
    >
      {/* Animated rotating border conic gradient */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"
        style={{
          background: `conic-gradient(from var(--angle, 0deg), transparent 0deg, rgba(${accentRgb},0.5) 60deg, transparent 120deg)`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
          animation: "spin-border 4s linear infinite",
        }}
      />

      {/* Spotlight that follows the cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(360px circle at ${x}px ${y}px, rgba(${accentRgb},0.18), transparent 50%)`
          ),
        }}
      />

      {/* Header */}
      <div className="relative p-5 pb-3 flex items-start justify-between" style={{ transform: "translateZ(15px)" }}>
        <div className="flex items-center gap-3">
          {/* Mini generative art icon */}
          <div className="shrink-0 -m-2">
            <GenerativeOptionCard
              strike={strike}
              vol={volBps}
              expiryDays={expiryDays}
              isPut={!isCall}
              size={64}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{
                  color: accentColor,
                  background: `rgba(${accentRgb},0.1)`,
                  border: `1px solid rgba(${accentRgb},0.3)`,
                }}
              >
                {type}
              </span>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  isItm
                    ? "text-green-400 bg-green-400/10 border border-green-400/30"
                    : "text-brand-text/40 bg-white/5 border border-white/10"
                }`}
              >
                {moneynessLabel}
              </span>
            </div>
            <p className="text-xl font-bold text-brand-text font-mono tracking-tight">
              ${strike.toFixed(2)}
            </p>
            <p className="text-[10px] text-brand-text/30 font-mono">strike price</p>
          </div>
        </div>

        <ArrowUpRight
          className="w-4 h-4 text-brand-text/30 group-hover:text-brand-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
        />
      </div>

      {/* Stats grid */}
      <div className="relative px-5 pb-4 grid grid-cols-2 gap-3" style={{ transform: "translateZ(10px)" }}>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Wallet className="w-3 h-3 text-brand-text/30" />
            <p className="text-[9px] text-brand-text/40 uppercase tracking-wider">Collateral</p>
          </div>
          <p className="text-sm font-mono font-semibold text-brand-text">
            {collateral.toLocaleString()} <span className="text-[10px] text-brand-text/40">XRP</span>
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className="w-3 h-3 text-brand-text/30" />
            <p className="text-[9px] text-brand-text/40 uppercase tracking-wider">Expires in</p>
          </div>
          <p className="text-sm font-mono font-semibold" style={{ color: accentColor }}>
            {formatTimeLeft(expiryEpoch)}
          </p>
        </div>
      </div>

      {/* Footer addresses */}
      <div className="relative border-t border-white/[0.05] px-5 py-3 flex items-center justify-between text-[10px] font-mono text-brand-text/40">
        <span>writer <span className="text-brand-text/60">{shortAddr(writer)}</span></span>
        <span>buyer <span className="text-brand-text/60">{shortAddr(buyer)}</span></span>
      </div>

      {/* Bottom glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 opacity-30 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          boxShadow: `0 0 12px ${accentColor}`,
        }}
      />

      {/* Hidden id for keying */}
      <span className="hidden">{id}</span>
    </motion.div>
  );
}
