---
id: tactic-review-lows-automation
kind: tactic
statement: "2026-07-05 review lows, live surface only: CI-wrapper false-green
  patterns, hook edge defects, fetch-* error-helper dedup"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-11 /align-tactics round from the retained
  2026-07-05 review-lows draft, scoped to live-surface fixes: CI verification
  wrappers, session hooks, align-init fetch helpers. Of the legacy-gh-router
  findings, only dispatch-select-target and dispatch-route are resolved (their
  scripts are deleted from origin/main); the rest are open and unowned, with no
  intention node tracking them, apart from one already tracked on
  tactic-token-audit-node-attribution. See the dispositions section in the body
  for the per-finding detail."
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
deleted mixed sweep per the placement doctrine). Scoped 2026-07-11 to
live-surface fixes. Of the legacy-gh-router findings, only
`dispatch-select-target` and `dispatch-route` are resolved (their scripts are
deleted from origin/main); the rest are open and unowned — no intention node
tracks them — apart from one already tracked on
`tactic-token-audit-node-attribution`. See the dispositions section below for
the per-finding detail. What remains as this node's planned work: three small
live-surface fixes, one PR.

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

## Dispositions of the findings left out of this node's plan

The 2026-07-11 greenfield-relevance gate cut these 2026-07-05 findings from this
node's plan and filed them as dropped, on the assumption that
`tactic-legacy-router-removal` would delete every script named here. That
assumption was wrong, and this section was corrected on 2026-07-23 by
`tactic-legacy-router-removal` Unit 3. `tactic-legacy-router-removal`'s body
only ever named `dispatch-select-target`, `dispatch-phase`'s derivation logic,
`dispatch-materialize-spawn`, `dispatch-launch-worker`, `dispatch-trace-leaf`,
`dispatch-route`, the office-hours entry surface, and the legacy
`worktree-create.sh` lane — nothing else below was ever in its plan. Only two of
the findings are actually resolved, and the deletions that resolved them came
from a different node.

Each finding sits in exactly one of the three groups below. This section is a
record only: it schedules no work and creates no units.

### Resolved — the code is deleted from origin/main

- `dispatch-select-target:270` (unpaginated main-broken check) and
  `dispatch-route:179,196,211,277-284` (undiagnosed parks). Both scripts are
  confirmed absent from origin/main as of 2026-07-23, deleted via the
  separately-recorded `tactic-dispatch-legacy-rewire` (PR #2869), not via
  `tactic-legacy-router-removal`. No further action needed.

### Open and unowned — no intention node tracks these

The code is confirmed still present on origin/main as of 2026-07-23, and no
node — neither `tactic-legacy-router-removal` nor any other — carries these
findings. They are open and unowned; this record neither claims nor commits to
fixing them.

- `dispatch-reconcile-merged:61` — creation-ordered window.
- `dispatch-find-owning-pr:92` — any-error-as-404.
- `dispatch-attempt-count` — remove-then-add bump.
- `gh_retry:125-151` (in `lib.sh`) — non-idempotent POST retries.
- lib.sh duplication lows — `gh label create` idiom x8, marker-comment upsert
  copies, `dispatch-attempt-count`/`dispatch-qa-fix-attempt` near-clones.
- Dead-script deletions never scheduled by any sweep — `issue-siblings`,
  `wait-for-url.sh`, `check-inbox-age`, `dispatch-reclaim-audit`.

### Tracked on another node

- Token-audit local-time window (`aggregate-usage.sh:168,174,846`) — tracked at
  `tactic-token-audit-node-attribution` Unit 4.

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
