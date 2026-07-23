---
id: tactic-goals-page-mount-views
kind: tactic
statement: Goals-page mount exploration — render mount boundaries, hand-assessed
  and derived degree, and the motivating-dependencies query view
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-11 by /align-tactics round 1 (consumes the
  retained draft of the same id): the rendering half of the success signal, on
  strategy-attention-surface's goals page — dual serves because the artifact is
  that strategy's surface (artifact-owner placement,
  strategy-graph-native-dispatch clarification 27). Gated on the base goals page
  landing (tactic-attention-surface-goals-page, in flight) and on the schema
  fields and derived-degree module it renders."
reading: null
gap: null
serves:
  - strategy-graph-mounts
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-goals-page-mount-views
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates:
  - strategy-graph-mounts
blocked_by:
  - tactic-mount-schema
  - tactic-mount-derived-degree
  - tactic-attention-surface-goals-page
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Goals-page mount exploration — render mount boundaries, hand-assessed and derived degree, and the motivating-dependencies query view

## Context

The rendering half of strategy-graph-mounts' success signal: from any
strategy, the goals page enumerates the mounted dependencies that motivate
it — mount boundary, grafted virtues/strategies/duties, and both degrees
(hand-assessed and derived) visible. The surface is the office-hours goals
page owned by strategy-attention-surface (hence this tactic's dual `serves` —
artifact-owner placement), landed by tactic-attention-surface-goals-page
(in flight; its plan wires the goals route via
`packages/ds/src/templates/OfficeHours.tsx`'s `page` prop and
`office-hours/src/components/NavControls.tsx`, with views over the clone-read
graph). This tactic is blocked_by that base page, by tactic-mount-schema
(the `mount`/`grafts` fields), and by tactic-mount-derived-degree (the
`derivedMountDegree` module the degree display consumes). No new app; no
GitHub queries — all views are projections of the clone-read graph.

Views the success signal requires:
- **Mount boundaries as boundaries** — a mounted subtree visibly distinct
  from native structure, attributed to its anchoring delegation/tradition
  record; nested mounts (recursion) explorable without flattening.
- **Degree display** — the record's hand-assessed level next to the derived
  boundary-flow degree, disagreement highlighted as a review signal.
- **Motivating-dependencies query** — from any strategy, enumerate every
  mounted virtue/strategy/duty that motivates it (its `grafts` closure).
  Canonical acceptance: strategy-financial-sustainability surfaces the
  grafted commercial growth virtue.
- **Tradition deferral explorable the same way** — adopted/diverged mounted
  nodes under their tradition anchor, disposition visible.

## Unit 1 — mount-aware graph read and tree build

**Recommended model:** opus

Scope:
- `office-hours/src/intention-tree.ts`: `SlimIntentionNode`
  (office-hours/src/intention-tree.ts:20) carries `mount` and `grafts`;
  `buildTree` (:64) groups mounted nodes under their anchor record and keeps
  nested mounts nested (never flattened into the native tree).
- `office-hours/src/graph-source.ts` `readGraphNodes`
  (office-hours/src/graph-source.ts:270): surface the new fields to the
  browser layer.
- Tests alongside the existing intention-tree tests.

## Unit 2 — boundary, degree, and motivating-dependencies views

**Recommended model:** opus

Dependencies: Unit 1.

Scope:
- Extend the goals-page views landed by tactic-attention-surface-goals-page
  (seed component: `office-hours/src/components/IntentionTreePanel.tsx`):
  - boundary styling and anchor attribution on mounted subtrees, recursion
    preserved;
  - degree panel consuming `derivedMountDegree`
    (`packages/intentionsutil/src/mounts.ts`), hand-assessed verdict
    alongside derived band, disagreement loudly flagged;
  - per-strategy motivating-dependencies view walking the strategy's
    `grafts` closure, each hit showing its anchor and disposition.
- Out of scope: writing the clone from the browser, new attention semantics,
  any change to the base page's six native views.

## Reuse

- `derivedMountDegree` (`packages/intentionsutil/src/mounts.ts`, from
  tactic-mount-derived-degree).
- `buildTree` / `IntentionTreePanel.tsx` / `readGraphNodes` as extended in
  Unit 1.

## Verification

```verify
npx vitest run --project office-hours --root .
```

Manual: against the real clone after the migration tactics land — the
canonical query answers within two clicks from the goals route; a nested
mount renders nested; a hand-assessed/derived disagreement is visibly
flagged.

## Implementation notes

Two units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain each subagent to
working-tree edits only.
