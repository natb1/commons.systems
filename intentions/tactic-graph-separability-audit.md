---
id: tactic-graph-separability-audit
kind: tactic
statement: Audit separability — enumerate what breaks when the intention-graph
  data structure is used without the harness, and track each gap as work
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-07 interview: 'use it with your own project
  management and agentic workflows' was recorded as a direction stated honestly,
  not a current-capability claim, with known separability gaps to become draft
  tactics under the strategy. This audit is where those gaps get enumerated."
reading: null
gap: null
serves:
  - strategy-data-structure-first
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
# Audit separability — enumerate what breaks when the intention-graph data structure is used without the harness, and track each gap as work

Draft tactic retained from the 2026-07-07 /align-strategy interview
(strategy-data-structure-first). Not yet planned — /align-tactics consumes
this body when the strategy is decomposed.

The strategy's headline claim — "use it with your own project management and
agentic workflows" — was recorded as a direction stated honestly, not a
current-capability claim. This audit makes the honesty operational: enumerate
the gaps between the claim and the code, and turn each into tracked work.

Candidate gap areas surfaced (unverified, to be confirmed by the audit):

- packages/intentionsutil assumptions about this repo's layout (intentions/
  at repo root, script-relative path resolution).
- graph-commit's coupling to this repo's CI fast path (`graph/**` branch
  protection stamping) — a consumer repo has neither the ruleset nor the
  workflow.
- The align skill family's assumptions about the dispatch harness (worktrees,
  phase fields, router semantics) versus what a standalone adopter needs
  (schema + validate + write-node + an interview pattern).
- Documentation: whether SCHEMA.md alone is sufficient for an adopter to
  author a valid graph with no harness context.

Output shape: each confirmed gap becomes its own tactic (or a unit of one)
under strategy-data-structure-first; the audit itself makes no code changes.
