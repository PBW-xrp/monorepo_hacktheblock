"use client";

import Link from "next/link";
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { useWallet, WalletId } from "@/contexts/WalletContext";

// ---------------------------------------------------------------------------
// Wallet definitions
// ---------------------------------------------------------------------------
const WALLETS: { id: WalletId; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "otsu",
    label: "Otsu Wallet",
    description: "Browser extension (recommended)",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
        <rect width="40" height="40" rx="10" fill="#1A1F36" />
        <circle cx="20" cy="20" r="8" fill="none" stroke="#00e5ff" strokeWidth="2" />
        <circle cx="20" cy="20" r="3" fill="#00e5ff" />
      </svg>
    ),
  },
  {
    id: "crossmark",
    label: "Crossmark",
    description: "Browser extension wallet",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
        <rect width="40" height="40" rx="10" fill="#1A1F36" />
        <path d="M13 13L27 27M27 13L13 27" stroke="#9b6bff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "xaman",
    label: "Xaman",
    description: "Mobile wallet (QR code)",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
        <rect width="40" height="40" rx="10" fill="#1A1F36" />
        <path d="M12 28L20 12L28 28H22.5L20 22.5L17.5 28H12Z" fill="#6b8fff" />
        <circle cx="20" cy="20" r="3" fill="#00e5ff" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function WalletConnectPanel() {
  const { state, connect, disconnect } = useWallet();

  // ── Connected ──────────────────────────────────────────────────────────────
  if (state.status === "connected") {
    return (
      <div className="glass-card p-8 flex flex-col items-center gap-5 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-brand-cyan/10 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-brand-cyan" />
        </div>
        <div className="text-center">
          <p className="text-brand-text/60 text-sm mb-1">Connected via</p>
          <p className="font-semibold text-brand-text capitalize">{state.wallet}</p>
        </div>
        <div className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-brand-text/40 mb-1 uppercase tracking-widest font-mono">XRPL Address</p>
          <p className="font-mono text-brand-cyan text-sm break-all">{state.address}</p>
        </div>
        <Link
          href="/write"
          className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
            bg-gradient-to-r from-brand-blue to-brand-cyan text-[#0a0d14]
            hover:opacity-90 hover:shadow-[0_0_20px_rgba(107,143,255,0.4)]"
        >
          Launch App
          <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={disconnect}
          className="text-xs text-brand-text/40 hover:text-brand-text/70 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // ── Idle / connecting / error ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {WALLETS.map((w) => {
        const isConnecting = state.status === "connecting" && state.wallet === w.id;
        const isError = state.status === "error" && state.wallet === w.id;

        return (
          <div key={w.id}>
            <button
              onClick={() => connect(w.id)}
              disabled={state.status === "connecting"}
              className={`
                w-full glass-card px-5 py-4 flex items-center gap-4
                border border-white/[0.08] rounded-2xl text-left
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isError ? "border-red-500/40" : "hover:border-brand-blue/40 hover:bg-white/[0.06]"}
              `}
            >
              <div className="shrink-0">{w.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-brand-text text-sm">{w.label}</p>
                <p className="text-xs text-brand-text/40 mt-0.5">{w.description}</p>
              </div>
              {isConnecting && <Loader2 className="w-4 h-4 text-brand-blue animate-spin shrink-0" />}
              {isError && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {!isConnecting && !isError && (
                <svg className="w-4 h-4 text-brand-text/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              )}
            </button>
            {isError && (
              <p className="mt-1.5 text-xs text-red-400/80 px-2 animate-fade-in">
                {(state as { status: "error"; message: string }).message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
