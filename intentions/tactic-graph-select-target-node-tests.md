---
id: tactic-graph-select-target-node-tests
kind: tactic
statement: add direct unit tests for graph-select-target's --node selection branch
owner: ai
status: codified
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
phase: done
execution:
  branch: tactic-graph-select-target-node-tests
  pr: 2985
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-10T09:55:41Z
    mergeCommitSha: 40a8852f92ca96e384fccab4c9dbbca069092a31
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# add direct unit tests for graph-select-target's --node selection branch

## Context

Surfaced by /review-fix on PR #2921 (`tactic-graph-explicit-node-dispatch`),
code-review finder, residue-disposed `deferred`. The `--node` selection logic
in `graph-select-target` (the jq `select(.id == $target)` filter, the
`NODE_PRESENT` flag driving the not-found vs. gated-vs-absent disposition
split, and the per-gate stderr reason echoes) has no direct unit test. The
four select-tick tests in `test-dispatch-select-tick.sh` that pass `--node` use
the fake `graph-select-target` from `sel_tick_setup`, which ignores `--node`
and just echoes `SEL_GRAPH_TARGET` — they only verify that select-tick passes
`--node` through and bypasses the pace gate, not that the real `--node`
branch behaves correctly. The existing real `graph-select-target` unit tests
(the `GSC_ROOT` fixture) never pass `--node`. A regression in the real
`--node` branch (a broken not-found path, or a leaky mutual-exclusion guard)
would not be caught by CI.

**Failure scenario:** A future edit to `graph-select-target`'s `--node`
branch breaks the not-found/gated disposition split or the
`--node`/`--top`/`--pace-exempt-only` mutual-exclusion guard. No test
exercises the real branch, so CI stays green while explicit-node dispatch
silently misbehaves in production.

**Dependency — blocks on `tactic-graph-explicit-node-dispatch`.** As of this
planning session (2026-07-22), the `--node` flag exists only on the open,
unmerged PR #2921 branch (`tactic-graph-explicit-node-dispatch`, commit
`4b3488475828eefb6b5921982aab5adde13feabf`) — it is **not** present on
`origin/main`'s `graph-select-target` (confirmed: `grep -rn -- '--node'` over
`.claude/skills/dispatch-propagate/scripts/` and `packages/intentionsutil/`
on `origin/main` returns nothing). This tactic is therefore recorded with
`blocked_by: [tactic-graph-explicit-node-dispatch]` — the router will not
select it until that tactic reaches `phase: done` (i.e. PR #2921 merges). The
`path:line` anchors below are taken from PR #2921's diff as of this session
and describe the code's shape **once merged**; a session picking up this
tactic after the block clears should re-grep for the anchors on current
`origin/main` before editing, in case unrelated changes shifted line numbers
in the interim.

## Unit 1 — direct `--node` test cases in the `GSC_ROOT` fixture family

**Scope.** Test-file-only change to
`.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh`. No
production-code change; no user-facing surface. Add a new fixture block
(model it on the existing `GSC_ROOT` "Unit 3" fixture immediately above,
currently spanning roughly lines 30886–30944, ending
`rm -rf "$GSC_ROOT" "$GSC_BARE"` at line 30944) inserted after that `rm -rf`
line and before the `# ====...` `assert-worktree-fresh` section header
(currently at line ~30946). Name the new fixture's variables distinctly
(`GSN_ROOT`, `GSN_BARE`, `GSN_SCRIPTS`, `GSN_GST`, etc.) so they cannot
collide with the preceding block's `GSC_*` variables if ordering ever changes.

Reuse the exact fixture-construction recipe from the `GSC_ROOT` block
verbatim (same rationale: `graph-select-target` derives `REPO_ROOT` from its
own on-disk location via `SCRIPT_DIR`, so the script + every sourced
`lib*.sh` must be physically copied, not symlinked; `select-targets.ts` is
stubbed with a fake `npx` on `PATH` so the fixture exercises only the `--node`
selection-order and environmental-gate logic, not the pure candidate
computation):

- Copy `graph-select-target`, `lib.sh`, and every `lib-*.sh` into
  `$GSN_ROOT/.claude/skills/dispatch-propagate/scripts/`.
- Fake `npx` on `$GSN_ROOT/bin` that emits one fixed candidate:
  `{"candidates":[{"id":"tactic-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}`
  (implement-phase → `sensor_gate` returns 0 without touching `gh`, same as
  the existing fixture).
- `git init -b main` at `$GSN_ROOT` with a seeded `intentions/placeholder.md`
  commit, a bare `$GSN_BARE` remote pushed and fetched as `origin/main`
  (`NATIVE_ROOT` resolution needs `git worktree list` to succeed against a
  real repo).
- Fake `claude` binary on `$GSN_ROOT/bin` that cats a `claude-payload.json`
  file the cases rewrite between runs (same pattern as `GSC_ROOT`'s Case
  1/2), for the live-session gate case.
- `mkdir -p "$GSN_ROOT/.claude/worktrees/tactic-fixture"` (the node-id
  worktree dir the live-session case's claim check reads).

Add these assertions, invoking the fixture-copied
`$GSN_SCRIPTS/graph-select-target` with
`PATH="$GSN_ROOT/bin:$SAVED_PATH" CLAUDE_AGENTS_CMD="$GSN_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSN_ROOT/reservations" DISPATCH_SELECTION_LOG_DIR="$GSN_ROOT/seldir"`
each time (same env shape as the existing `GSC_ROOT` invocations):

1. **Present candidate, no gate → selected.** `claude-payload.json` = `[]`,
   no reservation marker. Run with `--node tactic-fixture`. Assert stdout ==
   `node tactic-fixture tactic implement`, exit 0.
2. **Node absent from candidates → not-found.** Same clean env. Run with
   `--node tactic-absent` (an id the fake `npx` candidates list never
   contains — the branch's `jq --arg target ... select(.id == $target)`
   filters it to nothing, so `NODE_PRESENT` stays `0`). Assert stdout ==
   `empty`, exit 0, and stderr contains `is not selectable` (the exact
   message: `graph-select-target: node tactic-absent is not selectable (not
   found, done, parked, blocked, or already reviewed — inspect
   intentions/tactic-absent.md directly for the reason)`).
3. **Present candidate, reserved → gated.** `claude-payload.json` = `[]`;
   create the reservation marker with
   `touch "$GSN_ROOT/reservations/tactic-fixture"` (mirrors
   `reservation_write`'s marker-file shape read by `reservation_exists`, per
   `lib-reservation-ledger.sh`). Run with `--node tactic-fixture`. Assert
   stdout == `empty`, exit 0, and stderr contains exactly
   `graph-select-target: reserved`. Remove the marker afterward
   (`rm -f "$GSN_ROOT/reservations/tactic-fixture"`) so it does not leak into
   case 4.
4. **Present candidate, live session → gated.** No reservation marker;
   `claude-payload.json` =
   `[{"sessionId":"s1","pid":1,"status":"busy","name":"tactic-fixture","cwd":""}]`
   (same shape as `GSC_ROOT` Case 1). Run with `--node tactic-fixture`.
   Assert stdout == `empty`, exit 0, and stderr contains exactly
   `graph-select-target: live-session`.
5. **`--node` + `--top` → usage error.** Run with
   `--node tactic-fixture --top 2` (any fixture state; the mutual-exclusion
   check runs immediately after argument parsing, before `REPO_ROOT`/
   `NATIVE_ROOT` resolution touches git or the candidate fetch runs — no
   fixture state dependency, but reuse the same copied-script invocation for
   consistency). Assert exit 2 and stderr contains
   `--node is mutually exclusive with --top and --pace-exempt-only`.
6. **`--node` + `--pace-exempt-only` → usage error.** Same as case 5 but with
   `--node tactic-fixture --pace-exempt-only`. Assert exit 2 and the same
   mutual-exclusion stderr substring.

Clean up with `rm -rf "$GSN_ROOT" "$GSN_BARE"` at the end of the block,
matching the existing fixture's teardown convention.

**Recommended model:** `sonnet` — mechanical unit-test writing with fully
explicit cases, directly modeled on an existing, adjacent fixture in the same
file (`.claude/skills/implement-unit/SKILL.md` model-selection heuristic:
"unit-test writing with explicit cases" → sonnet).

**Dependencies:** none within this plan (single unit). At the node level,
this tactic itself is `blocked_by: [tactic-graph-explicit-node-dispatch]` —
do not begin implementation until that tactic reaches `phase: done` and the
`--node` code is present on `origin/main`.

## Reuse

- The existing `GSC_ROOT` fixture immediately above in
  `test-graph-select-target.sh` (physical-copy-of-script-plus-libs pattern, fake
  `npx` stub, fake `claude` binary driven by a rewritable payload file,
  `DISPATCH_RESERVATION_DIR`/`DISPATCH_SELECTION_LOG_DIR` env overrides) — copy
  its structure rather than inventing a new fixture shape.
- `lib-reservation-ledger.sh`'s `reservation_exists`/marker-file convention
  (`$DISPATCH_RESERVATION_DIR/<worktree-basename>`) for the reserved-gate case
  — a plain `touch`, no need to call `reservation_write` (which cares about
  concurrency semantics this test does not need).
- `assert_eq` (already defined earlier in `test-graph-select-target.sh`, used
  throughout the file) for every assertion; no new assertion helper needed.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
```

Manual check: after adding the cases, temporarily revert the `--node`
mutual-exclusion check or the `NODE_PRESENT` gate logic in the fixture-copied
script and confirm the corresponding new assertion(s) fail — this pins that
the new tests actually exercise the branch rather than passing vacuously
against the fake `npx`/`claude` stubs (the failure mode this tactic exists to
close).
