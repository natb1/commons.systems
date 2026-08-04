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
office_hours:
  reason: "This draft's mechanism choice cannot be finalized independently of an
    unresolved author pacing decision recorded on the serving strategy.
    strategy-promote-progressive-detachment is itself currently parked
    (office_hours since 2026-07-13) on whether/when to enter an outward
    validation tier (strategy-progressive-validation records tiers 2-4 as NOT
    entered as of 2026-07-06), and that park's own reason explicitly names this
    tactic: 'Retained draft tactic-analytics-preinit-vitals is left untouched as
    input for the next round (its mechanism choice, beacon vs accept-and-bound,
    is itself entangled with the deferred signal-scope decision).' Candidate
    mechanism 3 (accept-and-bound) in this tactic's body explicitly proposes
    validating 'the strategy's adoption signal against the post-init segment
    only' — a choice that presupposes the very tier/signal-scope decision the
    strategy has deferred. This is an unrecorded-context park (needed context —
    the tier-entry declaration and the fork/derivative-sensor-sharing and
    user-migration-check definitions — is not yet in the graph); the fix is an
    author /align-strategy or progressive-validation pass, not a guess by this
    session. Recommend: resolve strategy-promote-progressive-detachment's
    office_hours park first (decide whether to enter an outward tier and, if so,
    define the user-migration/no-lock-in check and the fork-reading-sharing
    question), then re-run /align-tactics tactic-analytics-preinit-vitals to
    finalize the mechanism choice among the three recorded candidates."
  since: 2026-08-03
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes:
  bug_fix: true
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
