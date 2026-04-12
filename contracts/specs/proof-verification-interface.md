# Proof Verification Interface

Status: draft

## Goal
Define the boundary between:
- zk guest / proving system
- on-chain smart escrow verifier

so the project can later wire actual proof verification without redesigning the verifier structure.

## Inputs expected by verifier
The verifier should conceptually receive:
- `journal_bytes`
- `seal_bytes`
- `escrow_data_bytes`
- `options_pricer_image_id`

## Verification contract
The verifier must answer:
1. Can `journal_bytes` be parsed as `JournalV1`?
2. Can `escrow_data_bytes` be parsed as `EscrowDataV1`?
3. Does `seal_bytes` prove that `journal_bytes` came from the expected guest/image ID?
4. Do the agreed params in escrow data match the journal?
5. Is the release condition satisfied?

Only if all are true should release be allowed.

## Recommended interface shape
A verifier boundary should look conceptually like:

```rust
fn verify_proof_against_image_id(
    journal_bytes: &[u8],
    seal_bytes: &[u8],
    image_id: &[u8; 32],
) -> bool
```

Then the escrow verifier can do:
- parse journal
- parse escrow data
- verify proof
- apply release gate

## Important note
The real implementation details may depend on the final RISC Zero / Boundless / XRPL verifier crate APIs.
This file defines the intended contract, not the final imported function signatures.
