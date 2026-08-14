---
id: tactic-ledger-sweep-on-read
kind: tactic
statement: fold reservation_sweep into the reservation-ledger count/read API
  (sweep-on-read) so every consumer is reconciled by construction, then remove
  the now-redundant per-path sweep calls
owner: ai
status: raw
parent: null
rationale: "Greenfield end-state (migration step iv) retained as a draft
  byproduct of the 2026-07-23 /align-strategy round. Makes the ledger
  self-reconciling so no call site can forget to sweep — the defect class the
  cross-mode-validity clarification identifies. Blocked on the parity fixes and
  reap-on-exit landing first; finalize via /align-tactics then. Draft (no
  phase): undecomposed work whose next step is an /align-tactics session. Not
  selectable TODAY only because its blockers are open — draft status alone does
  not prevent selection, the router emits drafts at the align-tactics rung
  (corrected 2026-08-14 per
  tactic-align-skill-draft-selectability-stale-prose)."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-manual-path-reservation-sweep
  - tactic-heartbeat-sweep-before-pause
  - tactic-graph-node-session-reap
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# self-reconciling ledger — sweep-on-read in the count/read API

## Context (draft — retained byproduct, finalize via /align-tactics)

This is the **greenfield end-state** (migration step iv) of the 2026-07-23
cross-mode ledger-validity clarification on `strategy-graph-native-dispatch`,
retained as a draft byproduct of that `/align-strategy` round.

After the parity fixes (`tactic-manual-path-reservation-sweep`,
`tactic-heartbeat-sweep-before-pause`) and reap-on-exit
(`tactic-graph-node-session-reap`, PR #2922) land, `reservation_sweep` is called
explicitly from several paths: the autonomous selection block, the `--manual`
block, the explicit-node (`NODE_ARG`) branch (PR #2952), and the heartbeat
pre-pause call. Each call site is a place a future code path can forget to sweep
— the exact defect class the clarification identifies ("no call site can read
stale" only if reconciliation is structural, not remembered).

## Greenfield direction

Make the ledger **self-reconciling**:

- Fold `reservation_sweep` into `reservation_count` (or a `reservation_count_live`
  wrapper) in `lib-reservation-ledger.sh`, so any read returns a reconciled
  count by construction.
- Remove the now-redundant standalone `reservation_sweep` calls from the
  autonomous block, the `--manual` block, the explicit-node branch (PR #2952),
  and the heartbeat pre-pause call — keeping only reap-on-exit (#2922) as the
  write-side and the count-API sweep as the read-side backstop.
- Narrow the pause sentinel's documented contract in `dispatch-tick` to "gates
  spawning, never ledger bookkeeping."

## Open questions for the /align-tactics round

- Whether sweep-on-read's per-call `claude agents` round-trip is acceptable on
  hot read paths, or needs a short-TTL memo.
- Whether pure-observability count reads that must **not** mutate get a
  non-sweeping variant.

**Status:** draft (no phase) — undecomposed work whose next step is an
`/align-tactics` session. It is not selectable *today* only because its blockers
are open: draft status alone does not prevent selection, since the router emits
drafts at the `align-tactics` rung (corrected 2026-08-14 per
tactic-align-skill-draft-selectability-stale-prose — the earlier wording here
attributed the non-selectability to draft status, which is the false rule).
`blocked_by` the two parity fixes and #2922; finalize via `/align-tactics` once
those have landed.
