---
id: tactic-graph-select-target-node-tests
kind: tactic
statement: add direct unit tests for graph-select-target's --node selection branch
owner: ai
status: raw
parent: null
rationale: null
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
# add direct unit tests for graph-select-target's --node selection branch

Surfaced by /review-fix on PR #2921 (tactic-graph-explicit-node-dispatch),
code-review finder, residue-disposed `deferred`.

**Location:** `.claude/skills/dispatch-propagate/scripts/graph-select-target:417`

**Finding:** The new `--node` selection logic in `graph-select-target` (the jq
`select(.id == $target)` filter, the `NODE_PRESENT` flag driving the
not-found vs. gated-vs-absent disposition split, and the per-gate stderr
reason echoes) has no direct unit test. The four new select-tick tests in
`test-dispatch-scripts.sh` use the fake `graph-select-target` from
`sel_tick_setup`, which ignores `--node` and just echoes
`SEL_GRAPH_TARGET` — so they only verify that select-tick passes `--node`
through and bypasses the pace gate, not that the real `--node` branch behaves
correctly. The existing real `graph-select-target` unit tests (around
`test-dispatch-scripts.sh:30960`, the `GSC_ROOT` fixture) never pass
`--node`. A regression in the real `--node` branch (a broken not-found path,
or a leaky mutual-exclusion guard) would not be caught by CI.

**Failure scenario:** A future edit to `graph-select-target`'s `--node`
branch breaks the not-found/gated disposition split or the
`--node`/`--top`/`--pace-exempt-only` mutual-exclusion guard. No test
exercises the real branch, so CI stays green while explicit-node dispatch
silently misbehaves in production.

**Adversarial verdict:** Not independently adversarially verified — this is a
code-review residue finding (already confirmed by code-review's own internal
review pass), disposed `deferred` (out of scope for PR #2921) rather than
routed through the shared verify pipeline.

**Recommended scope:** Extend the existing `GSC_ROOT` real-selector fixture
in `test-dispatch-scripts.sh` with direct `--node` cases: a candidate node
present (selects it), a node absent from candidates (not-found stderr +
`empty`), a node present but gated — reserved or live-session (specific
stderr reason + `empty`), and `--node` combined with `--top` or
`--pace-exempt-only` (exit 2). Test-file-only change; no production-code
change; no user-facing surface.
