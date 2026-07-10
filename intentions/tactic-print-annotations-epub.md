---
id: tactic-print-annotations-epub
kind: tactic
statement: "print viewer: extend highlight and note annotations to EPUB via
  epub.js CFI-range annotations"
owner: ai
status: codified
parent: null
rationale: Completes strategy-recover-knowledge's entry artifact across both
  text formats print renders. epub.js already exposes
  rendition.annotations.highlight/remove (used today by search highlighting,
  print/src/viewer/epub.ts:19-20) and CFI ranges serialize as positions the
  renderer's goToPosition already accepts. Off the round's minimum signal path —
  PDF annotations alone produce the round-1 reading — and sequenced after
  tactic-print-annotations, whose stores, open schema, and panel it reuses
  unchanged.
reading: null
gap: null
serves:
  - strategy-recover-knowledge
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-print-annotations-epub
  pr: 2841
  attempts: {}
  markers: []
  strategy_fingerprint: 9041cd3f2e7ae13e7ff4ec0430dba7348bb66ff18e90c12f3f276aa559b5bffb
validates: []
blocked_by:
  - tactic-print-annotations
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# print viewer: EPUB annotations via CFI ranges

## Context

`tactic-print-annotations` adds highlight + note annotations to the PDF viewer
with open-format, owned-storage persistence. This tactic extends the same
capability to EPUBs so strategy-recover-knowledge's entry artifact covers both
text formats print renders. epub.js already ships the needed primitives:
`rendition.annotations.highlight(cfiRange, ...)` / `annotations.remove(cfiRange,
"highlight")` — used today by search highlighting (`print/src/viewer/epub.ts:19-20,
76-81`) — and a selection event carrying a CFI range. An EPUB annotation's
`position` is the CFI-range string, which the renderer's `goToPosition` already
accepts (`print/src/viewer/epub.ts:210-213`). The stores, open schema, and
panel from `tactic-print-annotations` are reused unchanged.

## Units

### Unit 1 — EPUB selection capture + persistent highlights

**Recommended model:** opus

**Scope:**
- `print/src/viewer/epub.ts`: implement the optional `ContentRenderer`
  annotation surface added by `tactic-print-annotations`
  (`print/src/viewer/types.ts`). Capture selection via epub.js's
  `rendition.on("selected", (cfiRange, contents) => ...)` — same handler
  registration pattern as the existing `relocated`/`displayerror` handlers
  (`print/src/viewer/epub.ts:183-196`) — producing `{ position: cfiRange,
  quote }` (quote text via `book.getRange(cfiRange)`). Render persistent
  highlights with `annotations.highlight(cfiRange, ..., "annotation-highlight")`,
  a class distinct from search's base highlights; remove with
  `annotations.remove(cfiRange, "highlight")` on delete (the `clearSearch`
  pattern, `print/src/viewer/epub.ts:76-81`). Re-apply the full set on
  `setAnnotations`, and verify highlights survive section re-renders (epub.js
  normally re-applies registered annotations on display — if not, re-apply on
  the rendition's `rendered` event).
- Anchor fields: EPUB has no page/offset/length; those PDF anchor fields are
  optional in the shared annotation shape (`print/src/annotations.ts` from
  `tactic-print-annotations` Unit 1). If they landed as required, loosen them
  to optional as part of this unit.
- Tests: `print/test/viewer/epub.test.ts` additions using the existing epub.js
  mocking approach.

### Unit 2 — Wire EPUB into the shared annotations UI

**Recommended model:** sonnet

**Dependencies:** Unit 1.

**Scope:**
- Ensure the capture affordance and `AnnotationsPanel` from
  `tactic-print-annotations` work format-agnostically: the `useAnnotations`
  hook and panel must key on `annotation.position` (a CFI string here) with no
  PDF-specific assumptions; where the panel renders a page-number label, fall
  back to a quote-only label for EPUB annotations.
- The store layer is already format-agnostic (keyed by bare filename /
  mediaId); confirm no sidecar change is needed.
- Tests: a panel/hook test covering a CFI-positioned annotation end-to-end
  (add → list → navigate → delete).

## Reuse

- epub.js annotations API and the search-highlight precedent
  (`print/src/viewer/epub.ts:19-20, 47, 76-81`).
- CFI navigation: `goToPosition` (`print/src/viewer/epub.ts:210-228`).
- Annotation shape, stores, hook, and panel from `tactic-print-annotations`
  (`print/src/annotations.ts`, `print/src/sidecar.ts`,
  `print/src/pages/view.ts`, `print/src/viewer/`).

## Verification

```verify
npx vitest run --project print --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app print
```

Manual QA (browser, local folder): open a local-folder EPUB in print, select
text, add a highlight and a note; the highlight paints and survives chapter
navigation and a reload; panel navigation jumps to the CFI; the folder's
`.commons-print/index.json` carries the annotation as readable JSON; search
highlighting and annotation highlights coexist in the same section.
