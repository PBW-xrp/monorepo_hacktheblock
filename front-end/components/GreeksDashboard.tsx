"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface GreeksDashboardProps {
  delta: number;
  vega: number;
  spot: number;
  strike: number;
  isPut: boolean;
  vol: number;
  rate: number;
  expiryYears: number;
}

// ─── Black-Scholes (mirror of /api/quote) ───────────────────────────────────
function bs(S: number, K: number, T: number, r: number, sigma: number, isPut: boolean): number {
  if (T <= 0) return Math.max(0, isPut ? K - S : S - K);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const N = (x: number) => {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const t = 1 / (1 + p * Math.abs(x));
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1 + sign * y);
  };
  if (isPut) return K * Math.exp(-r * T) * N(-d2) - S * N(-d1);
  return S * N(d1) - K * Math.exp(-r * T) * N(d2);
}

function deltaFn(S: number, K: number, T: number, r: number, sigma: number, isPut: boolean): number {
  const dS = 0.001;
  return (bs(S + dS, K, T, r, sigma, isPut) - bs(S - dS, K, T, r, sigma, isPut)) / (2 * dS);
}

function vegaFn(S: number, K: number, T: number, r: number, sigma: number, isPut: boolean): number {
  const dSig = 0.001;
  return (bs(S, K, T, r, sigma + dSig, isPut) - bs(S, K, T, r, sigma - dSig, isPut)) / (2 * dSig);
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────
interface TooltipPayload {
  payload?: { spot?: number };
  value?: number;
}
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: number }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#0a0d14]/95 border border-white/10 rounded-lg px-3 py-2 backdrop-blur-sm shadow-xl">
      <p className="text-[10px] text-brand-text/40 font-mono uppercase">spot</p>
      <p className="text-xs text-brand-cyan font-mono font-semibold">${typeof label === "number" ? label.toFixed(2) : label}</p>
      <p className="text-[10px] text-brand-text/40 font-mono uppercase mt-1">value</p>
      <p className="text-xs text-brand-text font-mono font-semibold">{payload[0]?.value?.toFixed(4)}</p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function GreeksDashboard({
  delta,
  vega,
  spot,
  strike,
  isPut,
  vol,
  rate,
  expiryYears,
}: GreeksDashboardProps) {
  // Generate delta and vega curves across spot range for visualization
  const { deltaCurve, vegaCurve } = useMemo(() => {
    const samples = 40;
    const spotMin = strike * 0.5;
    const spotMax = strike * 1.5;
    const step = (spotMax - spotMin) / samples;
    const dCurve: { spot: number; delta: number }[] = [];
    const vCurve: { spot: number; vega: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const s = spotMin + i * step;
      dCurve.push({ spot: parseFloat(s.toFixed(3)), delta: deltaFn(s, strike, expiryYears, rate, vol, isPut) });
      vCurve.push({ spot: parseFloat(s.toFixed(3)), vega: vegaFn(s, strike, expiryYears, rate, vol, isPut) });
    }
    return { deltaCurve: dCurve, vegaCurve: vCurve };
  }, [strike, isPut, vol, rate, expiryYears]);

  // Delta gauge data: |delta| as % of 1 (max sensitivity)
  const deltaPct = Math.min(100, Math.abs(delta) * 100);
  const deltaGaugeData = [
    { name: "delta", value: deltaPct, fill: "#00e5ff" },
  ];

  // Vega: scale to a percentage (cap at ~0.5 = max for visualization)
  const vegaScaled = Math.min(100, Math.abs(vega) * 200);
  const vegaGaugeData = [
    { name: "vega", value: vegaScaled, fill: "#9b6bff" },
  ];

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-text/40">Greeks</p>
        <p className="text-[10px] text-brand-text/30 font-mono">spot ${spot.toFixed(2)} · strike ${strike.toFixed(2)}</p>
      </div>

      {/* Two radial gauges side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Delta gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-white/[0.03] rounded-xl p-3 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30" style={{
            background: "radial-gradient(circle at 50% 60%, rgba(0,229,255,0.15) 0%, transparent 70%)"
          }} />
          <p className="text-[10px] text-brand-text/40 uppercase tracking-wider font-semibold relative">Delta</p>
          <div className="relative h-[90px] -mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="65%"
                innerRadius="65%"
                outerRadius="100%"
                barSize={8}
                data={deltaGaugeData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{ fill: "rgba(255,255,255,0.05)" }}
                  dataKey="value"
                  cornerRadius={4}
                  fill="#00e5ff"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
              <div className="text-center">
                <p className="text-xl font-bold text-brand-cyan font-mono leading-none" style={{ textShadow: "0 0 12px rgba(0,229,255,0.5)" }}>
                  {delta.toFixed(2)}
                </p>
                <p className="text-[9px] text-brand-text/40 mt-0.5">price sensitivity</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vega gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative bg-white/[0.03] rounded-xl p-3 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30" style={{
            background: "radial-gradient(circle at 50% 60%, rgba(155,107,255,0.15) 0%, transparent 70%)"
          }} />
          <p className="text-[10px] text-brand-text/40 uppercase tracking-wider font-semibold relative">Vega</p>
          <div className="relative h-[90px] -mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="65%"
                innerRadius="65%"
                outerRadius="100%"
                barSize={8}
                data={vegaGaugeData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{ fill: "rgba(255,255,255,0.05)" }}
                  dataKey="value"
                  cornerRadius={4}
                  fill="#9b6bff"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
              <div className="text-center">
                <p className="text-xl font-bold text-brand-purple font-mono leading-none" style={{ textShadow: "0 0 12px rgba(155,107,255,0.5)" }}>
                  {vega.toFixed(3)}
                </p>
                <p className="text-[9px] text-brand-text/40 mt-0.5">vol sensitivity</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delta curve area chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white/[0.03] rounded-xl p-3"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-brand-text/40 uppercase tracking-wider font-semibold">Delta vs Spot</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
            <span className="text-[9px] text-brand-text/30 font-mono">current</span>
          </div>
        </div>
        <div className="h-[110px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={deltaCurve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="deltaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="spot"
                tick={{ fill: "#f0f4ff40", fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: "#ffffff10" }}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis hide domain={[isPut ? -1 : 0, isPut ? 0 : 1]} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#00e5ff40", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="delta"
                stroke="#00e5ff"
                strokeWidth={2}
                fill="url(#deltaGrad)"
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Vega curve area chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white/[0.03] rounded-xl p-3"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-brand-text/40 uppercase tracking-wider font-semibold">Vega vs Spot</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
            <span className="text-[9px] text-brand-text/30 font-mono">peak at strike</span>
          </div>
        </div>
        <div className="h-[110px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={vegaCurve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="vegaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9b6bff" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#9b6bff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="spot"
                tick={{ fill: "#f0f4ff40", fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: "#ffffff10" }}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#9b6bff40", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="vega"
                stroke="#9b6bff"
                strokeWidth={2}
                fill="url(#vegaGrad)"
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
