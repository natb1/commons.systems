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
office_hours:
  reason: "/implement: tactic-dispatch-stop-backstop-comment's target no longer
    exists — the stale comment at .claude/hooks/dispatch-stop.sh:62-63 was
    already deleted by commit c06c7295 prior to this session; nothing remains to
    reword"
  since: 2026-08-04
  recommendation: >-
    ## Recommendation: resolve as done (no-op)


    This tactic is moot — the defect it targets no longer exists.


    The stale comment (and the whole Stop-hook backstop-park block it lived in)
    was deleted by commit `c06c7295`, "Replace Stop-hook escalation-park
    backstop with a tick-owned terminal-disposition sweep" — not by this
    session. The current `.claude/hooks/dispatch-stop.sh` header comment (lines
    16-35) already accurately describes the removal: the backstop measured 0/4
    successes and was replaced by `dispatch-tick`'s
    `terminal_without_disposition_sweep`.


    Evidence:


    - `c06c7295` removed the code block containing the "backstop does not apply
    the reset-dance" assertion.

    - A repo-wide grep for `reset-dance` returns no occurrence in
    `.claude/hooks/dispatch-stop.sh` or anywhere else under `.claude/`.

    - Lines 62-63 of the current file are unrelated to the backstop; there is no
    comment left to reword.


    Recommended disposition: resolve the node as done with no code change.
    Attempting a fix would mean inventing a target — there is no remaining text
    that makes the stale claim.
  session_type: other
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
