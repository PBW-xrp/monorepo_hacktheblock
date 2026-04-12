# JournalV1 Real Runtime Format

Date: 2026-04-11
Status: derived from real RISC0 host/guest output

## Key finding
The real runtime journal emitted by the current VeraFi RISC0 guest is **44 bytes**, not 38 bytes.

Real journal hex observed:

`c05c150000000000308c110000000000cc100000008d2700000000000100000090d003000000000001000000`

## Length
- total length: **44 bytes**

## Field interpretation
Using the canonical fixture:
- `spot = 1_400_000`
- `strike = 1_150_000`
- `vol = 4_300`
- `expiry = 2_592_000`
- `is_call = 1`
- `price = 250_000`
- `is_itm = 1`

The real journal groups as:

| Offset | Bytes | Interpretation |
|--------|-------|----------------|
| 0 | 8 | `spot` as u64 LE |
| 8 | 8 | `strike` as u64 LE |
| 16 | 4 | `vol` as u32 LE |
| 20 | 8 | `expiry` as u64 LE |
| 28 | 4 | `is_call` committed as **u32-like width** |
| 32 | 8 | `price` as u64 LE |
| 40 | 4 | `is_itm` committed as **u32-like width** |

## Important implication
Even though the guest source reads `is_call` and `is_itm` as `u8`, the real journal emitted through `env::commit()` in this setup currently serializes them as 4-byte values in the journal output path we observed.

## Consequence for VeraFi
The verifier/spec/frontend should not keep assuming a 38-byte runtime journal unless we intentionally change guest serialization strategy.

For the current real path, the correct runtime contract is effectively:
- `JournalV1Real = 44 bytes`

## Recommendation
Short-term:
- update verifier-side parser to support the real 44-byte journal
- continue proving/verifier integration using the real runtime shape

Long-term decision:
- either embrace 44-byte canonical journal
- or redesign guest commit strategy to enforce a packed 38-byte layout explicitly
