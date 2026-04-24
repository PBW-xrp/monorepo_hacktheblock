"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Shield } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { XRPL_DEFAULTS } from "@/types/contracts";

const XRPL_EXPLORER = process.env.NEXT_PUBLIC_XRPL_EXPLORER || "http://custom.xrpl.org/groth5.devnet.rippletest.net";
const GROTH5_WSS = process.env.NEXT_PUBLIC_XRPL_WSS || "wss://groth5.devnet.rippletest.net:51233";
const DEFAULT_OWNER = XRPL_DEFAULTS.writerAddress;
const DEFAULT_JOURNAL = process.env.NEXT_PUBLIC_DEFAULT_JOURNAL || "c05c150000000000308c110000000000cc100000008d2700000000000100000090d003000000000001000000";
const DEFAULT_SEAL = process.env.NEXT_PUBLIC_DEFAULT_SEAL || "";

type ExerciseState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; txHash: string }
  | { status: "error"; message: string };

function ExercisePageContent() {
  const { state: walletState } = useWallet();
  const searchParams = useSearchParams();
  const ownerFromQuery = searchParams.get("owner") || DEFAULT_OWNER;
  const [owner, setOwner] = useState(ownerFromQuery);
  const [offerSequence, setOfferSequence] = useState("");
  const [journalHex, setJournalHex] = useState(DEFAULT_JOURNAL);
  const [sealHex, setSealHex] = useState(DEFAULT_SEAL);
  const [exerciseState, setExerciseState] = useState<ExerciseState>({ status: "idle" });

  const txPreview = useMemo(() => ({
    TransactionType: "EscrowFinish",
    Account: walletState.status === "connected" ? walletState.address : "<BUYER_ADDRESS>",
    Owner: owner,
    OfferSequence: offerSequence ? Number(offerSequence) : "<ESCROW_SEQUENCE>",
    ComputationAllowance: 1000000,
    Memos: [
      { Memo: { MemoData: journalHex || "<JOURNAL_HEX>" } },
      { Memo: { MemoData: sealHex || "<SEAL_HEX>" } },
    ],
  }), [journalHex, offerSequence, owner, sealHex, walletState]);

  const handleExercise = async () => {
    if (walletState.status !== "connected") {
      setExerciseState({ status: "error", message: "Connect the buyer wallet first." });
      return;
    }
    if (!offerSequence) {
      setExerciseState({ status: "error", message: "Enter the escrow offer sequence." });
      return;
    }
    if (!sealHex) {
      setExerciseState({ status: "error", message: "Paste the generated seal hex." });
      return;
    }

    const tx = {
      TransactionType: "EscrowFinish",
      Owner: owner,
      OfferSequence: Number(offerSequence),
      Memos: [
        { Memo: { MemoData: journalHex } },
        { Memo: { MemoData: sealHex } },
      ],
      networkID: XRPL_DEFAULTS.networkId,
    };

    setExerciseState({ status: "submitting" });

    try {
      if (walletState.wallet === "otsu") {
        const provider = (window as any).xrpl;
        const signed = await provider.signAndSubmit(tx);
        console.log("[EscrowFinish] Otsu signed:", JSON.stringify(signed, null, 2));

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
          console.log("[EscrowFinish] Tx result:", JSON.stringify(txRes, null, 2));
          const txResult = (txRes?.result as any)?.meta?.TransactionResult;
          if (txResult && txResult !== "tesSUCCESS") {
            throw new Error(`Transaction failed: ${txResult}`);
          }
          setExerciseState({ status: "success", txHash });
        } finally {
          await client.disconnect();
        }
        return;
      }

      if (walletState.wallet === "crossmark") {
        const { default: sdk } = await import("@crossmarkio/sdk");
        const result = await sdk.methods.signAndSubmitAndWait({ ...tx, Account: walletState.address } as any);
        console.log("[EscrowFinish] Crossmark result:", JSON.stringify(result, null, 2));
        const cmData = result?.response?.data as any;
        const engineResult = cmData?.resp?.result?.meta?.TransactionResult;
        if (engineResult && engineResult !== "tesSUCCESS") {
          throw new Error(`Transaction failed: ${engineResult}`);
        }
        const txHash = cmData?.resp?.result?.hash || cmData?.resp?.hash || cmData?.hash || "confirmed";
        setExerciseState({ status: "success", txHash });
        return;
      }

      throw new Error("Wallet not supported for EscrowFinish.");
    } catch (err: any) {
      const message = err?.message || err?.data?.message || err?.response?.data?.message || (typeof err === "string" ? err : null) || JSON.stringify(err, Object.getOwnPropertyNames(err || {})) || "EscrowFinish failed.";
      setExerciseState({ status: "error", message });
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
        <span className="text-sm text-brand-text/50">Exercise Option</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Submit EscrowFinish</h1>
            <p className="text-brand-text/40 text-sm mt-1">Use the buyer wallet to exercise the option with proof memos.</p>
          </div>

          <div className="glass-card p-5 flex flex-col gap-4">
            <label className="text-xs text-brand-text/50">Writer / owner address</label>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-mono" />

            <label className="text-xs text-brand-text/50">Escrow offer sequence</label>
            <input value={offerSequence} onChange={(e) => setOfferSequence(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-mono" />

            <label className="text-xs text-brand-text/50">Journal hex</label>
            <textarea value={journalHex} onChange={(e) => setJournalHex(e.target.value.trim())} rows={4} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono" />

            <label className="text-xs text-brand-text/50">Seal hex</label>
            <textarea value={sealHex} onChange={(e) => setSealHex(e.target.value.trim())} rows={8} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-xs font-mono" />
          </div>

          <button onClick={handleExercise} disabled={exerciseState.status === "submitting"} className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-purple to-brand-blue text-white flex items-center justify-center gap-2 disabled:opacity-60">
            {exerciseState.status === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Submit EscrowFinish
          </button>

          {exerciseState.status === "error" && (
            <div className="glass-card p-4 border border-red-400/20 text-sm text-red-400">{exerciseState.message}</div>
          )}

          {exerciseState.status === "success" && (
            <div className="glass-card p-4 border border-brand-cyan/20 text-sm text-brand-cyan flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                EscrowFinish submitted successfully.
              </div>
              <a href={`${XRPL_EXPLORER}/transactions/${exerciseState.txHash}`} target="_blank" rel="noreferrer" className="text-xs text-brand-cyan/80 hover:text-brand-cyan flex items-center gap-1 font-mono break-all">
                {exerciseState.txHash}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}
        </div>

        <div className="glass-card p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-text/40">EscrowFinish preview</h2>
          <pre className="mt-2 bg-white/[0.03] rounded-xl p-4 text-xs text-brand-text/70 overflow-x-auto">{JSON.stringify(txPreview, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

export default function ExercisePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center">Loading exercise flow…</div>}>
      <ExercisePageContent />
    </Suspense>
  );
}
