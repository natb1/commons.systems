---
id: tactic-dispatch-stop-backstop-comment
kind: tactic
statement: "Fix the stale dispatch-stop.sh backstop comment (lines 62-63): it
  asserts the backstop does not apply the reset-dance, stale now that
  graph-commit is far-ahead-safe"
owner: ai
status: raw
parent: null
rationale: Hold 3 of the 2026-07-11 census (round-2 finding of
  tactic-phase-skill-node-targets, still true and homeless). Converted
  2026-07-23 from a census office_hours park into this blocked_by target per the
  no-park hygiene doctrine.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix the stale dispatch-stop.sh backstop comment (lines 62-63): it asserts the backstop does not apply the reset-dance, stale now that graph-commit is far-ahead-safe

## Context

Hold 3 of the 2026-07-11 census, converted 2026-07-23 to a blocked_by target per the no-park hygiene doctrine (strategy-graph-native-dispatch clarification, 2026-07-23). Round-2 finding of the pruned tactic-phase-skill-node-targets: the backstop comment at `.claude/hooks/dispatch-stop.sh:62-63` asserts the backstop does not apply the reset-dance — stale now that graph-commit is far-ahead-safe. Fix the comment so it no longer misdescribes the backstop's behavior.

**Recommended model:** sonnet — comment-only edit to a single shell hook with a clear, pre-located diff shape (reword two lines); no behavior change, no cross-cutting design judgment.

## Plan (implement)

**Scope.** Comment-only edit to `.claude/hooks/dispatch-stop.sh` lines 62-63 (locate by the backstop comment if drifted): reword to reflect graph-commit's far-ahead-safe behavior. No behavior change; hooks-path edit needs the config permission grant.

## Verification

Prose: read the amended comment against `packages/intentionsutil/scripts/graph-commit`'s far-ahead handling and confirm the claim matches. No test surface — comment-only.
