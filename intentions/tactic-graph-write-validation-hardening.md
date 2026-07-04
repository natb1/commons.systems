---
id: tactic-graph-write-validation-hardening
kind: tactic
statement: "Harden graph write-path validation: symlink type check in the
  fast-path guard, semantic shape rules in the schema, tactic-body loss guard on
  kind change"
owner: ai
status: raw
parent: tactic-graph-native-dispatch
rationale: Deferred-finding draft per strategy-graph-native-dispatch
  clarification 19 — recorded by the 2026-07-04 independent review round of PRs
  2748 and 2742 (merged without review; no in-scope findings). All entries are
  defense-in-depth on paths that currently fail closed; awaiting /align-tactics
  finalization.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: draft
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Harden graph write-path validation: symlink type check in the fast-path guard, semantic shape rules in the schema, tactic-body loss guard on kind change

**Draft (retain-not-refine)** — deferred findings from the 2026-07-04
independent review of PR #2748 (`graph/**` CI fast path) and PR #2742
(intentionsutil schema/store), both merged without review; neither had
in-scope findings. All entries are defense-in-depth on paths that currently
fail closed, deferred per strategy clarification 19.

Findings:

- **Fast-path guard is name-based, not type-based**
  (`.github/workflows/graph-fast-path.yml:28`). A committed symlink at
  `intentions/x.md` passes the `^intentions/` path filter; practical impact
  is low today because `validate-graph` parses the resolved content and
  fails closed on anything that is not valid frontmatter, but the guard
  should reject non-regular-file modes explicitly (`git diff --raw` mode
  check, or `find intentions -type l`).
- **`writeNode` body preservation keyed only on kind + existence**
  (`packages/intentionsutil/src/store.ts:47-51`). Rewriting an existing
  tactic with `kind` changed away from `tactic` regenerates the placeholder
  body, silently discarding a hand-authored plan. Guard: refuse a kind
  change that would drop a non-placeholder body.
- **Semantic shape gaps in the schema**
  (`packages/intentionsutil/src/schema.ts:349-396`). `execution.pr`,
  `execution.attempts[*]`, and `rounds.count` accept negative/fractional
  numbers; `office_hours.since` accepts any string rather than an ISO date
  shape, so a downstream `Date.parse` silently yields `NaN`.
- **Referential/layer rules enforced only by `validateGraph`, not at
  `writeNode` time** (`packages/intentionsutil/src/schema.ts:524`). A direct
  `writeNode` caller can locally produce a dangling `blocked_by` or a
  `phase` on a non-tactic with no error; currently caught before landing by
  `committed-store.test.ts` in ordinary CI and by the fast path's
  `validate-graph` gate. Keep confirming every future direct-to-main write
  path runs one of those gates; optionally add opt-in graph validation to
  `writeNode`.
