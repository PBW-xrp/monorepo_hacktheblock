# Groth5 Live Payloads

Date: 2026-04-11
Status: prepared from real local artifacts

## Real local artifact paths
### Verifier Wasm
- `Contracts/target/wasm32v1-none/release/verafi_escrow_verifier.wasm`

### Real image ID
- `873fa78de97d6e673e1f47b3311e4fe2923d8b4259344f73a46ac304bd9e8789`

### Real runtime journal
- `c05c150000000000308c110000000000cc100000008d2700000000000100000090d003000000000001000000`

### Real runtime seal
- `0bf34bc2558bb1acf8e23b155a4bc96ccd6d48d685d894c9ffd0e4e51c66154b1b0380e7a054d9d616457f8e0b4b92744d84bd8d489c179643f5c57cedddbeb5004df234603b101b1ec4f2299c2dea2433d3db5b24b6a29a685cb7f49bcc8dd60b379aac933a89563e4a4556988bbd81fafcf8c8da2c44c348dfb105366c0af00f00b77d9b95fac18f94ebe6eb233f5b3521dce66f5fac7448e74a54e0293c37280f74cea9926a81c4df87a6920c2de4efef8d1ae744e4a56041e71f7f75b5c42861019b98bb4cdff56b28806d5f781489165dceb799726e6208669a5b880e360674a1f4b8cea429da15bd38a53a57333b09a990dea0a450653aba1570172a06`

## Escrow Data
Canonical fields:
- strike = `1_150_000`
- is_call = `1`
- expiry = `2_592_000`

Expected little-endian hex:
- `308c11000000000001008d270000000000`

Length:
- `17` bytes

## EscrowCreate payload shape
This is the real payload shape we need on groth5:

```json
{
  "TransactionType": "EscrowCreate",
  "Account": "<WRITER_ADDRESS>",
  "Amount": "<COLLATERAL_DROPS>",
  "Destination": "<BUYER_ADDRESS>",
  "CancelAfter": <EXPIRY_RIPPLE_EPOCH>,
  "FinishFunction": "<UPLOADED_WASM_REFERENCE>",
  "Data": "308c11000000000001008d270000000000"
}
```

## EscrowFinish payload shape
```json
{
  "TransactionType": "EscrowFinish",
  "Account": "<BUYER_ADDRESS_OR_FINISHER>",
  "Owner": "<WRITER_ADDRESS>",
  "OfferSequence": <ESCROW_SEQUENCE>,
  "ComputationAllowance": 1000000,
  "Memos": [
    {
      "Memo": {
        "MemoData": "c05c150000000000308c110000000000cc100000008d2700000000000100000090d003000000000001000000"
      }
    },
    {
      "Memo": {
        "MemoData": "0bf34bc2558bb1acf8e23b155a4bc96ccd6d48d685d894c9ffd0e4e51c66154b1b0380e7a054d9d616457f8e0b4b92744d84bd8d489c179643f5c57cedddbeb5004df234603b101b1ec4f2299c2dea2433d3db5b24b6a29a685cb7f49bcc8dd60b379aac933a89563e4a4556988bbd81fafcf8c8da2c44c348dfb105366c0af00f00b77d9b95fac18f94ebe6eb233f5b3521dce66f5fac7448e74a54e0293c37280f74cea9926a81c4df87a6920c2de4efef8d1ae744e4a56041e71f7f75b5c42861019b98bb4cdff56b28806d5f781489165dceb799726e6208669a5b880e360674a1f4b8cea429da15bd38a53a57333b09a990dea0a450653aba1570172a06"
      }
    }
  ]
}
```

## What is still external
To actually execute live on groth5 we still need:
- funded writer account
- funded buyer/finisher account
- uploaded/deployed Wasm reference usable in `FinishFunction`
- actual expiry in Ripple epoch if using real on-chain timestamping
- actual submission path (wallet or script)
