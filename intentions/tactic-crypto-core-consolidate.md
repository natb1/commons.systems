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

Unit 2 folds in an adjacent crypto-package finding (undocumented buffer
transfer) that was never captured in the original review's tracked output.

## Unit 1 — one canonical module

**Recommended model:** sonnet

Scope:
- Make `packages/crypto-core` the single source; repoint
  `packages/crypto/src/crypto.ts` and any `@commons-systems/crypto/core`
  consumers at it; delete `packages/crypto/src/crypto-core.ts`.
- Confirm the Go exporter contract and office-hours-snapshot still resolve
  the same primitives.

## Unit 2 — document (or avoid) the worker's buffer-transfer footgun

**Recommended model:** sonnet

Scope:
- `packages/crypto/src/crypto.ts:76-78`: `postToWorker` transfers the
  input `ArrayBuffer` to the worker
  (`w.postMessage({...msg, id}, [msgData])`), permanently detaching the
  caller's buffer; `BencCrypto.decrypt`'s contract (`crypto.ts:16-19`)
  doesn't document it. A caller that retries
  `decrypt(sameBuffer, correctedPassword)` after a wrong-password
  rejection gets `byteLength === 0`, so the guard at `crypto.ts:94` throws
  the misleading "File is not in BENC encrypted format." instead of a
  password error. Either document the transfer explicitly in the
  `decrypt`/`encrypt` JSDoc so callers know to re-read the source before a
  retry, or clone the buffer before transfer so a retry is safe by
  default — prefer the clone if the perf cost is negligible at BENC file
  sizes.
- Add a regression test: call `decrypt` twice on the same buffer with a
  wrong then correct password, asserting the second call does not throw
  the "not in BENC format" error.

## Verification

- A single encrypt/decrypt round-trip test exercised via BOTH the worker and
  the main-thread fallback path produces byte-compatible output; the
  duplicate file is gone and `knip` reports no dangling export. The
  retry-after-wrong-password regression test passes.
