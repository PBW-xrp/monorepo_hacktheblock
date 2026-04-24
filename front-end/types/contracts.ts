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
  writerAddress: (process.env.NEXT_PUBLIC_DEFAULT_WRITER_ADDRESS || "rht5xsioM3iix1hx4i2zJX2WJ1JDTwLGJe").trim(),
  buyerAddress: (process.env.NEXT_PUBLIC_DEFAULT_BUYER_ADDRESS || "r8D5rp5cn2hkemoLKvoEJFNZ73Mp2Mcgr").trim(),
};

export const WRITER_DEFAULTS = {
  collateralDrops: "20000000",
  collateralXrp: "20",
  strikeFixedPoint: 1_150_000,
  strikeUsd: "1.15",
  optionType: "CALL" as OptionType,
};

export function encodeEscrowDataV1({ strikeUsd, expirySeconds, optionType }: Pick<WriteFormValues, "strikeUsd" | "expirySeconds" | "optionType">) {
  const strike = Number(strikeUsd);
  if (!Number.isFinite(strike) || strike <= 0) {
    throw new Error("Invalid strike.");
  }
  if (!Number.isFinite(expirySeconds) || expirySeconds <= 0) {
    throw new Error("Invalid expiry.");
  }

  const strikeFixed = Math.round(strike * 1_000_000);
  const isCall = optionType === "CALL" ? 1 : 0;

  const bytes = new Uint8Array(17);
  const view = new DataView(bytes.buffer);
  view.setBigUint64(0, BigInt(strikeFixed), true);
  view.setUint8(8, isCall);
  view.setBigUint64(9, BigInt(expirySeconds), true);

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

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
