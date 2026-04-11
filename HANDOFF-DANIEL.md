# VeraFi — Handoff to Daniel (Smart Escrow Verifier)

## What Hamza built

**`zkvm/example-proof/guest/src/main.rs`** — ZK guest (runs inside RISC Zero zkVM)
Reads 6 inputs, runs Black-Scholes, commits a 38-byte journal + is_itm flag.

**`cli/src/main.rs`** — CLI prover (host)
Run `cargo run -p cli -- 1400000 1150000 4300 0 2592000 1` to get:
- `journal` (38 bytes hex) → Memo 0 in EscrowFinish
- `seal` (256 bytes hex) → Memo 1 in EscrowFinish
- Decoded `price` and `is_itm` printed for verification

**Image ID** is exported as `EXAMPLE_PROOF_ID` from `example-proof-builder`. You need this constant in `finish()`.

---

## Journal layout (38 bytes, little-endian)

| Offset | Size | Field    | Type | Example value      |
|--------|------|----------|------|--------------------|
| 0      | 8    | spot     | u64  | 1_400_000 = $1.40  |
| 8      | 8    | strike   | u64  | 1_150_000 = $1.15  |
| 16     | 4    | vol      | u32  | 4_300 = 43%        |
| 20     | 8    | expiry   | u64  | 2_592_000 = 30 days|
| 28     | 1    | is_call  | u8   | 1 = CALL           |
| 29     | 8    | price    | u64  | Black-Scholes output|
| 37     | 1    | is_itm   | u8   | 1 = in the money   |

## EscrowCreate `Data` field (17 bytes, little-endian)

| Offset | Size | Field   |
|--------|------|---------|
| 0      | 8    | strike  |
| 8      | 1    | is_call |
| 9      | 8    | expiry  |

---

## What you need to do — `escrow/src/lib.rs`

The current file is **still the starter template** (the 11×13=143 factoring example). Replace `finish()` with the VeraFi verifier:

```rust
#[unsafe(no_mangle)]
pub extern "C" fn finish() -> i32 {
    let journal: [u8; 38] = get_memo(0).unwrap();
    let seal:    [u8; 256] = get_memo(1).unwrap();

    // 1. Verify the ZK proof
    let proof = Proof::from_seal_bytes(&seal).unwrap();
    let journal_digest = risc0::hash_journal(&journal);
    risc0::verify(&proof, &bytemuck::cast(EXAMPLE_PROOF_ID), &journal_digest).unwrap();

    // 2. Cross-check journal vs agreed escrow params
    let strike_journal = u64::from_le_bytes(journal[8..16].try_into().unwrap());
    let is_call_journal = journal[28];

    let data: [u8; 17] = get_escrow_data().unwrap(); // bytes from EscrowCreate `Data` field
    let strike_agreed  = u64::from_le_bytes(data[0..8].try_into().unwrap());
    let is_call_agreed = data[8];

    assert_eq!(strike_journal, strike_agreed);
    assert_eq!(is_call_journal, is_call_agreed);

    // 3. Return is_itm — non-zero = escrow releases to buyer
    journal[37] as i32
}
```

You also need `get_escrow_data()` — same pattern as `get_memo()` but targeting the `Data` field of the escrow ledger object (check xrpl-wasm-stdlib docs for the correct sfield).

Compile target: `wasm32-unknown-unknown`. The output `.wasm` binary goes into EscrowCreate as `FinishFunction` (base64-encoded).

---

## Integration checkpoint

Once your Wasm is ready, give Hamza:
1. The compiled `.wasm` binary (or base64 string of it)
2. Confirmation of the Image ID used (must match `EXAMPLE_PROOF_ID` from this repo)

Hamza will then run the CLI to pre-compute the proof and hand you the journal+seal hex for the demo EscrowFinish.
