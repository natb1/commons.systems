---
id: tactic-mount-derived-degree
kind: tactic
statement: Derived mount degree — compute motivation flow across each mount
  boundary and surface disagreement with the record's hand-assessed verdict as a
  review signal
owner: ai
status: codified
parent: null
rationale: "Round-1 sensor (strategy tooling goal 3): the structural half of
  degree-of-capture — motivation flow across each mount boundary — is computed
  by tooling and compared against the record's hand-assessed verdict;
  disagreement between the two is the drift detector (strategy clarification 4).
  Split from tactic-mount-schema to keep each leaf exactly one PR."
reading: null
gap: null
serves:
  - strategy-graph-mounts
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-mount-derived-degree
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 04aa02adec88a3145460aa90242ca47578f633087667aba014c921593e28d1b3
validates:
  - strategy-graph-mounts
blocked_by:
  - tactic-mount-schema
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Derived mount degree — compute motivation flow across each mount boundary and surface disagreement with the record's hand-assessed verdict as a review signal

## Context

strategy-graph-mounts carries degree of capture/deference twice, with
distinct roles (strategy clarification 4): the record's hand-assessed verdict
(`attributes.divergence.level` and `classification` on delegation records)
stays the author's judgment, and a **derived** measure is computed from how
much motivation actually flows across the mount boundary. Disagreement
between the two is itself the drift signal — a low-divergence record with
heavy boundary flow is the drift detector. This tactic is strategy tooling
goal 3 (sensor). It builds on the `mount`/`grafts` fields and validate rules
from tactic-mount-schema (blocked_by), and its module is consumed by
tactic-goals-page-mount-views for the degree display.

## Unit 1 — boundary-flow module

**Recommended model:** opus

Scope:
- New `packages/intentionsutil/src/mounts.ts` exporting
  `derivedMountDegree(nodes: IntentionNode[])`: group mounted nodes by their
  `mount` anchor; per anchor report `{anchor, mountedNodeCount,
  graftEdgeCount (grafts entries landing on this anchor's mounted nodes),
  graftingNodes (the native ids holding those edges), derived
  (none|light|moderate|heavy — document the thresholds in the module; count
  of graft edges is the round-1 weight, one edge = one unit), handAssessed
  (delegation `attributes.divergence.level`, or null for kinds without one —
  traditions report flow with `attributes.origin` alongside, no verdict),
  disagreement (boolean; only when handAssessed is non-null and the bands
  differ by more than one step)}`.
- Export from `packages/intentionsutil/src/index.ts`.
- Tests: new `packages/intentionsutil/test/mounts.test.ts` — fixture graph
  with an anchor, mounted nodes, graft edges; a disagreement case (level low,
  heavy flow); a tradition anchor (no verdict); nested mounts counted under
  their own anchor.

Out of scope: rendering (tactic-goals-page-mount-views), any change to the
hand-assessed fields.

## Unit 2 — report script

**Recommended model:** sonnet

Dependencies: Unit 1.

Scope:
- New `packages/intentionsutil/scripts/mount-degree.ts`: read the store via
  `listNodes` (packages/intentionsutil/src/store.ts:137), print a per-anchor
  table and a loud line per disagreement; exit 0 always — it is a report the
  office-hours review reads, not a gate.
- Follow the existing script conventions (repo root resolved from
  `import.meta.url`, never cwd — see
  `packages/intentionsutil/scripts/grounding-gap.ts` or `read-sensors.ts`).

## Reuse

- `listNodes` (`packages/intentionsutil/src/store.ts:137`).
- validateGraph (tactic-mount-schema rules 16-17) already guarantees graft
  edges resolve — the module does not re-validate.
- Script skeleton: `packages/intentionsutil/scripts/grounding-gap.ts`.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: after the migration tactics land,
`npx tsx packages/intentionsutil/scripts/mount-degree.ts` lists every anchor
carrying mounted structure and flags any hand-assessed/derived disagreement.

## Implementation notes

Two units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain each subagent to
working-tree edits only.
