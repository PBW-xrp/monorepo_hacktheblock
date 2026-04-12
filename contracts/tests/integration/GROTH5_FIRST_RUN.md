# Groth5 First Run Checklist

Date: 2026-04-11
Status: readying first real end-to-end path

## Artifacts already available
### Built escrow Wasm
Path:
- `Contracts/target/wasm32v1-none/release/verafi_escrow_verifier.wasm`

### Real proof-generation path
Confirmed locally:
- local host/prover flow runs
- real image ID produced
- real journal + seal generation path works locally

Current image ID observed:
- `873fa78de97d6e673e1f47b3311e4fe2923d8b4259344f73a46ac304bd9e8789`

## Required inputs for first groth5 run
1. funded groth5 account/wallet
2. uploadable verifier Wasm artifact
3. `EscrowCreate` tx with:
   - `FinishFunction`
   - `Data = EscrowDataV1`
   - `Destination = buyer`
   - `CancelAfter = expiry`
4. real host/prover output:
   - journal hex
   - seal hex
5. `EscrowFinish` tx with memo payloads

## Current blocker to declaring step 5 complete
We have local artifacts, but step 5 is only truly done when one of these happens:
- a real groth5 escrow is deployed and exercised successfully
- or we capture the exact next external blocker during actual groth5 submission

## Immediate next actions
1. finish refreshing the latest real journal/seal output
2. assemble exact `EscrowCreate` / `EscrowFinish` payload plan
3. execute first groth5 attempt
4. document outcome in PROCESS/STATUS files
