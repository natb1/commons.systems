---
id: tactic-print-annotations
kind: tactic
statement: "print viewer: text-selection highlights and notes for PDFs,
  persisted in open formats in the reader's own storage"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-06 from the /align-strategy draft: reading notes
  are where a knowledge practice starts and print is where the author's reading
  already lives. Round 1's instrument tactic — strategy-recover-knowledge's
  reading is null and its sensor is owner review, so this tactic creates the
  observable (annotations accumulating open-format in owned storage) that makes
  the sensor runnable. PDF first: the pdf.js TextLayer already renders
  selectable text and the search-highlight machinery provides the span-wrapping
  pattern; EPUB follows in tactic-print-annotations-epub."
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
  branch: tactic-print-annotations
  pr: 2806
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates:
  - strategy-recover-knowledge
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# print viewer: PDF highlights and notes in owned storage

## Context

strategy-recover-knowledge enters through reading annotations: reading notes
are where a knowledge practice starts, and print is where the author's reading
already lives. This tactic adds text-selection highlight + note annotations to
the PDF viewer, persisted in open formats in storage the reader owns — the
`.commons-print/index.json` sidecar for local-folder items, device-local
localStorage otherwise, and deliberately **never Firestore** (strategy
clarification recorded 2026-07-06: reading notes must not accumulate in a
vendor silo). It is round 1's instrument: the strategy's `reading` is null and
its sensor is owner review at office-hours, so the observable — annotations
accumulating open-format in owned storage — must exist before a reading can be
taken.

Scope boundary: PDFs only. EPUB is `tactic-print-annotations-epub`
(blocked_by this tactic); image archives have no text layer. Cloud-item
Firestore persistence is out of scope by design, not omission.

## Units

### Unit 1 — Annotation model + stores

**Recommended model:** sonnet

**Scope:**
- New `print/src/annotations.ts`: a versioned, documented open annotation
  shape — `{ id: string; position: string; quote: string; note: string;
  created: string }` where `position` is the renderer's serialized position
  used for navigation (PDF: page-number string), plus **optional** PDF anchor
  fields `{ page: number; offset: number; length: number }` describing the
  highlighted range in the page's text-layer text — the same offset space
  `offsetToItemRanges` consumes (`print/src/viewer/pdf.ts:136-151`). Anchor
  fields stay optional so EPUB (CFI-only) annotations fit the same shape
  later. Document the on-disk shape in a doc comment — it is a user-visible
  open format.
- `AnnotationsStore` interface `{ load(): Promise<Annotation[]>;
  save(annotations: Annotation[]): Promise<void> }`, mirroring
  `BookmarksStore` (`print/src/viewer/useBookmarks.ts:6-9`).
- Extend `SidecarData` (`print/src/sidecar.ts:27-33`) with
  `annotations: Record<string, Annotation[]>` keyed by **bare filename**:
  add a `coerceAnnotations` edge-coercion (drop wrong-typed entries, pattern
  of `coerceMetadata` at `print/src/sidecar.ts:44-58`), extend `mergeSidecar`
  (`print/src/sidecar.ts:74-87`) and the `createSidecar` wiring's `coerce`
  (`print/src/sidecar.ts:90-108`), and add
  `makeSidecarAnnotationsStore(filename)` beside `makeSidecarPositionStore`
  (`print/src/sidecar.ts:163-184`). Keep `version: 1` — the new key is
  optional and absent-tolerated.
- localStorage fallback + routing in `print/src/pages/view.ts`:
  `makeLocalStorageAnnotationsStore(mediaId)` (pattern
  `print/src/pages/view.ts:39-57`) and `pickAnnotationsStore(item, isLocal,
  uid)` mirroring `pickPositionStore` (`print/src/pages/view.ts:66-73`)
  **except** signed-in cloud items also route to localStorage — there is no
  Firestore tier for annotations.
- Tests: sidecar coercion/merge round-trips in the `print/test/sidecar.test.ts`
  style; store-routing tests (local folder → sidecar, signed-in cloud →
  localStorage, anonymous → localStorage).

Out of scope: any viewer or UI change.

### Unit 2 — PDF anchor capture + persistent highlight rendering

**Recommended model:** opus

**Dependencies:** Unit 1.

**Scope:**
- `print/src/viewer/types.ts`: optional annotation surface on
  `ContentRenderer` — `getSelectionAnchor?(): { position: string; quote:
  string; page: number; offset: number; length: number } | null` (reads the
  live `window.getSelection()` against the rendered text layer) and
  `setAnnotations?(annotations: Annotation[]): void` (the renderer re-applies
  highlights whenever a covering page's text layer renders). If call sites
  need narrowing, follow the `SearchableRenderer` promotion pattern
  (`print/src/viewer/types.ts`, `isSearchable`).
- `print/src/viewer/pdf.ts`: map a DOM `Range` within the text layer's
  `textDivs` back to page-text `{offset, length}` — the inverse of
  `offsetToItemRanges` (`print/src/viewer/pdf.ts:151`), using the index
  alignment between `layout.items` and `tl.textDivs` asserted at
  `print/src/viewer/pdf.ts:391-395`. Render persistent annotation highlights
  with the `applyHighlight` span-wrapping approach
  (`print/src/viewer/pdf.ts:357-414`) but a distinct class
  (`annotation-highlight`) and **without** the single-active-restore model
  (`highlightRestores`, `print/src/viewer/pdf.ts:210`): annotation spans
  persist across search highlight/unhighlight and re-apply after every
  `renderTextLayer` (single-page path `print/src/viewer/pdf.ts:323`, and the
  spread path's per-page text layers, `print/src/viewer/pdf.ts:211`). Search's
  `applyHighlight` mutates div text content and restores it from a log — the
  implementer must make the two features coexist without corrupting each
  other's bookkeeping (e.g. re-apply annotation spans after search restores,
  or anchor annotation spans at a layer search does not restore over).
- CSS for `.annotation-highlight` in `print/src/style/viewer.css`, alongside
  the existing `.search-highlight` styling.
- Tests in `print/test/viewer/pdf.test.ts` covering the Range→offset mapping
  and highlight re-application across renders (existing jsdom setup).

### Unit 3 — Viewer UI: capture affordance + annotations panel

**Recommended model:** sonnet

**Dependencies:** Units 1–2.

**Scope:**
- `useAnnotations` hook (pattern `print/src/viewer/useBookmarks.ts`): owns the
  annotation list state, loads from the picked store, exposes
  add/remove/goToAnnotation, and pushes the list into the renderer via
  `setAnnotations`.
- Capture affordance: when the user selects text in the viewer, show a small
  floating "Highlight / Note" control; Highlight adds immediately, Note opens
  an inline text input before saving. Presentational component; state lives in
  the hook.
- `AnnotationsPanel` (pattern `print/src/viewer/BookmarksPanel.tsx`): lists
  quote + note, click navigates via the controller
  (`goToPosition`/`onPanelNavigate`, `print/src/viewer/Viewer.tsx:40-83`),
  with a delete button. Compose into `Viewer.tsx`'s `<aside>` next to
  `BookmarksPanel`.
- Wire `pickAnnotationsStore` in the view-page assembly
  (`print/src/pages/view.ts:160-199`) and pass it through Viewer props like
  the position store (`print/src/viewer/Viewer.tsx:16`).
- Tests: hook + panel tests in the `print/test/viewer` style
  (`Viewer.test.tsx`, `bookmarks.test.ts` patterns).

## Reuse

- Sidecar machinery: the `@commons-systems/sidecar` factory via
  `print/src/sidecar.ts` (coerce/merge/`enqueueWrite` single-flight chain) —
  extend it, do not fork it.
- Store routing: `pickPositionStore` / `pickBookmarksStore` patterns
  (`print/src/pages/view.ts:66-73`, `print/src/viewer/useBookmarks.ts:38-52`).
- Highlight span machinery: `offsetToItemRanges` + `applyHighlight`
  (`print/src/viewer/pdf.ts:151, 357-414`); `PageLayout` reconstruction
  (`print/src/viewer/pdf.ts:28-50, 323-354`).
- Panel composition: `BookmarksPanel`/`useBookmarks`/Viewer aside
  (`print/src/viewer/Viewer.tsx:76-84`).

## Verification

```verify
npx vitest run --project print --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app print
```

Manual QA (browser, local folder): open a local-folder PDF in print, select
text, add a highlight and a note; confirm the highlight paints, survives page
navigation and a reload, and appears in the annotations panel with working
navigate/delete; confirm `.commons-print/index.json` in the folder now carries
the annotation as readable JSON; confirm a search on the same page does not
destroy the annotation highlight. Signed-out non-folder item: the annotation
persists across reload via localStorage, and no Firestore write occurs
(network tab).

## Implement-phase residue (2026-07-10)

All three units are implemented on branch `tactic-print-annotations` (PR #2806,
draft). Units 1-2 landed in prior sessions (commits `a1ab0c8a`, `a2d712e0`);
Unit 3 (viewer UI: `useAnnotations` hook, `AnnotationCapture` floating control,
`AnnotationsPanel`, `pickAnnotationsStore` wiring) landed this session (commit
`70954de5`). The node's own `## Verification` is GREEN: full print vitest suite
(637 passed, 1 skipped) and `tsc --noEmit --project print` (0 errors).

Transitioned implement -> fix on RED CI. The `type-safety-sensor` check fails:
63 net-new type-safety escape hatches on lines added vs origin/main, which the
sensor flags because this branch had no prior PR (its first CI run covers all
three units' additions at once). Breakdown:

- **44 in Unit 2's `print/test/viewer/pdf.test.ts`** (39 non-null assertions
  `foo!.bar`, 5 `as <Type>` casts) — idiomatic test DOM/renderer access,
  committed by the Unit 2 session and never CI-checked (no PR then).
- **18 in this session's `print/test/viewer/annotations.test.tsx`** — the same
  idiomatic test casts (mock-controller ref fixtures, `querySelector as
  HTMLxxx`). Note: 5 `as Partial<ContentRenderer>` casts are removable outright
  (`getSelectionAnchor`/`setAnnotations` are on `ContentRenderer`, so the
  override object needs no cast).
- **1 in `print/src/viewer/useViewerController.ts:484`** — NOT a new hatch: the
  line already carried `(e.target as HTMLElement)` on origin/main; this session
  only appended `.viewer-annotation-note-input` to the `.closest()` selector, so
  the edited line re-flags (sensor "accepted tradeoff D1").

Fix-phase remedy (all sanctioned, none weaken a test): drop the 5 unneeded
`as Partial<ContentRenderer>` casts; append `// type-safety-ok: <reason>` to the
remaining net-new hatch lines (the established convention — origin/main carries
96 such markers in print, 17 in `epub.test.ts` alone). Sensor script:
`.github/scripts/check-type-safety-escapes.sh` (run bare to list violations).
Other CI checks that had concluded were green; `unit-tests`, `acceptance`,
`preview-and-smoke`, and `Analyze` were still pending at transition time and the
fix phase must confirm them.

## Fix-phase resolution (2026-07-10)

Applied the sanctioned remedy in commit `cd626bf2`: removed 4 redundant
`as Partial<ContentRenderer>` casts in `print/test/viewer/annotations.test.tsx`
(the file had 4, not the estimated 5 — `makeMockRenderer`'s param is already
typed `Partial<ContentRenderer>`, so the override-object casts were pure
no-ops), and appended `// type-safety-ok: <reason>` to the remaining 59
net-new hatch lines (test-fixture non-null assertions/casts in
`pdf.test.ts`/`annotations.test.tsx`, plus the one re-flagged pre-existing
cast in `useViewerController.ts:484`). `.github/scripts/check-type-safety-escapes.sh`
now exits 0. Pushed; full CI on PR #2806 went green (all checks pass,
including previously-pending `unit-tests`, `acceptance`, `preview-and-smoke`,
`Analyze`). Transitioning fix -> qa.
