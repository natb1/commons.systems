---
id: tactic-graph-eligibility-last-aligned
kind: tactic
statement: Add rounds.last_aligned and key the /align-tactics fresh-reading gate
  off it so a strategy whose rounds produce born-parked or off-path work stops
  being re-selected until a new reading lands
owner: ai
status: raw
parent: null
rationale: "2026-07-16 /align-strategy interview.
  strategy-philosophical-grounding surfaced perpetual /align-tactics
  re-selection: its human-only signal (sensor: owner review at office-hours)
  means every round produces off-path tooling plus born-parked on-path reading
  chunks and never a claude-executable on-path tactic, so router.ts's coverage
  gate never trips; and the fresh-reading backstop clarification 3 mandates
  never fires because it is guarded by count > 0 while count / last_completed
  only advance when a child prunes (verified-in-prod, clarification 22), which
  born-parked reading children never do. Fix chosen at interview: add
  rounds.last_aligned. See the 2026-07-16 last_aligned clarification on
  strategy-graph-native-dispatch."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 6
  override: null
  rationale: "Author-directed 2026-07-16: this tactic fixes the perpetual
    /align-tactics re-selection bug on strategy-philosophical-grounding (and any
    other human-signal strategy) — a router-eligibility defect, not feature
    work. Set to boost 6 (added on top of the strategy's own boost 5, plus the
    capture term, composing to ~11.3) so it ranks strictly above the current
    graph-wide ceiling among non-done, non-emergency nodes (9.33, held by
    tactic-graph-frozen-tactic-dispatch/tactic-nontactic-body-durability/tactic\
    -review-phase-trust-builtin-review) and above the prior top tier (authored
    8: tactic-align-family-opus-default, tactic-align-skills-latest-graph-guard,
    tactic-fingerprint-recipe-single-callsite). Deliberately left below
    strategy-main-health's emergency ceiling (boost 100) — a red-main safety
    signal this fix must not outrank."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add rounds.last_aligned and key the /align-tactics fresh-reading gate off it

## Context (retained from the 2026-07-16 /align-strategy interview)

Witnessed on `strategy-philosophical-grounding`: the router re-selects it for
`/align-tactics` every tick even though a prior round already ran. Root cause,
verified in code and record:

- Its `success_signal.sensor` is "owner review at office-hours" — a human. The
  work that validates the signal is the reading-chunk program, which
  `/align-tactics` correctly born-parks (non-claude work).
- So every round on this strategy produces at most (a) off-path tooling
  (`validates: []`) and (b) born-parked on-path reading chunks (`phase` absent);
  never a claude-executable on-path tactic.
- The selector's coverage gate — `children.some((t) => !isDraft(t) &&
  onPath.has(t.id))` in `packages/intentionsutil/src/router.ts` — therefore
  never trips: born-parked chunks are `isDraft` (phase null), the tooling is
  off-path.
- The backstop clarification 3 mandates ("re-eligible only once its sensor
  produces a reading newer than the round's completion") never fires either: it
  is guarded by `if (count > 0)`, and `rounds.count` / `rounds.last_completed`
  advance only when the last child prunes — verified-in-prod, clarification 22.
  Born-parked reading children never prune, so `count` stays 0 and
  `last_completed` stays null; the strategy is perpetually align-eligible.

## Fix (decided at interview — add rounds.last_aligned)

Three parts, all owned by this strategy's dispatch machinery:

1. **Schema** (`packages/intentionsutil/src/schema.ts`): add
   `rounds.last_aligned: string | null` (ISO date, same shape as
   `last_completed`), default null. Leave `last_completed` meaning
   verified-in-prod (clarification 22) unchanged.
2. **Stamp site**: when an `/align-tactics` round lands its tactics for a
   strategy, stamp that strategy's `rounds.last_aligned` to the round's commit
   date. Settle the exact call site during planning — candidates: the
   align-tactics step-5 `graph-commit`, or the transition writer if
   round-accounting is centralized there.
3. **Gate** (`router.ts`, strategy-candidate loop): replace the `if (count > 0)
   { ...reading newer than last_completed... }` block with a freshness check
   keyed off `last_aligned` that runs regardless of `count`: eligible when
   `last_aligned == null` (never aligned → first round passes) OR
   `readingDate(reading) > last_aligned`. Leave the `count >= 2` hard cap as-is.

Net behaviour: a recurring human-signal strategy is aligned once per new reading
(to born-park the reading's follow-up chunks and sweep drift), then waits —
instead of every tick. Normal claude-signal strategies are unaffected: in-flight
non-draft on-path tactics already exclude them via the coverage gate during
execution, and after prune the `last_aligned` freshness check gates the next
round exactly as the old `count > 0` path did.

## Reuse / anchors

- `packages/intentionsutil/src/router.ts` — `selectGraphTargets`, the strategy
  loop and the `count > 0` fresh-reading block; the `readingDate` helper.
- `packages/intentionsutil/src/attention.ts` — `computeSignalPath` (defines
  on-path; do not change).
- `packages/intentionsutil/src/schema.ts` — the `rounds` shape and validators.
- Doctrine: clarification 3 (fresh-reading gate + round cap) and clarification
  22 (`last_completed` = verified-in-prod) on `strategy-graph-native-dispatch`;
  §3.1 eligibility in `tactic-graph-native-dispatch.md`.

## Verification (sketch — /align-tactics owns the full plan)

- Unit-test `selectGraphTargets`: a strategy with only born-parked on-path
  children plus an off-path implement tactic and `last_aligned` newer than its
  `reading` is NOT emitted; the same with `reading` newer than `last_aligned` IS
  emitted; `last_aligned == null` IS emitted (first round).
- `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes.
- Regression: an ordinary claude-signal strategy mid-execution stays excluded by
  the coverage gate; after prune with no fresh reading it is not re-emitted.
