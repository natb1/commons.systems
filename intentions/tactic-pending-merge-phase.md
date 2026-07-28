---
id: tactic-pending-merge-phase
kind: tactic
statement: "Eliminate execution.markers: add a `pending-merge` phase after
  `review` so the selector reviewed-exclusion and the fix re-review reset key
  off phase ordinal, then delete all three completion markers (planned, qa-done,
  reviewed) and the markers field"
owner: ai
status: raw
parent: tactic-graph-native-dispatch
rationale: "Surfaced in a 2026-07-18 /align-strategy interview asking whether
  the qa-done completion marker is redundant. Tracing every marker consumer
  showed qa-done's sole reader (resumeAfterFix, transitions.ts:119) is already
  unreachable — the fix interrupt (decideTransition:199) always strips
  qa-done+reviewed on entry, and fix is the only path into a state
  resumeAfterFix reads; planned goes dead once
  tactic-fix-interrupt-orthogonal-state (PR #2905) deletes resumeAfterFix; only
  reviewed stays live, via the selector re-selection guard (router.ts:296) and
  #2905's past-review re-review reset. Author direction (this interview): rather
  than keep reviewed as a special-case marker, encode 'reviewed and awaiting
  merge' as its own phase, which eliminates the marker concept wholesale and
  removes review's forward-edge special case. Retained here as a draft byproduct
  — /align-tactics decomposes and plans it."
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
# Eliminate `execution.markers` via a `pending-merge` phase

Draft byproduct of the 2026-07-18 `/align-strategy` marker-parsimony interview.
Retained, not planned — `/align-tactics` decomposes and sequences it.

## Context

`execution.markers` (`transitions.ts:28-37`) carries three completion markers —
`planned` (implement done), `qa-done` (qa done), `reviewed` (review done) —
written by `PHASE_COMPLETION_MARKER` on clean phase advance. Their only job
beyond the `phase` scalar is to survive the `fix` interrupt, which overwrites
`phase` and so erases ladder position; `resumeAfterFix` (`transitions.ts:116-122`)
reconstructs the resume point from them.

Tracing every consumer shows the set is nearly all dead weight:

| Marker | Reader(s) | Reachable? | Verdict |
|---|---|---|---|
| `planned` | `resumeAfterFix:120` → resume at `qa` | yes (never cleared on fix-entry) | load-bearing **today** |
| `qa-done` | `resumeAfterFix:119` → resume at `review` | **no** | **already dead** |
| `reviewed` | `resumeAfterFix:118` (dead) **+** `router.ts:296` selector guard | yes, via the selector only | load-bearing via the *other* reader |

`qa-done`'s single read is unreachable because the only path into `fix` is the
CI-failure `fixInterrupt` (`decideTransition:198`), which unconditionally strips
`[qa-done, reviewed]` on entry (`:199`, the "regressed code was never qa'd/reviewed,
re-run both" doctrine). `apply-node-transition.ts` is the sole store-mutation path
and the `Phase` enum has no merge-conflict phase, so a node is never in `fix` with
`qa-done` still set — `resumeAfterFix`'s `qa-done → review` branch can never fire.

`tactic-fix-interrupt-orthogonal-state` (PR #2905) then deletes `resumeAfterFix`
outright (its Unit 2) as part of making `fix` an orthogonal `execution.fix` field
with `phase` staying ladder-positional. After it lands, `planned` loses its only
reachable reader too, leaving `reviewed` as the sole live completion marker —
used for the selector re-selection guard and #2905's past-review re-review reset.
But #2905 retains `PHASE_COMPLETION_MARKER` (for the `reviewed` test and a one-time
Unit-4 migration) and does **not** prune the now-dead `planned`/`qa-done` writes.

## Greenfield direction (author-confirmed, this interview)

Rather than keep `reviewed` as a special-case marker qualifying `phase: review`,
give "reviewed and awaiting merge" its own phase and delete the marker concept
entirely. Insert one phase between `review` and the terminal edges:

```
implement → qa → review → pending-merge → (main-qa | done)
```

A node enters `pending-merge` when review completes cleanly; it sits there,
reviewed, while auto-merge lands; the tick reconciler advances it to
`main-qa`/`done` on merge. Every marker consumer is then served by `phase` alone:

- **Selector re-selection guard** (`router.ts:296`, today `phase==review && reviewed`):
  a `pending-merge` node is simply not at `review`, so the review worker is never
  its phase's worker — one phase check, no marker conjunction.
- **review's forward edge**: today clean review completion arms merge but writes
  *no* forward phase — the single documented ladder special case
  (`forwardPhase`, `transitions.ts:74-75`). With `pending-merge`,
  `forwardPhase(review) = pending-merge`: review gets a normal forward edge like
  every other phase, and the arm-merge action attaches to `pending-merge`. **The
  special case disappears.**
- **Past-review re-review reset** (#2905's use of `reviewed`): a fix at
  `pending-merge`/`main-qa` resets `phase → review` — an ordinal comparison over
  `PHASES`, not a marker read.
- **`planned` / `qa-done`**: gone with the `execution.markers` field.

Net: zero completion markers, the whole `markers` field deleted, review's
forward-edge special case removed, and the overloaded `review` state split into
two honest phases (actively-reviewing vs reviewed-and-waiting).

**Why some distinct state is unavoidable.** `phase==review` alone cannot
distinguish "review me" from "I'm reviewed, waiting to merge, don't re-review
me," and a CI regression must route the waiting node back to `review`. A second
state is required either way; the only question is its encoding. A distinct phase
beats a side-marker on parsimony (it removes the field, not adds to it) and on
legibility (the wait state is a first-class position, not a marker qualifying a
phase that no longer describes what the node is doing).

**The one new thing.** `pending-merge` is a *no-worker wait phase* — no metered
agent session runs there; the tick reconciler advances it (merge when
green + `mergeable==MERGEABLE` → `main-qa`/`done`). That is a mild new category,
though `done` is already a no-worker terminal phase, and it is arguably more
honest than today's marker-qualified `review`.

## Scope pointers (for /align-tactics to plan)

- Schema: add `pending-merge` to `PHASES` (`schema.ts:41`) between `review` and
  `main-qa`; the progression ordinal (`progressionIndex` over `PHASES`,
  `router.ts:194-198`) picks it up mechanically.
- Transitions: `forwardPhase(review) = pending-merge`; `pending-merge → main-qa|done`
  is the reconciler edge (`reconcileMergedPhase`); delete `resumeAfterFix`,
  `PHASE_COMPLETION_MARKER`, the three marker constants, and the `addMarker`
  call-sites. Route the fix re-review reset off `progressionIndex(phase) >=
  progressionIndex(review)`.
- Selector: replace the `phase==review && reviewed` exclusion with a plain
  `phase==pending-merge` skip.
- Schema removal: drop `execution.markers` (and its `validateIdArray` at
  `schema.ts:480`) once no marker is written — confirm no other reader
  (only `resumeAfterFix`, the selector guard, and the Unit-4 migration touch it).
- Migration: live nodes at `review` carrying the `reviewed` marker → `pending-merge`;
  same one-time marker→phase migration shape as #2905 Unit 4.

## Sequencing

Sequenced **after** `tactic-fix-interrupt-orthogonal-state` (PR #2905, at
`phase: qa` when this was recorded — open, not merged). #2905 is finalized as a
single atomic PR and adding a phase-enum value is outside its frozen scope, so
this lands as a follow-on. It supersedes #2905's interim marker-based
reviewed-exclusion and subsumes the "prune dead `planned`/`qa-done` writes"
cleanup (the whole field goes). This is the natural home for the "deferred
record-hygiene for a later /align-strategy pass" #2905's own rationale
anticipated. `/align-tactics` should set the `blocked_by`
(`tactic-fix-interrupt-orthogonal-state`) at finalization; left off the raw
draft so a prune of #2905 does not dangle an inbound edge.

## Naming

`pending-merge` recommended (describes the current wait). Alternatives:
`awaiting-merge`, or reusing `reviewed` as the phase value (reads as the past
action rather than the wait state). Decide at finalization.

