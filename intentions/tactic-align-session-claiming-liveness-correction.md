---
id: tactic-align-session-claiming-liveness-correction
kind: tactic
statement: "correct tactic-align-session-claiming Unit 3's recorded
  existence-based claim ('graph-select-target treats ANY existing worktree as a
  held claim') to the shipped liveness rule (reservation marker OR
  worktree_has_live_session), reconciling it with its own Unit 1 and #1474"
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-18 office-hours-concurrency interview:
  verifying the target-state mechanism surfaced that
  tactic-align-session-claiming Unit 3 (phase done, PR 2804) records an
  existence-based claimed-set that diverges from the shipped graph-select-target
  (liveness-keyed), contradicts Unit 1 of the same node (liveness), and
  describes the pre-#1474 worktree-walk that #1474 deliberately replaced.
  Recorded-text hygiene only — the code is already correct; no behavior change."
reading: null
gap: null
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
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# correct tactic-align-session-claiming Unit 3's recorded existence-based claim ('graph-select-target treats ANY existing worktree as a held claim') to the shipped liveness rule (reservation marker OR worktree_has_live_session), reconciling it with its own Unit 1 and #1474

**Draft** — byproduct of the 2026-07-18 office-hours-concurrency interview.
Recorded-text hygiene; no behavior change. Input to a later
`/align-tactics strategy-graph-native-dispatch` round.

## Context

Verifying the target-state concurrency mechanism this round surfaced an
inconsistency in the recorded graph. `tactic-align-session-claiming`
(`phase: done`, PR 2804) Unit 3 prescribes an **existence-based** claimed set:

> "Assert (and if missing, add) that `graph-select-target`'s claimed-set
> derivation treats ANY existing `.claude/worktrees/<node-id>` as a held
> claim … Add a test: create a bare node-id worktree, run selection, assert
> the node is skipped." (`intentions/tactic-align-session-claiming.md:134-138`)

This is stale on three counts:
- **Diverges from shipped code.** `graph-select-target:245-255` skips a node
  only on a reservation-ledger marker OR `worktree_has_live_session` (liveness);
  a bare worktree with no live session is **not** skipped.
- **Contradicts its own Unit 1**, which states the liveness rule
  ("`…exists with a live session (worktree_has_live_session)…`",
  `tactic-align-session-claiming.md:89-96`).
- **Describes the pre-#1474 behavior** that was deliberately replaced.
  `test-dispatch-scripts.sh:296-297, 9363-9364` records #1474 moving
  existence-keying → liveness so "a bare worktree alone no longer blocks."

## What changes

Correct Unit 3's recorded text (and its prescribed test) to the shipped
liveness rule, reconciled with Unit 1. Because the author's target state is
liveness-keying — an un-reaped worktree must never block dispatch work; reaping
is post-merge `dispatch-sweep` hygiene — the existence-based prescription is
simply wrong for the target state. Code is already correct; this is a
whole-node text reconciliation of the `done` tactic, no implementation.

## Surfaces to change

- `intentions/tactic-align-session-claiming.md` Unit 3 (and any body sentence
  implying existence-keying) → liveness. Preserve Unit 1/Unit 2 as-is.
