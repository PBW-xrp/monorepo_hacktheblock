"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";
import {
  ArrowLeft, Shield, Loader2, AlertCircle, ChevronDown,
  CheckCircle2, Clock, Zap, ExternalLink, Copy,
} from "lucide-react";
import type { IntentV1 } from "@/types/intent";
import GreeksDashboard from "@/components/GreeksDashboard";
import AnimatedCounter from "@/components/AnimatedCounter";
import ComputingValue from "@/components/ComputingValue";
import SuccessRipple from "@/components/SuccessRipple";
import QuoteCountdown from "@/components/QuoteCountdown";

// Dynamic import for R3F — client-side only, no SSR
const PayoffSurface3D = dynamic(() => import("@/components/PayoffSurface3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-2xl bg-gradient-to-br from-[#0a0d14] to-[#0d1325] border border-white/[0.06] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-brand-cyan animate-spin" />
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Config — hardcoded values from team (April 11 2026)
// ---------------------------------------------------------------------------
const SPOT_PRICE     = 1.40;   // XRP/USD
const DEFAULT_STRIKE = "1.15"; // $1.15
const PREMIUM_DROPS  = "5000000"; // 5 XRP fixed for demo
const XRPL_EXPLORER  = "http://custom.xrpl.org/groth5.devnet.rippletest.net";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Expiry = { label: string; seconds: number };

const EXPIRIES: Expiry[] = [
  { label: "1 Day",   seconds: 86_400 },
  { label: "7 Days",  seconds: 604_800 },
  { label: "30 Days", seconds: 2_592_000 },
  { label: "90 Days", seconds: 7_776_000 },
];

type QuoteResponse = {
  intentId: string;
  spotPrice: number;
  impliedVol: number;
  priceBS: number;
  totalPremiumXRP: number;
  delta: number;
  vega: number;
  fixedPoint: {
    spot: number;
    strike: number;
    price: number;
    vol: number;
    isItm: boolean;
  };
  validUntil: number;
};

type FormState = {
  amount: string;
  strike: string;
  expiry: Expiry;
  isPut: boolean;
};

type BuyState =
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "pending" }
  | { status: "success"; txHash: string }
  | { status: "error"; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n: number, decimals = 4) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function toHex(str: string): string {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TradePage() {
  const { state: walletState } = useWallet();
  const [form, setForm] = useState<FormState>({
    amount: "100",
    strike: DEFAULT_STRIKE,
    expiry: EXPIRIES[2], // 30 days default
    isPut: false,
  });

  const [quoteState, setQuoteState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; quote: QuoteResponse; intent: IntentV1 }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const [buyState, setBuyState] = useState<BuyState>({ status: "idle" });
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Get Quote ────────────────────────────────────────────────────────────
  const handleGetQuote = useCallback(async () => {
    const amount = parseFloat(form.amount);
    const strike = parseFloat(form.strike);
    if (!amount || amount <= 0 || !strike || strike <= 0) {
      setQuoteState({ status: "error", message: "Enter valid amount and strike." });
      return;
    }

    const intent: IntentV1 = {
      intentId: crypto.randomUUID(),
      t: Math.floor(Date.now() / 1000),
      action: "RFQ",
      underlying: "XRP",
      amount: form.amount,
      strike: form.strike,
      expiry: Math.floor(Date.now() / 1000) + form.expiry.seconds,
      isPut: form.isPut,
    };

    setQuoteState({ status: "loading" });
    setBuyState({ status: "idle" });

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intent),
      });
      if (!res.ok) throw new Error("Quote request failed.");
      const quote: QuoteResponse = await res.json();
      setQuoteState({ status: "success", quote, intent });
    } catch (err) {
      setQuoteState({
        status: "error",
        message: err instanceof Error ? err.message : "Quote failed.",
      });
    }
  }, [form]);

  // ── Buy Option (Pay Premium) ────────────────────────────────────────────
  const handleBuy = useCallback(async () => {
    if (quoteState.status !== "success") return;
    if (walletState.status !== "connected") {
      setBuyState({ status: "error", message: "Connect a wallet first." });
      return;
    }
    const { intent } = quoteState;
    const memoData = toHex(JSON.stringify(intent));
    const memoType = toHex("application/json");
    const tx = {
      TransactionType: "Payment",
      Amount: PREMIUM_DROPS,
      Destination: "rht5xsioM3iix1hx4i2zJX2WJ1JDTwLGJe", // groth5 faucet wallet (always active)
      NetworkID: 1256, // required for groth5 devnet
      Memos: [{ Memo: { MemoType: memoType, MemoData: memoData } }],
    };

    setBuyState({ status: "confirming" });

    try {
      let txHash = "";

      if (walletState.wallet === "otsu") {
        const provider = (window as any).xrpl;
        const { Client } = await import("xrpl");
        const client = new Client("wss://groth5.devnet.rippletest.net:51233");
        await client.connect();
        // autofill adds Sequence, Fee, LastLedgerSequence, NetworkID from the live ledger
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prepared = await client.autofill({ ...tx, Account: walletState.address } as any);
        console.log("[Otsu] prepared tx:", JSON.stringify(prepared));
        const signed = await provider.signTransaction(prepared);
        const txBlob = signed?.tx_blob;
        if (!txBlob) throw new Error("Otsu did not return a signed tx_blob.");
        setBuyState({ status: "pending" });
        const submitResult = await client.submitAndWait(txBlob);
        await client.disconnect();
        txHash = (submitResult.result as any)?.hash || signed?.hash || "confirmed";

      } else if (walletState.wallet === "crossmark") {
        const { default: sdk } = await import("@crossmarkio/sdk");
        setBuyState({ status: "pending" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await sdk.methods.signAndSubmitAndWait(tx as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = result?.response?.data as any;
        txHash = data?.resp?.result?.hash || data?.resp?.hash || data?.hash || "confirmed";

      } else {
        throw new Error("Wallet not supported for signing.");
      }

      setBuyState({ status: "success", txHash });
    } catch (err) {
      setBuyState({
        status: "error",
        message: err instanceof Error ? err.message : "Transaction failed.",
      });
    }
  }, [quoteState, walletState]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ───────────────────────────────────────────────────────────────
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
        <span className="text-sm text-brand-text/50">Options Trading</span>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/board"
            className="text-xs text-brand-cyan/60 hover:text-brand-cyan transition-colors"
          >
            Option Board →
          </Link>
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            <span className="text-xs text-brand-text/50 font-mono">XRPL groth5</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left: Option Form ── */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Price an Option</h1>
            <p className="text-brand-text/40 text-sm mt-1">
              Black-Scholes pricing · ZK-verified on XRPL
            </p>
          </div>

          {/* Underlying */}
          <div className="glass-card p-5 flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-text/40">Underlying</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
                <span className="text-brand-cyan font-bold text-xs">XRP</span>
              </div>
              <div>
                <p className="font-semibold text-brand-text">XRP / USD</p>
                <p className="text-xs text-brand-text/40">XRPL · groth5 Devnet</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-mono text-brand-cyan font-semibold">${SPOT_PRICE.toFixed(2)}</p>
                <p className="text-xs text-brand-text/30">Oracle spot</p>
              </div>
            </div>
          </div>

          {/* Option type */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-text/40">Option Type</p>
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map((put) => (
                <button
                  key={String(put)}
                  onClick={() => setForm((f) => ({ ...f, isPut: put }))}
                  className={`
                    py-3 rounded-xl font-semibold text-sm transition-all duration-200
                    ${form.isPut === put
                      ? put
                        ? "bg-brand-purple/20 border border-brand-purple/50 text-brand-purple"
                        : "bg-brand-cyan/10 border border-brand-cyan/40 text-brand-cyan"
                      : "bg-white/[0.03] border border-white/[0.08] text-brand-text/40 hover:border-white/20"}
                  `}
                >
                  {put ? "PUT" : "CALL"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Strike */}
          <div className="glass-card p-5 flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-text/40">Parameters</p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-text/50">Amount (XRP)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-brand-text font-mono text-sm focus:outline-none focus:border-brand-cyan/60 focus:shadow-[0_0_24px_rgba(0,229,255,0.15)] focus:bg-white/[0.06] transition-all duration-300"
                  placeholder="100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-text/30 font-mono">XRP</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-text/50">Strike Price (USD)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.strike}
                  onChange={(e) => setForm((f) => ({ ...f, strike: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-brand-text font-mono text-sm focus:outline-none focus:border-brand-cyan/60 focus:shadow-[0_0_24px_rgba(0,229,255,0.15)] focus:bg-white/[0.06] transition-all duration-300"
                  placeholder="1.15"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-text/30 font-mono">USD</span>
              </div>
              <p className="text-xs text-brand-text/30">
                Spot: ${SPOT_PRICE.toFixed(2)} ·{" "}
                {parseFloat(form.strike) > SPOT_PRICE
                  ? form.isPut ? "ITM Put" : "OTM Call"
                  : form.isPut ? "OTM Put" : "ITM Call"}
              </p>
            </div>
          </div>

          {/* Expiry */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-text/40">Expiry</p>
            <div className="relative">
              <button
                onClick={() => setExpiryOpen((o) => !o)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center justify-between text-brand-text text-sm hover:border-brand-cyan/50 hover:bg-white/[0.06] hover:shadow-[0_0_20px_rgba(0,229,255,0.12)] transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-text/40" />
                  {form.expiry.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-brand-text/40 transition-transform ${expiryOpen ? "rotate-180" : ""}`} />
              </button>
              {expiryOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#12172a] border border-white/[0.10] rounded-xl overflow-hidden z-10 shadow-xl">
                  {EXPIRIES.map((e) => (
                    <button
                      key={e.label}
                      onClick={() => { setForm((f) => ({ ...f, expiry: e })); setExpiryOpen(false); }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-white/[0.04] transition-colors flex items-center justify-between ${form.expiry.label === e.label ? "text-brand-cyan" : "text-brand-text/70"}`}
                    >
                      {e.label}
                      {form.expiry.label === e.label && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Get Quote CTA */}
          <button
            onClick={handleGetQuote}
            disabled={quoteState.status === "loading"}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
              bg-gradient-to-r from-brand-blue to-brand-cyan text-[#0a0d14]
              hover:opacity-90 hover:shadow-[0_0_24px_rgba(107,143,255,0.4)]
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {quoteState.status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Computing price…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Get Price
              </>
            )}
          </button>

          {quoteState.status === "error" && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {quoteState.message}
            </div>
          )}
        </div>

        {/* ── Right: Quote + Buy Panel ── */}
        <div className="flex flex-col gap-6">
          {quoteState.status !== "success" ? (
            <div className="glass-card p-8 flex flex-col items-center justify-center gap-4 min-h-[400px]">
              {quoteState.status === "loading" ? (
                <>
                  <div className="w-16 h-16 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin" />
                  <div className="text-center">
                    <p className="font-semibold text-brand-text">Computing Price</p>
                    <p className="text-sm text-brand-text/40 mt-1">Black-Scholes · ZK-provable</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                    <Shield className="w-7 h-7 text-brand-text/20" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-brand-text/40">No price yet</p>
                    <p className="text-sm text-brand-text/20 mt-1">Fill in the parameters and click Get Price</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* 3D Payoff Surface */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-text/40 px-1">Payoff Surface</p>
                <PayoffSurface3D
                  spot={SPOT_PRICE}
                  strike={parseFloat(form.strike)}
                  isPut={form.isPut}
                  premium={quoteState.quote.priceBS}
                  vol={quoteState.quote.impliedVol}
                  rate={0}
                  expiryYears={form.expiry.seconds / (365 * 24 * 3600)}
                />
              </div>

              {/* ZK badge — computing effect */}
              <div className="glass-card px-5 py-4 border border-brand-cyan/20 flex items-start gap-3 relative overflow-hidden">
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
                  background: "linear-gradient(110deg, transparent 30%, rgba(0,229,255,0.05) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer-zk 3s linear infinite",
                }} />
                <div className="relative w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-brand-cyan" />
                  <div className="absolute inset-0 rounded-full border border-brand-cyan/40 animate-ping" style={{ animationDuration: "2s" }} />
                </div>
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-brand-cyan uppercase tracking-widest">ZK Provable</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
                  </div>
                  <p className="text-xs text-brand-text/50 font-mono">
                    spot=<ComputingValue value={quoteState.quote.fixedPoint.spot} delay={0} className="text-brand-cyan/80" /> · strike=<ComputingValue value={quoteState.quote.fixedPoint.strike} delay={150} className="text-brand-cyan/80" /> · vol=<ComputingValue value={quoteState.quote.fixedPoint.vol} delay={300} className="text-brand-cyan/80" /> · price=<ComputingValue value={quoteState.quote.fixedPoint.price} delay={450} className="text-brand-cyan/80" />
                  </p>
                  <p className="text-xs text-brand-text/40 mt-0.5">
                    {quoteState.quote.fixedPoint.isItm ? "✓ In the money" : "✗ Out of the money"}
                  </p>
                </div>
                <style jsx>{`
                  @keyframes shimmer-zk {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                  }
                `}</style>
              </div>

              {/* Premium */}
              <div className="glass-card p-6 flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                  background: "radial-gradient(ellipse at top right, rgba(0,229,255,0.1) 0%, transparent 60%)"
                }} />
                <div className="flex items-start justify-between relative">
                  <p className="text-xs text-brand-text/40 uppercase tracking-widest font-semibold">Premium</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-brand-text/30 uppercase tracking-wider">expires</span>
                    <QuoteCountdown validUntil={quoteState.quote.validUntil} duration={30000} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative">
                  <AnimatedCounter
                    value={quoteState.quote.totalPremiumXRP}
                    decimals={4}
                    className="text-4xl font-bold text-brand-text font-mono"
                  />
                  <span className="text-brand-text/40 font-mono">XRP</span>
                </div>
                <p className="text-xs text-brand-text/30 mt-0.5 relative">
                  BS price: ${fmt(quoteState.quote.priceBS)} per XRP · {form.amount} XRP · {form.isPut ? "Put" : "Call"} · Strike ${form.strike} · {form.expiry.label}
                </p>
              </div>

              {/* Greeks */}
              <GreeksDashboard
                delta={quoteState.quote.delta}
                vega={quoteState.quote.vega}
                spot={quoteState.quote.spotPrice}
                strike={parseFloat(form.strike)}
                isPut={form.isPut}
                vol={quoteState.quote.impliedVol}
                rate={0}
                expiryYears={form.expiry.seconds / (365 * 24 * 3600)}
              />

              {/* ── Buy / TX status ── */}
              {buyState.status === "success" ? (
                <div className="glass-card p-5 border border-brand-cyan/30 flex flex-col gap-3 relative overflow-hidden">
                  <SuccessRipple triggerKey={buyState.txHash} />
                  <div className="relative flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center relative">
                      <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
                      <div className="absolute inset-0 rounded-full border border-brand-cyan/40 animate-ping" style={{ animationDuration: "1.5s" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-text text-sm">Premium Paid</p>
                      <p className="text-xs text-brand-text/40">XRPL Payment confirmed</p>
                    </div>
                  </div>

                  <div className="relative">
                    <p className="text-xs text-brand-text/30 mb-1.5 uppercase tracking-widest font-medium">XRPL Transaction</p>
                    <div className="bg-white/[0.03] rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-brand-text/60 truncate">{buyState.txHash}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => copyHash(buyState.txHash)} className="text-brand-text/40 hover:text-brand-text/80 transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a href={`${XRPL_EXPLORER}/transactions/${buyState.txHash}`} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:text-brand-cyan/80 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {copied && <p className="relative text-xs text-brand-cyan text-center">Copied!</p>}
                  <button
                    onClick={() => { setQuoteState({ status: "idle" }); setBuyState({ status: "idle" }); }}
                    className="relative text-xs text-brand-text/40 hover:text-brand-text/70 transition-colors text-center"
                  >
                    New quote →
                  </button>
                </div>
              ) : buyState.status === "error" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/20 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {buyState.message}
                  </div>
                  <button onClick={handleBuy} className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-purple to-brand-blue text-white hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    Retry
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={buyState.status === "confirming" || buyState.status === "pending"}
                  className="w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                    bg-gradient-to-r from-brand-purple to-brand-blue text-white
                    hover:opacity-90 hover:shadow-[0_0_24px_rgba(155,107,255,0.4)]
                    disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {buyState.status === "confirming" || buyState.status === "pending" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {buyState.status === "confirming" ? "Confirm in wallet…" : "Sending XRPL Payment…"}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Pay Premium
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
