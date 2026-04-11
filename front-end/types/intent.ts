export type IntentV1 = {
  intentId: string;
  t: number;
  action: "RFQ";
  underlying: "XRP";
  amount: string;
  strike: string;
  expiry: number;
  isPut: boolean;
};

export type SendIntentPaymentInput = {
  memo: IntentV1;
  amountDrops?: string;
};
