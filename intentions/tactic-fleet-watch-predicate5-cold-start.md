---
id: tactic-fleet-watch-predicate5-cold-start
kind: tactic
statement: dispatch-fleet-watch's predicate 5 spawns a fresh node --import
  tsx/esm process to transpile list-unclaimed-hold-alerts.ts and its import
  graph on every 5-minute watcher pass, purely to evaluate a 24-hour-threshold
  predicate
owner: ai
status: raw
parent: null
rationale: "Deferred cost finding from the /review-fix pass on PR #3036
  (tactic-unclaimed-hold-alerting), source lens \"cost\", ADVISORY — not
  adversarially verified (cost findings route straight to Deferred per
  review-fix's disposition table). Location:
  .claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:606. The
  default (non-seam) path spawns node --import tsx/esm and transpiles
  list-unclaimed-hold-alerts.ts plus its intentionsutil import graph (store.ts,
  attention.ts, hold-sweep.ts, schema.ts) from TypeScript on every watcher pass
  — about 288 cold interpreter startups plus transpiles per day, purely to
  evaluate a predicate whose threshold is 24 hours. This overhead sits in the
  same call as the companion full-store-scan finding
  (tactic-hold-alerts-unbounded-scan-cadence), so the two amplify together.
  Recommended fix (from the finder, not verified): reduce predicate 5's cadence
  (see the companion finding), or run the enumerator from prebuilt JS / a warm
  tsx cache directory so each pass skips the transpile; if cadence is reduced
  this cost falls out proportionally. Source PR: #3036."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# dispatch-fleet-watch's predicate 5 spawns a fresh node --import tsx/esm process to transpile list-unclaimed-hold-alerts.ts and its import graph on every 5-minute watcher pass, purely to evaluate a 24-hour-threshold predicate

## Provenance

Deferred **cost** finding (ADVISORY, not adversarially verified — cost findings
route straight to Deferred per `/review-fix`'s disposition table) from the
`/review-fix` pass on `tactic-unclaimed-hold-alerting`, source PR #3036.

- **Location:** `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:606`
- **Failure scenario:** the default (non-seam) path spawns
  `node --import tsx/esm` and transpiles `list-unclaimed-hold-alerts.ts` plus
  its intentionsutil import graph (`store.ts`, `attention.ts`, `hold-sweep.ts`,
  `schema.ts`) from TypeScript on every watcher pass — about 288 cold
  interpreter startups plus transpiles per day, purely to evaluate a predicate
  whose threshold is 24 hours. This overhead sits in the same call as the
  companion full-store-scan finding
  ([[tactic-hold-alerts-unbounded-scan-cadence]]), so the two amplify together.
- **Adversarial verdict:** none — cost findings are advisory by design and were
  not routed through the verify/skeptic stage.
- **Recommended fix (from the finder, unverified):** reduce predicate 5's
  cadence (see the companion finding), or run the enumerator from prebuilt JS
  / a warm tsx cache directory so each pass skips the transpile; if cadence is
  reduced this cost falls out proportionally.
