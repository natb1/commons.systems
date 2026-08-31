---
id: tactic-omit-default-serialization
kind: tactic
statement: writeNode omits default-valued fields — ~3,700 lines of serialized
  defaults stop being written; normalization is incremental
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round
  (author-confirmed): serialized defaults are ~19% of frontmatter bulk,
  fingerprint the authoring tool, and put dispatch fields on records-not-goals
  kinds. validateNode already applies defaults, so omission is lossless and
  backwards compatible today."
reading: null
gap: null
serves:
  - strategy-graph-self-description
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-omit-default-serialization
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 15b5ef1dc7ce30e0a267440a124bd558c5506c86bd79f91fa2dc39b909df79b9
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-omit-default-serialization

## Context

286 nodes carry roughly 3,700 frontmatter lines of pure default values
(`reading: null`, `recovers: []`, `pace_exempt: false`, ...). `validateNode`
already applies defaults on read, so omitted fields are already valid — 11
nodes omit them today — and the two-convention split merely fingerprints
which tool authored a file. Author-confirmed decision (2026-07-09): writeNode
omits default-valued fields at write; normalization is incremental as nodes
are rewritten; no flag day. This also stops records-not-goals kinds
(traditions, virtues, kinds, delegations) carrying dispatch fields their kind
declares meaningless.

## Units

### Unit 1 — Omit-when-default in writeNode, with round-trip tests

**Scope:**

- `packages/intentionsutil/src/store.ts` `writeNode`
  (`store.ts:40-51`): before `stringify(validated)`, drop every optional
  field whose value deep-equals its `validateNode` default. Derive the
  default set from `validateNode`'s own defaulting logic
  (`packages/intentionsutil/src/schema.ts:455-500`): `parent`, `rationale`,
  `reading`, `gap` (unless tactic-gap-derive-on-read has already removed the
  field — whichever lands second reconciles via the compile error), `serves`
  `[]`, `recovers` `[]`, `clarifications` `[]`, `tooling_goals` `[]`,
  `success_signal`, `attention`, `phase`, `execution`, `validates` `[]`,
  `blocked_by` `[]`, `office_hours`, `pace_exempt` `false`, `rounds`,
  `attributes` `{}`. Keep the drop list adjacent to the defaulting code (or
  derived from one shared table) so the drift guard and future field
  additions cannot split them.
- Round-trip unit tests: `write(read(x))` byte-stable for an already-omitted
  node; a node written with explicit defaults comes back semantically equal
  and serializes omitted; omitted and explicit forms validate identically.
- Required fields (`id`, `kind`, `statement`, `owner`, `status`) are never
  omitted.
- NO validator rule rejects explicit defaults — normalization stays
  incremental (backwards compatible). An optional one-shot normalization
  sweep over `intentions/` may ride along as a separate commit in the same PR
  if review prefers a single-convention landing; it is not required.

**Recommended model:** sonnet

## Reuse

- `validateNode`'s defaulting expressions
  (`packages/intentionsutil/src/schema.ts:455-500`) — the single source for
  what "default" means per field.
- Existing store round-trip tests in the intentionsutil suite as the template.
- `stringify` (yaml) usage at `store.ts:49` — only the object passed to it
  changes.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root . || exit 1
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts
```

Prose: rewrite one heavily-defaulted node through
`packages/intentionsutil/scripts/write-node.ts` and confirm its frontmatter
shrinks to non-default fields only while `readNode` returns the identical
validated object. Confirm a records-not-goals node (e.g. a virtue) rewritten
this way carries no dispatch fields.
