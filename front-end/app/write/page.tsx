"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Wallet } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { encodeEscrowDataV1, unixToRippleTime, WRITER_DEFAULTS, xrpToDrops, type OptionType } from "@/types/contracts";

const EXPIRIES = [
  { label: "1 Day", seconds: 86_400 },
  { label: "7 Days", seconds: 604_800 },
  { label: "30 Days", seconds: 2_592_000 },
  { label: "90 Days", seconds: 7_776_000 },
];

const FINISH_FUNCTION_PLACEHOLDER = "compiled from contracts/target/wasm32v1-none/release/verafi_escrow_verifier.wasm";

type CreateState =
  | { status: "idle" }
  | { status: "ready" }
  | { status: "error"; message: string };

export default function WritePage() {
  const { state: walletState } = useWallet();
  const [buyerAddress, setBuyerAddress] = useState("r8D5rp5cn2hkemoLKvoEJFNZ73Mp2Mcgr");
  const [collateralXrp, setCollateralXrp] = useState(WRITER_DEFAULTS.collateralXrp);
  const [strikeUsd, setStrikeUsd] = useState(WRITER_DEFAULTS.strikeUsd);
  const [expirySeconds, setExpirySeconds] = useState(EXPIRIES[2].seconds);
  const [optionType, setOptionType] = useState<OptionType>(WRITER_DEFAULTS.optionType);
  const [createState, setCreateState] = useState<CreateState>({ status: "idle" });

  const derived = useMemo(() => {
    try {
      const nowUnix = Math.floor(Date.now() / 1000);
      const cancelAfterUnix = nowUnix + expirySeconds;
      const data = encodeEscrowDataV1({ strikeUsd, expirySeconds, optionType });
      return {
        amountDrops: xrpToDrops(collateralXrp),
        cancelAfterUnix,
        cancelAfterRipple: unixToRippleTime(cancelAfterUnix),
        dataHex: data.hex,
        strikeFixed: data.strikeFixed,
        isCall: data.isCall,
      };
    } catch {
      return null;
    }
  }, [collateralXrp, expirySeconds, optionType, strikeUsd]);

  const handlePrepare = () => {
    if (walletState.status !== "connected") {
      setCreateState({ status: "error", message: "Connect the writer wallet first." });
      return;
    }
    if (!buyerAddress.startsWith("r")) {
      setCreateState({ status: "error", message: "Enter a valid buyer XRPL address." });
      return;
    }
    if (!derived) {
      setCreateState({ status: "error", message: "Check collateral, strike, or expiry values." });
      return;
    }
    setCreateState({ status: "ready" });
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <nav className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-brand-text/50 hover:text-brand-text transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <span className="font-semibold text-brand-text">VeraFi</span>
        <span className="text-brand-text/30">·</span>
        <span className="text-sm text-brand-text/50">Write Option</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Create Escrow</h1>
            <p className="text-brand-text/40 text-sm mt-1">Prepare a real `EscrowCreate` payload for the writer wallet.</p>
          </div>

          <div className="glass-card p-5 flex flex-col gap-4">
            <label className="text-xs text-brand-text/50">Buyer address</label>
            <input value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-mono" />

            <label className="text-xs text-brand-text/50">Collateral (XRP)</label>
            <input value={collateralXrp} onChange={(e) => setCollateralXrp(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-mono" />

            <label className="text-xs text-brand-text/50">Strike (USD)</label>
            <input value={strikeUsd} onChange={(e) => setStrikeUsd(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-mono" />

            <label className="text-xs text-brand-text/50">Option type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["CALL", "PUT"] as OptionType[]).map((kind) => (
                <button key={kind} onClick={() => setOptionType(kind)} className={`py-3 rounded-xl text-sm border ${optionType === kind ? "border-brand-cyan/50 text-brand-cyan bg-brand-cyan/10" : "border-white/10 text-brand-text/50"}`}>
                  {kind}
                </button>
              ))}
            </div>

            <label className="text-xs text-brand-text/50">Expiry</label>
            <div className="grid grid-cols-2 gap-2">
              {EXPIRIES.map((expiry) => (
                <button key={expiry.label} onClick={() => setExpirySeconds(expiry.seconds)} className={`py-3 rounded-xl text-sm border ${expirySeconds === expiry.seconds ? "border-brand-blue/50 text-brand-blue bg-brand-blue/10" : "border-white/10 text-brand-text/50"}`}>
                  {expiry.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handlePrepare} className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-blue to-brand-cyan text-[#0a0d14] flex items-center justify-center gap-2">
            <Wallet className="w-4 h-4" />
            Prepare EscrowCreate
          </button>

          {createState.status === "error" && (
            <div className="glass-card p-4 border border-red-400/20 text-sm text-red-400">{createState.message}</div>
          )}

          {createState.status === "ready" && (
            <div className="glass-card p-4 border border-brand-cyan/20 text-sm text-brand-cyan flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Payload prepared. Next step is wallet-backed signing on groth5.
            </div>
          )}
        </div>

        <div className="glass-card p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-text/40">EscrowCreate preview</h2>

          {!derived ? (
            <div className="text-sm text-brand-text/30 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Waiting for valid values
            </div>
          ) : (
            <>
              <div className="text-xs text-brand-text/40">Writer</div>
              <div className="font-mono text-sm text-brand-text/80">{walletState.status === "connected" ? walletState.address : "<connect writer wallet>"}</div>

              <div className="text-xs text-brand-text/40">Buyer</div>
              <div className="font-mono text-sm text-brand-text/80 break-all">{buyerAddress}</div>

              <div className="text-xs text-brand-text/40">Collateral drops</div>
              <div className="font-mono text-sm text-brand-text/80">{derived.amountDrops}</div>

              <div className="text-xs text-brand-text/40">Data hex</div>
              <div className="font-mono text-xs text-brand-cyan break-all">{derived.dataHex}</div>

              <div className="text-xs text-brand-text/40">CancelAfter (Ripple time)</div>
              <div className="font-mono text-sm text-brand-text/80">{derived.cancelAfterRipple}</div>

              <div className="text-xs text-brand-text/40">FinishFunction</div>
              <div className="text-xs text-brand-text/50">{FINISH_FUNCTION_PLACEHOLDER}</div>

              <pre className="mt-2 bg-white/[0.03] rounded-xl p-4 text-xs text-brand-text/70 overflow-x-auto">{JSON.stringify({
                TransactionType: "EscrowCreate",
                Account: walletState.status === "connected" ? walletState.address : "<WRITER_ADDRESS>",
                Amount: derived.amountDrops,
                Destination: buyerAddress,
                CancelAfter: derived.cancelAfterRipple,
                FinishFunction: "<HEX_ENCODED_WASM>",
                Data: derived.dataHex,
              }, null, 2)}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
