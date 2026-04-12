# Contracts

This directory contains the VeraFi contract-side implementation for the XRP hackathon demo.

It is the contract workspace for the XRPL smart escrow plus RISC Zero zkVM flow.
The goal of this folder is to make the demo understandable, testable, and runnable from one place.

## What is in here

### `zkvm/verafi-pricer/`
RISC Zero method builder plus guest code.

This is the proving side of the flow:
- the guest reads pricing inputs
- computes the option result
- commits the journal values that later get verified

### `zk-host/`
Local prover runner.

This is used to:
- execute the guest with real inputs
- generate the journal
- generate the seal
- print memo payloads that can be attached to XRPL transactions

### `escrow-verifier/`
XRPL Wasm verifier contract.

This is the on-chain side of the flow:
- reads memo payloads from the transaction
- parses the journal layout
- verifies the RISC Zero proof against the image id
- checks the escrow release condition
- returns `1` only when verification and release checks pass

### `tests/fixtures/`
Canonical byte fixtures used to keep contract-side encoding stable.

These fixtures help verify that:
- escrow data bytes match expectations
- journal bytes match expectations
- parser assumptions stay aligned with the actual contract flow

## Demo flow

```mermaid
flowchart TD
    A[Writer creates XRPL Escrow] --> B[Escrow stores collateral and contract data]
    C[Buyer wants to exercise] --> D[zk-host runs RISC Zero guest]
    D --> E[Guest commits journal]
    D --> F[Host produces seal]
    E --> G[Journal memo]
    F --> H[Seal memo]
    G --> I[EscrowFinish transaction]
    H --> I
    I --> J[escrow-verifier finish]
    J --> K[Verify proof against image id]
    K --> L[Check params and ITM condition]
    L --> M[Release escrow if valid]
```

## Verification logic

```mermaid
sequenceDiagram
    participant Buyer
    participant Host as zk-host
    participant XRPL as XRPL EscrowFinish
    participant Verifier as escrow-verifier

    Buyer->>Host: Provide exercise inputs
    Host->>Host: Run guest and generate journal + seal
    Host->>XRPL: Submit EscrowFinish with memos
    XRPL->>Verifier: Invoke finish()
    Verifier->>Verifier: Read memo 0 as journal
    Verifier->>Verifier: Read memo 1 as seal
    Verifier->>Verifier: Verify proof
    Verifier->>Verifier: Check escrow params and is_itm
    Verifier-->>XRPL: Return 1 or 0
```

## Current implementation status

Working in this repo now:
- zkVM workspace is ported
- guest is ported
- host is ported
- escrow verifier is ported
- fixture files are ported
- verifier tests are passing in this repo

## What still needs to be completed

For full live demo readiness, this folder still needs:
- any remaining contract-support files required to operate only from `contracts/`
- repo-side validation of the full workspace build
- repo-side proof generation run from `zk-host`
- final groth5 deploy and transaction execution path

## How to think about the architecture

This is a bilateral option flow:
- writer creates the escrow and locks collateral
- buyer is the destination
- buyer exercises by submitting proof memos
- verifier checks proof plus release condition

The release rule is effectively:
- escrow params must match agreed bytes
- option must be in the money

## Important note

This folder is the contract source of truth for the demo path.
Frontend work should align to the byte layouts, proof inputs, and verifier behavior defined here.
