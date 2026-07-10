---
id: tactic-analytics-vitals-delivery
kind: tactic
statement: "analyticsutil: deliver web-vitals on short/bounce sessions
  (beacon/flush) and remove the unreachable logEvent try/catch wrappers +
  comment-only traffic-type coupling"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. web-vitals report at page-hide
  but firebase logEvent awaits a dynamic-config fetch, so tabs hidden before it
  resolves lose CLS/INP/LCP and the first page_view - systematically censoring
  the short-session segment vitals exist to measure; the surrounding
  try/catch+logError wrappers are unreachable (the SDK swallows internally), and
  the GA4 traffic-type STORAGE_KEY is duplicated with comment-only coupling.
  Serves strategy-promote-progressive-detachment: web-vitals ride the GA4 export
  channel (delegation-web-analytics) that senses its adoption/quality signals -
  strategy-attention-surface only renders signals it does not own. Re-pointed
  2026-07-06 per the placement doctrine."
reading: null
gap: null
serves:
  - strategy-promote-progressive-detachment
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Implementation complete on draft PR #2835 (beacon-transport web-vitals
    + removal of the unreachable logEvent try/catch wrappers per Unit 2a). All
    checks pass locally (21 analyticsutil + 39 config tests, typecheck, lint)
    EXCEPT the blocking test-integrity gate: removing the dead wrappers orphans
    the 4 tests that mocked logEvent to throw (an impossible path), firing
    Signal 2 (4 net test-declaration removals). Their subject -- the
    swallow-and-report branch -- is deliberately deleted, so restoring them
    would contradict the node and the clear-errors rule. The mechanical gate
    cannot distinguish this legitimate dead-code cleanup from weakening; there
    is no self-serve fix (fix-checks would loop on it). Next steps: human
    override-merge of PR #2835 to bypass the test-integrity required check, then
    run /review-fix separately (override-merge skips only pre-merge review),
    then advance the node implement -> qa."
  since: 2026-07-10
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# analyticsutil: reliable web-vitals delivery + remove dead wrappers

## Context

web-vitals (CLS/INP/LCP) report at page-hide, but firebase `logEvent`
internally awaits a dynamic-config fetch, so a tab hidden before that fetch
resolves loses the metrics and the first `page_view` - systematically
censoring the short/bounce sessions vitals exist to measure. The surrounding
try/catch+logError wrappers are unreachable (the SDK swallows internally).
Verified 2026-07-05.

## Unit 1 — beacon/flush delivery on page-hide

**Recommended model:** sonnet

Scope:
- `packages/analyticsutil/src/index.ts:84,101-105`: deliver vitals and the
  first `page_view` via a transport that survives page-hide (sendBeacon /
  GA4 `transport_type: 'beacon'` / a flush), so short sessions are not
  dropped.

## Unit 2 — remove unreachable wrappers; couple the traffic-type key

**Recommended model:** sonnet

Scope:
- `index.ts:83-98,155-165`: remove the try/catch+`logError` wrappers around
  `logEvent`/`setUserProperties` that can never fire (or replace with a real
  failure signal), per the clear-errors rule and to stop tests validating an
  impossible path.
- `index.ts:12` vs `packages/config/playwright-test.ts:3-4`: the
  `analytics_traffic_type` STORAGE_KEY is duplicated with comment-only
  coupling; a rename on either side silently makes CI smoke traffic count as
  organic. Share one constant.

## Verification

- A short session (tab closed immediately) still records vitals and
  page_view; the shared traffic-type constant is imported on both sides.
