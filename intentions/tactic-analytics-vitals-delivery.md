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
  2026-07-06 per the placement doctrine. Rescoped 2026-07-10 at qa
  (author-ratified): transport_type:beacon delivers the post-init page-hide
  segment (the request gtag issues at page-hide survives teardown via
  sendBeacon) but cannot cover tabs torn down before firebase init resolves —
  logEvent suspends awaiting the dynamic-config fetch before gtag ever reads
  transport_type. The pre-init residual moves to draft
  tactic-analytics-preinit-vitals."
reading: null
gap: null
serves:
  - strategy-promote-progressive-detachment
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-analytics-vitals-delivery
  pr: 2835
  attempts: {}
  markers:
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  test_integrity_waiver:
    pr: 2835
    signal: 2
    max_net: 4
    paths:
      - packages/analyticsutil/test/**
    approved: 2026-07-10
    reason: "Removing the unreachable logEvent try/catch wrappers orphans the 4
      tests that mocked logEvent to throw (an impossible path); their subject —
      the swallow-and-report branch — is deliberately deleted, so this is
      dead-code cleanup, not weakening. Author explicitly approved this scoped
      Signal-2 waiver at the 2026-07-10 office-hours round (doctrine:
      strategy-graph-native-dispatch integrity-waiver clarification;
      implementation: draft tactic-test-integrity-waiver). Written by the
      interactive session after human approval; clears the 2026-07-10 park."
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
- Rescoped 2026-07-10 at qa (author-ratified): this unit covers the
  post-init segment — sessions whose firebase init (dynamic-config fetch)
  has resolved by page-hide, whose gtag request would otherwise be
  cancelled at teardown. Tabs torn down before init resolves are out of
  scope here: `logEvent` suspends awaiting init before gtag ever reads
  `transport_type`, so no transport parameter can reach them. That residual
  is draft `tactic-analytics-preinit-vitals`.

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

- A session closed at/after page-hide once firebase init has resolved
  delivers vitals and page_view via sendBeacon (the request survives
  teardown); the shared traffic-type constant is imported on both sides.
- (Superseded 2026-07-10: the original bullet "a short session — tab closed
  immediately — still records vitals and page_view" is NOT delivered by
  `transport_type: 'beacon'` and moved to draft
  `tactic-analytics-preinit-vitals`.)

## QA residue (2026-07-10)

qa ran with full parity semantics against PR #2835 (summary comment on the
PR). Script-verifiable items all pass: 21/21 analyticsutil + 39/39 config
tests, typecheck (all CI-affected workspaces), lint, dead-code, and
waiver-scope compliance (exactly 4 net test-declaration removals confined to
`packages/analyticsutil/test/**`, within the author-approved
`attributes.test_integrity_waiver`). Code-read items: wrapper removal and
traffic-type single-sourcing verified correct. One finding: the beacon
transport does not apply to tabs torn down before firebase init resolves —
`logEvent` (firebase/analytics) awaits `initializationPromise`
(dynamic-config fetch + installations fetch) before the wrapped gtag call,
which is where `transport_type` is read; a tab dying at those awaits loses
the event exactly as before. Disposition: author-ratified rescope (this
round, human present — the office-hours-equivalent decision): the delivered
post-init segment is accepted, code comments corrected on the PR, and the
pre-init residual recorded as draft `tactic-analytics-preinit-vitals`. No
needs-main residue beyond ordinary post-merge observation of the GA4
channel, which the serving strategy's own sensor covers.
