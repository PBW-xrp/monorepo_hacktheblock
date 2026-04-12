"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Layers, Filter } from "lucide-react";
import OptionBoardCard from "@/components/OptionBoardCard";
import AuroraBackground from "@/components/AuroraBackground";

type OptionListing = {
  id: string;
  type: "CALL" | "PUT";
  strike: number;
  collateral: number;
  expiryEpoch: number;
  writer: string;
  buyer: string;
  ledgerIndex: number;
  isMock?: boolean;
};

type OptionsResponse = {
  options: OptionListing[];
  count: number;
  isMock: boolean;
};

const REFRESH_INTERVAL = 15_000;
const SPOT_PRICE = 1.40;

export default function BoardPage() {
  const [data, setData] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "CALL" | "PUT">("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchOptions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/options");
      if (!res.ok) throw new Error("Failed to fetch options");
      const json: OptionsResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
    const timer = setInterval(() => fetchOptions(true), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchOptions]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "ALL") return data.options;
    return data.options.filter((o) => o.type === filter);
  }, [data, filter]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, calls: 0, puts: 0, totalCollateral: 0 };
    const calls = data.options.filter((o) => o.type === "CALL").length;
    const puts = data.options.filter((o) => o.type === "PUT").length;
    const totalCollateral = data.options.reduce((sum, o) => sum + o.collateral, 0);
    return { total: data.options.length, calls, puts, totalCollateral };
  }, [data]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text relative overflow-hidden">
      {/* Aurora background */}
      <AuroraBackground />

      {/* Nav */}
      <nav className="relative border-b border-black/10 px-6 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-brand-muted hover:text-brand-text transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <span className="font-semibold text-brand-text">VeraFi</span>
        <span className="text-brand-muted/60">·</span>
        <span className="text-sm text-brand-muted">Option Board</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-brand-bg border border-black/15 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            <span className="text-xs text-brand-muted font-mono">XRPL groth5</span>
          </div>
        </div>
      </nav>

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-brand-text flex items-center gap-3 mb-1">
              <Layers className="w-7 h-7 text-brand-cyan" />
              Option Board
            </h1>
            <p className="text-brand-muted text-sm">
              Live escrows on XRPL groth5 devnet · spot ${SPOT_PRICE.toFixed(2)}
              {data?.isMock && (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-brand-purple/70 bg-brand-purple/10 border border-brand-purple/20 rounded px-1.5 py-0.5">
                  demo data
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => fetchOptions(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors glass-card px-4 py-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand-cyan" : ""}`} />
            Refresh
          </button>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {[
            { label: "Active Options", value: stats.total.toString(), color: "#25292E" },
            { label: "Calls", value: stats.calls.toString(), color: "#2aab63" },
            { label: "Puts", value: stats.puts.toString(), color: "#FF494A" },
            { label: "Total TVL", value: `${stats.totalCollateral.toLocaleString()} XRP`, color: "#25292E" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
              className="glass-card px-4 py-3"
            >
              <p className="text-[10px] text-brand-muted uppercase tracking-widest">{s.label}</p>
              <p
                className="text-xl font-bold font-mono mt-0.5"
                style={{ color: s.color, textShadow: `0 0 12px ${s.color}40` }}
              >
                {s.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-2 mb-6"
        >
          <Filter className="w-4 h-4 text-brand-muted/60" />
          <span className="text-xs text-brand-muted uppercase tracking-widest mr-2">Filter</span>
          {(["ALL", "CALL", "PUT"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                filter === f
                  ? f === "CALL"
                    ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/40 shadow-[0_0_16px_rgba(42,171,99,0.2)]"
                    : f === "PUT"
                    ? "bg-brand-purple/15 text-brand-purple border border-brand-purple/40 shadow-[0_0_16px_rgba(255,73,74,0.2)]"
                    : "bg-brand-blue/15 text-brand-blue border border-brand-blue/40 shadow-[0_0_16px_rgba(42,171,99,0.2)]"
                  : "border border-white/10 text-brand-muted hover:text-brand-text/80 hover:border-white/20"
              }`}
            >
              {f}
            </button>
          ))}
        </motion.div>

        {/* Cards grid */}
        {loading ? (
          <div className="glass-card p-16 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin" />
            <p className="text-brand-muted text-sm">Loading escrows from groth5…</p>
          </div>
        ) : error ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3 border border-red-400/20">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => fetchOptions()}
              className="text-xs text-brand-muted hover:text-brand-text transition-colors underline"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-surface border border-black/15 flex items-center justify-center">
              <Layers className="w-6 h-6 text-brand-muted/40" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-brand-muted">
                {data?.isMock ? "No options match this filter" : "No live escrows found yet"}
              </p>
              <p className="text-sm text-brand-muted/40 mt-1">
                {data?.isMock
                  ? "Try a different type or refresh."
                  : "Create one from /write or enable NEXT_PUBLIC_ENABLE_MOCK_OPTIONS=true for demo fallback."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((opt, i) => (
              <OptionBoardCard
                key={opt.id}
                {...opt}
                index={i}
                spot={SPOT_PRICE}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-brand-muted/40 text-center mt-8">
          Auto-refreshes every 15s · Showing {filtered.length} option{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
