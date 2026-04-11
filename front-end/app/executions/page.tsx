"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ExternalLink, Shield, Activity } from "lucide-react";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const GROTH5_EXPLORER = "http://custom.xrpl.org/groth5.devnet.rippletest.net";
const REFRESH_INTERVAL = 10_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type LedgerTx = {
  type: string;
  account: string;
  destination?: string;
  amount?: string;
  hash: string;
  ledgerIndex: number;
  timestamp: string;
  meta?: string;
};

type EventsResponse = {
  ledgerIndex: number;
  closeTime: string;
  transactions: LedgerTx[];
  count: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function shortAddr(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function shortHash(hash: string) {
  if (!hash || hash.length < 16) return hash;
  return hash.slice(0, 8) + "…" + hash.slice(-6);
}

function txTypeBadge(type: string) {
  switch (type) {
    case "EscrowCreate":
      return { label: "ESCROW CREATE", color: "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20" };
    case "EscrowFinish":
      return { label: "ESCROW FINISH", color: "bg-green-500/10 text-green-400 border-green-500/20" };
    case "EscrowCancel":
      return { label: "ESCROW CANCEL", color: "bg-red-500/10 text-red-400 border-red-500/20" };
    case "Payment":
      return { label: "PAYMENT", color: "bg-brand-blue/10 text-brand-blue border-brand-blue/20" };
    case "OfferCreate":
      return { label: "OFFER", color: "bg-brand-purple/10 text-brand-purple border-brand-purple/20" };
    default:
      return { label: type.toUpperCase(), color: "bg-white/5 text-brand-text/50 border-white/10" };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ExecutionsPage() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch ledger data.");
      const json: EventsResponse = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const timer = setInterval(() => fetchEvents(true), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchEvents]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-brand-text/50 hover:text-brand-text transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <span className="font-semibold text-brand-text">VeraFi</span>
        <span className="text-brand-text/30">·</span>
        <span className="text-sm text-brand-text/50">Live Feed</span>
        <div className="ml-auto flex items-center gap-3">
          {data?.ledgerIndex && (
            <span className="text-xs text-brand-text/30 font-mono hidden sm:block">
              ledger #{data.ledgerIndex.toLocaleString()}
            </span>
          )}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            <span className="text-xs text-brand-text/50 font-mono">XRPL groth5</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-text flex items-center gap-3">
              <Activity className="w-6 h-6 text-brand-cyan" />
              Live Execution Feed
            </h1>
            <p className="text-brand-text/40 text-sm mt-1">
              Real-time transactions from XRPL groth5 devnet
            </p>
          </div>
          <button
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-brand-text/50 hover:text-brand-text transition-colors glass-card px-4 py-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand-cyan" : ""}`} />
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Refresh"}
          </button>
        </div>

        {/* Network badge */}
        <div className="glass-card px-5 py-3 flex items-center gap-3 mb-6 border border-brand-blue/10">
          <Shield className="w-4 h-4 text-brand-blue shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-brand-text/40">XRPL groth5 Devnet · </span>
            <span className="font-mono text-xs text-brand-blue/80">
              wss://groth5.devnet.rippletest.net:51233
            </span>
          </div>
          <a
            href={GROTH5_EXPLORER}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-text/30 hover:text-brand-text/70 transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="glass-card p-16 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin" />
            <p className="text-brand-text/40 text-sm">Querying XRPL groth5 devnet…</p>
          </div>
        ) : error ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3 border border-red-400/20">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => fetchEvents()}
              className="text-xs text-brand-text/50 hover:text-brand-text transition-colors underline"
            >
              Try again
            </button>
          </div>
        ) : !data || data.transactions.length === 0 ? (
          <div className="glass-card p-16 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
              <Activity className="w-6 h-6 text-brand-text/20" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-brand-text/40">No transactions in latest ledger</p>
              <p className="text-sm text-brand-text/20 mt-1">
                Transactions will appear here as they hit the groth5 devnet.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Table header */}
            <div className="grid grid-cols-6 gap-4 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-brand-text/30">
              <span>Type</span>
              <span>From</span>
              <span>To</span>
              <span>Amount</span>
              <span>Ledger</span>
              <span>Tx</span>
            </div>

            {data.transactions.map((tx, i) => {
              const badge = txTypeBadge(tx.type);
              return (
                <div
                  key={tx.hash + i}
                  className="glass-card px-5 py-4 grid grid-cols-6 gap-4 items-center hover:border-brand-blue/20 transition-colors"
                >
                  {/* Type */}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg w-fit border ${badge.color}`}>
                    {badge.label}
                  </span>

                  {/* From */}
                  <span className="font-mono text-xs text-brand-text/50">
                    {shortAddr(tx.account)}
                  </span>

                  {/* To */}
                  <span className="font-mono text-xs text-brand-text/50">
                    {tx.destination ? shortAddr(tx.destination) : "—"}
                  </span>

                  {/* Amount */}
                  <span className="font-mono text-sm text-brand-cyan">
                    {tx.amount || "—"}
                  </span>

                  {/* Ledger */}
                  <span className="font-mono text-xs text-brand-text/30">
                    #{tx.ledgerIndex}
                  </span>

                  {/* Tx link */}
                  <a
                    href={`${GROTH5_EXPLORER}/transactions/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono text-xs text-brand-blue/70 hover:text-brand-blue transition-colors"
                  >
                    {shortHash(tx.hash)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              );
            })}

            <p className="text-xs text-brand-text/20 text-center mt-2">
              Auto-refreshes every 10s · {data.count} transaction{data.count !== 1 ? "s" : ""} in ledger #{data.ledgerIndex}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
