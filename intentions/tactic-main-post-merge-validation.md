---
id: tactic-main-post-merge-validation
kind: tactic
statement: validate origin/main via a paths-filtered post-merge nixos-build
  fired only on nix-touching pushes, and investigate speeding up the ~22-minute
  nixos-build job
owner: ai
status: raw
parent: null
rationale: "Born 2026-07-23 as a human decision gate on strategy-main-health
  (wezterm-pin /align-strategy round): unit-tests.yml carries branches-ignore
  [main, graph/**], so the merge-gating suite validates pre-merge on branch
  pushes and never observes origin/main directly — external, commit-less
  breakage (the wezterm asset repackage) stays invisible until an unrelated PR
  touches the same surface. The author decided 2026-07-23 to add a
  paths-filtered post-merge nixos-build on main (fired only when nix-touching
  paths change, feeding main-health on failure) and to investigate speeding up
  the ~22-minute job. Now ordinary claude-eligible CI-config + investigation
  work: owner flipped human->ai, status raw for /align-tactics decomposition,
  office_hours cleared."
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# validate origin/main via a paths-filtered post-merge nixos-build, and investigate speeding up that job

Draft for `/align-tactics` to decompose and finalize into PR-sized units. Born
as a human decision gate (2026-07-23 `/align-strategy` round on
`strategy-main-health`, wezterm-pin clarification); the author's decision is now
recorded below, so this is ordinary claude-eligible CI-config + investigation
work — no longer a cost/benefit call the author owns.

## Author decision (2026-07-23)

The problem: `unit-tests.yml`'s fifteen jobs carry
`branches-ignore: [main, 'graph/**']`, so the merge-gating suite runs pre-merge
on branch pushes and never observes `origin/main` directly. Breakage whose cause
is external to the repo and arrives with no commit (the wezterm asset repackage
being the worked example) stays invisible until an unrelated PR happens to touch
the same surface.

The author chose a **paths-filtered post-merge** trigger over the alternative
`schedule:` cron the park's recommendation floated:

- Fire the existing `nixos-build` steps on pushes to `main` **only when
  nix-touching paths change**. This catches commit-caused nix breakage on main
  (which a branch-only pre-merge run cannot, since the merge commit itself is
  never rebuilt) without firing on every one of the ~100+ daily
  `graph-commit` fast-forwards — the path filter gates it to the small subset
  of pushes that touch nix.
- On failure, feed the main-health signal (or a dedicated sibling signal), the
  same way a red main is surfaced today.

## Scope (units for `/align-tactics` to finalize)

- **Unit A — paths-filtered post-merge nixos-build on main.** Add a workflow (or
  a `push: { branches: [main], paths: [<nix globs>] }` trigger) that runs the
  existing `nixos-build` job steps against `main` HEAD when nix-touching paths
  change. The current job lives in `.github/workflows/unit-tests.yml`
  (`nixos-build:`, which invokes `.github/scripts/build-nixos-config.sh` gated on
  `steps.changes.outputs.nix == 'true'` via
  `.claude/skills/dispatch-propagate/scripts/detect-changes.sh`) and is excluded
  from main today by the workflow-level `branches-ignore: [main, 'graph/**']`.
  Reuse those existing steps/scripts rather than re-authoring the build. Wire a
  failure into the main-health signal (or a dedicated sibling), consistent with
  how `dispatch-diagnose-main` records a red main today.
- **Unit B — nixos-build speedup investigation.** Investigate whether the
  ~22-minute `nixos-build` job can be sped up (e.g. cache hit-rate against the
  `claude-code.cachix.org` substituter already configured on the job, what the
  build actually rebuilds, warm-cache vs cold-cache timings). Report findings
  and, if a cheap win exists, land it. This directly trades against
  `strategy-token-economy` (CI minutes are not free) and lowers the cost of
  Unit A's recurring runs.

## Context to weigh

- Cost: `nixos-build` runs ~22 minutes; it has no warm-cache CI baseline yet
  (the step has executed 0 times — every run so far skipped it), so Unit B's
  first job is to establish real timings.
- Volume: `origin/main` received 186 commits in the 24 hours before this was
  written (723 in 7 days), almost all automated `graph-commit` fast-forwards;
  the path filter is what keeps the post-merge trigger from firing on all of
  them.
