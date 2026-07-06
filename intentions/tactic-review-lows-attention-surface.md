---
id: tactic-review-lows-attention-surface
kind: tactic
statement: "2026-07-05 review lows: office-hours surface + project-signals
  pipeline (retained draft context)"
owner: ai
status: raw
parent: null
rationale: Retained draft context, not selectable work. Split 2026-07-06 out of
  the deleted mixed sweep tactic-review-low-severity-sweep per the placement
  doctrine (strategy-graph-native-dispatch), so this strategy's /align-tactics
  rounds find their own residue. Findings are from the 2026-07-05 code review,
  each verified with an anchor.
reading: null
gap: null
serves:
  - strategy-attention-surface
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
# 2026-07-05 review lows: office-hours surface + project-signals pipeline (retained draft context)

## Context

Retained draft context, not selectable work. Split 2026-07-06 out of the
deleted mixed sweep `tactic-review-low-severity-sweep` per the placement
doctrine on `strategy-graph-native-dispatch`. Each line is a confirmed
finding from the 2026-07-05 review with an anchor. A later `/align-tactics`
round on `strategy-attention-surface` finalizes, splits, merges, or prunes.

## office-hours app

- `QueueMetricsPanel.tsx:35-37`: unrounded runway ("23.36... days").
- `local-snapshot-source.ts:148-152`: stamps the staleness watermark
  before decode (a transient decode failure marks the version "seen").
- `Dashboard.tsx:357-361`: demo banner references removed auth.
- five vanilla DOM renderers (`queue-band.ts` etc.) referenced only by tests.

## project-signals pipeline (functions)

- `functions/src/project-signals.ts:328-329`: PSI fan-out is all-or-nothing
  (`Promise.all`) - one 429 drops PSI for all apps; combined with the
  full-overwrite snapshot (`project-signals-core.ts:535`) erases
  last-known-good on a transient upstream blip. Use `allSettled` + merge.
- `firestore.rules:520-527`: signal-samples demo tier can `get` but not
  `list` (the promised public time-series is unusable); no rules-test.
- `functions/src/dispatch-queue-metrics-core.ts` / `office-hours-sync-core.ts`:
  orphaned after the #2763 decommission with stale header contracts,
  consumed cross-package via relative imports. (Note: relocation overlaps the
  in-flight `tactic-attention-surface-analytics-collector`.)
