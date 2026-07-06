---
id: tactic-graph-self-consistency-sweep
kind: tactic
statement: "intention graph hygiene: prune the three done-but-present nodes
  (repairing the dependent blocked_by edge), fix the graph-native-dispatch
  subtree map, repoint condition-review-sweep at /align-init, correct two stale
  prose claims, and catch the kind-* schema docs up to the promoted schema"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 target-state review. The graph is failing
  its own doctrine in several bounded ways. Serves
  strategy-graph-drives-dispatch: the graph can only drive dispatch reliably if
  it is internally consistent and self-describing."
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
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
# intention graph: self-consistency sweep

## Context

The 2026-07-05 target-state review found the graph failing its own doctrine
in several bounded ways. Each is low-risk but they accumulate; the graph must
be internally consistent and self-describing to drive dispatch reliably.

## Unit 1 — prune done-but-present nodes (with edge repair)

**Recommended model:** sonnet

Scope:
- `tactic-graph-native-dispatch.md §1.1` says `phase: done` prunes the node
  and its edges in the same commit, but `tactic-graph-commit`,
  `tactic-graph-dispatch-schema`, and `tactic-intentions-branch-protection`
  sit at `done` and remain present. Prune them - but `tactic-graph-commit` is
  `blocked_by: tactic-graph-dispatch-schema`, so removing the schema node
  first leaves a dangling `blocked_by` that fails `validate-graph`. Repair the
  dependent edge (or prune both in one commit) so the graph validates.

## Unit 2 — fix the subtree map and stale prose

**Recommended model:** sonnet

Scope:
- `tactic-graph-native-dispatch.md §5`: the "Fifteen children" map/diagram
  still shows three pruned align-skill tactics and omits
  `tactic-schema-migration-backfill`; correct the count and the list.
- `strategy-graph-drives-dispatch.md:11-12` ("readings are null") and
  `tactic-first-sensor-pass.md:9` ("every reading and gap is null"): both are
  contradicted by ~37 strategies now carrying success_signals and several
  populated readings. Update or delete the stale claims.
- `tactic-condition-review-sweep.md`: repoint from the retired `/align`
  rung-5 consistency role to `/align-init`, whose landing spot will exist.

## Unit 3 — kind-layer schema catch-up

**Recommended model:** sonnet

Scope:
- The `kind-*.md` schema docs no longer describe the real node schema:
  `kind-kind.md` omits the promoted execution fields (`phase`, `execution`,
  `validates`, `blocked_by`, `office_hours`, `pace_exempt`, `rounds`) and the
  common `reading`/`gap`/`clarifications`/`tooling_goals`/`success_signal`
  fields; `kind-tactic.md` documents only `attention` under `attributes`.
  Bring the kind docs in line with `packages/intentionsutil/SCHEMA.md` and the
  promoted schema so "read this node, then the kind nodes" yields the real
  schema again.

## Verification

- `npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions`
  stays green after each unit (especially the prune+edge-repair); the kind
  docs match `SCHEMA.md` field-for-field.
