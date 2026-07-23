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
phase: implement
execution:
  branch: tactic-office-hours-snapshot-wire-contract
  pr: 2805
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours:
  reason: 'origin/main advanced by PR #2783 (attention-surface
    analytics-collector), which added analytics functionality directly into
    office-hours-snapshot/src/snapshot.ts, semantically conflicting with this
    node PR #2805 that extracts that same file into the new shared module
    office-hours/src/snapshot-wire.ts (provision exit 11; run.ts + snapshot.ts
    conflict), and the graph-native model has no autonomous fix-conflicts lane
    for an implement-phase node. Next steps: run /fix-conflicts against PR #2805
    (office-hours is read-only, so a human triggers it). PRESERVE BOTH SIDES, do
    not pick one: choosing HEAD silently drops #2783 just-merged analytics
    feature, choosing origin/main drops this PR wire-contract extraction.
    Resolution is to PORT #2783 analytics additions into the new shared module
    office-hours/src/snapshot-wire.ts (keeping snapshot.ts as the thin re-export
    shim): add "analytics" to SnapshotScope, export serializeProjectSignals, add
    foldProjectSignals, and add the --scope=analytics fold path to
    office-hours-snapshot/src/run.ts; the run.ts other hunk is a JSDoc-only
    block and is trivial. PR #2805 CI is currently all-green on its own head;
    execution.pr is null and no implement->qa transition was ever written, so
    after the conflict is resolved the node resumes at phase=implement and the
    next implement worker re-verifies CI and writes the transition. Ordering
    note: this node rationale said it should land before or alongside the
    analytics-collector rebuild, but #2783 merged first, so this conflict is
    predictable ordering fallout, not a mystery, and needs only a fix-conflicts
    pass, not re-planning the tactic.'
  since: 2026-07-10
  recommendation: null
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
