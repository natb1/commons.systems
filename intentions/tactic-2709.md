---
id: tactic-2709
kind: tactic
statement: "firestoreutil media queries: cursor pagination for
  getPublicMedia/getUserMedia"
owner: human
status: raw
parent: tactic-2701
rationale: >-
  - Extend the `MediaSource.list()` contract
  (`packages/mediautil/src/source.ts`)
    to support cursor/page-based enumeration, keeping the existing sources
    (Firebase + local-folder) conformant.
  - Add `orderBy("addedAt", "desc")` + a page `limit()` to `getPublicMedia` and
    `getUserMedia` in `packages/firestoreutil/src/media-queries.ts`, with the
    required composite indexes.
  - Update the two `// query-bounds-ok:` markers to `.limit(n)` bounded queries
  (or
    to the typed `.limit(n)` form if #2689 lands first), removing the
    `query-bounds-ok` suppression once the reads are genuinely bounded.
  - Paginate the media gallery UI that consumes `getAllAccessibleMedia`.
reading: null
gap: null
serves: []
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  source: github:natb1/commons.systems#2709
---
# firestoreutil media queries: cursor pagination for getPublicMedia/getUserMedia
