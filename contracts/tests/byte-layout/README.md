# Byte Layout Validation

Purpose:
- validate canonical fixture bytes before deeper contract work
- ensure guest, verifier, and frontend all agree on serialization

Planned checks:
- exact JournalV1 serialized bytes
- exact EscrowDataV1 serialized bytes
- parser roundtrip checks
- cross-check mismatch behavior
