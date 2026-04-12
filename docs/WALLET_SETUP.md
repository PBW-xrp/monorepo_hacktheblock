# VeraFi — Wallet Integration Setup Guide

> Branch: `xrp-connect` | Network: groth5 devnet | Last updated: April 12, 2026

---

## Overview

VeraFi uses **Otsu Wallet** as the primary XRPL browser extension. Otsu is not yet published to the Chrome Web Store — it must be built from source and loaded as an unpacked extension.

The wallet integration flow:
1. Otsu connects and returns the user's XRPL address
2. When signing a transaction, `signTransaction()` returns a signed `tx_blob`
3. xrpl.js submits the `tx_blob` directly to groth5 via WebSocket (bypassing Otsu's internal submit, which fails on custom networks)

---

## Step 1 — Build Otsu Wallet

### Prerequisites
- Node.js ≥ 20.11
- pnpm ≥ 9

```bash
git clone https://github.com/RomThpt/otsu-wallet
cd otsu-wallet
pnpm install
pnpm --filter @otsu/extension build:chrome
```

Build output: `packages/extension/dist/`

---

## Step 2 — Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select `otsu-wallet/packages/extension/dist`

Otsu icon should appear in the Chrome toolbar.

---

## Step 3 — Configure Otsu

### 3a. Create a wallet
Open Otsu → create a new wallet or import an existing seed phrase.

### 3b. Add groth5 as custom network
Go to **Settings → Networks → Add Custom Network**:

| Field | Value |
|-------|-------|
| Name | `Groth5 Devnet` |
| WSS | `wss://groth5.devnet.rippletest.net:51233` |

### 3c. Switch to groth5
Click the network selector at the top of Otsu and select `Groth5 Devnet`.

### 3d. Enable blind signing
Go to **Settings → Security** (or Advanced) → enable **Blind Signing**.

> This is required because groth5 transactions are not recognized by Otsu's transaction parser.

---

## Step 4 — Fund your wallet on groth5

Get your XRPL address from Otsu (shown on the main screen).

Fund it using the groth5 faucet:

```bash
curl -X POST "https://groth5.devnet.rippletest.net/accounts" \
  -H "Content-Type: application/json" \
  -d '{"destination": "YOUR_OTSU_ADDRESS"}'
```

> **Note:** The faucet HTTP endpoint (`http://groth5-faucet.devnet.rippletest.net`) is often unreachable. Use `https://groth5.devnet.rippletest.net/accounts` instead.
> If both are down, ask a teammate to send you XRP from a funded groth5 wallet.

Verify balance via explorer:
```
https://custom.xrpl.org/groth5.devnet.rippletest.net/accounts/YOUR_OTSU_ADDRESS
```

---

## Step 5 — Run the frontend

```bash
cd front-end
npm install
npm run dev
```

App runs at `http://localhost:3000`

---

## Step 6 — Connect wallet

1. Open `http://localhost:3000`
2. Click **Otsu Wallet**
3. Approve the connection in the Otsu popup
4. Your XRPL address should appear as "Connected"

---

## Step 7 — Receiver address (writer wallet)

The **Pay Premium** button currently sends 5 XRP to a hardcoded destination in `front-end/app/trade/page.tsx`:

```typescript
const PREMIUM_DROPS = "5000000"; // 5 XRP

// line ~160 in handleBuy:
Destination: "rht5xsioM3iix1hx4i2zJX2WJ1JDTwLGJe", // groth5 faucet wallet (demo placeholder)
```

### For the real integration:

Each option writer creates an **EscrowCreate** with `Destination = buyer's address`. The "Pay Premium" payment goes to the **writer's address** — not an escrow, just a direct `Payment` transaction.

**The team building the smart escrow / write flow needs to:**
1. Expose the writer's XRPL address when creating an option
2. Replace `Destination` in `handleBuy` with the writer's address from the option data

Example:
```typescript
Destination: option.writerAddress, // from escrow/option board data
```

---

## Network details

| Resource | Value |
|----------|-------|
| WebSocket | `wss://groth5.devnet.rippletest.net:51233` |
| RPC | `https://groth5.devnet.rippletest.net:51234` |
| Explorer | `https://custom.xrpl.org/groth5.devnet.rippletest.net` |
| Network ID | `1256` |
| Faucet | `https://groth5.devnet.rippletest.net/accounts` (POST) |

---

## Known issues & workarounds

| Issue | Cause | Fix |
|-------|-------|-----|
| `provider.request is not a function` | Otsu doesn't have `.request()` | Use `provider.connect()` and `provider.signTransaction()` |
| `temREDUNDANT` | Sending to yourself or same tx submitted twice | Ensure sender ≠ destination; use `autofill` for correct Sequence |
| `tecNO_DST_INSUF_XRP` | Destination account doesn't exist on groth5 | Fund the destination via faucet first |
| Transaction not found on explorer | Submitted to wrong network | Verify Otsu is on `Groth5 Devnet`, not Testnet/Mainnet |
| `Permission scope 'switchNetwork' not granted` | `switchNetwork` is not in the connect scopes | Switch network manually in Otsu UI |
| Otsu submits to wrong network | Otsu's internal submit ignores custom network config | Use `signTransaction` + xrpl.js `submitAndWait` instead of `signAndSubmit` |

---

## Key files

| File | Purpose |
|------|---------|
| `front-end/contexts/WalletContext.tsx` | Global wallet state, WalletManager, Otsu + Crossmark connect logic |
| `front-end/components/WalletConnectPanel.tsx` | Wallet selection UI |
| `front-end/app/trade/page.tsx` | Pay Premium flow — signs with Otsu, submits via xrpl.js |
| `front-end/types/xrpl-connect.d.ts` | TypeScript declarations for xrpl-connect (no official types) |

---

## Demo wallet addresses (groth5)

| Role | Address | Status |
|------|---------|--------|
| Buyer (Otsu demo) | `r8D5rp5cn2hkemoLKvoEJFNZ73Mp2Mcgr` | Funded (100 XRP) |
| Writer placeholder | `rht5xsioM3iix1hx4i2zJX2WJ1JDTwLGJe` | Groth5 faucet wallet — replace with real writer address |

> The buyer address (`r8D5rp5cn2hkemoLKvoEJFNZ73Mp2Mcgr`) is the Otsu wallet used during development. Each team member will have their own Otsu address after setup — make sure to fund it on groth5 using Step 4.
