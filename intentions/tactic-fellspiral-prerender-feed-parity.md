---
id: tactic-fellspiral-prerender-feed-parity
kind: tactic
statement: "fellspiral prerender: feed buildTimeFeeds into the prerendered
  info-panel data so it matches the client hydration"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. fellspiral/scripts/prerender.ts
  omits buildTimeFeeds while the client hydrates InfoPanelRegion with it,
  guaranteeing an SSR/client mismatch on the panel root - the same failure class
  as prod bug #2173 that an earlier fix only partially closed (the structural
  cause: virtual:blog-roll-feeds only exists inside the vite build). Serves
  strategy-tabletop-storytelling: fellspiral is the storytelling surface and
  must hydrate cleanly."
reading: null
gap: null
serves:
  - strategy-tabletop-storytelling
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-fellspiral-prerender-feed-parity
  pr: 2838
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# fellspiral prerender: buildTimeFeeds parity

## Context

`fellspiral/scripts/prerender.ts:28-33` omits `buildTimeFeeds` from the
info-panel data while the client hydrates with it
(`fellspiral/src/main.ts:20` -> `InfoPanelRegion.tsx:101-106`), guaranteeing
an SSR/client mismatch on the panel root whenever the build-time feed fetch
returned data - the same failure class as prod bug #2173. Structural cause:
`virtual:blog-roll-feeds` only exists inside the vite build, so the post-build
tsx prerender cannot import it. Verified 2026-07-05.

## Unit 1 — feed buildTimeFeeds into the prerender

**Recommended model:** opus

Scope:
- Expose the build-time feed data to the tsx prerender (emit it as a
  build artifact the prerender reads, or run the prerender inside the vite
  build where `virtual:blog-roll-feeds` resolves), and pass it into the
  prerendered info-panel data so both sides hydrate from identical input.
- Add a parity assertion (build-time) that the prerendered panel state
  matches the client's initial derived state.

## Verification

- Load a fellspiral page whose build-time feed fetch returned data and
  confirm no hydration mismatch on the info-panel root (the #2173 class);
  the parity assertion passes in the build.
