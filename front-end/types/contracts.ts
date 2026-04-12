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

export function encodeEscrowDataV1({ strikeUsd, expirySeconds, optionType }: Pick<WriteFormValues, "strikeUsd" | "expirySeconds" | "optionType">) {
  const strikeFixed = Math.round(Number(strikeUsd) * 1_000_000);
  const isCall = optionType === "CALL" ? 1 : 0;

  const buffer = Buffer.alloc(17);
  buffer.writeBigUInt64LE(BigInt(strikeFixed), 0);
  buffer.writeUInt8(isCall, 8);
  buffer.writeBigUInt64LE(BigInt(expirySeconds), 9);

  return {
    hex: buffer.toString("hex"),
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
