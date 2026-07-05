---
id: tactic-graph-dispatch-schema
kind: tactic
statement: "intentionsutil: first-class execution state — phase, execution,
  blocked_by, office_hours, rounds — and tactic-body preservation in writeNode"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Round-1 root of strategy-graph-native-dispatch (clarifications 1, 4,
  5): the graph is the state machine, so the store must carry execution state
  first-class and stop regenerating tactic bodies from statement. Until this
  lands, the round-1 tactics squat these fields under free-form attributes; this
  tactic promotes the fields and migrates those nodes."
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
  branch: tactic-graph-dispatch-schema
  pr: 2742
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
# intentionsutil: first-class execution state — phase, execution, blocked_by, office_hours, rounds — and tactic-body preservation in writeNode

## Context

`strategy-graph-native-dispatch` (clarifications 1, 4, 5, 9, 10, 14) makes
the graph the state machine: tactics carry a persisted `phase` the router
transitions, parking is a first-class `office_hours` field, goal-layer
nodes carry the authored `pace_exempt` pace-gate bypass (the legacy
priority label's graph home, orthogonal to attention ordering), strategies
carry `rounds` accounting, tactic bodies are authoritative plan content,
signal-validating tactics carry a factual `validates` edge (the
calculated-attention signal term's terminals), and executions carry the
strategy substance fingerprint that triggers the mid-flight soft freeze. None of this
exists in the schema today — the round-1 tactic nodes squat these fields
under free-form `attributes`, and `writeNode` regenerates every body from
`statement`, which would destroy a tactic's plan on any rewrite. Target field
shapes: `intentions/tactic-graph-native-dispatch.md` §1.1.

## Unit 1 — schema fields and validation rules

**Recommended model:** opus

Scope:
- `packages/intentionsutil/src/schema.ts:79` (`IntentionNode`) and
  `schema.ts:110` (`IntentionNodeInput`): add optional typed fields —
  - `phase: "draft" | "align-tactics" | "implement" | "fix" | "qa" | "review" | "done" | null`
  - `execution: { branch: string; pr: number | null; attempts: Record<string, number>; markers: string[]; strategy_fingerprint: string | null } | null`
    (`strategy_fingerprint` = hash of the serving strategy's substance
    fields — statement, clarifications, conditions, serves,
    success_signal, tooling_goals — stamped at plan time; the router's
    soft-freeze trigger, strategy clarification 10)
  - `validates: string[]` (default `[]`) — factual edge on the tactics
    that validate a strategy's signal (produce its reading, meet its
    threshold); the calculated-attention signal term derives on-path
    status from reachability to these terminals (strategy clarification
    11)
  - `blocked_by: string[]` (default `[]`)
  - `office_hours: { reason: string; since: string } | null`
  - `pace_exempt: boolean` (default `false`) — authored pace-gate bypass
    (strategy clarification 14): the selector may admit one gate-exempt
    worker for a flagged node past a paced-to-zero budget; never
    overrides genuine token exhaustion; deliberately a separate field
    from `attention` (bypass ≠ ordering)
  - `rounds: { count: number; last_completed: string | null } | null`
- `packages/intentionsutil/src/schema.ts:291` (`validateNode`): parse and
  default the new fields, strict on shape.
- `packages/intentionsutil/src/schema.ts:378` (`validateGraph`) layer rules:
  `phase`/`execution`/`blocked_by`/`validates` valid on tactics only;
  `office_hours` and `pace_exempt` on goal-layer kinds only (same
  `attributes.goal_layer` gate as attention, `schema.ts:401`); `rounds`
  on strategies only; every
  `blocked_by` id must exist and be a tactic; every `validates` id must
  exist and be a strategy; reject `blocked_by` cycles.

Out of scope: any router or skill consumption of the fields (sibling
tactics own that).

## Unit 2 — tactic-body preservation and field migration

**Recommended model:** sonnet

Depends on: Unit 1.

Scope:
- `packages/intentionsutil/src/store.ts:22` (`writeNode`): for
  `kind: tactic`, if `<dir>/<id>.md` already exists, retain everything after
  the closing frontmatter fence instead of regenerating `# ${statement}`.
  Non-tactic kinds keep the cosmetic render (doctrine amendment, strategy
  clarification 5).
- Migrate the squatted round-1 fields to first-class: `attributes.phase`,
  `attributes.blocked_by`, `attributes.office_hours`,
  `attributes.validates` on the tactic children of
  `tactic-graph-native-dispatch`, and `attributes.rounds` on
  `intentions/strategy-graph-native-dispatch.md`.
- Tests in `packages/intentionsutil/test/`: body preserved on tactic
  rewrite, regenerated for a strategy; each validation rule accepts/rejects
  as specified.

## Reuse

- `requireOneOf` / `requireString` local guards in `schema.ts` for the new
  field validation.
- `extractFrontmatter` in `store.ts` for locating the body boundary.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: rewrite this node itself via
`packages/intentionsutil/scripts/write-node.ts` and confirm this body
survives.

## Implementation notes

Implement each unit in a subagent (Agent tool) with `model` set to the
unit's recommended tag; supply this Context and the unit's Scope; constrain
to working-tree edits.
