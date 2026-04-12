# Mismatch Checks

Planned mismatch validations:
- journal strike != escrow data strike -> fail
- journal is_call != escrow data is_call -> fail
- journal expiry != escrow data expiry -> fail
- journal is_itm == 0 -> no release

These should become real verifier-side tests in Rust after the parser helpers are added.
