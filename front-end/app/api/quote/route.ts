import { NextResponse } from "next/server";
import type { IntentV1 } from "@/types/intent";

// ---------------------------------------------------------------------------
// Black-Scholes pricing engine
// Reference values from team:
//   spot = $1.40, vol = 43%, rate = 0%, expiry = 30d → price ≈ $0.25
// ---------------------------------------------------------------------------

function blackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isPut: boolean
): number {
  if (T <= 0) return Math.max(0, isPut ? K - S : S - K);

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const N = (x: number) => {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const t = 1 / (1 + p * Math.abs(x));
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1 + sign * y);
  };

  if (isPut) {
    return K * Math.exp(-r * T) * N(-d2) - S * N(-d1);
  }
  return S * N(d1) - K * Math.exp(-r * T) * N(d2);
}

export async function POST(req: Request) {
  try {
    const body: IntentV1 = await req.json();

    const S = 1.40;       // XRP/USD spot price (hardcoded — in prod: on-chain oracle)
    const K = parseFloat(body.strike);
    const amount = parseFloat(body.amount);
    const now = Math.floor(Date.now() / 1000);
    const T = Math.max(0, (body.expiry - now) / (365 * 24 * 3600));
    const r = 0;           // risk-free rate = 0
    const sigma = 0.43;   // 43% annualized vol (4300 bps)

    const bsPrice = blackScholes(S, K, T, r, sigma, body.isPut);

    // Greeks via finite differences
    const dS = 0.001;
    const delta =
      (blackScholes(S + dS, K, T, r, sigma, body.isPut) -
        blackScholes(S - dS, K, T, r, sigma, body.isPut)) /
      (2 * dS);

    const dSigma = 0.001;
    const vega =
      (blackScholes(S, K, T, r, sigma + dSigma, body.isPut) -
        blackScholes(S, K, T, r, sigma - dSigma, body.isPut)) /
      (2 * dSigma);

    const totalPremiumXRP = bsPrice * amount;

    // Fixed-point values matching the ZK journal layout
    const spotFixed = Math.round(S * 1_000_000);       // 1_400_000
    const strikeFixed = Math.round(K * 1_000_000);
    const priceFixed = Math.round(bsPrice * 1_000_000);
    const volFixed = Math.round(sigma * 10_000);        // 4300
    const isItm = body.isPut ? S < K : S > K;

    return NextResponse.json({
      intentId: body.intentId,
      spotPrice: S,
      impliedVol: sigma,
      priceBS: bsPrice,
      totalPremiumXRP,
      delta,
      vega,
      // Fixed-point values for ZK guest reference
      fixedPoint: {
        spot: spotFixed,
        strike: strikeFixed,
        price: priceFixed,
        vol: volFixed,
        isItm,
      },
      validUntil: Date.now() + 30_000,
    });
  } catch {
    return NextResponse.json({ error: "Quote failed." }, { status: 500 });
  }
}
