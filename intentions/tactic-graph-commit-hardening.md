---
id: tactic-graph-commit-hardening
kind: tactic
statement: "Harden graph-commit: surface gh api errors, stop retrying
  deterministic check failures, park_write rollback, id-validation
  over-rejection"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: Deferred-finding draft per strategy-graph-native-dispatch
  clarification 19 — recorded by the 2026-07-04 independent review round of PR
  2750 (merged without review; the in-scope conflict data-loss finding shipped
  separately as PR 2751). All entries are confirmed-or-plausible robustness
  gaps, out of the primitive's stated contract; finalized 2026-07-04 by the
  clarification-19 /align-tactics re-evaluation; off-path (no validates chain),
  so calculated attention demotes it below round tactics.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-graph-commit-hardening
  pr: 2778
  attempts:
    qa: 1
  markers:
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Harden graph-commit: surface gh api errors, stop retrying deterministic check failures, park_write rollback, id-validation over-rejection

**Finalized 2026-07-04** by the clarification-19 `/align-tactics`
re-evaluation, from the deferral draft recorded by the same-day independent
review of PR #2750. Off-path: no `validates` chain reaches this node, so
calculated attention demotes it below round tactics at read time. One PR.

## Context

The 2026-07-04 review of `packages/intentionsutil/scripts/graph-commit`
(merged without independent review as PR #2750) confirmed one in-scope
contract violation — silent data loss in the conflict-recovery path — fixed
separately by PR #2751 (fail-closed park). The remaining confirmed-or-
plausible findings are out-of-contract robustness gaps, deferred here per
strategy clarification 19. They make failures slower to diagnose or leave
mess behind, but none can land wrong content on `main`.

**Precondition:** PR #2751 must be merged first — it rewrites the conflict
path this plan's line anchors sit around. Verify before starting:
`grep -q 'fail closed' packages/intentionsutil/scripts/graph-commit` on
`origin/main`; if absent, stop and check PR #2751's state.

## Unit 1 — surface check/API errors; stop retrying deterministic failures

**Recommended model:** sonnet

Scope — `packages/intentionsutil/scripts/graph-commit` only:

- `await_checks()` (near `gh api "repos/{owner}/{repo}/commits/$sha/check-runs"`):
  today `2>/dev/null … || counts=""` collapses gh auth/rate-limit/network
  errors into the "still polling" bucket and the script times out ~180s
  later with a generic message. Capture gh's stderr; after 3 consecutive
  gh failures, die with the captured error text (clear error over
  fallback, `.claude/rules/code-style.md`). Distinguish return states:
  green / a required check CONCLUDED non-success / timeout-pending.
- `try_land()` retry loop: when `await_checks` reports a *concluded*
  non-success (nfail>0, not a timeout), the content itself is broken —
  every retry reproduces it. Stop the attempt loop immediately and die
  with the check-failure message instead of burning the remaining
  attempts and printing "main busy … retry later".

Out of scope: any change to the conflict/park path (owned by PR #2751).

## Unit 2 — park_write atomicity, id validation, signal traps

**Recommended model:** sonnet

Scope — `packages/intentionsutil/scripts/graph-commit` only:

- `park_write()`: the per-id `writeNode` loop has no rollback; a mid-loop
  throw leaves earlier ids mutated on disk, uncommitted. Make the tsx
  helper two-pass: pass 1 `readNode` every id (fail fast before any
  write), pass 2 write all.
- Id validation (`case "$id" in */*|*'\'*|*..*)`): `..` as a *substring*
  cannot traverse once `/` and `\` are banned — reject only the exact ids
  `.` and `..`, keep the separator bans. Unblocks ids like
  `v1..v2-migration`.
- Traps: `trap cleanup EXIT` does not fire the scratch-branch delete on
  INT/TERM in all shells; add `trap 'exit 130' INT TERM` so the EXIT trap
  runs on signal death. Orphan reaping beyond that (a janitor for stale
  `graph/**` branches) stays out of scope.

## Dependencies

Unit 2 is independent of Unit 1; both land in the one PR.

## Reuse

- `id_files_dirty()` / `snapshot()` patterns already in the script — do
  not restructure them.
- The functional harness pattern from PR #2751's verification (bare
  origin + two clones, `gh`/`npx` PATH shims, `GRAPH_COMMIT_*` env
  overrides) — commit it as
  `packages/intentionsutil/scripts/test-graph-commit.sh` in this PR so it
  stops living in job-scratch dirs, and extend it with: a concluded-check-
  failure case (gh shim returns "3 1" — expect immediate die, no retry
  burn) and a gh-hard-failure case (shim exits 1 — expect die with stderr
  surfaced after 3 polls).

## Verification

```verify
bash -n packages/intentionsutil/scripts/graph-commit
```

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```

Manual: none — the harness covers the behavior end-to-end; live
`graph-commit` use continues as the ongoing soak.

## main-qa residue (qa 2026-07-06)

- Unit 1's 'concluded check failure -> immediate die, no retry' path was verified via the PR's own gh-shim harness and via my real-gh green/hard-failure checks, but a genuine CONCLUDED non-success on a real scratch SHA was not exercised against live CI in this pass (would require deliberately landing broken content on a graph/** branch). Per the plan's own Verification section naming live use as the ongoing soak: on the next real graph-commit run where a required check concludes non-success on the scratch SHA, confirm exit 1 with 'a required check concluded non-success ... not retrying' logged, and no retry-burn / no misleading 'main busy' message.
