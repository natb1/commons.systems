---
id: tactic-primary-checkout-main-guard
kind: tactic
statement: Prevent the dispatch host's primary checkout from ever leaving the
  main branch — no dispatch/provisioning path switches ~/natb1/commons.systems
  onto a feature branch
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-08 /align-strategy round that recorded the
  primary-checkout-on-main invariant as a condition + clarifications on
  strategy-autonomous-execution. The author chose prevent-at-source over
  detect-and-alert: fix why the primary checkout ends up on a feature branch
  rather than monitor for the symptom. Known drift mechanism (from the
  failed-cd-worktree-drops-into-main-checkout precedent): `git worktree add
  <branch>` fails because the branch is already checked out in a leftover
  worktree, a chained `cd` into the intended worktree then also fails, and the
  next `git switch`/`git merge` runs in the primary checkout — moving it off
  main. The guard is to make provisioning chain-safe (chain `add && cd`, or use
  `git -C`, and fail loudly rather than silently continuing in the primary
  checkout) so the primary checkout is never switched off main. Finalized
  2026-07-11 /align-tactics round into a lib.sh assertion wired into the
  unattended main-sync path plus a chain-safety audit of every
  worktree-provisioning script."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 80
  override: null
  rationale: "Author-directed 2026-07-21: boost to top ranking. This is the
    root-cause fix for the 2026-07-21 incident on
    tactic-graph-native-dispatch-fold / PR #2925, where the tactic's 6 Unit
    commits were pushed straight to origin/main with no PR (bypassing CI/review)
    — the failed-cd-worktree-drops-into-main-checkout drift: an /implement
    session tried to provision the fold worktree, `git worktree add` failed
    (branch already checked out in a leftover worktree), the chained `cd`
    failed, so the session silently continued in the primary checkout (on main)
    and commit-merge-push pushed to main. This tactic's fail-loudly-on-drift
    guard prevents exactly that. Sized at 80 — above the live discretionary
    composed max (75.33, tactic-park-node-fresh-main-clobber-fix, the sibling
    main-clobber fix) so this childless tactic serving
    strategy-autonomous-execution (inherited base 0) becomes the top
    discretionary dispatch target — and kept below the strategy-main-health
    ceiling (100, author-override-guarded), which it must not displace."
phase: review
execution:
  branch: tactic-primary-checkout-main-guard
  pr: 2929
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint:
    strategy-autonomous-execution:
      hash: dd3961ce32c3f94852763ecd1212f9799714b6002b418e430bf2c9477437c9de
      sha: 70a48530c0c61b972f57db69f283ddb0e6554612
  fix:
    since: 2026-07-22
    attempt: 1
    pushed_sha: 38d9d716571200b28975059d375cc6204a838787
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Prevent the dispatch host's primary checkout from ever leaving the main branch

## Context

The primary checkout `~/natb1/commons.systems` must stay on `main` (recorded
as a condition + two clarifications on `strategy-autonomous-execution`). Two
unattended paths break when it drifts onto a feature branch:

- **Main-sync** — `dispatch-select-tick` runs `git merge --ff-only
  origin/main` on the main worktree
  (`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:321`); it
  can only fast-forward a checkout that is on `main`.
- **Worktree provisioning** — the worktree-create hook resolves the project
  root from a worktree with `main` checked out; a non-main primary checkout
  fails with "no worktree with 'main' checked out".

Known drift mechanism: `git worktree add <branch>` fails (branch already
checked out in a leftover worktree), a chained `cd` into the intended
worktree then also fails, and the next `git switch`/`git merge` runs in the
*primary* checkout — moving it off `main`. The author chose
prevent-at-source over detect-and-alert. Worktrees are exempt (they
legitimately check out feature branches); currency is out of scope (a stale
`main` is normal — a separate freshness requirement governs pre-task sync).

## Unit 1 — lib.sh assertion + main-sync wiring + chain-safety audit

**Recommended model:** opus

Scope:
- New `assert_primary_checkout_on_main <path>` helper in
  `.claude/skills/dispatch-propagate/scripts/lib.sh`: `git -C <path>
  symbolic-ref --short HEAD` must equal `main`; on violation print a loud
  message naming the invariant (condition on `strategy-autonomous-execution`)
  and the repair (`git -C <path> switch main`), and return non-zero — never
  auto-switch (tree-updating ops on the primary checkout are the caller's
  deliberate act).
- Wire the assertion into `dispatch-select-tick` immediately before the
  ff-only merge (`dispatch-select-tick:321`), failing into the existing
  `sync-failed` repair path (documented at `dispatch-select-tick:22`).
- Chain-safety audit of every provisioning-path `git worktree add` call
  site — `dispatch-materialize-spawn:449,481,490`,
  `dispatch-provision-from-remote:84`, `provision-node-worktree:108-115` —
  confirming each failure path exits loudly without leaving the caller
  cwd'd (or later git ops running) in the primary checkout; fix any bare
  `worktree add <X> && cd <X>` pattern to `git -C` or a guarded `cd`.
- Out of scope: `.claude/hooks/*` and SKILL.md prose (agent-behavior config —
  auto-mode commit friction); if the audit finds a hook-side gap, record it
  as a new draft tactic serving `strategy-autonomous-execution` instead of
  editing hooks here.

## Unit 2 — tests

**Recommended model:** sonnet

Dependencies: Unit 1.

Scope:
- Test script covering the assertion helper: passes on a `main` checkout,
  fails with the repair message on a feature-branch checkout (throwaway repo
  fixture in `$TMPDIR`, house test-script pattern of
  `packages/intentionsutil/scripts/test-graph-commit.sh`; validate under
  `bash -c`, not zsh).

## Reuse

- `lib.sh` error/logging conventions; `git -C` (auto-approved by the
  PreToolUse hook for worktree paths).

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-primary-checkout-guard.sh
```

Manual: in a scratch clone, check out a feature branch and run the wired
`dispatch-select-tick` sync step — it must refuse before merging, naming the
invariant and repair; on `main` it proceeds.

## Implementation notes

Two units, one PR; implement each unit in a subagent with its Recommended
model; supply this Context and the unit's Scope; constrain each subagent to
working-tree edits only.
