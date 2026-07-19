---
id: tactic-live-session-check-path-clobber
kind: tactic
statement: lib-claude-agents.sh's `local path` locals clobber zsh's tied $PATH
  when the lib is sourced into the Bash-tool zsh, so worktree_has_live_session
  fails safe to a false held-claim; rename the offending locals to a non-tied
  name and add a zsh regression test
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-12 during an /align-tactics workflow over the raw
  draft-tactic backlog: the strategy-token-economy run's Step 0 claim check
  reported LIVE_SESSION_HELD for a worktree with no live session (claude agents
  --json showed none), forcing an unnecessary read-only no-op instead of a
  decomposition. Root cause is the documented zsh path/PATH tie biting
  worktree_has_live_session's `local path` local. Finalized by /align-tactics
  tactic-live-session-check-path-clobber (2026-07-18): the bug was independently
  reproduced live during this session's own Step 0 claim check
  (worktree_has_live_session reported HELD with `basename: command not found` on
  stderr, for a worktree confirmed free via `claude agents --json`), confirming
  the root cause is unchanged and still live in all three sites."
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
# Bug: `local path` in lib-claude-agents.sh clobbers zsh's tied `$PATH`, producing false held-claims

Finalized by `/align-tactics tactic-live-session-check-path-clobber` (2026-07-18).
Reproduced live during this same session's own Step 0.2 claim check: sourcing
`lib-claude-agents.sh` into the Bash-tool zsh and calling
`worktree_has_live_session` on this tactic's own (unoccupied) worktree printed
`worktree_has_live_session:7: command not found: basename` to stderr and
returned "held" — confirmed a false positive by cross-checking
`claude agents --json` directly, which showed no session under that path. Root
cause and fix surface below are unchanged from the original draft; the three
`local path` sites and file-wide sweep were re-verified against the current
`origin/main` copy of the file (still exactly three sites, no other
`cdpath`/`fpath` locals).

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
references) to a non-tied name in every function that declares one. Confirmed
as of 2026-07-18 (still exactly three sites, unchanged from the 2026-07-12
draft):

- `claude_agents_snapshot_capture` — `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:203`
  (`local path`, `"$path"` in the arg-guard and the `claude agents --json
  >"$path"` redirect).
- `claude_sessions_under` — `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:214`
  (`local path`, `"$path"` in the guard and the `--cwd "$path"` flag).
- `worktree_has_live_session` — `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:498`
  (`local path`, `"$path"` in the guard and `basename "$path"` at line 504).

A file-wide sweep (`grep -n '^\s*local ' lib-claude-agents.sh`) confirms these
are the only three `local path` declarations and there are no `local
cdpath`/`local fpath` sites anywhere in the file.

**Scope decision — no repo-wide lint guard this round.** The draft flagged a
possible repo-side guard (a shellcheck/grep lint rejecting `local path=` in
sourced `.sh` helpers) as an option, deferred to this session's judgment. This
round does the minimum fix (rename + a targeted zsh regression test on the one
function the align skills' Step 0.2 claim check actually calls,
`worktree_has_live_session`) and leaves a general repo-wide lint guard out of
scope — it would require enumerating every sourced `.sh` helper and deciding a
project-wide policy, which is a separate unit of work, not part of finalizing
this one bug-report tactic.

## Context

The Bash tool runs zsh, which ties the array parameter `path` to the scalar
`$PATH`. `lib-claude-agents.sh` has a bash shebang but is *sourced* (not
executed) into that zsh session by the align skills' Step 0.2 claim check
(`/align-strategy`, `/align-tactics` — see this skill's own `SKILL.md` Step 0
item 2). Every `local path=` declaration inside a sourced function silently
overwrites the calling zsh session's `$PATH` for the remainder of that
function's execution, breaking any bare-command lookup (`basename`, and the
`claude` CLI itself when `CLAUDE_AGENTS_CMD` is unset) that runs afterward
inside the same function call. `worktree_has_live_session` folds every
"unknown" outcome (a failed `claude` query) into "occupied" as a deliberate
fail-safe (see its docstring, `lib-claude-agents.sh:486-496`) — so the PATH
clobber doesn't just make the function error, it makes it return the *wrong
definite answer*: a free worktree reads as held. This forces align-skill
sessions into unnecessary read-only no-ops (as happened 2026-07-12) and, if
depended on elsewhere for spawn-gating, could equally mask a truly occupied
worktree as free (an occupied fetch also errors the same way, folding to
occupied is what saves that direction — but only until the fold is bypassed by
some future refactor, which is exactly the kind of failure a rename plus a
regression test forecloses).

### Unit 1 — rename the three `local path` locals

**Scope.** In
`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`, rename the
`local path` declaration and every in-function reference to `$path` to a
non-tied name (`pth`) in exactly these three functions:

- `claude_agents_snapshot_capture` (line 203 and its use at line 208).
- `claude_sessions_under` (line 214 and its use at line 225).
- `worktree_has_live_session` (line 498 and its use at line 504).

Do not rename the *documented argument name* in comments/docstrings (e.g. the
`<path>` in `# claude_agents_snapshot_capture <path> — capture...`) — those
describe the calling convention, not the shell variable, and stay as `<path>`
for readability. Do not touch any other function in the file (the file-wide
sweep above confirms no other `local path`/`cdpath`/`fpath` sites exist). Out
of scope: no caller of these three functions passes a named/keyword argument,
so no caller-side changes are needed — verify this by grepping the repo for
each function name after the rename (`grep -rn 'claude_agents_snapshot_capture\|claude_sessions_under\|worktree_has_live_session' --include='*.sh' --include='*.md'`)
and confirming every call site is positional.

**Recommended model:** sonnet — a mechanical, well-specified rename with a
clear diff shape (three sites, all in one file).

**Dependencies:** none.

### Unit 2 — add a zsh regression test

**Scope.** Add a new standalone test script,
`.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents-zsh-path-clobber.sh`,
with shebang `#!/usr/bin/env zsh` (not bash — the bug is zsh-specific, and the
existing `test-dispatch-scripts.sh` suite runs under bash per its own shebang,
so it cannot exercise this failure mode; `test-dispatch-daemon-liveness.sh:14`
documents the converse convention, "Run under bash -c, never zsh" — this new
file is the first exception, and its header comment should say so explicitly).
The script must be picked up automatically by
`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh`'s `test-*.sh`
glob (`run-unit-tests.sh:187`) — no changes to `run-unit-tests.sh` are needed,
since it executes each matched script via its own shebang (`"$test_script"`,
not `bash "$test_script"`).

Test cases, reusing the `write_fake_claude` pattern from
`test-dispatch-scripts.sh:9279-9292` (stub `claude` at an absolute path via
`CLAUDE_AGENTS_CMD` so no real daemon or `$PATH`-based `claude` lookup is
needed for the stub itself):

1. Source `lib-claude-agents.sh` in the zsh test script. Capture `$PATH`
   before calling `worktree_has_live_session` on a path with an empty
   session registry (`write_fake_claude '[]' 0`). Assert the function returns
   free (non-zero exit / "free", matching the existing bash-suite convention
   at `test-dispatch-scripts.sh:9314-9316`).
2. Assert `$PATH` after the call is byte-identical to `$PATH` before the
   call — the direct regression assertion for the clobber.
3. Repeat case 1 for `claude_sessions_under` and
   `claude_agents_snapshot_capture` (call each once, assert `$PATH` is
   unchanged afterward) so all three fixed sites get a direct regression
   assertion, not just `worktree_has_live_session`.

Before the Unit 1 fix lands, this test must fail (case 2's assertion trips,
and case 1 likely reports "occupied" instead of "free" per the reproduction
above) — confirm this by running the new test script against the pre-fix file
first, then again after Unit 1, to see red-then-green (test-integrity: don't
write a test you haven't watched fail).

**Recommended model:** sonnet — unit-test writing with explicit, enumerated
cases against an already-understood function.

**Dependencies:** Unit 1 should land first (or in the same commit) so the
final committed state has the test passing; the test script itself can be
authored independently since its assertions target already-known, unchanged
function names.

## Reuse

- `write_fake_claude` / `ca_setup` / `ca_teardown` helper pattern from
  `test-dispatch-scripts.sh:9267-9292` — copy the pattern (not a shared
  `source`, since that file is bash-only and this test is zsh-only) rather
  than reinventing a fake-`claude` stub.
- `assert_eq` / `PASS`/`FAIL`/`TOTAL` counters and `report_results` pattern —
  every existing `test-*.sh` in this directory (e.g.
  `test-dispatch-daemon-liveness.sh:21-30`) hand-rolls the same tiny harness
  rather than sourcing a shared file; follow that house convention for the new
  script too, sized down to only what these test cases need.

## Verification

```verify
zsh .claude/skills/dispatch-propagate/scripts/test-lib-claude-agents-zsh-path-clobber.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh
```

- Manually re-run the exact reproduction from this session: `source
  .claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh &&
  worktree_has_live_session <a-known-unoccupied-worktree-path>` in a zsh shell
  (the Bash tool's default shell) and confirm (a) no `command not found`
  error on stderr and (b) the predicate reports free/not-held, matching a
  direct `claude agents --json` check on the same path.
- Confirm `run-unit-tests.sh`'s dispatch-script-tests loop
  (`run-unit-tests.sh:187`) reports `PASS:
  test-lib-claude-agents-zsh-path-clobber.sh` in its output, so CI is
  confirmed to actually invoke the new file rather than merely having it be
  runnable by hand.

## Provenance

Surfaced 2026-07-12 during the `/align-tactics` draft-backlog workflow;
tracked here per the graph-as-sole-tracker contract
(`strategy-graph-native-dispatch` clarification 28: every defect worth fixing
is a tactic, never a side channel). Finalized into this plan by `/align-tactics
tactic-live-session-check-path-clobber` on 2026-07-18, after independently
re-reproducing the bug live in that session's own Step 0.2 claim check.
