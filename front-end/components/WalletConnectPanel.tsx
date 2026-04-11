"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ConnectionState =
  | { status: "idle" }
  | { status: "connecting"; wallet: WalletId }
  | { status: "connected"; wallet: WalletId; address: string }
  | { status: "error"; wallet: WalletId; message: string };

type WalletId = "otsu" | "crossmark" | "xaman";

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
// TODO: Replace with xrpl-connect WalletManager + <xrpl-wallet-connector>
//       when the full integration is wired up. This is a placeholder that
//       uses dynamic imports to connect individual wallets.
// ---------------------------------------------------------------------------
export default function WalletConnectPanel() {
  const [conn, setConn] = useState<ConnectionState>({ status: "idle" });

  const handleConnect = useCallback(async (walletId: WalletId) => {
    setConn({ status: "connecting", wallet: walletId });

    try {
      if (walletId === "crossmark") {
        const { default: sdk } = await import("@crossmarkio/sdk");
        const result = await sdk.methods.signInAndWait();
        const address = result?.response?.data?.address;
        if (!address) throw new Error("Crossmark did not return an address.");
        setConn({ status: "connected", wallet: "crossmark", address });

      } else if (walletId === "otsu") {
        // Otsu injects window.xrpl
        const provider = (window as any).xrpl;
        if (!provider?.isOtsu) throw new Error("Otsu Wallet extension not found. Install it first.");
        const result = await provider.connect({ scopes: ["read", "sign", "submit"] });
        const address = result?.address;
        if (!address) throw new Error("Otsu did not return an address.");
        setConn({ status: "connected", wallet: "otsu", address });

      } else if (walletId === "xaman") {
        // Xaman requires API keys — placeholder for xrpl-connect integration
        throw new Error("Xaman integration requires xrpl-connect setup. Use Otsu or Crossmark for now.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed.";
      setConn({ status: "error", wallet: walletId, message });
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setConn({ status: "idle" });
  }, []);

  // ── Connected ──────────────────────────────────────────────────────────────
  if (conn.status === "connected") {
    return (
      <div className="glass-card p-8 flex flex-col items-center gap-5 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-brand-cyan/10 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-brand-cyan" />
        </div>
        <div className="text-center">
          <p className="text-brand-text/60 text-sm mb-1">Connected via</p>
          <p className="font-semibold text-brand-text capitalize">{conn.wallet}</p>
        </div>
        <div className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-brand-text/40 mb-1 uppercase tracking-widest font-mono">XRPL Address</p>
          <p className="font-mono text-brand-cyan text-sm break-all">{conn.address}</p>
        </div>
        <Link
          href="/trade"
          className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
            bg-gradient-to-r from-brand-blue to-brand-cyan text-[#0a0d14]
            hover:opacity-90 hover:shadow-[0_0_20px_rgba(107,143,255,0.4)]"
        >
          Launch App
          <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={handleDisconnect}
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
      {WALLETS.map((w, i) => {
        const isConnecting = conn.status === "connecting" && conn.wallet === w.id;
        const isError = conn.status === "error" && conn.wallet === w.id;

        return (
          <div
            key={w.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            <button
              onClick={() => handleConnect(w.id)}
              disabled={conn.status === "connecting"}
              className={`
                relative w-full glass-card px-5 py-4 flex items-center gap-4
                border border-white/[0.08] rounded-2xl text-left
                transition-all duration-300 group overflow-hidden
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isError
                  ? "border-red-500/40"
                  : "hover:border-brand-cyan/50 hover:bg-white/[0.06] hover:shadow-[0_0_32px_rgba(0,229,255,0.18)] hover:-translate-y-0.5"}
              `}
            >
              {/* Animated shimmer sweep */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(110deg, transparent 30%, rgba(0,229,255,0.08) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s linear infinite",
                }}
              />
              <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-110">{w.icon}</div>
              <div className="relative flex-1">
                <p className="font-semibold text-brand-text text-sm">{w.label}</p>
                <p className="text-xs text-brand-text/40 mt-0.5">{w.description}</p>
              </div>
              {isConnecting && <Loader2 className="relative w-4 h-4 text-brand-cyan animate-spin shrink-0" />}
              {isError && <AlertCircle className="relative w-4 h-4 text-red-400 shrink-0" />}
              {!isConnecting && !isError && (
                <svg className="relative w-4 h-4 text-brand-text/30 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all duration-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              )}
            </button>
            {isError && (
              <p className="mt-1.5 text-xs text-red-400/80 px-2 animate-fade-in">
                {(conn as { status: "error"; message: string }).message}
              </p>
            )}
          </div>
        );
      })}

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
