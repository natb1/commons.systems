---
id: tactic-crypto-core-consolidate
kind: tactic
statement: Consolidate the two duplicated BENC crypto-core implementations into
  one canonical module so worker and main-thread paths cannot drift
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review.
  packages/crypto/src/crypto-core.ts and packages/crypto-core/src/crypto-core.ts
  are two live near-identical copies; the worker imports one and the main-thread
  fallback imports the other, so a KDF/format change could land in one path
  invisibly and corrupt the .benc round-trip. The cryptography itself is sound;
  this is a packaging fix. Relates to strategy-durable-owned-data: owned
  encrypted data stays readable across every decode path only if there is one
  authoritative crypto core."
reading: null
gap: null
serves:
  - strategy-durable-owned-data
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Consolidate the duplicated BENC crypto-core

## Context

`packages/crypto/src/crypto-core.ts` and
`packages/crypto-core/src/crypto-core.ts` are two live, near-identical copies
of the BENC primitives (differ only by two comments). The worker
(`crypto-worker.ts:4`) imports `@commons-systems/crypto-core` while the
main-thread fallback (`crypto.ts:6`) imports the local copy, so a KDF/format
change (e.g. an iteration bump) could land in one path only and the worker
would write files the fallback reads with different parameters - invisibly,
since both export the same names. The cryptography is sound; this is
packaging. Verified 2026-07-05.

## Unit 1 — one canonical module

**Recommended model:** sonnet

Scope:
- Make `packages/crypto-core` the single source; repoint
  `packages/crypto/src/crypto.ts` and any `@commons-systems/crypto/core`
  consumers at it; delete `packages/crypto/src/crypto-core.ts`.
- Confirm the Go exporter contract and office-hours-snapshot still resolve
  the same primitives.

## Verification

- A single encrypt/decrypt round-trip test exercised via BOTH the worker and
  the main-thread fallback path produces byte-compatible output; the
  duplicate file is gone and `knip` reports no dangling export.
