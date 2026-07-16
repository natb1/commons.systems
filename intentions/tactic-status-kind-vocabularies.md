---
id: tactic-status-kind-vocabularies
kind: tactic
statement: Each kind node declares its own status vocabulary; validateGraph
  checks a node's status against its kind's declaration
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round (author
  decision): status meant three things (central lifecycle enum; tradition
  provenance; tactic plan-written) — the field must not be overloaded, so the
  kind owns the vocabulary, exactly as it owns attributes."
reading: null
gap: null
serves:
  - strategy-graph-self-description
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-status-kind-vocabularies
  pr: 2876
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: 15b5ef1dc7ce30e0a267440a124bd558c5506c86bd79f91fa2dc39b909df79b9
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-status-kind-vocabularies

## Context

`status` carried three meanings under one central enum: the central lifecycle
(`STATUSES` at `packages/intentionsutil/src/schema.ts:13` — raw, refining,
delegated, codified), tradition provenance (kind-tradition redefines
delegated = scholarship on trust, codified = personally verified), and the
tactic layer's plan-written sense. Author decision (2026-07-09 interview):
the field must not be overloaded — each kind declares its own status
vocabulary, exactly as kinds already own `attributes`, and the validator
checks a node's status against its kind's declaration instead of the central
enum. Day-one declarations match current stored values, so no node changes at
migration.

Current stored values per kind (2026-07-11 census): kind {codified}; virtue
{codified}; strategy {raw, refining, codified}; tactic {raw, refining,
delegated, codified}; tradition {delegated} (codified is declared valid per
kind-tradition's verified-provenance meaning); delegation {raw, refining,
codified}.

## Units

### Unit 1 — Declaration convention and per-kind declarations

**Scope:**

- Define one machine-comparable declaration shape on kind nodes: each of the
  six `intentions/kind-*.md` nodes' `attributes` gains a status-vocabulary
  declaration mapping each valid value to a one-line meaning (shape chosen at
  implementation time, but it must be mechanically readable — the drift guard
  (tactic-schema-drift-guard) will compare it; coordinate on a simple
  `attributes` key such as `status_vocabulary`).
- Author the six declarations. Values: exactly the census above (every
  currently stored value validates on day one), plus a value only where the
  kind's own body already defines its meaning (e.g. tradition's `codified`).
  Meanings: kind-local — tradition declares its provenance senses; tactic
  declares the plan-written sense; the others keep the central-lifecycle
  meanings they actually use.
- Kind-node writes go through
  `packages/intentionsutil/scripts/write-node.ts` (frontmatter) — never
  hand-edit YAML.
- Out of scope: changing any non-kind node's stored `status`; the drift
  guard itself.

**Recommended model:** opus

### Unit 2 — Validator switch: loose per-node, strict per-graph

**Scope:**

- `packages/intentionsutil/src/schema.ts`: `validateNode` stops enforcing the
  central enum (`requireOneOf(value.status, STATUSES, ...)` at
  `schema.ts:455`) and requires a non-empty string instead (per-node
  validation has no graph context). The `Status` type widens to `string`
  accordingly; keep `STATUSES` only if something still needs it, else remove
  it (grep consumers first — e.g. `sensors.ts` compares
  `node.status === "codified"` and is unaffected by the widening).
- `validateGraph` (same file, rules section at `schema.ts:530-720`) gains a
  new rule: every node's `status` must be in its kind node's declared
  vocabulary (the kind node is already resolved for the attention rule at
  `schema.ts:646`); a missing declaration on the kind is itself an error
  (clear errors over fallbacks, `.claude/rules/code-style.md`).
- Unit tests in the intentionsutil suite: a node with a status outside its
  kind's vocabulary fails with the node id and kind named; all six shipped
  declarations accept the current corpus.
- Out of scope: SCHEMA.md text (owned by tactic-schema-md-deprecation;
  whichever lands second reconciles the doc).

**Recommended model:** sonnet

**Dependencies:** Unit 1.

## Reuse

- The kind-resolution pattern `validateGraph` already uses for the attention
  goal-layer gate (`packages/intentionsutil/src/schema.ts:646`).
- `packages/intentionsutil/scripts/write-node.ts` for the kind-node
  frontmatter writes.
- Existing intentionsutil vitest suite layout for the new rule's tests.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Prose: locally flip one node's `status` to a value its kind does not declare
and confirm `validate-graph.ts` fails naming the node and the kind; revert.
Confirm no stored node value changed in the diff (declarations-only
migration).
