---
id: tactic-schema-drift-guard
kind: tactic
statement: CI drift guard — every field, rule, enum, and vocabulary schema.ts
  enforces must be declared on a kind node, checked mechanically
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round:
  self-description drift recurs unless guarded — the kind docs fell 6 rules and
  12 fields behind the code with the validator green throughout. Blocked by the
  deprecation tactic because the guard compares against kind-node declarations
  that tactic puts in place."
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
  branch: tactic-schema-drift-guard
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 15b5ef1dc7ce30e0a267440a124bd558c5506c86bd79f91fa2dc39b909df79b9
validates:
  - strategy-graph-self-description
blocked_by:
  - tactic-schema-md-deprecation
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-schema-drift-guard

## Context

strategy-graph-self-description's success signal is: the schema a fresh
reader derives from kind-kind and the kind nodes matches what `schema.ts`
enforces. This tactic is the strategy's declared sensor — a CI drift guard
that fails when the code and the kind-node declarations diverge, so the next
drift is a red check instead of a periodic review finding (the 2026-07-09
review found the kind docs 6 rules and 12 fields behind the code with the
validator green throughout). It is the round's validates-terminal: it makes
the signal's sensor runnable and produces the strategy's reading.

Blocked by `tactic-schema-md-deprecation` (the kind-node bodies/declarations
it compares against) and `tactic-status-kind-vocabularies` (the
machine-comparable vocabulary declarations).

## Units

### Unit 1 — Declaration surface and guard comparison

**Scope:**

- Fix the machine-readable declaration surface on kind nodes that the guard
  reads. Building on what the two blocking tactics land: field declarations
  (which kinds carry which fields, from the kind bodies/attributes
  tactic-schema-md-deprecation lands), status vocabularies (the
  `attributes` declaration tactic-status-kind-vocabularies lands), and enum
  declarations (e.g. `PHASES`). Where a declaration is body-prose-only,
  promote just enough structure into the kind node's `attributes` for a
  mechanical compare — via `packages/intentionsutil/scripts/write-node.ts`.
- Guard implementation in `packages/intentionsutil/` comparing, at minimum:
  - `IntentionNode`'s field set (`packages/intentionsutil/src/schema.ts:100-140`)
    against the fields the kind nodes declare (both directions: undeclared
    code field and declared-but-unenforced field are each a failure).
  - `PHASES` (`schema.ts:33-41`) and any other code enum against the kind
    declarations.
  - Per-kind status vocabularies against `validateGraph`'s per-kind check.
  - The kind-scoping rules (`schema.ts:608-666`: recovers/phase/execution/
    blocked_by/validates/rounds) against the owning kind's declaration.
  - The `validateGraph` rule census against the rule list kind-kind's body
    documents.
- Clear errors naming each undeclared or over-declared item
  (`.claude/rules/code-style.md` — no defensive fallbacks).
- Design choice at implementation time: a standalone
  `packages/intentionsutil/scripts/schema-drift-guard.ts` invoked alongside
  `validate-graph.ts`, or extending `validateGraph` itself. Prefer whichever
  keeps the graph/** fast path (`.github/workflows/graph-fast-path.yml:52`)
  covering it with one invocation.
- Out of scope: repairing drift the guard finds beyond what is needed to go
  green at landing time (each finding lands where the authority is — usually
  a kind-node declaration update).

**Recommended model:** opus

### Unit 2 — CI wiring on both trigger surfaces

**Scope:**

- The guard runs on every change touching `intentions/` or
  `packages/intentionsutil` (strategy condition 2):
  - `intentions/`-only pushes: the graph fast path — add the guard invocation
    to `.github/workflows/graph-fast-path.yml` (after the validate-graph step
    at line 52), or get it free by extending `validate-graph.ts` (Unit 1's
    design choice).
  - Package changes: a vitest test in the intentionsutil suite that runs the
    guard against the repo's `intentions/` corpus — `unit-tests.yml` already
    runs on non-main branch pushes, and PR CI runs the suite.
- Out of scope: new workflow files; reuse the two existing surfaces.

**Recommended model:** sonnet

**Dependencies:** Unit 1.

### Unit 3 — Register the strategy's sensor

**Scope:**

- `packages/intentionsutil/scripts/read-sensors.ts`: register a sensor for
  `strategy-graph-self-description` following the existing registry pattern
  (see the sensor-entry shape and the read→derive→`writeNode` persistence at
  `read-sensors.ts:565-595`). The reading states: guard status (green/red
  with failure count), whether `packages/intentionsutil/SCHEMA.md` still
  exists, and declaration coverage (code-enforced fields/rules/vocabularies
  declared vs total) — the strategy's threshold is "guard green with
  SCHEMA.md deleted and every code-enforced field, rule, and vocabulary
  declared on a kind node".
- Out of scope: writing the strategy's `reading` by hand — the sensor run
  does that.

**Recommended model:** sonnet

**Dependencies:** Unit 1.

## Reuse

- `packages/intentionsutil/scripts/validate-graph.ts` — script shape
  (positional intentions dir, throw-propagation, `ok — N nodes` output).
- `listNodes` / `readNode` (`packages/intentionsutil/src/store.ts:88`).
- The read-sensors registry pattern
  (`packages/intentionsutil/scripts/read-sensors.ts` — e.g. the lifecycle
  sensor added for strategy-graph-native-dispatch, PR #2843).
- `.github/workflows/graph-fast-path.yml` guard job as the CI home.

## Verification

```verify
npx vitest run --project intentionsutil --root . || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Prose: mutate one kind declaration locally (remove a declared field) and
confirm the guard goes red naming the item; revert. Run the read-sensors
entry for strategy-graph-self-description and confirm it writes a reading
that reflects guard state. Confirm both CI surfaces execute the guard (fast
path on an intentions-only branch push; the vitest suite locally).
