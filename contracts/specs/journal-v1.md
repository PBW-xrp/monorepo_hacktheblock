# JournalV1

Status: draft, research-backed, pending runtime validation

## Purpose
Canonical byte layout for the zk guest public output committed to the RISC Zero journal and later transported in `EscrowFinish` memos.

## Encoding rules
- Endianness: **little-endian everywhere**
- Fixed-width fields only
- Total size must remain stable across guest, verifier, tests, and frontend utilities

## Layout
| Offset | Field | Type | Size | Notes |
|---|---|---:|---:|---|
| 0 | `spot` | `u64` | 8 | 6 decimal fixed-point price |
| 8 | `strike` | `u64` | 8 | 6 decimal fixed-point price |
| 16 | `vol` | `u32` | 4 | annualized volatility in bps |
| 20 | `expiry` | `u64` | 8 | seconds to expiry or agreed expiry value |
| 28 | `is_call` | `u8` | 1 | `1 = CALL`, `0 = PUT` |
| 29 | `price` | `u64` | 8 | Black-Scholes / theoretical option price |
| 37 | `is_itm` | `u8` | 1 | `1 = ITM`, `0 = OTM` |

**Total: 38 bytes**

## Important note
`risk_free_rate` is intentionally omitted from JournalV1 for now because the demo assumes `0`. If this changes, JournalV1 must be versioned rather than silently modified.
