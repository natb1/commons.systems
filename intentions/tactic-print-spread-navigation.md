---
id: tactic-print-spread-navigation
kind: tactic
statement: "print viewer: make bookmark and outline navigation spread-aware, and
  read the spread's live page when toggling a bookmark"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. In spread mode, bookmark and TOC
  navigation bypass the SpreadController and render into the hidden single-page
  surface (a visual no-op), and the bookmark toggle reads renderer.position
  which spread navigation never updates. Search navigation already does it
  correctly via controller.goToPage. Serves strategy-recover-attention: print is
  its named consumer-side artifact and the owned reader must actually navigate.
  Re-pointed from strategy-recover-knowledge 2026-07-06 per the placement
  doctrine."
reading: null
gap: null
serves:
  - strategy-recover-attention
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-print-spread-navigation
  pr: 2822
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# print viewer: spread-aware bookmark/outline navigation

## Context

In spread mode the print viewer's bookmark and outline navigation bypass the
SpreadController. Verified 2026-07-05; search navigation already does it
correctly via `controller.goToPage`, giving the intended pattern.

## Unit 1 — route bookmark/outline nav through the controller

**Recommended model:** sonnet

Scope:
- `print/src/viewer/useBookmarks.ts:109` and
  `print/src/viewer/OutlinePanel.tsx:109`: both render into the CSS-hidden
  single-page surface, so clicking a bookmark or TOC entry in spread mode is
  a visual no-op. Route them through `controller.goToPage` like search.

## Unit 2 — bookmark toggle reads the live spread page

**Recommended model:** sonnet

Scope:
- `useBookmarks.ts:98`: the toggle reads `renderer.position`, which spread
  navigation never updates (`spread-controller.ts:160-165` bumps only
  `spreadIndex`), so after flipping spreads the toggle records the
  pre-spread page and the indicator highlights the wrong page. Read the
  controller's current page.

## Verification

- In spread mode, a bookmark/outline click moves the visible spread; toggling
  a bookmark after flipping spreads records the page actually shown.
