---
id: tactic-schema-migration-backfill
kind: tactic
statement: Backfill the 14 pre-schema tactic nodes whose dispatch state still
  squats under attributes.* into the promoted top-level fields
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Surfaced by the /review-fix pass on PR #2764: nodes written before
  tactic-graph-dispatch-schema promoted phase/execution/validates/blocked_by to
  top level still carry them squatted under attributes.*. The 2026-07-06 census
  counts 14 such nodes (eight attention-surface tactics, four token-economy
  tactics, main-qa-triage-before-provision, noncodegen-session-model-defaults).
  Consequences are live: align-tactics idempotency and router selection read
  top-level phase, so a squatted node misreads as an untriaged draft -
  already-planned work becomes invisible to the router precisely as the
  graph-native queue goes live. Finalized from draft 2026-07-06 /align-tactics
  re-evaluation round."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-schema-migration-backfill
  pr: 2788
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# backfill squatted dispatch state into the promoted schema

## Context

`tactic-graph-dispatch-schema` (done) promoted `phase` / `execution` /
`validates` / `blocked_by` / `office_hours` / `rounds` to first-class
top-level frontmatter, but nodes authored before it landed still squat
those fields under `attributes.*`. The 2026-07-06 census (frontmatter-only
scan) finds 14:

- `tactic-attention-surface-analytics-collector`
- `tactic-attention-surface-firestore-retire`
- `tactic-attention-surface-goals-page`
- `tactic-attention-surface-graph-read`
- `tactic-attention-surface-instrument`
- `tactic-attention-surface-signal-types`
- `tactic-attention-surface-status-page`
- `tactic-attention-surface-velocity-pace`
- `tactic-main-qa-triage-before-provision`
- `tactic-noncodegen-session-model-defaults`
- `tactic-outcome-envelope-qa-accounting`
- `tactic-token-audit-node-attribution`
- `tactic-token-economy-sensor`
- `tactic-token-hygiene-sweep`

The router and `/align-tactics` idempotency read **top-level** `phase`; a
squatted node misreads as an untriaged draft, so already-planned work is
invisible to selection exactly as the graph-native queue goes live. Note:
lifting `attributes.phase: implement` to top level makes those nodes
selectable — that is the recorded intent finally taking effect, not a
behavior change to review.

## Unit 1 — lift, normalize, land atomically

**Recommended model:** sonnet

Scope:
- For each listed node: `readNode` → move `attributes.phase`,
  `attributes.execution`, `attributes.validates`, `attributes.blocked_by`,
  `attributes.office_hours`, `attributes.rounds` (only keys present) to top
  level; delete them from `attributes`; pass the result through
  `write-node.ts` (which validates enums and drops unknown keys — a
  squatted value that fails validation must **abort that node loudly**,
  not silently drop: leave the node unmigrated and name it in the commit
  message, per clear-errors code-style).
- Shape mapping: a squatted `execution` object predating the schema may
  lack fields (`attempts`, `markers`, `strategy_fingerprint`) — fill with
  the schema defaults (`{}`, `[]`, `null`). A squatted `phase` value not in
  `schema.ts` `PHASES` (e.g. a retired name) aborts that node loudly.
- Do not touch node bodies (`writeNode` preserves them).
- Land all migrated nodes in **one** `graph-commit` call (one atomic
  fast-path commit), message listing any aborted nodes.
- Out of scope: `main-qa` enum addition (that is `tactic-main-qa-phase`);
  any semantic re-planning of the migrated nodes.

## Reuse

- `readNode` / `writeNode` — `packages/intentionsutil/src/store.ts:74`
- `packages/intentionsutil/scripts/write-node.ts` (single validation gate)
- `packages/intentionsutil/scripts/graph-commit` (multi-id atomic landing)

## Verification

```verify
for f in intentions/tactic-*.md; do awk '/^---$/{n++} n==1 && /^attributes:/{f=1} n==1 && f && /^  (phase|execution|validates|blocked_by|office_hours|rounds):/{print FILENAME; exit}' "$f"; done | wc -l | grep -qx '0' && npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

- Manual: spot-read two migrated nodes (one attention-surface, one
  token-economy) and confirm top-level `phase` matches what `attributes.*`
  carried before, and the body is byte-identical.
