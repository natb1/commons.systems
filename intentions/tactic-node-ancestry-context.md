---
id: tactic-node-ancestry-context
kind: tactic
statement: Inject a bounded ancestry projection (parent + serves chain to virtue
  roots) into every node-assigned session via an owned primitive at provisioning
  / session Step 0
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-08 /align-strategy ancestry-context
  interview (the node-plus-ancestry clarification and condition on
  strategy-graph-native-dispatch): node-assigned sessions currently receive only
  the node's own context, so judgment calls the plan under-determines resolve
  greedily; the decided fix is a bounded ancestry projection injected uniformly,
  mechanism owned in a thin script per the thin-script condition."
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
# Inject a bounded ancestry projection (parent + serves chain to virtue roots) into every node-assigned session via an owned primitive at provisioning / session Step 0

Retained draft from the 2026-07-08 /align-strategy ancestry-context round —
input to a future /align-tactics pass; not yet a plan.

## Context

The decision this implements is the node-plus-ancestry clarification and
condition on strategy-graph-native-dispatch (recorded 2026-07-08). Current
state: a node-assigned session receives only the node's own context — the
tick prompt carries id/kind/phase (`.claude/workflows/dispatch-graph-tick.js`,
`nodePrompt`) and the phase skill reads the node file, whose body is the
plan (condition 7). Nothing anywhere loads ancestry, yet phase semantics
already owe ancestry facts (review's signal-path disposition, qa's
independent validation against intent), so workers resolve
plan-under-determined judgment calls greedily or read the graph ad hoc with
nothing forcing the read. Doctrinal home: strategy-explicit-intent's
periagoge clarification and injection-lapse condition — this primitive is
that condition's per-node materialization.

## Scope (draft)

- **Owned primitive** (thin-script condition, clarification 25): e.g.
  `packages/intentionsutil/scripts/node-context.ts <node-id>` — walk
  `parent` (same-kind) and `serves` edges via `readNode`
  (`packages/intentionsutil/src/store.ts`) up to virtue roots; emit, per
  ancestor: `statement`, `rationale`, `attributes.conditions`,
  `success_signal`, attention rationale, plus the `clarifications`
  questions as a titles-only index (full entries pulled on demand via
  `readNode`). Cycle-safe; reads the session worktree tree, which the
  freshness guard (tactic-align-skills-latest-graph-guard) guarantees is
  cut from fresh origin/main — coordinate: if that guard has not landed,
  the primitive must read at origin/main.
- **Injection points, uniform by node id**: `provision-node-worktree`
  emits the projection into the provisioned worktree (so router phase
  workers and main-qa handlers get it at the same fresh read that stamps
  fingerprints); `dispatch-graph-tick.js` `nodePrompt` gains a step
  directing the worker to read it; the office-hours graph entry surfaces
  it beside `office_hours.reason`/recommendation; the align skills' claim
  step (/align-strategy, /align-tactics) runs the primitive for the
  claimed node.
- **Discipline text in each consuming skill**: ancestry is read-only
  decision context for in-scope judgment calls; the node body stays the
  sole work contract (condition 7 unweakened — a plan that assumes the
  projection is still an incomplete record); a perceived plan-vs-ancestry
  conflict parks to office_hours with a recommendation, never
  self-expanded or self-reduced scope.
- **Token bound**: projection only, order-of-a-few-KB per chain; never
  full clarification histories by default (token-economy parity,
  clarification 17).

Out of scope: weakening the plan-completeness bar; the fingerprint
freeze/demote machinery (unchanged — it guards substance changes, this
guards under-determined judgment calls); tradition-record injection
(alignment-tests territory, tactic-align-strategy-alignment-tests).
