# Integration Checklist

## Byte-level validation
- [x] JournalV1 fixture length = 38 bytes
- [x] EscrowDataV1 fixture length = 17 bytes
- [x] Expected fixture hex generated
- [ ] Parser roundtrip implemented in code
- [ ] Mismatch tests implemented in code

## Verifier behavior to enforce
- [ ] proof must verify against expected image ID
- [ ] strike must match escrow Data
- [ ] is_call must match escrow Data
- [ ] expiry must match escrow Data
- [ ] `is_itm == 1` required for release

## Runtime validation still pending
- [ ] memo payload path on groth5
- [ ] `ComputationAllowance` behavior
- [ ] Otsu/custom network tx signing path
- [ ] live proof verification path
