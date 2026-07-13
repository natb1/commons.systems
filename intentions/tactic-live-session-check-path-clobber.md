---
id: tactic-live-session-check-path-clobber
kind: tactic
statement: lib-claude-agents.sh's `local path` locals clobber zsh's tied $PATH
  when the lib is sourced into the Bash-tool zsh, so worktree_has_live_session
  fails safe to a false held-claim; rename the offending locals
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-12 during an /align-tactics workflow over the raw
  draft-tactic backlog: the strategy-token-economy run's Step 0 claim check
  reported LIVE_SESSION_HELD for a worktree with no live session (claude agents
  --json showed none), forcing an unnecessary read-only no-op instead of a
  decomposition. Root cause is the documented zsh path/PATH tie biting
  worktree_has_live_session's `local path` local. Retained as a draft bug report
  per the graph-as-sole-tracker contract (strategy-graph-native-dispatch
  clarification 28)."
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
# Bug: `local path` in lib-claude-agents.sh clobbers zsh's tied `$PATH`, producing false held-claims

Draft bug report (retained context for `/align-tactics`, not yet planned).

## Symptom

`worktree_has_live_session <path>` returns "held" (exit 0) for a worktree that
has **no** live Claude session. Both align skills' Step 0.2 claim check
(`/align-strategy`, `/align-tactics`) and any other zsh caller that *sources*
`lib-claude-agents.sh` are affected. Observed live 2026-07-12: the
`strategy-token-economy` `/align-tactics` run reported `LIVE_SESSION_HELD` for
its worktree while `claude agents --json` showed no session in it, so the run
did a read-only no-op it should not have needed to.

## Root cause

The Bash tool runs **zsh**, which ties the lowercase array parameter `path` to
the scalar `PATH` (same tie as `cdpath`/`fpath`). `lib-claude-agents.sh` is a
bash-shebang file, but the align skills *source* it into the Bash-tool zsh and
call its functions. Inside `worktree_has_live_session`:

```sh
local path="${1:-}"          # zsh: this SETS $PATH to the worktree path
base="$(basename "$path")"   # basename now off $PATH → not found → base empty/errs
```

With `$PATH` clobbered to a single worktree directory, `basename` (and any
subsequent `claude` invocation in the function) fails to resolve, the
exact-name match logic collapses, and the fail-safe predicate returns
"occupied/held" — a false positive. This is the documented zsh
path/PATH-clobber hazard (see `.claude/rules/*` and prior recurrences), here in
a *sourced* helper rather than an interactive loop.

Note: when these scripts are **executed** under their bash shebang (the
headless `dispatch-tick` path), `local path` is harmless — bash does not tie
`path`↔`PATH`. The defect bites only the *sourced-into-zsh* path, which is
exactly the interactive/agent align-skill claim check.

## Fix surface

Rename the offending `local path` locals (and their in-function `$path`
references) to a non-tied name (e.g. `pth`, `wt`, `dir`) in every function that
declares one. As of 2026-07-12 there are three sites in
`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`:

- `claude_agents_snapshot_capture` — line ~203 (`local path`, `"$path"` in the
  arg-guard and the `claude agents --json >"$path"` redirect).
- `claude_sessions_under` — line ~214 (`local path`, `"$path"` in the guard and
  the `--cwd "$path"` flag).
- `worktree_has_live_session` — line ~498 (`local path`, `"$path"` in the guard
  and `basename "$path"`).

Sweep the whole file for any other `local path`/`local cdpath`/`local fpath`
before landing. A repo-side guard (a shellcheck/grep lint that rejects
`local path=` in sourced `.sh` helpers, or a zsh-sourced unit test asserting
`$PATH` survives a `worktree_has_live_session` call) would prevent recurrence —
`/align-tactics` decides whether that guard is in scope for this round.

## Verification

- Source the lib in a zsh shell, capture `$PATH`, call
  `worktree_has_live_session` on a path with no live session, and assert (a) it
  returns not-held and (b) `$PATH` is unchanged after the call.
- Re-run the failing scenario: a claim check on an unoccupied worktree must
  return free.

## Provenance

Surfaced 2026-07-12 during the `/align-tactics` draft-backlog workflow;
tracked here per the graph-as-sole-tracker contract
(`strategy-graph-native-dispatch` clarification 28: every defect worth fixing
is a tactic, never a side channel).
