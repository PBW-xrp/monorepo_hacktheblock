# monorepo_hacktheblock_XRP_hackathon

# VeraFi — ZK Options on XRPL

**Hack the Block 2026 · Paris Blockchain Week · April 11-12**

---

## One-liner

Decentralized options protocol on XRPL where Black-Scholes pricing is verified on-chain via Boundless ZK proofs. No vault, no intermediary, no trust assumption.

---

## Pitch (60 seconds)

> Two parties agree on an option. The writer locks collateral in a ZK Smart Escrow on XRPL — and the key design decision: the escrow's destination is the buyer's address. Not a vault. Not a protocol wallet. The buyer directly.
>
> The buyer pays the premium via a simple XRPL Payment. Two transactions and the deal is live.
>
> At exercise: the buyer generates a Boundless ZK proof — a Groth16 proof that runs Black-Scholes inside a RISC Zero zkVM. The proof gets submitted as memos in an EscrowFinish transaction. The on-chain Wasm verifier checks the proof. If valid and ITM — finish() returns 1, and the collateral goes straight to the buyer.
>
> If the option expires out of the money, EscrowCancel returns collateral to the writer.
>
> Four transactions. Fully trustless. Zero options protocols exist on XRPL today — we're building the first one.

---

## Bounty strategy — one project, all tracks

VeraFi is one unified project that targets multiple bounties simultaneously. All bounties are stackable. Core deliverables target the main bounties first; visual polish is a nice-to-have layer on top.

### Primary bounties (core deliverables)

| Bounty | What qualifies us |
|--------|-------------------|
| **Main prizes (1st-3rd)** | First options protocol on XRPL. DeFi nativo, 4 txns per lifecycle on L1. Fills a gap in a 310-project ecosystem. |
| **Boundless** | ZK proof of Black-Scholes computed in RISC Zero zkVM, verified on-chain via Groth16 on groth5 devnet. Uses the Boundless starter kit directly. Emiliano Bonassi (VP Eng Boundless) is judge and mentor. |
| **Impact Finance** | Democratizes access to financial derivatives. Any XRPL user can hedge risk without needing an EVM wallet, a brokerage account, or financial intermediaries. |

### Nice-to-have bounty (visual layer, after core is done)

| Bounty | What qualifies us |
|--------|-------------------|
| **Pixel Meets Chain** | Visually stunning XRPL experience: 3D payoff surfaces, cinematic scroll, generative option cards, animated particle effects, glassmorphism UI. |

---

## Core constraint that drives the architecture

> "An escrow needs its amount and recipient set at deployment time. It is then a boolean operation — an escrow either finishes and delivers all of its held funds to its recipient, or does not finish."
> — Boundless XRPL RISC0 Starter FAQ

This means:
- `Destination` is immutable after `EscrowCreate`
- No partial withdrawals
- Funds always go to `Destination`, nowhere else

**Our design decision:** `Destination = buyer's address`. The ZK proof is the only gate. Fully trustless end-to-end.

**What we removed from the initial design because of this:**
- ~~rVeraFiVault~~ → replaced by buyer's address directly
- ~~Option tokens (TrustSet + Payment)~~ → unnecessary in bilateral model
- ~~DEX trading (OfferCreate)~~ → premium is a direct Payment
- ~~6+ transactions~~ → reduced to **4 transactions**

---

## End-to-end flows

### Flow 1 — Writer creates option

```
Writer connects wallet → /write page
  │
  │  Sets terms: CALL, strike = $1.15, expiry = 30 days,
  │  collateral = 100 XRP, buyer address
  │
  │  Signs EscrowCreate:
  │    {
  │      TransactionType: "EscrowCreate",
  │      Account: rWriter,
  │      Amount: "100000000",              // 100 XRP collateral
  │      Destination: rBuyer,              // buyer receives directly
  │      CancelAfter: <expiry_epoch>,      // option expiry
  │      FinishFunction: <escrow.wasm>,    // ZK verifier binary
  │      Data: <strike=1_150_000|is_call=1|expiry=CancelAfter>
  │    }
  │
  ▼
  Escrow live on groth5 devnet. Collateral locked.
```

### Flow 2 — Buyer pays premium

```
Buyer sees option on the board (driven by EscrowCreate event polling)
  │
  │  App shows Black-Scholes fair value + payoff visualization
  │
  │  Signs Payment:
  │    {
  │      TransactionType: "Payment",
  │      Account: rBuyer,
  │      Destination: rWriter,
  │      Amount: "5000000"              // 5 XRP premium
  │    }
  │
  ▼
  Deal done. Buyer has right to exercise. Writer has premium.
```

### Flow 3 — Buyer exercises (the ZK core)

```
Buyer → /exercise page → selects position
  │
  │  App shows: "CALL @ $1.15 is ITM (spot = $1.40) — intrinsic value: $0.25"
  │
  │  Clicks "Exercise" → triggers Boundless ZK proof:
  │    ┌──────────────────────────────────────────────┐
  │    │  RISC Zero zkVM (Groth16)                   │
  │    │                                              │
  │    │  Reads: spot=1_400_000, strike=1_150_000,    │
  │    │         vol=4300, rate=0, expiry=2_592_000,   │
  │    │         is_call=true                          │
  │    │  Computes: Black-Scholes price = 250_000      │
  │    │  Verifies: option is ITM (spot > strike)      │
  │    │  Commits: journal (38 bytes, see layout below)│
  │    │  Proves: Groth16 → seal (256 bytes)           │
  │    └──────────────────────┬───────────────────────┘
  │                           │
  │  Signs EscrowFinish:
  │    {
  │      TransactionType: "EscrowFinish",
  │      Owner: rWriter,
  │      OfferSequence: <escrow_seq>,
  │      ComputationAllowance: 1000000,
  │      Memos: [
  │        { MemoData: <journal_hex> },   // 38 bytes
  │        { MemoData: <seal_hex> }       // 256 bytes
  │      ]
  │    }
  │
  │  On-chain Wasm executes finish():
  │    1. Read journal (memo 0) and seal (memo 1)
  │    2. Verify Groth16 proof against OPTIONS_PRICER_ID
  │    3. Parse journal → cross-check vs Data field (strike, is_call)
  │    4. Confirm is_itm == 1
  │    5. Return 1 → escrow releases funds
  │
  ▼
  100 XRP → buyer. ZK-verified. Trustless.
```

### Flow 4 — Option expires OTM

```
CancelAfter time passes → anyone calls EscrowCancel
  │
  ▼
  100 XRP returns to writer. Option expired worthless.
```

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│              XRPL (groth5 devnet)                │
│                                                  │
│  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │   Smart    │  │ Payment  │  │ EscrowCancel │  │
│  │  Escrow    │  │(premium) │  │ (expiry OTM) │  │
│  │(ZK verify) │  │          │  │              │  │
│  └─────┬──────┘  └────┬─────┘  └──────┬──────┘  │
│        │               │               │         │
└────────┼───────────────┼───────────────┼─────────┘
         │               │               │
   ┌─────┴───────────────┴───────────────┴──────┐
   │          VeraFi Web App (Next.js)          │
   │                                             │
   │  ┌──────────┐ ┌──────────┐ ┌────────────┐  │
   │  │  XRPL    │ │  Option  │ │  Payoff     │  │
   │  │ Connect  │ │  Board   │ │  Surface    │  │
   │  │(wallets) │ │(escrows) │ │  (R3F)      │  │
   │  └──────────┘ └──────────┘ └──────┬─────┘  │
   │                                    │        │
   └────────────────────────────────────┼────────┘
                                        │
                                 ┌──────┴──────┐
                                 │  Boundless  │
                                 │   Prover    │
                                 │  (zkVM)     │
                                 │ Black-Scholes│
                                 │  in RISC-V  │
                                 └─────────────┘
```

---

## XRPL features used

| Feature | How we use it |
|---------|---------------|
| **ZK Smart Escrows** | Collateral locked, destination = buyer, settlement verified by ZK proof |
| **Payments** | Premium from buyer to writer (1 transaction) |
| **Memos** | Journal (38 bytes) + seal (256 bytes) of the ZK proof in EscrowFinish |
| **EscrowCancel** | Writer reclaims collateral after expiry if OTM |

All transactions hit **XRPL L1** on the groth5 devnet.

---

## Byte layout contract (ZK guest ↔ Wasm verifier)

The ZK guest and the on-chain Wasm verifier **must agree on byte layout**. This is the canonical definition.

### Journal layout (38 bytes total)

```rust
// ZK guest commits (order + type matters):
env::commit(&spot);     // u64, 8 bytes — e.g. 1_400_000
env::commit(&strike);   // u64, 8 bytes — e.g. 1_150_000
env::commit(&vol);      // u32, 4 bytes — e.g. 4_300
env::commit(&expiry);   // u64, 8 bytes — 2_592_000 (30d in seconds)
env::commit(&is_call);  // u8,  1 byte  — 1 = CALL
env::commit(&price);    // u64, 8 bytes — Black-Scholes output (computed)
env::commit(&is_itm);   // u8,  1 byte  — 1 if spot > strike for CALL
```

| Offset | Field | Type | Size | Example value |
|--------|-------|------|------|---------------|
| 0 | `spot` | u64 | 8 | `1_400_000` ($1.40) |
| 8 | `strike` | u64 | 8 | `1_150_000` ($1.15) |
| 16 | `vol` | u32 | 4 | `4_300` (43%) |
| 20 | `expiry` | u64 | 8 | `2_592_000` (30 days) |
| 28 | `is_call` | u8 | 1 | `1` (CALL) |
| 29 | `price` | u64 | 8 | `250_000` ($0.25) |
| 37 | `is_itm` | u8 | 1 | `1` (ITM) |
| **Total** | | | **38** | |

### EscrowCreate `Data` field encoding

The `Data` field stores the agreed option parameters so the Wasm verifier can cross-check the journal against what was agreed at creation time:

```
Data = strike (u64, 8 bytes) | is_call (u8, 1 byte) | expiry (u64, 8 bytes)
Total: 17 bytes
```

| Offset | Field | Type | Size | Example |
|--------|-------|------|------|---------|
| 0 | `strike` | u64 | 8 | `1_150_000` |
| 8 | `is_call` | u8 | 1 | `1` |
| 9 | `expiry` | u64 | 8 | `2_592_000` |

### Wasm verifier cross-check logic

```rust
fn finish() -> i32 {
    // 1. Read journal + seal from memos
    let journal: [u8; 38] = get_memo(0);
    let seal: [u8; 256] = get_memo(1);

    // 2. Verify ZK proof
    let proof = Proof::from_seal_bytes(&seal).unwrap();
    let journal_digest = risc0::hash_journal(&journal);
    risc0::verify(&proof, &OPTIONS_PRICER_ID, &journal_digest).unwrap();

    // 3. Parse journal
    let strike_journal = u64::from_le_bytes(journal[8..16]);
    let is_call_journal = journal[28];
    let is_itm = journal[37];

    // 4. Read Data field from escrow → cross-check
    let data: [u8; 17] = get_escrow_data();
    let strike_agreed = u64::from_le_bytes(data[0..8]);
    let is_call_agreed = data[8];

    // 5. Cross-check: journal params must match agreed params
    assert_eq!(strike_journal, strike_agreed);
    assert_eq!(is_call_journal, is_call_agreed);

    // 6. Release only if ITM
    is_itm as i32
}
```

---

## Components

### 1. zkVM Guest — Black-Scholes Pricer

Runs inside RISC Zero's zkVM. Computes option price with fixed-point arithmetic.

**Inputs** (via `env::read()`):
| Parameter | Type | Reference value | Human-readable |
|-----------|------|----------------|----------------|
| `spot_price` | u64, 6 decimals | `1_400_000` | $1.40 USD |
| `strike_price` | u64, 6 decimals | `1_150_000` | $1.15 USD |
| `time_to_expiry` | u64, seconds | `2_592_000` | 30 days |
| `volatility` | u32, basis points | `4_300` | 43% annualized |
| `risk_free_rate` | u64, basis points | `0` | 0% |
| `is_call` | u8 | `1` | Call option |

**Output** (journal via `env::commit()`):
- All inputs + computed `option_price` (`250_000` = $0.25) + `is_itm` (`1`) → 38 bytes total

**What it proves:** "Given these market parameters, the correct Black-Scholes price is $0.25 and the option is in the money." Verifiable by anyone. Unfakeable.

### 2. Smart Escrow — On-chain Verifier

Rust → wasm32v1-none. Deployed on groth5 devnet as `FinishFunction` in the escrow.

**Logic in `finish()`:**
1. Read journal (memo 0, 38 bytes) and seal (memo 1, 256 bytes)
2. Verify Groth16 proof against `OPTIONS_PRICER_ID` (image hash of the guest)
3. Parse journal → extract strike, is_call, is_itm
4. Read `Data` field from escrow → cross-check strike and is_call match what was agreed
5. Return `is_itm` → funds released only if option is in the money

### 3. Web App — Next.js Frontend

| Page | Purpose |
|------|---------|
| `/` | Landing page — connect wallet, project overview |
| `/write` | Writer creates an option — set strike, expiry, type, buyer address, collateral → signs EscrowCreate |
| `/trade` | Option board — lists active escrows via event polling, shows BS fair value, payoff visualization |
| `/exercise` | Buyer exercises — triggers ZK proof generation, signs EscrowFinish with proof memos |
| `/portfolio` | Positions overview — options written and bought, P&L |

### 4. CLI Prover

Generates the Groth16 ZK proof locally or via Boundless Market. Invoked from the web app when exercising.

---

## Tech stack

### Blockchain layer
| Component | Technology |
|-----------|------------|
| Network | XRPL groth5 devnet (`wss://groth5.devnet.rippletest.net:51233`) |
| Smart Escrow | Rust → wasm32v1-none (`risc0-verifier-xrpl-wasm`) |
| ZK Guest | Rust (`risc0-zkvm`, Groth16 proving) |
| XRPL SDK | `xrpl.js@4.5.0-smartescrow.4` |
| Proving | Local RISC Zero toolchain or Boundless Market |

### Frontend layer
| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 + React 18 + TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| 2D Animation | Framer Motion 12 + GSAP/ScrollTrigger |
| Smooth Scroll | Lenis |
| Particles | tsParticles |
| UI Components | Aceternity UI (spotlight cards, aurora, meteors, moving borders) |
| 3D | React Three Fiber + Drei + Postprocessing (bloom, chromatic aberration) |
| Charts | Recharts |
| Icons | Lucide React |

### Wallet layer
| Component | Technology |
|-----------|------------|
| Connection | `xrpl-connect` (umbrella package) |
| Primary | Otsu Wallet (MV3 browser extension, mentor-recommended — `OtsuAdapter` in xrpl-connect, escrow support built-in, GemWallet/Crossmark compat shims, ref: `github.com/RomThpt/otsu-wallet`) |
| Secondary | Crossmark (browser extension, zero config fallback) |
| Tertiary | Xaman (QR-based, team has API keys) |

---

## Transaction lifecycle

| Step | Transaction | From | To | What happens |
|------|------------|------|-----|-------------|
| 1. Write | `EscrowCreate` | Writer | Escrow (dest=Buyer) | Collateral locked, ZK verifier deployed, Data field stores agreed params |
| 2. Premium | `Payment` | Buyer | Writer | Buyer pays for the option right |
| 3a. Exercise (ITM) | `EscrowFinish` | Buyer | — | ZK proof in memos, on-chain verify + cross-check vs Data, funds → Buyer |
| 3b. Expiry (OTM) | `EscrowCancel` | Anyone | — | Collateral returns to Writer |

**4 transactions total. All on XRPL L1.**

---

## Wallet integration

```typescript
import { WalletManager, OtsuAdapter, CrossmarkAdapter, XamanAdapter } from 'xrpl-connect';

const walletManager = new WalletManager({
  adapters: [
    new OtsuAdapter(),                                          // primary — mentor recommended
    new CrossmarkAdapter(),                                     // fallback
    new XamanAdapter({ apiKey: process.env.XAMAN_API_KEY }),   // QR alternative
  ],
  network: {
    id: 'groth5',
    name: 'Groth5 Devnet',
    wss: 'wss://groth5.devnet.rippletest.net:51233',
  },
  autoConnect: true,
});
```

**Web component:**
```html
<xrpl-wallet-connector
  primary-wallet="otsu"
  wallets="otsu,crossmark,xaman"
  style="--xc-background-color: #0a0d14; --xc-primary-color: #00e5ff;"
/>
```

---

## Oracle consideration

The smart escrow **can read live spot prices from an on-chain XRPL Oracle** at settlement time.

**Reference:** https://github.com/ripple/xrpl-wasm-stdlib/tree/main/examples/smart-escrows/oracle/

### How it works

The escrow's `finish()` function reads the Oracle ledger object synchronously at validation time:

```rust
let oracle_keylet = oracle_keylet(&ORACLE_OWNER, ORACLE_DOCUMENT_ID);
let slot = host::cache_ledger_obj(oracle_keylet.as_ptr(), oracle_keylet.len(), 0);

let mut locator = Locator::new();
locator.pack(sfield::PriceDataSeries);
locator.pack(0);
locator.pack(sfield::AssetPrice);

let price = host::get_ledger_obj_nested_field(slot, locator, ...);
```

### What's available vs what's not

| Data | On-chain oracle | Status |
|------|----------------|--------|
| **Spot price (XRP/USD)** | Yes — via `OracleSet` with `BaseAsset: "XRP"`, `QuoteAsset: "USD"` | Available. Requires setting up an Oracle object on groth5 devnet. |
| **Volatility** | No — no on-chain volatility oracle exists on XRPL | Not available. Hardcoded at 43% annualized (4300 bps). |

### Our approach

- **Spot price:** Use the on-chain oracle pattern. Set up an Oracle object on groth5 devnet via `OracleSet` and update it with current XRP/USD prices. The smart escrow reads it at settlement time to determine ITM/OTM.
- **Volatility:** Hardcoded for the hackathon (43% annualized). In production, this would come from an off-chain vol oracle or be computed inside the ZK proof from historical price data.

### Oracle setup required (pre-demo)

```json
{
  "TransactionType": "OracleSet",
  "Account": "rOracleOperator...",
  "OracleDocumentID": 1,
  "Provider": "VeraFi",
  "AssetClass": "currency",
  "LastUpdateTime": "<current_ripple_epoch>",
  "PriceDataSeries": [
    {
      "PriceData": {
        "BaseAsset": "XRP",
        "QuoteAsset": "USD",
        "AssetPrice": 1400000,
        "Scale": 6
      }
    }
  ]
}
```

The `ORACLE_OWNER` address and `ORACLE_DOCUMENT_ID` are then hardcoded in the smart escrow Wasm.

---

## Team split

### Priority 1 — Core deliverables (must ship)

| Area | Bounty | Deliverables |
|------|--------|-------------|
| **ZK + Escrow (Rust)** | **Boundless** | zkVM guest (BS pricer), Smart Escrow verifier (finish() + cross-check), CLI prover, proof encoding, byte layout implementation |
| **Frontend — functional** | **Main prizes** | /write, /trade, /exercise pages, xrpl-connect + Otsu integration, EscrowCreate/Payment/EscrowFinish tx builders, event polling, Data field encoding |
| **Integration + pitch** | **Main + Impact** | E2E testing on groth5, Oracle setup, demo prep, pitch framing (financial inclusion angle), submission text, video recording |

### Priority 2 — Nice to have (after core works)

| Area | Bounty | Deliverables |
|------|--------|-------------|
| **Frontend — visual** | **Pixel Meets Chain** | 3D payoff surface (R3F), landing page (GSAP + aurora + particles), animated option board, greeks charts, generative cards, page transitions |

---

## Visual strategy — Pixel Meets Chain (nice-to-have, after core ships)

| Element | Treatment |
|---------|-----------|
| **Landing** | GSAP ScrollTrigger cinematic scroll + Lenis smooth scroll + Aceternity aurora background + meteor shower + particle canvas |
| **Option board** | Aceternity spotlight cards with animated glow borders. Each escrow = a card. Driven by EscrowCreate event polling |
| **3D Payoff surface** | React Three Fiber scene: P&L × spot × time rendered as animated 3D terrain. Bloom postprocessing. Color gradient ITM (cyan) → OTM (purple) |
| **Greeks** | Animated radial charts with glow effects. Delta, vega, theta curves via Recharts + Framer Motion |
| **Live TX feed** | tsParticles: each XRPL transaction from WebSocket subscription = particle burst |
| **Design system** | `#0a0d14` (bg), `#6b8fff` (blue), `#00e5ff` (cyan), `#9b6bff` (purple), `#f0f4ff` (text). Inter + JetBrains Mono. Glassmorphism throughout. |

---

## Network details

| Resource | URL |
|----------|-----|
| RPC (WebSocket) | `wss://groth5.devnet.rippletest.net:51233` |
| Faucet | `http://groth5-faucet.devnet.rippletest.net` |
| Explorer | `http://custom.xrpl.org/groth5.devnet.rippletest.net` |
| Boundless Starter Kit | `https://github.com/boundless-xyz/xrpl-risc0-starter` |
| XRPL Wasm Stdlib (oracle) | `https://github.com/ripple/xrpl-wasm-stdlib` |
| xrpl.js (smart escrow) | `xrpl@4.5.0-smartescrow.4` |
| Otsu Wallet ref | `https://github.com/RomThpt/otsu-wallet` |
| Funded wallet | `rifU1ueYmRw6XLyecqiQHf1FWM8mF7mZ9` (testnet + devnet, 100 XRP each) |

---

## Demo strategy

**Pre-pitch preparation:**
- Pre-create 2-3 escrows with a team wallet as writer
- Pre-fund buyer wallet from faucet
- Pre-generate at least 1 ZK proof (Groth16 is slow)
- Set up Oracle on groth5 with current XRP/USD price

**Live demo (3 minutes):**
1. Show the landing page — visual impact
2. Connect wallet via Otsu (1 click, instant)
3. Option board — escrows listed with payoff visualization
4. Pay premium (1 signature)
5. Exercise with ZK proof → show proof verification → EscrowFinish → funds arrive
6. Show tx on groth5 explorer

**Fallback:** Pre-recorded demo video if groth5 devnet is unstable.

---

## Submission text (draft)

**What real-world problem does your project solve?**
There are zero options protocols on XRPL. Users cannot hedge their XRP exposure on-chain. VeraFi is the first decentralized options protocol on the XRP Ledger, enabling trustless hedging with ZK-verified pricing.

**How can your solution scale beyond the hackathon?**
The bilateral model scales to multi-collateral vaults with professional market makers as writers. The pricing engine is Rysk-compatible. Any asset pair on XRPL can become an option underlying. On-chain oracle integration for spot price is already working.

**Which XRPL features are used?**
ZK Smart Escrows (collateral + settlement + on-chain ZK verification), Payments (premium), Memos (ZK proof delivery), EscrowCancel (expiry), Oracle (spot price at settlement time). All transactions on L1 via the groth5 devnet.

**Estimated transaction volume?**
4 transactions per option lifecycle. At 1,000 options/day = 4,000 daily XRPL transactions, plus oracle updates.

---

## Judging criteria alignment

| Criteria | How we score |
|----------|-------------|
| **Idea** | First options protocol on XRPL. Fills a gap in a 310-project ecosystem. ZK-verified pricing is novel. Zero competitors. |
| **Implementation** | Rust smart escrow + RISC Zero zkVM guest + Next.js frontend. Clean bilateral architecture. 4 txns. Byte layout contract between guest and verifier. Oracle integration for live spot price. |
| **Demo** | Full lifecycle in 3 minutes. Live on groth5. |
| **Potential** | Options are a $600T+ global market. Business model: protocol fee on premiums. Path to production: Rysk-compatible quote struct, multi-asset expansion, vol oracle. |

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Groth16 proving is slow (~minutes) | Pre-compute proof before demo; Boundless Market for offloading |
| groth5 devnet instability | Test early, have fallback demo video |
| Journal byte layout mismatch | Defined canonical 38-byte layout with cross-check in Wasm verifier |
| Volatility not available on-chain | Hardcoded for hackathon (43% annualized, 4300 bps). ZK proof takes it as input. |
| Oracle price staleness | Update oracle frequently during demo. Read `LastUpdateTime` to check freshness. |
| 24h time pressure | Bilateral model = 4 txns not 6+. Parallel workstreams. Visual polish > feature count. |
| Wallets don't support groth5 natively | Use xrpl-connect custom network config. Otsu supports custom networks. |
