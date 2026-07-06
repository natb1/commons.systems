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
  Relates to strategy-attention-surface: analytics is a signal source the
  attention surface consumes; recorded here as the nearest signal-oriented
  strategy."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
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
