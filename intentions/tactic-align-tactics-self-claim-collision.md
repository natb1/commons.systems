---
id: tactic-align-tactics-self-claim-collision
kind: tactic
statement: Fix align-tactics Step 0.2 worktree_has_live_session self-claim
  false-positive when graph-launched under Shape B
owner: ai
status: codified
parent: null
rationale: 'Surfaced 2026-07-14 by the /review-fix pass on PR #2870
  (tactic-graph-phase-launch-per-phase, the Shape-B launch-per-phase tactic).
  The Shape-B strategy lane spawns the /align-tactics orchestrator session with
  `--name "$id"` — exactly the worktree basename that a live-session check keys
  on — so align-tactics own Step 0.2 worktree_has_live_session lookup can match
  its own just-spawned session as a pre-existing claim, a self-collision. Filed
  as a Deferred follow-up rather than fixed in PR #2870 because the fix belongs
  in align-tactics/SKILL.md and the shared lib-claude-agents.sh helper (30+
  callers, large test suite) — outside dispatch-graph-execute, the file PR #2870
  touches. Source PR: #2870.'
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
  - strategy-token-economy
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

# Fix align-tactics Step 0.2 worktree_has_live_session self-claim false-positive when graph-launched under Shape B

## Context

Surfaced 2026-07-14 by the `/review-fix` pass on PR #2870
(`tactic-graph-phase-launch-per-phase`, the Shape-B launch-per-phase tactic), and
classified `Deferred` there because the fix belongs in `/align-tactics` and the
shared `lib-claude-agents.sh` (30+ callers, large test suite) — outside the file
that PR touched.

**Failure scenario.** The Shape-B strategy lane spawns the `/align-tactics`
orchestrator session with `--name "$id"`
(`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:150`, the
strategy-lane `dispatch-spawn-job --name "$id"` call) — exactly the worktree
basename a live-session check keys on
(`worktree_has_live_session` / `lib-claude-agents.sh:497`). When `/align-tactics`
Step 0.2 runs its own self-claim check against that same session name, it can
match its **just-spawned self** as a pre-existing live claim — a self-collision
that would wrongly treat the node as already claimed by another worker and abort
the round.

This is a live routing correctness bug in the graph-native launch path, so it
serves `strategy-graph-native-dispatch` (the router owns the launch chain) and
`strategy-token-economy` (a false self-claim burns a spawned worker to no effect —
this strategy's named "allowance burned without closing work" failing state). Off
the success-signal path (no `validates`).

I hit a *sibling* fragility while claiming this very node: `worktree_has_live_session`
returned a false "live" under a zsh `PATH`-clobber (`basename: command not
found`). That is a separate detection-robustness issue, not this bug; note it in
the change but keep this tactic scoped to the self-collision.

## Unit 1 — give the self-claim check a session-id self-exclusion

**Recommended model:** opus

Concurrency-correctness edit across a shared helper with many callers — get the
guard right without regressing the genuine "another session holds the claim"
case.

Scope:
- Choose one of two review-recommended fixes (prefer the first — it is the least
  invasive and mirrors an existing precedent):
  1. **Session-id self-exclusion in the check.** Pass `/align-tactics`' own
     `$CLAUDE_CODE_SESSION_ID` into the Step 0.2 claim check and skip a match
     where the live session's id equals self — mirroring `dispatch-spawn-job`'s
     existing `$SESSION_ID` self-guard. This may require `worktree_has_live_session`
     (or a thin wrapper) in `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:497`
     to accept an "exclude this session id" argument; keep the default behavior
     (no exclusion) unchanged for its other 30+ callers.
  2. **Short-circuit under the graph lane.** Since a successful
     `dispatch-spawn-job` kick already establishes the claim under Shape B, drop
     or short-circuit `/align-tactics`' Step 0.2 `worktree_has_live_session` check
     when launched via the graph lane (detect the graph-launch context).
- `.claude/skills/align-tactics/SKILL.md` Step 0.2 ("Check the claim"): update the
  self-claim procedure to apply the chosen exclusion, so a graph-launched
  orchestrator does not match its own session.
- Preserve the real invariant: a *different* live session in the target worktree
  must still register as a held claim and stop the run (the Step 0.2 contract).

Reuse:
- `.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job` — its
  `$SESSION_ID` self-guard is the precedent for the exclusion (fix 1).
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:497`
  (`worktree_has_live_session`) — the shared predicate; extend behind a
  backward-compatible signature.
- `dispatch-graph-execute:148-151` — the strategy-lane spawn that creates the
  collision; the graph-launch context detector (fix 2) keys off this path.

## Unit 2 — cover the self-exclusion in the lib-claude-agents test suite

**Recommended model:** sonnet

Scope:
- Extend the `lib-claude-agents.sh` test suite: a case asserting that a claim
  check **with** the self-session-id excluded returns "free" when the only live
  session in the worktree is self, and still returns "held" when a different
  session is live. Match the suite's existing fixture/mock style for
  `_claude_agents_raw` / `worktree_has_live_session`.

Dependencies: Unit 2 depends on Unit 1.

Reuse:
- The existing `lib-claude-agents.sh` test harness and its session-liveness
  fixtures.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh
```

(If the suite lives at a different path, run the repo's `lib-claude-agents` test
target discovered at implementation time.)

Manual: trace a graph-launched `/align-tactics` round (strategy lane) and confirm
Step 0.2 does **not** match its own just-spawned `--name "$id"` session as a
pre-existing claim, while a genuinely concurrent session in the same worktree
still stops the run.
