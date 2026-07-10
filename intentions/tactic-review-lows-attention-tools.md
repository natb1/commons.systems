---
id: tactic-review-lows-attention-tools
kind: tactic
statement: "print + audio owned reader/player low-severity sweep: bookmarks
  post-mount fork, forget-folder sidecar clear, keydown modifier guard,
  image-archive object-URL eviction, audio MIME-map drift, queue-toggle dead
  validation"
owner: ai
status: codified
parent: null
rationale: Finalized 2026-07-07 /align-tactics round on
  strategy-recover-attention out of the retained draft (split 2026-07-06 from
  the deleted mixed sweep tactic-review-low-severity-sweep). Each unit is a
  confirmed low-severity finding from the 2026-07-05 code review of the owned
  print reader and audio player, re-anchored against current origin/main. Off
  the strategy's signal path (no validates edge) - recorded fully so the
  calculated-attention derivation demotes it, rather than deferral-by-omission.
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
# print + audio owned reader/player low-severity sweep

## Context

Six confirmed low-severity findings from the 2026-07-05 code review of the
owned print reader and audio player, finalized 2026-07-07 out of a retained
draft. Each is an independent, self-contained correctness/cleanup fix in the
attention-recovery artifacts (print viewer, audio player). None is on the
strategy's signal path; they harden the owned tools that already carry the
author's daily reading. Anchors below were re-verified against current
`origin/main` (line numbers drifted from the original review — the current
numbers are used here).

The units are independent (no ordering dependency); each is one commit inside
the single sweep PR.

## Unit 1 — print bookmarks: reconcile store on post-mount Firestore recovery

- **Scope**: `print/src/viewer/Viewer.tsx:46` selects the bookmarks store via
  `pickBookmarksStore(controller.uid, controller.readFailed, controller.mediaId)`;
  `print/src/viewer/useBookmarks.ts:75-87` loads bookmarks once on mount
  (`}, []); // intentional: load once on mount`). If the initial cloud store
  read fails and Firestore later recovers, the loaded list stays forked from
  the store. Make the load re-run when the effective store identity changes
  (e.g. key the load effect on the store / `readFailed` rather than `[]`, or
  re-load when `pickBookmarksStore` returns a different store). Out of scope:
  any change to `pickBookmarksStore`'s selection inputs or the cloud/local
  store implementations.
- **Recommended model**: sonnet

## Unit 2 — print "Forget folder": clear the sidecar local-directory model

- **Scope**: `print/src/local-folder-ui.ts:176-192` — the `#local-folder-forget`
  click handler calls `store.remove(PURPOSE)` and `resetLocalSource()` but never
  clears the sidecar's in-memory local-directory model. `print/src/sidecar.ts:126`
  deliberately does not re-export `clearLocalDirectory` ("no behavior change" —
  that omission is the bug); the shared hook exists at
  `packages/sidecar/src/factory.ts:189,285`. Re-export `clearLocalDirectory`
  from `print/src/sidecar.ts` and call it in the forget handler so the forgotten
  folder's cached model is dropped. Out of scope: the sidecar package itself
  (the hook already exists).
- **Recommended model**: sonnet

## Unit 3 — print keydown: ignore modified Arrow keys

- **Scope**: `print/src/viewer/useViewerController.ts:483-486` — `handleKeydown`
  fires `goPrev()`/`goNext()` on `ArrowLeft`/`ArrowRight` without checking
  modifiers, so `Alt+ArrowLeft` both pages the viewer and triggers browser
  back-navigation. Return early when any of `altKey`/`ctrlKey`/`metaKey`
  (and, per reviewer judgment, `shiftKey`) is set. Out of scope: the search /
  goto-input guard already present on the first line of the handler.
- **Recommended model**: sonnet

## Unit 4 — print image-archive: bound the object-URL cache

- **Scope**: `print/src/viewer/image-archive.ts:67-83` (`getObjectUrl`) creates
  and retains an object URL per page for the whole session; only the teardown
  path at `:249` revokes. For a large archive this holds every decompressed
  image. Add a bounded-window eviction: keep object URLs for a small window
  around the current/prefetched page and `URL.revokeObjectURL` +
  clear `slot.resolvedUrl`/`slot.urlPromise` for pages that fall outside it
  (reuse the existing `resolvedUrl`/`urlPromise` slot shape and the
  `prefetchNextPage` cursor at `:86`). Out of scope: the decompression /
  `image-archive` entry model; prefetch count tuning beyond what eviction needs.
- **Recommended model**: sonnet

## Unit 5 — audio: converge the two MIME maps

- **Scope**: two drifted extension→MIME maps —
  `audio/src/storage.ts:7-13` (keyed by dotted extension, includes `.aac`) and
  `audio/src/local-source.ts:37-43` (keyed by `AudioFormat`, omits `aac`). A
  `.aac` file accepted by one path is unreachable via the other. The
  authoritative closed union is `AUDIO_FORMATS` at `audio/src/types.ts:1`
  (`mp3, m4a, flac, ogg, wav` — no `aac`), and the strategy's recorded
  ownership-preserving product boundary (`strategy-recover-attention`
  clarification on product boundaries, recorded 2026-07-07) names exactly that
  five-format DRM-free set — so the default resolution is to drop `.aac` from
  `storage.ts`; add `aac` to the union instead only if end-to-end aac support
  is deliberately being adopted (a wider change than this unit intends).
  Converge on one representation and prefer a single shared map if both
  consumers can key off it. Out of scope: adding new formats beyond
  reconciling `aac`. (This unit absorbs the draft
  `tactic-audio-format-boundary`, pruned this round — the same finding
  surfaced independently at the 2026-07-07 `/align-strategy` code review.)
- **Recommended model**: sonnet

## Unit 6 — audio Home: remove the pre-React queue-toggle validation

- **Scope**: `audio/src/pages/Home.tsx:44-51` — the queue-toggle handler
  re-validates already-typed props (`id`/`title`/`artist`/`album`/`origin`/
  locator) as if reading DOM data attributes and logs
  `"Queue toggle: missing data attributes on audio row"` (`:48`). The fields
  come from the typed `item` object, not DOM attributes, so the branch is dead
  pre-React carryover and the message is misleading. Remove the dead validation
  block (or, if the locator guard is genuinely reachable for a partial `item`,
  keep only that check and correct the message to name the real condition).
  Out of scope: the `player.add`/`remove` calls and the `onQueueChange`
  re-render in `finally`.
- **Recommended model**: sonnet

## Reuse

- Sidecar `clearLocalDirectory` already exists (`packages/sidecar/src/factory.ts:189`);
  Unit 2 wires it, does not reimplement it.
- Unit 4 reuses the existing `slot.resolvedUrl`/`slot.urlPromise` slots and the
  `revokeObjectURL` call already present at `image-archive.ts:249`.
- Unit 5 should collapse to one map where practical rather than adding a third.

## Verification

Per-app unit suites (CI-equivalent form, rooted at the repo root so
root-hoisted `?url` asset imports resolve):

```verify
npx vitest run --project print --root .
npx vitest run --project audio --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app print
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app audio
```

Manual (judgment, observe in the running app):

- Unit 3: in the print viewer, `Alt+ArrowLeft` navigates browser-back only and
  does not page; unmodified `ArrowLeft`/`ArrowRight` still page.
- Unit 4: open a large image archive, page through it, and confirm memory does
  not grow unbounded (object URLs for far-off pages are revoked).
- Unit 1: simulate an initial bookmarks-store read failure then recovery and
  confirm the list reconciles rather than staying forked.
