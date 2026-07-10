---
id: tactic-analytics-preinit-vitals
kind: tactic
statement: "analyticsutil: deliver web-vitals and the first page_view for
  sessions torn down before firebase analytics init resolves (pre-init race)"
owner: ai
status: raw
parent: null
rationale: "qa finding on PR #2835 (2026-07-10), author-ratified rescope of
  tactic-analytics-vitals-delivery: transport_type:'beacon' covers only the
  post-init segment because firebase logEvent awaits initializationPromise
  (dynamic-config fetch + installations fetch) BEFORE the wrapped gtag call
  where transport_type is read — a tab torn down at those awaits loses the event
  regardless of transport. The shortest bounce sessions therefore remain
  censored, which is precisely the segment the vitals channel exists to
  measure."
reading: null
gap: null
serves:
  - strategy-promote-progressive-detachment
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
# analyticsutil: deliver web-vitals and the first page_view for sessions torn down before firebase analytics init resolves (pre-init race)

Draft context from the 2026-07-10 qa round on PR #2835 (finding provenance:
qa summary comment on that PR; SDK evidence: firebase/analytics logEvent$1
awaits initializationPromise at dist/esm/index.esm.js:652-663, set by
_initializeAnalytics awaiting Promise.all([dynamicConfigPromise, fidPromise])
at :829; the wrapped gtagOnEvent awaits further at :229/:268 before gtagCore,
where transport_type is finally read).

Candidate mechanisms for finalization — an /align-tactics round decides:
1. Eager-init prewarm: start analytics init as early as possible in app boot
   so the config fetch races the full session length; shrinks but does not
   close the window (sub-fetch-latency bounces still lost).
2. Direct g/collect beacon fallback: at page-hide with init unresolved, hand
   a minimal GA4 g/collect payload to navigator.sendBeacon (the endpoint
   gtag itself uses; no api_secret needed, unlike Measurement Protocol).
   Closes the window but hand-rolls a protocol Google does not stabilize —
   fragility must be weighed and the payload kept minimal.
3. Accept-and-bound: document the censoring bound (sessions shorter than
   config-fetch latency) and validate the strategy's adoption signal against
   the post-init segment only. Zero code; makes the residual explicit.

Code pointer: TODO(tactic-analytics-preinit-vitals) comments at
packages/analyticsutil/src/index.ts (reportWebVitals and the page_view
closure) mark the exact sites.
