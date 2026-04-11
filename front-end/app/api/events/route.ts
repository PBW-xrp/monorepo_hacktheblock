import { NextResponse } from "next/server";

// Force dynamic — do not pre-render at build time
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// XRPL groth5 devnet — fetch recent transactions via JSON-RPC
// Using HTTP instead of WebSocket to avoid Next.js bundling issues with ws
// ---------------------------------------------------------------------------
const GROTH5_RPC = "https://groth5.devnet.rippletest.net:51234";

export type LedgerTx = {
  type: string;
  account: string;
  destination?: string;
  amount?: string;
  hash: string;
  ledgerIndex: number;
  timestamp: string;
  meta?: string;
};

async function rpcRequest(method: string, params: Record<string, unknown>[] = [{}]) {
  const res = await fetch(GROTH5_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} failed: ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    const ledgerRes = await rpcRequest("ledger", [{
      ledger_index: "validated",
      transactions: true,
      expand: true,
    }]);

    const ledger = ledgerRes.result?.ledger;
    if (!ledger) throw new Error("No ledger data returned");

    const ledgerIndex = ledger.ledger_index;
    const closeTime = ledger.close_time_human || "";

    const txs: LedgerTx[] = [];

    if (ledger.transactions && Array.isArray(ledger.transactions)) {
      for (const tx of ledger.transactions) {
        if (typeof tx === "object" && tx !== null) {
          const txJson = tx.tx_json || tx;
          const meta = tx.meta || tx.metaData;
          const result = meta?.TransactionResult || "unknown";

          if (result !== "tesSUCCESS") continue;

          const txType = txJson.TransactionType || "Unknown";
          const entry: LedgerTx = {
            type: txType,
            account: txJson.Account || "",
            destination: txJson.Destination || undefined,
            amount: typeof txJson.Amount === "string"
              ? (Number(txJson.Amount) / 1_000_000).toFixed(2) + " XRP"
              : txJson.Amount
                ? `${txJson.Amount.value} ${txJson.Amount.currency}`
                : undefined,
            hash: tx.hash || txJson.hash || "",
            ledgerIndex: Number(ledgerIndex),
            timestamp: closeTime,
          };

          if (txType === "EscrowCreate" || txType === "EscrowFinish" || txType === "EscrowCancel") {
            entry.meta = "escrow";
          } else if (txType === "Payment") {
            entry.meta = "payment";
          }

          txs.push(entry);
        }
      }
    }

    return NextResponse.json({
      ledgerIndex: Number(ledgerIndex),
      closeTime,
      transactions: txs,
      count: txs.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch ledger data." },
      { status: 500 }
    );
  }
}
