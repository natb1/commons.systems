---
id: tactic-ci-change-detection-transitive
kind: tactic
statement: "CI change-detection: propagate internal-package deps transitively
  and stop the vitest.config.ts / go.work blind spots"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. The dirty-app map only propagates
  package deps one level, so a ds-only change never tests or redeploys
  fellspiral (which gets ds transitively via blog), shipping stale untested code
  to prod. Serves strategy-autonomous-execution: the autonomous chain's
  test/deploy gating is only trustworthy if change detection is complete. This
  is CI-propagation code, not legacy-router code, so it survives the router
  migration."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-ci-change-detection-transitive
  pr: 2837
  attempts: {}
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
# CI change-detection: transitive dep propagation + root-file blind spots

## Context

The dispatch/CI change-detection layer decides which apps get tested and
prod-deployed on a given diff. Two blind spots let real changes ship
untested. Verified in the 2026-07-05 review: fellspiral imports
`@commons-systems/blog`, blog imports `@commons-systems/ds`, but
`fellspiral/package.json` never declares `ds`.

## Unit 1 — transitive internal-dep propagation

**Recommended model:** opus

Scope:
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1930,1966-1969`:
  `shared_pkgs` maps each package to its *direct* declarers only, so a
  ds-only change tests/deploys every app except fellspiral (and office-hours
  via local-first -> idbutil), leaving stale design-system code in prod
  untested until an unrelated change redeploys it. Compute the transitive
  closure of internal-package dependents.
- Add a fixture test: a change to a leaf package marks every transitive
  dependent app dirty.

## Unit 2 — root-file blind spots

**Recommended model:** sonnet

Scope:
- `lib.sh:1946`: the mark-all-dirty root-file list omits `vitest.config.ts`
  (a PR editing only it resolves zero dirty apps -> run-unit-tests exits 0,
  a broken test config merges green). Add it.
- `.claude/skills/dispatch-propagate/scripts/detect-changes.sh:49-53`:
  `go=true` fires only for files under module dirs; root `go.work` matches
  neither prefix, so a go.work change skips go-tests. Add a `go.work` arm.

## Verification

- Unit fixtures for the closure and each root file; confirm a ds-only diff
  now includes fellspiral in the dirty set, and a vitest.config.ts / go.work
  diff triggers the right suites.
