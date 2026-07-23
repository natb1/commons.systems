---
id: tactic-main-post-merge-validation
kind: tactic
statement: decide whether origin/main gets its own validating build, since the
  merge-gating suite never runs on main
owner: human
status: delegated
parent: null
rationale: "Retained from the 2026-07-23 /align-strategy round on the wezterm
  pin. unit-tests.yml's fifteen jobs carry branches-ignore [main, graph/**], so
  the trunk's merge-gating suite is validated pre-merge on the branch push and
  never post-merge on main. That is coherent for commit-caused breakage but
  blind to breakage whose cause is OUTSIDE the repo and arrives with no commit —
  the wezterm asset repackage being the worked example. Open question,
  deliberately undecided: whether to add a scheduled or post-merge main build,
  which costs real CI time (a nix build runs roughly 22 minutes) and trades
  against strategy-token-economy. Owner human because the cost/benefit call is
  the author's, not a mechanical fix."
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Decide whether origin/main should get its own validating build, and on
    what trigger. Not claude-decidable — it is a cost/benefit call the author
    owns (strategy-main-health's 2026-07-23 clarifications). Context measured
    2026-07-23: nixos-build (the relevant job) runs ~22 minutes; origin/main
    took 186 commits in the preceding 24h (723 in 7 days) via the dispatch
    fleet's graph-commit fast-forwards, so a build gated on every push to main
    is not viable — see Recommend below."
  since: 2026-07-23
  recommendation: "Given the push volume (~100+/day, mostly automated graph-commit
    fast-forwards), do not trigger the build on every push to main — that is
    roughly 68 hours of CI time per day at current volume. The known failure
    mode this tactic exists for (an upstream asset repackage breaking
    nixos-build with no accompanying commit) is a time-based drift, not a
    commit-triggered one, so a `schedule:` cron trigger (e.g. daily) is the
    natural fit and sidesteps the volume problem entirely — cost is then fixed
    regardless of push rate. A `paths:`-filtered post-merge trigger (only
    nix-touching pushes to main) is a fallback if commit-caused nix breakage on
    main specifically (not just branches) is also a concern, but it would still
    fire dozens of times/day if nix files are touched by the fleet — measure
    that before choosing it. Recommend: add a daily `schedule:` cron workflow
    running the existing nixos-build steps against main HEAD, wired into the
    main-health signal (or a dedicated sibling signal) on failure."
pace_exempt: false
rounds: null
attributes: {}
---
# decide whether origin/main gets its own validating build, since the merge-gating suite never runs on main

Born-parked human gate. Retained from the 2026-07-23 `/align-strategy` round on
`strategy-main-health` (wezterm-pin clarification), finalized here at
`/align-tactics` after confirming this is a cost/benefit call, not a mechanical
fix — see `office_hours.reason`/`recommendation` for the specifics.

## What to decide

Whether to add a post-merge or scheduled build of the trunk that runs
`unit-tests.yml`'s merge-gating suite (or a relevant subset — likely just
`nixos-build`) against `origin/main` itself, since that suite currently only
runs pre-merge on branch pushes (`branches-ignore: [main, 'graph/**']`) and
never observes main directly. Without it, breakage whose cause is external to
the repo (an upstream package repackage, e.g. the wezterm pin incident) stays
invisible until an unrelated PR happens to touch the same surface.

## Context to weigh

- Cost: a nix build (`nixos-build`) runs ~22 minutes.
- Volume: `origin/main` received 186 commits in the 24 hours before this was
  written (723 in the preceding 7 days), almost all automated
  `graph-commit` fast-forwards from the dispatch fleet — see
  `office_hours.recommendation` for why this rules out a naive per-push
  trigger and points toward a `schedule:` cron instead.
- This trades against `strategy-token-economy` (CI minutes are not free).

## If approved

A follow-up claude-eligible tactic should be minted (serving
`strategy-main-health`) to implement whichever trigger shape is chosen, wired
so a failure feeds the `main-health` signal (or a dedicated sibling signal) —
not something this parked node itself plans, since the shape depends on the
decision.
