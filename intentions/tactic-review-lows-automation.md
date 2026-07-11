---
id: tactic-review-lows-automation
kind: tactic
statement: "2026-07-05 review lows, live surface only: CI-wrapper false-green
  patterns, hook edge defects, fetch-* error-helper dedup"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-11 /align-tactics round from the retained
  2026-07-05 review-lows draft, narrowed by the greenfield-relevance gate:
  GitHub issues are disabled (the gh queue drained and retired), so every
  legacy-gh-router finding is dropped as superseded by
  tactic-legacy-router-removal — only live-surface fixes remain (CI verification
  wrappers, session hooks, align-init fetch helpers). Dropped units are recorded
  in the body with their superseding node."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-review-lows-automation
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: f51f76ac14405b0ccbb0e47f33e0fae1e341c60a45ec9ae6b329170b7227ae05
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# 2026-07-05 review lows, live surface only

## Context

Live-surface residue of the 2026-07-05 code review lows (draft split from the
deleted mixed sweep per the placement doctrine). Narrowed 2026-07-11 by the
greenfield-relevance gate: GitHub issues are disabled — the gh dispatch queue
drained and retired — so every legacy-gh-router finding is dropped as
superseded by `tactic-legacy-router-removal` (see Dropped units). What
remains: three small live-surface fixes, one PR.

## Unit 1 — CI wrapper false-green patterns

**Recommended model:** sonnet

Scope:
- `.claude/skills/dispatch-propagate/scripts/run-lint.sh:56-59`: the
  `< <("$SCRIPTS/get-changed-apps.sh")` process substitution swallows a
  non-zero exit from the detector — a failing `get-changed-apps.sh` yields an
  empty dirty set and lint false-greens the workspace. Capture the output
  first (`if ! OUT=$(...); then fail; fi`) and iterate the captured value.
- `.claude/skills/dispatch-propagate/scripts/run-typecheck.sh:~105-130` (the
  origin/main baseline block): review the
  `(cd "$REPO_ROOT" && npx tsc ...) || baseline_ok=false` +
  checkout/reset/clean sequence for paths where a *git* failure (as opposed
  to a tsc failure) under `set -e` with `||` suppression leaves a false
  baseline or a dirty tree; make git failures explicit and fatal while
  keeping the intentional tsc-failure tolerance.

## Unit 2 — hook edge defects

**Recommended model:** sonnet

Scope:
- `.claude/hooks/statusline.sh:~28-30`: `pct=$((current * 100 / ctx_size))`
  divides by zero when `context_window_size` is `0`/`null` — guard and fall
  back to the no-usage output branch. Keep the hooks' deliberate fail-open
  posture (a broken statusline must never wedge the session).
- `.claude/hooks/worktree-remove.sh:~58-66`: `CANON` is realpath-resolved but
  `WORKTREES_ROOT` is not — a symlinked worktrees root makes the containment
  `case` and the `!= "$WORKTREES_ROOT/main"` guard compare a resolved path
  against an unresolved one and misfire. Resolve both sides before comparing.
- Note: hook files are agent-behavior config — an auto-mode dispatch worker
  may need a human grant at commit time; if the commit is denied, park
  rather than dropping the unit.

## Unit 3 — api_error_reason dedup

**Recommended model:** sonnet

Scope:
- `api_error_reason` is duplicated in
  `.claude/skills/align-init/scripts/fetch-psi.sh:74` and
  `.claude/skills/align-init/scripts/fetch-analytics.sh:109`. Reconcile any
  drift between the two copies, extract one helper into a sourceable lib
  file under `.claude/skills/align-init/scripts/`, and source it from both.

## Dropped units (greenfield-relevance gate, 2026-07-11)

- All legacy dispatch-script findings (`dispatch-reconcile-merged:61`
  creation-ordered window, `dispatch-select-target:270` unpaginated
  main-broken check, `dispatch-find-owning-pr:92` any-error-as-404,
  `dispatch-route:179,196,211,277-284` undiagnosed parks,
  `dispatch-attempt-count` remove-then-add bump, `gh_retry:125-151`
  non-idempotent POST retries) — superseded by `tactic-legacy-router-removal`
  (issues disabled; the surface is scheduled for deletion).
- lib.sh duplication lows (`gh label create` idiom x8, marker-comment upsert
  copies, `dispatch-attempt-count`/`dispatch-qa-fix-attempt` near-clones) —
  same supersession.
- Dead-script deletions (`issue-siblings`, `wait-for-url.sh`,
  `check-inbox-age`, `dispatch-reclaim-audit`) — deferred to the same
  removal tactic's deletion sweep.
- Token-audit local-time window (`aggregate-usage.sh:168,174,846`) — already
  tracked at `tactic-token-audit-node-attribution` Unit 4.

## Reuse

- `get-changed-apps.sh` contract (exit codes / one-app-per-line stdout);
  the lifecycle hooks' fail-open convention recorded on
  `strategy-autonomous-execution`.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Prose: shim `get-changed-apps.sh` to exit 1 (PATH override in a scratch run)
and confirm `run-lint.sh` now fails loudly instead of passing with zero apps;
feed `statusline.sh` a status JSON with `context_window_size: 0` on stdin and
confirm it prints the fallback line instead of crashing; run
`worktree-remove.sh` dry against a symlinked worktrees root fixture and
confirm containment still matches.

## Implementation notes

Three units, one PR; implement each unit in a subagent with its Recommended
model; supply this Context and the unit's Scope; constrain each subagent to
working-tree edits only.
