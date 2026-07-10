---
id: tactic-benc-format-versioning
kind: tactic
statement: Add a format-version byte to the BENC header and a cross-language
  (Go+TS) test-vector suite
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy interview: the BENC
  header (magic/salt/IV only) carries no version or KDF-params field, so a
  future parameter change silently breaks TypeScript-Go round-trips of encrypted
  financial snapshots; and the Go/TS snapshot-schema validators are
  hand-mirrored with only a golden fixture guarding drift. Add a version byte
  (one coordinated format epoch with tactic-crypto-core-consolidate so the
  format changes once, not twice) and shared test vectors both implementations
  must decrypt. Retained as a draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-durable-owned-data
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add a format-version byte to the BENC header and a cross-language (Go+TS) test-vector suite
