# Fixtures

Status: draft, pending team lock-in

## Canonical demo fixture candidate
- `spot = 1_400_000`
- `strike = 1_150_000`
- `vol = 4_300`
- `risk_free_rate = 0`
- `expiry = 2_592_000`
- `is_call = 1`
- `price = 250_000`
- `is_itm = 1`

## Notes
- `price` must be finalized and used consistently everywhere.
- If a different canonical `price` is chosen, update all docs/tests together.
