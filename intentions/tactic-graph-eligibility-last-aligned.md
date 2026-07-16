---
id: tactic-graph-eligibility-last-aligned
kind: tactic
statement: Add rounds.last_aligned and key the /align-tactics fresh-reading gate
  off it so a strategy whose rounds produce born-parked or off-path work stops
  being re-selected until a new reading lands
owner: ai
status: codified
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
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add rounds.last_aligned and key the /align-tactics fresh-reading gate off it

## Context

Witnessed on `strategy-philosophical-grounding` (2026-07-16 `/align-strategy`
interview): the router re-selects it for `/align-tactics` every tick even
though a prior round already ran. Root cause, verified in code and record:

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
- The backstop (clarification 3: "re-eligible only once its sensor produces a
  reading newer than the round's completion") never fires either: it is guarded
  by `if (count > 0)`, and `rounds.count` / `rounds.last_completed` advance only
  when the last non-draft child prunes — verified-in-prod, clarification 22.
  Born-parked reading children never prune, so `count` stays 0 and
  `last_completed` stays null; the strategy is perpetually align-eligible.

**Intended outcome.** Add a distinct `rounds.last_aligned` timestamp, stamped
at align-decompose landing time (not completion), and key the fresh-reading
gate off it *regardless of count*. A recurring human-signal strategy is then
aligned once per new reading — to born-park the reading's follow-up chunks and
sweep drift — then waits, instead of every tick. `last_completed` keeps its
verified-in-prod meaning (clarification 22) and `count >= 2` stays a hard cap.
The fix is ratified by the 2026-07-16 `last_aligned` clarification on
`strategy-graph-native-dispatch` (its recorded `answer` names this tactic as
the implementation).

**Why `last_aligned`, not counting born-parked chunks as coverage.** The rival
fix — treating born-parked on-path chunks as coverage — would exclude the
strategy until the *entire* reading program finished and never re-open to sweep
drift on a new reading, losing the per-reading cadence clarification 3 intends.
The clarification explicitly rejects that alternative.

## Units of work

### Unit 1 — Add `rounds.last_aligned` to the schema and preserve it in `stampRound`

**Recommended model:** sonnet

**Scope.** Add the `last_aligned` field to the `Rounds` shape and keep the
completion-time stamp from wiping it. These two edits are TS-coupled — adding
the field to the `Rounds` interface makes `stampRound`'s current
`{ count, last_completed }` return a type error — so they land together.

- `packages/intentionsutil/src/schema.ts`:
  - `Rounds` interface (`schema.ts:355-358`): add `last_aligned: string | null;`
    after `last_completed`. Keep the doc comment; note `last_aligned` = the
    date the last `/align-tactics` round landed (align-decompose time), distinct
    from `last_completed` = verified-in-prod.
  - `validateRounds` (`schema.ts:449-454`): add
    `last_aligned: optionalString(value.last_aligned, \`${field}.last_aligned\`)`
    to the returned object. `optionalString` returns `null` for an absent key
    (`schema.ts:197`, `value == null` covers `undefined`), so existing serialized
    `rounds` blocks without the field validate to `last_aligned: null` — no
    migration of stored nodes needed.
- `packages/intentionsutil/src/transitions.ts`:
  - `stampRound` (`transitions.ts:275-277`): change the return to
    `{ count: (rounds?.count ?? 0) + 1, last_completed: date, last_aligned: rounds?.last_aligned ?? null }`
    so closing a round preserves the align stamp instead of dropping it. Update
    the doc comment to note it preserves `last_aligned`.

**Out of scope.** Do NOT add a `stampAlign` helper. There is no code
align-landing writer today (`reconcile-graph.ts:161` — the only `stampRound`
caller — stamps `last_completed` at *completion*, the wrong event). The
align-landing stamp is bootstrap-by-hand in the `/align-tactics` skill (Unit 3);
a code helper would be uncalled until the router automates align, which is a
separate future tactic. Do not change `last_completed` semantics.

**Dependencies.** None.

### Unit 2 — Re-key the fresh-reading gate off `last_aligned`, regardless of count

**Recommended model:** opus

**Scope.** `packages/intentionsutil/src/router.ts`, the strategy-candidate loop
inside `selectGraphTargets`. Replace the `if (count > 0) { ... }` fresh-reading
block (`router.ts:315-339`) with a freshness check keyed off `last_aligned`
that runs **regardless of `count`**:

- Read `const lastAligned = s.rounds?.last_aligned ?? null;`.
- Eligible (fall through to `candidates.push(asCandidate(false))`) when
  `lastAligned === null` — never aligned, so any first round passes, preserving
  first-round behaviour for both count-0 and count-null strategies.
- Otherwise (a prior align landed) require a reading strictly newer than
  `lastAligned`. Skip with a `stale-reading` event when:
  - `s.reading === null` (detail: `last_aligned set (...) but reading is null`),
    or
  - `readingDate(s.reading)` is `null` (unparseable date — fails the gate,
    preserving current behaviour) or `<= lastAligned.slice(0, 10)`
    (detail: `no reading newer than rounds.last_aligned=...`).
- Leave the `count >= 2` round-cap block above (`router.ts:303-312`) unchanged;
  it still runs first.
- The net effect on the bug: a human-signal strategy that aligned once (`count`
  stays 0, `last_aligned` set) with only born-parked on-path children + off-path
  tooling and no fresher reading is now `stale-reading`-skipped instead of
  re-emitted every tick.

Update the `selectGraphTargets` doc comment's "Strategy eligibility" paragraph
(`router.ts:194-198`), which currently says the fresh-reading gate is
`rounds.count == 0, or a reading dated newer than rounds.last_completed`, to
describe the `last_aligned`-keyed gate.

**Out of scope.** `computeSignalPath` / on-path derivation
(`packages/intentionsutil/src/attention.ts` — do not change). The coverage gate
(`children.some(...)`), the soft-freeze scan, and `strategyAlignSelectable`
(`router.ts:374`, a thin wrapper over `selectGraphTargets` — inherits the new
gate with no edit).

**Dependencies.** Unit 1 (reads `s.rounds.last_aligned`).

### Unit 3 — Stamp `last_aligned` at align-landing (bootstrap by-hand) in the skill

**Recommended model:** sonnet

**Scope.** `.claude/skills/align-tactics/SKILL.md`. Without a real stamp,
`last_aligned` stays `null` forever and the Unit 2 gate always passes — the bug
is not fixed. In the bootstrap interim (no live router), `/align-tactics` lands
its round by hand via `graph-commit`, so the stamp is by hand in the same commit.

- **"Strategy round accounting" paragraph** (`SKILL.md:450-459`): add that when
  an `/align-tactics` round lands its tactics for a strategy, it stamps that
  strategy's `rounds.last_aligned` to the round's commit date
  (`date -u +%Y-%m-%d`) via `write-node.ts`, bundled into the same
  `graph-commit` as the round's tactics — distinct from `count` /
  `last_completed`, which stay completion-time (clarification 22).
  Note the caveat that a **per-node finalize** (`/align-tactics <tactic-id>`)
  does *not* stamp `last_aligned` — it is not a strategy round (per
  clarification 52; it never bumps `rounds`).
- **Eligibility-description lines** (`SKILL.md:159-160`, Step 1's fresh-reading
  gate prose: "a reading exists newer than `rounds.last_completed`"): update to
  reference `rounds.last_aligned` so the skill's own description matches the
  re-keyed selector.

**Out of scope.** A code `stampAlign` helper or an automated align-landing
writer (future router-automation tactic). Changing the `graph-commit` script
itself.

**Dependencies.** Unit 1 (the field must exist for `write-node.ts` to accept it).

### Unit 4 — Tests

**Recommended model:** sonnet

**Scope.** `packages/intentionsutil/test/router.test.ts` (and a `stampRound`
assertion wherever `transitions` is unit-tested).

The existing fresh-reading tests (`router.test.ts:230-275`) encode the **old**
`last_completed`-keyed contract, which the ratified clarification deliberately
replaces. Rewrite them to the `last_aligned` semantics — this is a contract
change, not test-weakening (the whole point of the fix is that `last_completed`
was the wrong anchor). Cases:

- `last_aligned == null` (never aligned) → emitted (first round), for both
  `rounds: null` and `rounds: { count: 0, last_completed: null, last_aligned: null }`.
- `last_aligned` set, `reading` null → NOT emitted; `stale-reading` event.
- `last_aligned` set, `reading` older than `last_aligned` → NOT emitted;
  `stale-reading` event.
- `last_aligned` set, `reading` newer than `last_aligned` → emitted.
- **Regression for the bug** (the case the whole tactic exists to fix): a
  strategy with `count: 0`, `last_aligned` set, whose only children are
  born-parked on-path chunks (phase absent) plus an off-path `implement` tactic
  (`validates: []`), and whose `reading` is not newer than `last_aligned` → NOT
  emitted (previously, `count == 0` made it fresh and it was emitted every tick).
- `count >= 2` still logs `rounds-cap` and skips (the cap runs before the
  freshness check) — keep the existing case (`router.test.ts:215`).
- `stampRound` preserves an existing `last_aligned` while bumping `count` /
  setting `last_completed`.

Check the `strategy()` test fixture helper (`router.test.ts:35`, which spreads
`partial.rounds ?? null`) still produces valid `Rounds` — a fixture that sets
`rounds` must now include `last_aligned` (or rely on `validateRounds` defaulting
it) so it typechecks.

**Dependencies.** Units 1, 2 (and 3 is prose-only, untested here).

## Reuse

- `packages/intentionsutil/src/router.ts` — `selectGraphTargets` strategy loop,
  the `count > 0` fresh-reading block, `readingDate` (`router.ts:153`),
  `strategyAlignSelectable` (`router.ts:374`).
- `packages/intentionsutil/src/schema.ts` — `Rounds` interface, `validateRounds`,
  `optionalString` (`schema.ts:197`).
- `packages/intentionsutil/src/transitions.ts` — `stampRound` (`transitions.ts:275`).
- `packages/intentionsutil/scripts/reconcile-graph.ts:161` — the single
  `stampRound` caller (completion-time), confirming the align stamp is a
  *different* event with no existing code site.
- `packages/intentionsutil/test/router.test.ts` — the `strategy()` fixture and
  the fresh-reading / rounds-cap test cases to rewrite.
- Doctrine: clarification 3 (fresh-reading gate + round cap), clarification 22
  (`last_completed` = verified-in-prod), and the 2026-07-16 `last_aligned`
  clarification on `strategy-graph-native-dispatch`; §3.1 eligibility in
  `tactic-graph-native-dispatch.md`.

## Verification

```verify
npx vitest run --project intentionsutil --root .
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual / judgment checks:

- Confirm the rewritten `router.test.ts` cases assert the `last_aligned`
  semantics above, including the born-parked-only regression case that fails
  before Unit 2 and passes after.
- Sanity-read the `selectGraphTargets` doc comment and the `SKILL.md`
  eligibility prose so neither still describes the retired `last_completed`-keyed
  gate.
- Regression: an ordinary claude-signal strategy mid-execution stays excluded by
  the coverage gate; after its last child prunes with no fresh reading it is not
  re-emitted (the `last_aligned` freshness check gates the next round exactly as
  the old `count > 0` path did).
