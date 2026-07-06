---
id: tactic-sidecar-cross-tab-safety
kind: tactic
statement: "sidecar: coordinate cross-tab writes (Web Locks / read-merge-write)
  and surface persist failures instead of always resolving"
owner: ai
status: codified
parent: null
rationale: Surfaced by the 2026-07-05 review. The sidecar single-flight chain
  serializes writes within one tab only and rewrites the whole file, so two tabs
  on one folder silently clobber each other; enqueueWrite's per-link catch makes
  the returned promise always resolve, so a caller never learns a disk persist
  failed. Serves strategy-durable-owned-data (data durability) and honors the
  clear-errors-over-fallbacks rule.
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
# sidecar: cross-tab write coordination + surfaced persist failures

## Context

The sidecar single-flight write chain (`packages/sidecar/src/factory.ts`)
guarantees no-clobber per-tab only, and swallows persist failures. Verified
2026-07-05.

## Unit 1 — cross-tab coordination

**Recommended model:** opus

Scope:
- `factory.ts:98,155-166,250-273`: `writeSidecar` rewrites the whole file
  against the in-memory `cachedModel` with no cross-tab coordination, so two
  tabs on one folder each merge against a stale model and the last write
  discards the other's entries. Add Web Locks (or a read-merge-write against
  on-disk state) so the no-clobber guarantee holds across tabs.

## Unit 2 — surface persist failures

**Recommended model:** sonnet

Scope:
- `factory.ts:269-272`: `enqueueWrite`'s per-link `.catch` logs and resolves,
  so a caller never learns a disk persist failed (a full/revoked-permission
  folder reports saves as successful - silent data loss, against the
  clear-errors rule). Reject the per-call promise (keep the chain recovered)
  so callers can react; `flushWrites` likewise must reflect failure.

## Verification

- Two-tab test: interleaved writes preserve both tabs' entries; a forced
  write failure rejects the caller's promise instead of resolving.
