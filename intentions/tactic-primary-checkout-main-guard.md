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
phase: qa
execution:
  branch: tactic-primary-checkout-main-guard
  pr: 2929
  attempts: {}
  markers:
    - planned
  strategy_fingerprint:
    strategy-autonomous-execution:
      hash: dd3961ce32c3f94852763ecd1212f9799714b6002b418e430bf2c9477437c9de
      sha: 70a48530c0c61b972f57db69f283ddb0e6554612
  fix: null
validates: []
blocked_by: []
office_hours:
  reason: '/qa-fix: PR #2929 (tactic-primary-checkout-main-guard) at qa-fix
    attempt cap (2/2). Disposition workflow classified the sole open residue
    item (chain-safety-audit scope question) as opus-fixable, refuting the
    "needs human" framing, but plan_fix was false at the cap so no fix plan ran
    (fix_plan=null). Escalating to office-hours per the cap-reached rule; no new
    attempt label applied. See PR #2929 comment and recommendation for details.'
  since: 2026-07-22
  recommendation: >-
    # Office-hours recommendation: tactic-primary-checkout-main-guard (PR #2929)


    ## What this is


    A cap-reached park, not a stuck or ambiguous bug. PR #2929 passed 3 of 4
    qa-fix

    plan items by machine check (isolated guard test 5/5, full dispatch-scripts
    suite

    3002/3002, both guard-pass/guard-halt wiring cases present and asserted).
    The only

    open item is a scope-completeness check on the tactic's Unit 1 "chain-safety
    audit"

    criterion — and that check has already been answered. It is parking only
    because

    the PR is at the qa-fix attempt cap (2 of 2), so the Opus fix phase
    deliberately

    did not run this pass. There is no irreducible ambiguity here.


    ## Default recommendation: record the finding and close it out


    The audit is effectively already done. Both live provisioning call sites
    already

    satisfy the chain-safety pattern the audit was meant to enforce:


    - `dispatch-provision-from-remote:84` wraps its `git worktree add` in an
      `if ! ...; then echo err; exit 2; fi` — loud failure, no bare chained `cd`.
    - `provision-node-worktree:108-115` uses `git -C "$PROJECT_ROOT"` / `git -C
    "$WT"`
      throughout, with explicit post-add existence checks and named error exits.

    The third named target, `dispatch-materialize-spawn` (`:449,481,490`), no
    longer

    exists — it was deleted in `a8c4898d` (PR #2869, an unrelated legacy
    rewire), so

    those references in the tactic scope are stale. An independent disposition
    pass

    re-verified all of this from the live repo (grep + read, not trusting the QA

    claims) and its skeptic panel voted 2/2 that this needs no human judgment.


    So: paste the paragraph above (or a condensed form) into the tactic body of

    `tactic-primary-checkout-main-guard` and/or a PR #2929 comment, treat the

    chain-safety-audit acceptance criterion as satisfied, and let the tactic
    proceed.

    No code change is needed — nothing is broken, and there is nothing left to
    fix.


    ## If you want a discrete audit artifact instead


    If you'd rather have a written audit as its own deliverable (not just this

    investigation trail), two options: author it directly — it's a one-paragraph

    addition, faster than another automated pass — or reset/raise the qa-fix
    attempt

    cap and let a future pass write it. Either way the technical conclusion is
    the

    same; this is a bookkeeping choice about where the audit is recorded, not an
    open

    question about the code.
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
