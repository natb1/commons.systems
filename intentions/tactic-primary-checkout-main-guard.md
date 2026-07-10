---
id: tactic-primary-checkout-main-guard
kind: tactic
statement: Prevent the dispatch host's primary checkout from ever leaving the
  main branch — no dispatch/provisioning path switches ~/natb1/commons.systems
  onto a feature branch
owner: ai
status: raw
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
  checkout) so the primary checkout is never switched off main. /align-tactics
  will decide the concrete PR-sized shape."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
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
# Prevent the dispatch host's primary checkout from ever leaving the main branch — no dispatch/provisioning path switches ~/natb1/commons.systems onto a feature branch

Draft (retained from the 2026-07-08 `/align-strategy` round). Not yet
decomposed — `/align-tactics` picks the concrete PR-sized shape.

## Why this matters

The primary checkout `~/natb1/commons.systems` must stay on `main` (recorded
as a condition + clarifications on `strategy-autonomous-execution`). Two
unattended paths break when it drifts onto a feature branch:

- **Main-sync** — `dispatch-select-tick` runs `git merge --ff-only
  origin/main` on the main worktree (`.claude/rules/sandbox.md`); it can only
  fast-forward a checkout that is on `main`.
- **Worktree provisioning** — the worktree-create hook resolves the project
  root from a worktree with `main` checked out. A non-main primary checkout
  fails with `no worktree with 'main' checked out; cannot resolve the project
  root` (bit a prior `/align-strategy` session; see the
  `enterworktree-name-fails-no-main-worktree` recurrence).

## Chosen approach: prevent at source

The author chose prevention over detect-and-alert: fix *why* the primary
checkout ends up on a feature branch rather than monitor for the symptom.

Known drift mechanism (precedent
`failed-cd-worktree-drops-into-main-checkout`): `git worktree add <branch>`
fails because the branch is already checked out in a leftover worktree; a
chained `cd` into the intended worktree then also fails; the next `git switch`
/ `git merge` runs in the *primary* checkout and moves it off `main`.

Guard direction: make every provisioning path chain-safe — chain `add && cd`
(or use `git -C <path>`), and fail loudly rather than silently continuing in
the primary checkout — so no dispatch path ever switches the primary checkout
off `main`.

## Scope note

Worktrees are exempt (they legitimately check out feature branches); the
invariant is the primary checkout alone. Currency is out of scope — a stale
`main` is normal and a separate freshness requirement governs pre-task sync.
