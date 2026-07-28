---
id: tactic-mainqa-record-time-routing
kind: tactic
statement: "Post-merge verification tests are sorted to their terminal queue at
  qa record time: /qa-fix writes standalone tactic-mainqa-* nodes grouped by
  destination instead of a source-body residue section, and the source goes
  review -> done"
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-28 /align-strategy interview that recorded
  the record-time main-qa routing requirement. The routing unit today is the
  source tactic, which has exactly one destination, so the record-time triage
  that needs-main-followups.md already mandates cannot actually be expressed.
  This tactic carries the implementation of the greenfield design recorded in
  that clarification.
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
# Post-merge verification tests are sorted to their terminal queue at qa record time: /qa-fix writes standalone tactic-mainqa-* nodes grouped by destination instead of a source-body residue section, and the source goes review -> done

## Context

Recorded 2026-07-28 /align-strategy. Full doctrine is the same-day
`strategy-graph-native-dispatch` clarification "A main-qa verification test
recorded by the qa phase always entered the dispatch queue first..." plus its two
companions (deploy-lag park taxonomy; the progressive-detachment steelman) and the
two conditions added the same round. Read those first — this body carries only
the implementation shape.

Today the routing unit is the source tactic, which has exactly one destination.
`/qa-fix` appends `## needs-main residue` to the source's own body and advances it
`review -> main-qa`, so mixed residue cannot be split and an author-required item
cannot be parked at qa time without blocking the merge its observation depends on.
The record-time triage that
`.claude/skills/qa-fix/references/needs-main-followups.md` already mandates is
therefore unexpressible, and every main-qa item boots a `/qa-main` worker first.

## Target design

One node per (source, destination) group — at most two per source PR:

| | machine-verifiable group | author-required group |
|---|---|---|
| `phase` | `main-qa` | `main-qa` |
| `office_hours` | `null` | `{reason, since, recommendation}` |
| `owner` | `ai` | `human` |
| queue | dispatch (`/qa-main`) | office-hours only |

Both carry `execution.pr` (the source PR whose deploy is checked) and
`blocked_by: [<source-tactic-id>]`. The source tactic then goes `review -> done`
directly. Either group is omitted when empty.

Why this works with existing machinery, verified at origin/main this round:

- The selector's tactic eligibility requires `office_hours` null
  (`packages/intentionsutil/src/router.ts:197`), so an author-lane node is never
  selectable — it appears only on the office-hours PARKED panel.
- `blocked_by` self-clears correctly: pruning the `done` source strips inbound
  edges in the same commit and absence reads as completion
  (`inboundBlockers`, `packages/intentionsutil/src/transitions.ts:265-272`).
- The shape is already live on the migrated `tactic-mainqa-*` nodes
  (`tactic-mainqa-gcp-cost-alerts`, `tactic-mainqa-ds-storybook-visual`) — no new
  kind, no new field, no schema change.

## Units (indicative — /align-tactics owns the final decomposition)

1. `/qa-fix` node lane: replace the Step 3.6 residue append with per-destination
   node creation; source transitions `review -> done`. Sorting predicate is
   unchanged — the `autonomous | human` criteria in `needs-main-followups.md`
   section 1, `uncertain -> author`. Both conditions recorded this round bind
   here: born-parked context completeness, and the explicit verifiability mark.
2. `/qa-main` node lane: retarget from "source tactic at phase main-qa, work list
   = its residue section" to "verification node at phase main-qa, work list = its
   own statement/body".
3. Deploy-lag cannot-verify becomes a `blocked_by` mechanical retry hold, not an
   `office_hours` park (the selector gates on `mergedAt` only —
   `.claude/skills/dispatch-propagate/scripts/graph-select-target:631-642`).
   Coordinate with `tactic-mechanical-park-producers`, which is converting the
   other two park producers to the same shared hold primitive.
4. Retire the `review -> main-qa` edge in `forwardPhase` and the reconciler's
   main-qa absorption path. `main-qa` stays a valid standing phase. Per entry 111,
   the generated ladder prose must be regenerated, not hand-edited.
5. Mis-sort census: count `/qa-main` cannot-verify parks on nodes born
   `office_hours: null`, over all machine-sorted main-qa nodes.

## Migration

Backwards-incompatible and larger than one PR. Drain the in-flight
residue-carrying nodes currently at `phase: main-qa` under the old path — no bulk
rewrite. Units 1-2 must land together or the two lanes disagree about what a
main-qa target is; unit 4 lands only after the last residue-carrying node drains.

## Verification

Unit tests over the new `/qa-fix` node-writing path and the selector's treatment
of a born-parked main-qa node. End-to-end: a source PR with mixed residue must
produce exactly two nodes, and no `/qa-main` worker may boot for the
author-required one.
