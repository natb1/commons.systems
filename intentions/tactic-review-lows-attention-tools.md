---
id: tactic-review-lows-attention-tools
kind: tactic
statement: "2026-07-05 review lows: print + audio owned reader/player (retained
  draft context)"
owner: ai
status: raw
parent: null
rationale: Retained draft context, not selectable work. Split 2026-07-06 out of
  the deleted mixed sweep tactic-review-low-severity-sweep per the placement
  doctrine (strategy-graph-native-dispatch), so this strategy's /align-tactics
  rounds find their own residue. Findings are from the 2026-07-05 code review,
  each verified with an anchor.
reading: null
gap: null
serves:
  - strategy-recover-attention
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# 2026-07-05 review lows: print + audio owned reader/player (retained draft context)

## Context

Retained draft context, not selectable work. Split 2026-07-06 out of the
deleted mixed sweep `tactic-review-low-severity-sweep` per the placement
doctrine on `strategy-graph-native-dispatch`. Each line is a confirmed
finding from the 2026-07-05 review with an anchor. A later `/align-tactics`
round on `strategy-recover-attention` finalizes, splits, merges, or prunes.

## print

- `Viewer.tsx:46-49` + `useBookmarks.ts:87`: bookmarks store loads once with
  the initial cloud store; a post-mount Firestore failure forks state.
- `local-folder-ui.ts:178-190`: "Forget folder" never calls the sidecar
  `clearLocalDirectory` hook.
- `useViewerController.ts:483-487`: keydown handler ignores modifiers ->
  Alt+ArrowLeft both pages and navigates back.
- `viewer/image-archive.ts:67-83`: no object-URL/Blob eviction (holds all
  decompressed images for the session).

## audio

- `storage.ts:7-14` vs `local-source.ts:38-44`: two drifted MIME maps
  (`.aac` accepted in one, unreachable in the other).
- `pages/Home.tsx:47-50,76-82`: pre-React dead code + misleading validation
  message.
