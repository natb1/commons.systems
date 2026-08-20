---
id: tactic-ladder-run-answerable-across-node-boundary
kind: tactic
statement: A /dispatch-ladder run may not report complete until the main-qa work
  it spawned is itself terminal or excused, whether that work sits on the source
  node's own phase or on a standalone tactic-mainqa-* node the run created —
  making a run answerable ACROSS a node boundary, which no ladder code does
  today
owner: ai
status: raw
parent: null
rationale: "Re-homed scope item 2 of tactic-ladder-terminus-owns-main-qa, by
  author ruling in a 2026-08-19 /office-hours sitting over the PR2 park cohort.
  That node's code half merged out-of-band as PR #3091 (merge commit de347430,
  2026-08-14) delivering scope item 1 and the measurement half of item 3, and
  was transitioned to done crediting that PR; item 2 was the one piece it did
  NOT land, and PR #3091's own 'Not in this PR' section deferred it behind
  tactic-mainqa-record-time-routing under the rule 'No cross-node machinery is
  built while no caller can exercise it'. Keeping item 2 on the original node
  would have left a merged implementation sitting under a raw node, so it moves
  here instead of being tracked there. The deferral edge that PR promised but
  never landed is now real: blocked_by tactic-mainqa-record-time-routing."
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
  - tactic-mainqa-record-time-routing
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A run is answerable for the main-qa work it spawned, across a node boundary

## Context

Re-homed scope item 2 of `tactic-ladder-terminus-owns-main-qa` by author ruling
in the 2026-08-19 `/office-hours` sitting over the PR2 park cohort. Read that
node's clarifications first — they carry the ruling, what PR #3091 actually
delivered, and why this piece moved rather than staying.

The standing requirement lives on `strategy-graph-native-dispatch` as the dated
`/align` clarification recorded 2026-08-14 ("Must a /dispatch-ladder run carry
its node all the way to a terminal state, or may it stop once the PR merges?").
A run may not report a terminal disposition until its node's work is terminal
(`phase: done`) or legitimately excused — parked to office-hours, or blocked on
an awaited event. This node is the cross-node-boundary half of that.

## Scope

**The requirement follows the work, not the node.** The 2026-07-28 clarification
on the same strategy adopted a greenfield in which the source tactic goes
`review -> done` directly ("no main-qa phase on the source, no residue body
append") and post-merge work lives on standalone `tactic-mainqa-*` nodes. Under
that shape a run that reports complete when its SOURCE node reaches `done` is
reporting on the wrong object: the main-qa work it spawned is a different node,
and no ladder code follows it today.

This is a real scope increase, not a patch. It is the part of the original
tactic most likely to need design work.

## Explicitly out of scope

- Scope items 1 and 3 of `tactic-ladder-terminus-owns-main-qa`. Item 1 and the
  measurement half of item 3 merged as PR #3091 (`terminus.ts`,
  `ladder-terminus-census.ts`, the `ladder-terminus` sensor, the
  `dispatch-ladder-run` classification wiring). The ENFORCEMENT half of item 3
  — `--strict` wiring, the 0-violations threshold, and the two prose
  `Verifiability: WAIT` marks — was folded into PR2 of the serialized RSI PR
  plan by the same ruling and is executed ad hoc there, NOT here.
- The reconciler's own availability defects
  (`tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt`,
  `tactic-eval-finding-ladder-gate-stale-main-checkout-halt`). Fixing them makes
  the failure rarer but does not make a run answerable for its terminus.

## Why this is blocked

`blocked_by: [tactic-mainqa-record-time-routing]`, which is the edge PR #3091's
own "Not in this PR" section promised and never landed. The governing rule is
its: **no cross-node machinery is built while no caller can exercise it.** Until
record-time main-qa routing is real, there is no standalone `tactic-mainqa-*`
node for a run to be answerable FOR, so any unit written here would be
unexercisable.

That blocker is itself `status: raw`, `phase: null` and unplanned as of
2026-08-19 — run `/align-tactics tactic-mainqa-record-time-routing` before
planning this node.

## Reuse

- `packages/intentionsutil/src/transitions.ts` — `forwardPhase`,
  `reconcileMergedPhase`, and the `LADDER` constant already model
  `review -> main-qa -> done`; the schema needs no change.
- `packages/intentionsutil/src/terminus.ts` — `classifyTerminus` and
  `ladderTerminusCensus`, shipped by PR #3091, are the existing classification
  vocabulary. Two invariants their doc comments carry must not be broken: the
  census requires a STRICT enumeration (`listNodesStrict`), and
  `findUnstructuredWaits` must never feed back into `classifyTerminus` to
  reclassify a prose wait as excused.
