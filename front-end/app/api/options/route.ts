import { NextResponse } from "next/server";

// Force dynamic — do not pre-render at build time
export const dynamic = "force-dynamic";

const GROTH5_RPC = "https://groth5.devnet.rippletest.net:51234";

export type OptionListing = {
  id: string;            // escrow tx hash
  type: "CALL" | "PUT";
  strike: number;        // USD
  collateral: number;    // XRP
  expiryEpoch: number;   // unix seconds
  writer: string;        // r-address
  buyer: string;         // r-address (escrow Destination)
  ledgerIndex: number;
  isMock?: boolean;
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

/**
 * Decodes the escrow Data field hex into option params.
 * Layout (17 bytes): strike (u64, 8) + is_call (u8, 1) + expiry (u64, 8)
 */
function decodeEscrowData(hex: string): { strike: number; isCall: boolean; expiry: number } | null {
  try {
    if (!hex || hex.length < 34) return null;
    const bytes = Buffer.from(hex, "hex");
    if (bytes.length < 17) return null;
    // Little-endian u64 for strike
    const strikeRaw = bytes.readBigUInt64LE(0);
    const isCall = bytes.readUInt8(8) === 1;
    const expiry = Number(bytes.readBigUInt64LE(9));
    return {
      strike: Number(strikeRaw) / 1_000_000, // 6 decimal fixed-point → USD
      isCall,
      expiry,
    };
  } catch {
    return null;
  }
}

// ─── Mock data fallback ──────────────────────────────────────────────────────
function generateMockOptions(): OptionListing[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      id: "0xMOCK0001A4F8C2D9E7B3F1A5C8E6D4B2",
      type: "CALL",
      strike: 1.15,
      collateral: 100,
      expiryEpoch: now + 86400 * 7,
      writer: "rifU1ueYmRw6XLyecqiQHf1FWM8mF7mZ9",
      buyer: "rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT",
      ledgerIndex: 0,
      isMock: true,
    },
    {
      id: "0xMOCK0002B5D9E3C1F7A8E2D6C9B4F5A3",
      type: "CALL",
      strike: 1.20,
      collateral: 250,
      expiryEpoch: now + 86400 * 30,
      writer: "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
      buyer: "rfizF55b3KjHBhHcGiF8FKiBtFXcWZeC2j",
      ledgerIndex: 0,
      isMock: true,
    },
    {
      id: "0xMOCK0003C6E1F4D8B2A9E5C3D7F6B1A4",
      type: "PUT",
      strike: 1.05,
      collateral: 150,
      expiryEpoch: now + 86400 * 14,
      writer: "rDNvpqQzKM7K6F8wJ9bP2YxR3hQwTm5yKx",
      buyer: "rifU1ueYmRw6XLyecqiQHf1FWM8mF7mZ9",
      ledgerIndex: 0,
      isMock: true,
    },
    {
      id: "0xMOCK0004D7F2E5C9B3A8E6D1F4C7B2A5",
      type: "CALL",
      strike: 1.30,
      collateral: 500,
      expiryEpoch: now + 86400 * 90,
      writer: "rGNcm6KLKj1cTnLhVj8h8Q1P2bL3dZ4mNx",
      buyer: "rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT",
      ledgerIndex: 0,
      isMock: true,
    },
    {
      id: "0xMOCK0005E8A3F6D9C4B7E2F5A1D8C3B6",
      type: "PUT",
      strike: 0.95,
      collateral: 80,
      expiryEpoch: now + 86400 * 21,
      writer: "rifU1ueYmRw6XLyecqiQHf1FWM8mF7mZ9",
      buyer: "rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc",
      ledgerIndex: 0,
      isMock: true,
    },
    {
      id: "0xMOCK0006F9B4A7E2D5C8B1F3A6E9C2D5",
      type: "CALL",
      strike: 1.10,
      collateral: 200,
      expiryEpoch: now + 86400 * 3,
      writer: "rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT",
      buyer: "rifU1ueYmRw6XLyecqiQHf1FWM8mF7mZ9",
      ledgerIndex: 0,
      isMock: true,
    },
  ];
}

export async function GET() {
  const realOptions: OptionListing[] = [];

  try {
    // Query the latest validated ledger and look for EscrowCreate transactions
    const ledgerRes = await rpcRequest("ledger", [{
      ledger_index: "validated",
      transactions: true,
      expand: true,
    }]);

    const ledger = ledgerRes.result?.ledger;
    if (ledger?.transactions && Array.isArray(ledger.transactions)) {
      const ledgerIndex = Number(ledger.ledger_index);

      for (const tx of ledger.transactions) {
        if (typeof tx !== "object" || tx === null) continue;
        const txJson = tx.tx_json || tx;
        const meta = tx.meta || tx.metaData;
        const result = meta?.TransactionResult;

        if (result !== "tesSUCCESS") continue;
        if (txJson.TransactionType !== "EscrowCreate") continue;

        // Decode the Data field
        const data = decodeEscrowData(txJson.Data || "");
        if (!data) continue;

        const collateralXRP = typeof txJson.Amount === "string"
          ? Number(txJson.Amount) / 1_000_000
          : 0;

        realOptions.push({
          id: tx.hash || txJson.hash || `${ledgerIndex}-${realOptions.length}`,
          type: data.isCall ? "CALL" : "PUT",
          strike: data.strike,
          collateral: collateralXRP,
          expiryEpoch: txJson.CancelAfter || data.expiry,
          writer: txJson.Account || "",
          buyer: txJson.Destination || "",
          ledgerIndex,
        });
      }
    }
  } catch {
    // Network error — fall through to mock data
  }

  const enableMockFallback = process.env.NEXT_PUBLIC_ENABLE_MOCK_OPTIONS === "true";
  const options = realOptions.length > 0 ? realOptions : enableMockFallback ? generateMockOptions() : [];

  return NextResponse.json({
    options,
    count: options.length,
    isMock: realOptions.length === 0 && enableMockFallback,
  });
}
