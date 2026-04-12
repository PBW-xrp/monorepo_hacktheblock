export type OptionType = "CALL" | "PUT";

export type WriteFormValues = {
  buyerAddress: string;
  collateralXrp: string;
  strikeUsd: string;
  expirySeconds: number;
  optionType: OptionType;
};

export const XRPL_DEFAULTS = {
  networkId: 1256,
  premiumDrops: "5000000",
  writerAddress: process.env.NEXT_PUBLIC_DEFAULT_WRITER_ADDRESS || "rht5xsioM3iix1hx4i2zJX2WJ1JDTwLGJe",
  buyerAddress: process.env.NEXT_PUBLIC_DEFAULT_BUYER_ADDRESS || "r8D5rp5cn2hkemoLKvoEJFNZ73Mp2Mcgr",
};

export const WRITER_DEFAULTS = {
  collateralDrops: "100000000",
  collateralXrp: "100",
  strikeFixedPoint: 1_150_000,
  strikeUsd: "1.15",
  optionType: "CALL" as OptionType,
};

// Known validated values from contracts/README.md
export const CONTRACT_ARTIFACTS = {
  imageId: "873fa78de97d6e673e1f47b3311e4fe2923d8b4259344f73a46ac304bd9e8789",
  journal: "c05c150000000000308c110000000000cc100000008d2700000000000100000090d003000000000001000000",
  dataHex: "308c11000000000001008d270000000000",
};

/**
 * Encode the escrow Data field using browser-compatible APIs.
 * Layout: strike (u64 LE, 8 bytes) + is_call (u8, 1 byte) + expiry (u64 LE, 8 bytes) = 17 bytes
 */
export function encodeEscrowDataV1({ strikeUsd, expirySeconds, optionType }: Pick<WriteFormValues, "strikeUsd" | "expirySeconds" | "optionType">) {
  const strikeFixed = Math.round(Number(strikeUsd) * 1_000_000);
  const isCall = optionType === "CALL" ? 1 : 0;

  const bytes = new Uint8Array(17);
  const view = new DataView(bytes.buffer);

  // Little-endian u64 for strike (split into low/high 32-bit)
  view.setUint32(0, strikeFixed & 0xFFFFFFFF, true);
  view.setUint32(4, Math.floor(strikeFixed / 0x100000000), true);

  // u8 for is_call
  view.setUint8(8, isCall);

  // Little-endian u64 for expiry
  view.setUint32(9, expirySeconds & 0xFFFFFFFF, true);
  view.setUint32(13, Math.floor(expirySeconds / 0x100000000), true);

  // Convert to hex string
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

  return {
    hex,
    strikeFixed,
    isCall,
  };
}

export function xrpToDrops(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid XRP amount.");
  }
  return Math.round(amount * 1_000_000).toString();
}

export function unixToRippleTime(unixSeconds: number) {
  return unixSeconds - 946684800;
}
