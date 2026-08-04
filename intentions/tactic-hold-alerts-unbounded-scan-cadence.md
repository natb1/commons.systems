---
id: tactic-hold-alerts-unbounded-scan-cadence
kind: tactic
statement: list-unclaimed-hold-alerts.ts's full-graph resolveAttention scan runs
  on dispatch-fleet-watch's 5-minute timer cadence even though the predicate's
  own threshold is a 24-hour age bound, adding ~288 redundant full-store
  scans/day that grow with the graph
owner: ai
status: raw
parent: null
rationale: "Deferred cost finding from the /review-fix pass on PR #3036
  (tactic-unclaimed-hold-alerting), source lens \"cost\", ADVISORY — not
  adversarially verified (cost findings route straight to Deferred per
  review-fix's disposition table). Location:
  packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts:104.
  listNodesStrict(dir) reads and parses every file in intentions/ (491 nodes /
  6.1 MB at filing time), then resolveAttention (attention.ts:312) runs a
  monotone fixpoint over all nodes plus a per-node parent-cycle walk, plus a
  second full pass to build the top-K pool (hold-alerts.ts:119-124).
  dispatch-fleet-watch:606 invokes this on OnUnitActiveSec=5min while the
  predicate's own threshold is 24h (HOLD_MIN_AGE=86400) - about 288x more
  sampling than the signal needs. Measured ~0.5s CPU per pass at 491 nodes at
  filing time; cost grows linearly in node count (superlinearly for the
  fixpoint). Recommended fix (from the finder, not verified): decouple predicate
  5's cadence from the watchdog's — run on every Nth pass via a persisted
  last-run stamp in the existing state file, or give it its own hourly timer;
  additionally prefilter before the full resolve rather than recomputing
  attention in a second process. Source PR: #3036."
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
# list-unclaimed-hold-alerts.ts's full-graph resolveAttention scan runs on dispatch-fleet-watch's 5-minute timer cadence even though the predicate's own threshold is a 24-hour age bound, adding ~288 redundant full-store scans/day that grow with the graph

## Provenance

Deferred **cost** finding (ADVISORY, not adversarially verified — cost findings
route straight to Deferred per `/review-fix`'s disposition table) from the
`/review-fix` pass on `tactic-unclaimed-hold-alerting`, source PR #3036.

- **Location:** `packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts:104`
- **Failure scenario:** `listNodesStrict(dir)` reads and parses every file in
  `intentions/` (491 nodes / 6.1 MB at filing time), then `resolveAttention`
  (`attention.ts:312`) runs a monotone fixpoint over all nodes plus a per-node
  parent-cycle walk, plus a second full pass to build the top-K pool
  (`hold-alerts.ts:119-124`). `dispatch-fleet-watch:606` invokes this on
  `OnUnitActiveSec=5min` while the predicate's own threshold is 24h
  (`HOLD_MIN_AGE=86400`) — about 288x more sampling than the signal needs.
  Measured ~0.5s CPU per pass at 491 nodes at filing time; cost grows linearly
  in node count (superlinearly for the fixpoint).
- **Adversarial verdict:** none — cost findings are advisory by design and were
  not routed through the verify/skeptic stage.
- **Recommended fix (from the finder, unverified):** decouple predicate 5's
  cadence from the watchdog's — run on every Nth pass via a persisted last-run
  stamp in the existing state file, or give it its own hourly timer;
  additionally prefilter before the full resolve rather than recomputing
  attention in a second process.
