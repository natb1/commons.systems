---
id: tactic-print-viewer-save-reliability
kind: tactic
statement: "print viewer: flush the debounced reading-position save on
  page-hide, guard stale text-layer renders, and stop epub percent-goto from
  hanging"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 code review, previously misfiled in
  tactic-review-low-severity-sweep at higher severity than a low sweep warrants
  (all three units were rated medium). Serves strategy-recover-attention (print
  is its named consumer-side artifact; re-pointed from
  strategy-recover-knowledge 2026-07-06 per the placement doctrine): the owned
  reader must reliably save and render the reader's actual position and page."
reading: null
gap: null
serves:
  - strategy-recover-attention
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
# print viewer: save-on-unload, stale-render guard, epub goto reliability

## Context

Three verified print-viewer reliability defects (2026-07-05), all rated
medium and previously misfiled in the low-severity sweep.

## Unit 1 — flush the debounced position save on page-hide

**Recommended model:** sonnet

Scope:
- `print/src/viewer/useViewerController.ts:268-282`: the 500ms-debounced
  reading-position save has no `beforeunload`/`pagehide`/`visibilitychange`
  flush (grep confirms none anywhere in print or the shared packages), so
  closing the tab within the debounce window drops the final page turn
  every time. Add a flush-on-hide listener.
- `useViewerController.ts:260-263`: `persistPosition` records
  `lastSavedPosition` before the async save settles, so a transiently
  failed save (offline Firestore write) is never retried for that
  position. Only record it once the save resolves, or retry on failure.
- `useViewerController.ts:537-549`: merely opening a document with the
  spread preference on silently rewrites the saved position to the
  spread's left page (saved "3" -> spread {2,3} -> init `syncNav`
  persists "2"), regressing the exact page with zero user navigation. Do
  not persist a position change from initialization alone.

## Unit 2 — generation-guard the PDF text layer

**Recommended model:** sonnet

Scope:
- `print/src/viewer/pdf.ts:323-354`: `renderTextLayer` has no generation
  guard; a superseded render suspended in `await page.getTextContent()`
  can create a `TextLayer` into the shared div after the winning render
  cleared it, leaving invisible-but-selectable stale-page text overlaid
  on the current page (the loser's `tl` is never registered in
  `activeTextLayer`, so the winner can't cancel it). Register in-flight
  renders so a superseded one can be cancelled or its result discarded.

## Unit 3 — bound epub percent-goto instead of hanging

**Recommended model:** sonnet

Scope:
- `print/src/viewer/epub.ts:103-109,232-241`: `goToFraction`/`goToResult`
  await a `relocated` event the file itself documents (at `:214-216`) as
  unreliable for `display(cfi)`, so a percent-goto can freeze
  "Calculating…" for the full 30s timeout and then report a spurious
  error; the timer also fires after `destroy()` since nothing clears it.
  Clear the timer on destroy, and consider a shorter/adaptive timeout or
  a fallback resolution path that doesn't depend solely on `relocated`.

## Verification

- Close the tab within 500ms of a page turn; the position is saved.
  Rapidly paging while a page's text layer is still loading leaves no
  stale selectable text over the current page. A percent-goto in an epub
  resolves or fails within a bounded, shorter window and does not fire
  after the viewer is destroyed.
