---
id: tactic-office-hours-snapshot-wire-contract
kind: tactic
statement: "office-hours snapshot: extract a shared producer/reader
  wire-contract and fix the three breaks (GraphQL comments, missing version,
  missing memberEmails)"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review: the office-hours-snapshot
  producer -> dashboard reader pipeline is broken end-to-end in three
  independent ways, each masked by mocks/hand-built fixtures so CI is green
  around an integration that cannot work. Foundational for
  strategy-attention-surface's graph-native office-hours surface: the
  attention-surface rebuild subtree (signal-types, velocity-pace,
  analytics-collector) assumes a working producer/reader base. Land this before
  or alongside that subtree; it touches gh-fetchers.ts and snapshot.ts
  (serialize/decode), which the rebuild tactics largely do not, so keep it a
  distinct foundational fix rather than folding it in."
reading: null
gap: null
serves:
  - strategy-attention-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-office-hours-snapshot-wire-contract
  pr: 2805
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  bug_fix: true
---
# office-hours snapshot: shared wire-contract + the three pipeline breaks

## Context

The office-hours-snapshot producer writes an encrypted `.benc` the dashboard
reader decodes. The 2026-07-05 review found the pipeline broken end-to-end in
three independent ways, each masked by mock runners and hand-built fixtures
so both isolated suites stay green. Root cause: the producer deep-imports
dashboard/functions internals via `../../office-hours/src/*.js` relative
paths instead of a shared wire-contract, so serializer and decoder drifted.

## Unit 1 — extract the shared wire contract

**Recommended model:** opus

Scope:
- Create a shared package (or module) owning the snapshot wire types and the
  serialize/decode pair, imported by both `office-hours-snapshot/src/` and
  `office-hours/src/`, replacing the `../../office-hours/src/*.js` deep
  imports in `produce.ts`, `snapshot.ts`, `parity.ts`, `run.ts`.
- Add ONE round-trip test feeding `serializeSnapshot` output straight into
  `decodeSnapshot` (no mocks) - the test that would have caught all three
  breaks.

## Unit 2 — fix the three breaks

**Recommended model:** opus

Scope:
- `office-hours-snapshot/src/gh-fetchers.ts:159,169,248`: `// type-safety-ok`
  comments sit inside GraphQL template literals (GraphQL comments are `#`),
  making every real query a syntax error. Move/relabel them.
- `snapshot.ts:246-265`: producer never emits `version`; reader
  (`office-hours/src/snapshot.ts:99`) rejects `version !== 1`. Emit it.
- `snapshot.ts:167-178`: serialized samples omit `memberEmails`, which the
  reader's strict parsers reject. Include it (and fix the parity checker,
  which strips it on both sides so it cannot catch the drift).

## Unit 3 — fold in the two related snapshot mediums

**Recommended model:** sonnet

Scope:
- `office-hours/src/backlog-runway.ts:43-49`: the `slope < 0` branch runs
  before the near-zero epsilon check, captioning a flat backlog
  "~1e16 days to clear". Reorder.
- `office-hours-snapshot/src/produce.ts:311-323`: `parked-only` scope
  fabricates a zeroed QueueMetricsSnapshot with no `scope` on the wire, so
  the dashboard shows a fabricated runway as real. Carry `scope` and render
  it as unmeasured.

## Verification

- The round-trip test passes; a real (non-mock) producer run writes a `.benc`
  the dashboard decodes with populated CAPACITY/PACE/HISTORY/BACKLOG panels.
  This also unblocks the queued main-qa verifications (#2704, #2698).

## Conflict resolution — 2026-07-23

The office-hours park (opened 2026-07-10, provision exit 11) is cleared. The
`origin/main` merge into PR #2805 conflicted in exactly two files against
PR #2783's analytics-collector work, which had landed `foldProjectSignals`
directly into `office-hours-snapshot/src/snapshot.ts` — the same file this
tactic replaces with a re-export shim over the new shared module. Both sides
are preserved; neither was dropped.

**Author decision (2026-07-23):** shown the placement options, the author chose
to fold `foldProjectSignals` into `office-hours/src/snapshot-wire.ts` — the
fold constructs an `OfficeHoursSnapshot`, so it belongs beside the type the
wire module owns. The park's own recipe additionally suggested exporting
`serializeProjectSignals`; the author rejected that as redundant. Both callers
(`serializeSnapshot` and `foldProjectSignals`) now live in the same module, so
it stays module-private.

What landed (merge commit `b30ad4b2`, follow-up `b44c48fd`; branch pushed, PR
left open for the normal lane):

- `office-hours-snapshot/src/snapshot.ts` — kept this branch's re-export shim.
- `office-hours/src/snapshot-wire.ts` — `SnapshotScope` gains `"analytics"`;
  `foldProjectSignals` ported in; `serializeProjectSignals` stays private.
- The ported no-prior-snapshot skeleton gains `version: 1`. #2783's skeleton
  predates the field; under the wire contract the type requires it, and it is
  also a genuine correctness fix — `decodeSnapshot` hard-rejects
  `raw.version !== 1`, so a version-less analytics skeleton would be written to
  disk and then refused by the reader. Called out on the PR as an intended
  behavior change rather than left to pass silently.
- `office-hours-snapshot/src/run.ts` — the conflicted hunk took `origin/main`'s
  `defaultReadPriorSnapshot` doc. Separately, the AUTO-MERGED (non-conflicted)
  `defaultReadPriorHistory` doc still claimed the serialized snapshot
  "intentionally drops" `memberEmails`, which this tactic makes false; the
  corrected wording was folded in there too. Resolving only the conflicted hunk
  would have landed a factually wrong comment.
- `office-hours-snapshot/src/parity.test.ts` — merge residue, not a conflict:
  #2861 added a second `SnapshotInput` literal while this branch made
  `memberEmails` a required field. Stamped `MEMBERS` on it.

Verification on the merged head: `tsc --noEmit` clean for both `office-hours`
and `office-hours-snapshot`; `run-unit-tests.sh` green (54 files / 542 tests,
plus the office-hours production build); `run-lint.sh` green.

Phase stays `implement`: PR #2805 is still an open DRAFT carrying no
`dispatch:*` label, and no implement→qa transition was ever written. The next
implement worker re-verifies CI on the merged head and writes the transition —
exactly what the park's own next-steps note anticipated.
