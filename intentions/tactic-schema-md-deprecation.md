---
id: tactic-schema-md-deprecation
kind: tactic
statement: Deprecate SCHEMA.md — move the schema detail into the kind-node
  bodies, delete the file, and repoint its 8 referencing files
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round: SCHEMA.md
  and the kind nodes are two competing schema authorities and their drift
  produced the round's largest finding cluster. The kind nodes win; this tactic
  executes the move."
reading: null
gap: null
serves:
  - strategy-graph-self-description
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
# tactic-schema-md-deprecation

## Context

The graph is self-describing (kind-kind is the entry point), but
packages/intentionsutil/SCHEMA.md still claims authority over the same schema
and has drifted (documents rules 1-9 of 15; field table omits the seven
dispatch fields). Decision (strategy-graph-self-description, 2026-07-09):
kind nodes are the sole authority; SCHEMA.md is deleted.

## Scope

- Move still-accurate SCHEMA.md content into the kind-node markdown bodies per
  the per-kind body-function rule (kind bodies carry normative spec detail):
  the file-format section, field tables (kind-scoped), SuccessSignal /
  Clarification / ToolingGoal / Attention shapes, graph rules 1-15 (catch up
  to schema.ts — SCHEMA.md stops at 9), round-trip guarantee, and
  derived-attention doctrine. kind-kind's body carries the all-nodes material;
  each kind's body carries its kind-scoped material.
- Delete packages/intentionsutil/SCHEMA.md.
- Repoint every referencing file to kind-kind:
  .claude/skills/align-init/SKILL.md (NOTE: skill edit — auto-mode blocks the
  commit; route via the self-modification office-hours lane),
  intentions/README.md, and the historical mentions in
  tactic-copy-change-audit-instrument, tactic-copy-approval-planning-rule,
  tactic-graph-separability-audit, tactic-graph-native-dispatch,
  tactic-graph-self-consistency-sweep, strategy-author-approved-copy
  (update live instructions; leave dated historical clarifications as-is).
- packages/intentionsutil README/docs keep a one-line pointer to
  intentions/kind-kind.md.

## Out of scope

The CI drift guard (tactic-schema-drift-guard) and kind-declared status
vocabularies (tactic-status-kind-vocabularies) — this tactic only relocates
authority; those mechanize it.

## Verification

```verify
test ! -f packages/intentionsutil/SCHEMA.md
! grep -rn "SCHEMA.md" .claude/skills intentions/README.md packages/intentionsutil/src packages/intentionsutil/scripts
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```
