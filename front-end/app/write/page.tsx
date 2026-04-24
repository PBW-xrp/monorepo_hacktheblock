"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Wallet, ExternalLink } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { encodeEscrowDataV1, unixToRippleTime, WRITER_DEFAULTS, XRPL_DEFAULTS, xrpToDrops, type OptionType } from "@/types/contracts";

const GROTH5_WSS = process.env.NEXT_PUBLIC_XRPL_WSS || "wss://groth5.devnet.rippletest.net:51233";
const XRPL_EXPLORER = process.env.NEXT_PUBLIC_XRPL_EXPLORER || "http://custom.xrpl.org/groth5.devnet.rippletest.net";
const FINISH_FUNCTION_PLACEHOLDER = process.env.NEXT_PUBLIC_FINISH_FUNCTION_HEX || "<HEX_ENCODED_WASM>";

const EXPIRIES = [
  { label: "1 Day", seconds: 86_400 },
  { label: "7 Days", seconds: 604_800 },
  { label: "30 Days", seconds: 2_592_000 },
  { label: "90 Days", seconds: 7_776_000 },
];

type CreateState =
  | { status: "idle" }
  | { status: "ready" }
  | { status: "submitting" }
  | { status: "success"; txHash: string }
  | { status: "error"; message: string };

export default function WritePage() {
  const { state: walletState } = useWallet();
  const [buyerAddress, setBuyerAddress] = useState(XRPL_DEFAULTS.writerAddress);
  const [collateralXrp, setCollateralXrp] = useState(WRITER_DEFAULTS.collateralXrp);
  const [strikeUsd, setStrikeUsd] = useState(WRITER_DEFAULTS.strikeUsd);
  const [expirySeconds, setExpirySeconds] = useState(EXPIRIES[2].seconds);
  const [optionType, setOptionType] = useState<OptionType>(WRITER_DEFAULTS.optionType);
  const [createState, setCreateState] = useState<CreateState>({ status: "idle" });
  const [clientNow, setClientNow] = useState<number | null>(null);

  useEffect(() => {
    setClientNow(Math.floor(Date.now() / 1000));
  }, []);

  const derived = useMemo(() => {
    if (clientNow === null) return null;
    try {
      const nowUnix = clientNow;
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
  }, [clientNow, collateralXrp, expirySeconds, optionType, strikeUsd]);

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

  const handleSubmit = async () => {
    if (walletState.status !== "connected") {
      setCreateState({ status: "error", message: "Connect the writer wallet first." });
      return;
    }
    if (!derived) {
      setCreateState({ status: "error", message: "Payload is not ready." });
      return;
    }
    if (FINISH_FUNCTION_PLACEHOLDER === "<HEX_ENCODED_WASM>") {
      setCreateState({ status: "error", message: "Set NEXT_PUBLIC_FINISH_FUNCTION_HEX before submitting." });
      return;
    }

    const tx = {
      TransactionType: "EscrowCreate",
      Amount: derived.amountDrops,
      Destination: buyerAddress,
      CancelAfter: derived.cancelAfterRipple,
      FinishFunction: FINISH_FUNCTION_PLACEHOLDER,
      Data: derived.dataHex,
      networkID: XRPL_DEFAULTS.networkId,
    };

    setCreateState({ status: "submitting" });

    try {
      if (walletState.wallet === "otsu") {
        const provider = (window as any).xrpl;
        const signed = await provider.signAndSubmit(tx);
        console.log("[EscrowCreate] Otsu signed:", JSON.stringify(signed, null, 2));

        const txBlob = signed?.tx_blob || signed?.result?.tx_blob;
        if (!txBlob) throw new Error("Otsu did not return a signed tx_blob.");

        // Compute tx hash from blob using WebCrypto (avoids double-submit)
        const prefix = new Uint8Array([0x54, 0x58, 0x4e, 0x00]);
        const txBytes = new Uint8Array((txBlob.match(/.{2}/g) as string[]).map((b: string) => parseInt(b, 16)));
        const data = new Uint8Array(prefix.length + txBytes.length);
        data.set(prefix);
        data.set(txBytes, prefix.length);
        const hashBuffer = await crypto.subtle.digest("SHA-512", data);
        const txHash = Array.from(new Uint8Array(hashBuffer).slice(0, 32))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();

        // Wait for ledger inclusion then verify
        await new Promise((r) => setTimeout(r, 5000));
        const { Client } = await import("xrpl");
        const wss = process.env.NEXT_PUBLIC_XRPL_WSS || "wss://groth5.devnet.rippletest.net:51233";
        const client = new Client(wss);
        await client.connect();
        try {
          const txRes = await client.request({ command: "tx", transaction: txHash });
          console.log("[EscrowCreate] Tx result:", JSON.stringify(txRes, null, 2));
          const txResult = (txRes?.result as any)?.meta?.TransactionResult;
          if (txResult && txResult !== "tesSUCCESS") {
            throw new Error(`Transaction failed: ${txResult}`);
          }
          setCreateState({ status: "success", txHash });
        } finally {
          await client.disconnect();
        }
        return;
      }

      if (walletState.wallet === "crossmark") {
        const { default: sdk } = await import("@crossmarkio/sdk");
        const result = await sdk.methods.signAndSubmitAndWait({ ...tx, Account: walletState.address } as any);
        console.log("[EscrowCreate] Crossmark result:", JSON.stringify(result, null, 2));
        const data = result?.response?.data as any;
        const engineResult = data?.resp?.result?.meta?.TransactionResult;
        if (engineResult && engineResult !== "tesSUCCESS") {
          throw new Error(`Transaction failed: ${engineResult}`);
        }
        const txHash = data?.resp?.result?.hash || data?.resp?.hash || data?.hash || "confirmed";
        setCreateState({ status: "success", txHash });
        return;
      }

      throw new Error("Wallet not supported for EscrowCreate.");
    } catch (err: any) {
      const message = err?.message || err?.data?.message || err?.response?.data?.message || (typeof err === "string" ? err : null) || JSON.stringify(err, Object.getOwnPropertyNames(err || {})) || "EscrowCreate failed.";
      setCreateState({ status: "error", message });
    }
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={handlePrepare} className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-blue to-brand-cyan text-[#0a0d14] flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" />
              Prepare EscrowCreate
            </button>
            <button onClick={handleSubmit} disabled={createState.status === "submitting"} className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-purple to-brand-blue text-white flex items-center justify-center gap-2 disabled:opacity-60">
              {createState.status === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Submit EscrowCreate
            </button>
          </div>

          {createState.status === "error" && (
            <div className="glass-card p-4 border border-red-400/20 text-sm text-red-400">{createState.message}</div>
          )}

          {createState.status === "ready" && (
            <div className="glass-card p-4 border border-brand-cyan/20 text-sm text-brand-cyan flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Payload prepared. Ready for wallet-backed signing on groth5.
            </div>
          )}

          {createState.status === "success" && (
            <div className="glass-card p-4 border border-brand-cyan/20 text-sm text-brand-cyan flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                EscrowCreate submitted successfully.
              </div>
              <a href={`${XRPL_EXPLORER}/transactions/${createState.txHash}`} target="_blank" rel="noreferrer" className="text-xs text-brand-cyan/80 hover:text-brand-cyan flex items-center gap-1 font-mono break-all">
                {createState.txHash}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
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
              <div className="text-xs text-brand-text/50 break-all font-mono">{FINISH_FUNCTION_PLACEHOLDER.length > 20 ? `${FINISH_FUNCTION_PLACEHOLDER.slice(0, 10)}…${FINISH_FUNCTION_PLACEHOLDER.slice(-10)}` : FINISH_FUNCTION_PLACEHOLDER}</div>

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
