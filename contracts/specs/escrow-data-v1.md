# EscrowDataV1

Status: draft, research-backed, pending runtime validation

## Purpose
Canonical byte layout for the `Data` field on `EscrowCreate`. These are the agreed option parameters the verifier cross-checks against the proof journal.

## Encoding rules
- Endianness: **little-endian everywhere**
- Minimal agreed parameter set only

## Layout
| Offset | Field | Type | Size | Notes |
|---|---|---:|---:|---|
| 0 | `strike` | `u64` | 8 | 6 decimal fixed-point price |
| 8 | `is_call` | `u8` | 1 | `1 = CALL`, `0 = PUT` |
| 9 | `expiry` | `u64` | 8 | agreed expiry value |

**Total: 17 bytes**

## Verifier cross-check requirement
The verifier must cross-check:
- `strike`
- `is_call`
- `expiry`

against the values parsed from `JournalV1`.
