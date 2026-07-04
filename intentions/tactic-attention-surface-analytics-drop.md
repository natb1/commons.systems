---
id: tactic-attention-surface-analytics-drop
kind: tactic
statement: "author: establish the analytics export drop — GA4/Search
  Console/PageSpeed exports land on the network share"
owner: ai
status: codified
parent: null
rationale: "Born-parked author task (≤30 minutes): the analytics adapter reads
  export files per delegation-web-analytics, but only the author can export them
  from the Google properties and choose the share path. Built against fixtures
  until the drop exists."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  phase: implement
  blocked_by: []
  office_hours:
    reason: "author-only: export GA4/GSC/PSI data from the Google properties to the
      agreed network-share path; ≤30 author-minutes"
    since: 2026-07-03
---
# author: establish the analytics export drop — GA4/Search Console/PageSpeed exports land on the network share

## Context

Born-parked author task (≤30 minutes). The analytics adapter
(`tactic-attention-surface-signal-types` unit 4) reads export files from
the network share, but only the author can export from the Google
properties. The attachment and its capture posture (engagement-metric
framing, moderate divergence) are recorded in
`intentions/delegation-web-analytics.md`.

## Author steps

1. Choose a directory on the existing network share (the budget drop's
   share is the natural neighbor) for analytics exports.
2. Export from GA4 (engagement/acquisition), Search Console
   (performance), and PageSpeed Insights for the tracked
   commons.systems properties; drop the files with stable names.
3. Record the chosen path and filename convention in
   `intentions/delegation-web-analytics.md` (review notes) so the
   adapter and future exports agree.

Refresh cadence is the author's choice; the surface shows export
freshness and complains loudly when the drop goes stale.

## Verification

Prose: the adapter's fixtures are swapped for the real files and the
marketing signals render real readings on the status page.
