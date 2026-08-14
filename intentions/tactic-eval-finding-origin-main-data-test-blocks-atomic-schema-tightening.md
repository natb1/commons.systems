---
id: tactic-eval-finding-origin-main-data-test-blocks-atomic-schema-tightening
kind: tactic
statement: packages/intentionsutil/test/office-hours.test.ts runs the branch own
  schema code against origin/main live intentions data, so any PR that both
  migrates node data and tightens the schema that reads it is
  red-by-construction until it merges — align-tactics planned exactly that pair
  as one atomic unit, and the implement phase spent a 21 usd opus investigation
  confirming no code fix exists before deferring Unit 4, parking the node and
  halting the ladder at its second rung
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: investigation_subagent_price_proxy
      value: 21.02
      unit: usd
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: planned_units_landed
      value: 3
      unit: units of 4 planned
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14
      sensor: rsi
      measured: 2026-08-14
    - metric: phase_price_proxy
      value: 112.67
      unit: usd
      window: tactic-attention-per-tier-boost-migration/implement 2026-08-14
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
## What was observed

Node tactic-attention-per-tier-boost-migration, `implement` phase, ladder run
started 2026-08-14T17:11:29Z (`--since 1786727489`).

The persisted plan directed four units to land as one PR: Units 1-3 introduce
the closed `BOOST_LEVELS` vocabulary, an idempotent migration script, and the
91-node data migration; Unit 4 adds `validateGraph` rule 22 rejecting an
off-vocabulary boost and deletes the legacy `boost:` / `override:` compat parse
branches in `validateAttention`.

Unit 4 cannot land in that PR. `packages/intentionsutil/test/office-hours.test.ts:860`
opens `describe.skipIf(!hasOriginMain())("office-hours-select CLI (real repo)")`,
and every case inside it reads `intentions/` at the literal `origin/main` git
ref — `git -C <root> show origin/main:intentions/<id>.md`, test lines 875 and
890 — while executing **this branch's** schema code. Until the migration PR
merges, `origin/main` still carries the legacy spelling; `origin/main`'s own
`packages/intentionsutil/src/schema.ts:435-461` still holds the two compat
branches, with a comment naming this very tactic node as the thing that will
delete them. So a branch that tightens the validator makes its own test suite
reject `origin/main`'s live data, and CI runs with `fetch-depth: 0`, so
`origin/main` resolves in GitHub Actions too. The red check is permanent and
self-resolving only on merge.

This is not a coding defect and no code fix exists that keeps both the test's
real-`origin/main` guarantee and the legacy-branch deletion. It is a **planning
constraint the plan did not encode**: any PR that both migrates node data and
tightens the schema that reads it is red-by-construction, and the plan asked
for exactly that pair atomically.

## Cost of the miss, measured

- The implement worker spent a 107-turn opus subagent (`agent-a8dad0ad0d90f1e86`,
  $21.02 price proxy, peak context 131,661 tokens) investigating whether a
  legitimate code fix existed. It concluded none does — a correct answer to a
  question the plan should have foreclosed.
- The phase could not use `transition-node`. It ended by writing a deviation
  escalation and stopping, the terminal-without-disposition sweep parked the
  node ~319s later (park commit 0ea4026f, 2026-08-14T17:50:56Z), and
  `dispatch-ladder-run` halted exit 11 `terminus=excused-parked`.
- Net: the ladder stops at the second rung, a human is now required to sequence
  a follow-up, and PR #3093 ships 3 of 4 planned units.
- Phase totals: 6 sessions, 399 turns, $112.67 price proxy / $27.52 cost.

## What would have to change

This recurs for every future closed-vocabulary tightening over live graph data,
which is a shape this repo will keep producing. Two candidate directions, for
the author to choose between:

1. **Encode the constraint at plan time.** `/align-tactics` has no rule that a
   data migration and the validator tightening that rejects the pre-migration
   spelling cannot share a PR. A planning-time check — or a documented rule the
   planner reads — would split them into two dependent tactics with `blocked_by`
   ordering instead of one unit the implementer has to discover is unlandable.
2. **Remove the coupling in the test.** The real-repo CLI suite's guarantee is
   that a listed node is genuinely parked *on `origin/main`*. It reads
   `origin/main`'s data with the branch's parser. Pinning the parser used for
   that assertion to `origin/main`'s own code, or asserting on the parked-ness
   fact without full schema validation, would break the chicken-and-egg for
   every future migration without weakening the invariant.

Direction 1 is the cheaper and more general fix; direction 2 removes the class.
Recording only; this evaluator applies neither.

## Evidence a later session cannot rediscover

- Worker session `09888b78-be81-4597-bb3d-55b3cfa00d63`, transcript ends
  2026-08-14T17:45:37.305Z with a summary turn; it never called
  `transition-node` and never called `park-node`.
- Investigation subagent `agent-a8dad0ad0d90f1e86`, $21.02 price proxy.
- Ladder events: `.claude/worktrees/tactic-attention-per-tier-boost-migration.ladder/events.jsonl`,
  `implement` lines 2026-08-14T17:12:06Z through 17:52:43Z.
