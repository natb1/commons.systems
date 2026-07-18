---
id: tactic-dispatch-skill-input-contract
kind: tactic
statement: Give each dispatch-* skill a structured-params execution core with a
  node-id + derivation-script front door, replacing worktree-branch-name
  inference
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-07-18 /align-strategy interview recording the
  uniform dispatch-skill input contract (clarification 68). Generalizes
  /align-tactics's explicit node-id argument to every dispatch phase skill.
  Finalize as a BACKLOG tactic (off-path, low rank) per clarification 69.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# Give each dispatch-* skill a structured-params execution core with a node-id + derivation-script front door, replacing worktree-branch-name inference

Draft context (retained by /align-strategy 2026-07-18; not yet planned). Splits each dispatch-* skill into derivation (node → params) and execution (params → work), replacing worktree-branch-name inference (strategy clarification 68).

## Contract

- **Execution core** takes explicit structured params — testable in isolation, no branch/worktree magic.
- **Front door** accepts a node id and runs a derivation script that emits those params.
- **Router path**: the router always passes the computed structured params directly (it holds the node at selection — saves the derivation round-trip).
- **Manual/author path**: pass a bare node id; the derivation script produces the params.

## Current state (what this replaces)

Today the phase skills infer the target from the worktree branch name:
- `.claude/skills/implement/SKILL.md:29-45`, `.claude/skills/fix-checks/SKILL.md:32-48`, `.claude/skills/qa-fix/SKILL.md:62,73-74`, `/review-fix` (worktree-driven), `.claude/skills/qa-main/SKILL.md:25,31-39`.
- Only `/align-tactics` already takes an explicit node-id argument (`.claude/skills/align-tactics/SKILL.md:41-52`) — the model to generalize.

## Open design question (for the planning round)

One shared derivation script (`dispatch-derive-input <node-id> <phase>` emitting per-phase params) vs one script per skill. Lean shared-and-parameterized for DRY, but defer to the plan. Coordinate with [[tactic-dispatch-skill-rename]] (same skills; ideally same or sequenced PRs).
