# Deployment Status

This file tracks the current contract-side deployment inputs and the result of real groth5 attempts.

## Current locked payload values

### Writer address
- `rht5xsioM3iix1hx4i2zJX2WJ1JDTwLGJe`

### Buyer address
- `r8D5rp5cn2hkemoLKvoEJFNZ73Mp2Mcgr`

### Frontend/network alignment values
- network id: `1256`
- premium constant: `5000000` drops
- `NEXT_PUBLIC_DEFAULT_WRITER_ADDRESS=rht5xsioM3iix1hx4i2zJX2WJ1JDTwLGJe`
- `NEXT_PUBLIC_DEFAULT_BUYER_ADDRESS=r8D5rp5cn2hkemoLKvoEJFNZ73Mp2Mcgr`
- `NEXT_PUBLIC_ENABLE_MOCK_OPTIONS=false`

### Collateral
- `100 XRP`
- `100000000` drops

### Option parameters
- type: `CALL`
- strike: `1.15 USD`
- strike fixed-point: `1150000`
- is_call: `1`
- expiry seconds example currently used in proof run: `2592000`

### Escrow `Data`
- `308c11000000000001008d270000000000`

### Image ID
- `873fa78de97d6e673e1f47b3311e4fe2923d8b4259344f73a46ac304bd9e8789`

### Journal
- `c05c150000000000308c110000000000cc100000008d2700000000000100000090d003000000000001000000`

## FinishFunction source

Derived from:
- `contracts/target/wasm32v1-none/release/verafi_escrow_verifier.wasm`

The `FinishFunction` value must be the hex-encoded contents of that compiled Wasm file.

## EscrowCreate payload template

```json
{
  "TransactionType": "EscrowCreate",
  "Account": "rht5xsioM3iix1hx4i2zJX2WJ1JDTwLGJe",
  "Amount": "100000000",
  "Destination": "r8D5rp5cn2hkemoLKvoEJFNZ73Mp2Mcgr",
  "CancelAfter": "<RIPPLE_EPOCH_TIME>",
  "FinishFunction": "<HEX_ENCODED_WASM>",
  "Data": "308c11000000000001008d270000000000"
}
```

## EscrowFinish payload template

```json
{
  "TransactionType": "EscrowFinish",
  "Account": "r8D5rp5cn2hkemoLKvoEJFNZ73Mp2Mcgr",
  "Owner": "rht5xsioM3iix1hx4i2zJX2WJ1JDTwLGJe",
  "OfferSequence": "<ESCROW_SEQUENCE>",
  "ComputationAllowance": 1000000,
  "Memos": [
    {
      "Memo": {
        "MemoData": "c05c150000000000308c110000000000cc100000008d2700000000000100000090d003000000000001000000"
      }
    },
    {
      "Memo": {
        "MemoData": "<SEAL_HEX>"
      }
    }
  ]
}
```

## Real deployment attempts

### Attempt 1
- status: pending
- notes: waiting on live wallet-backed groth5 submission path

## Record fields for future live attempts
- date/time
- create tx hash
- create result code
- offer sequence
- finish tx hash
- finish result code
- explorer links
- notes
