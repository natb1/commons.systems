---
id: tactic-attributes-phase-squatter-drift-observations
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics tactic-mode
  round on tactic-attributes-phase-squatter-retire: four immaterial Side-B drift
  observations with no legal autonomous destination — the squatter population
  shrank 6 to 3 out of band, the backfill has a cross-subtree effect on three
  foreign strategies, the retirement's ban is narrower than the reader set it
  deletes, and the strategy's own maintenance-burden reading is ten days stale
  and re-measures upward"
owner: human
status: delegated
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Observation carrier, not planned work — four immaterial Side-B drift
    observations from the 2026-08-20 /align-tactics tactic-mode round finalizing
    tactic-attributes-phase-squatter-retire. None gates that node's plan (all
    four are plan_depends: false) and none may be written to the serving
    strategy's clarifications by an autonomous lane (clarification 245 / V1,
    which overturned clarification 118), so this born-parked node is their
    destination. (1) POPULATION DRIFT: the tactic's recorded 'six remaining
    squatters' is stale — three remain, because f42da977 (2026-08-04, 'bootstrap
    step 1a') hand-migrated tactic-noncodegen-session-model-defaults,
    tactic-outcome-envelope-qa-accounting and
    tactic-token-audit-node-attribution out of band. The generalizable form: a
    hand migration landed by an operator leaves no trace on the node that owns
    the migration, so the owning tactic's population count silently rots. (2)
    CROSS-SUBTREE EFFECT: all three surviving squatters serve OTHER strategies
    (strategy-attention-surface, strategy-recover-finance,
    strategy-own-audience), so the backfill activates three dormant nodes into
    the main-qa lane in foreign subtrees. Intended and precedented, but the
    tactic record does not state it. (3) BAN NARROWER THAN THE DELETION:
    graph-wide there are zero attributes.office_hours and zero
    attributes.execution squatters, so five of check-node-selection.ts's six
    squatter-aware readers already read dead keyspace. The tactic statement
    scoped the new validate-graph rule to attributes.phase alone, which would
    leave those two keyspaces un-banned after their readers are deleted; this
    round's plan resolves it by widening Rule 23 to any attributes key that
    shadows a first-class field, and a key census confirms phase is the only
    live collision. Recorded because the widening is the plan's own greenfield
    judgment, not something the author ruled. (4) BURDEN BAND RE-MEASURES
    UPWARD: the strategy's recorded reading is 58/236 = 24.6% dated 2026-08-10;
    re-measured 2026-08-20 with the strategy's own sensor
    (align-tactics-census.ts on strategy-graph-native-dispatch) it is 94/301 =
    31.2% — 68 open (33 implement, 21 main-qa, 13 qa, 1 review) plus 26
    born-parked over 301 serving tactics. The <=35% ceiling clause holds; the
    'non-increasing across consecutive samples' clause does not on this sample,
    ending the recorded 47.6% -> 38.2% -> 31.4% -> 24.6% descent. NOT read as
    the condition failing (the condition names failure as burden growing without
    bound, and one sample inside the ceiling is not that), and it bears on no
    premise of the node under review. See the body for what each disposition
    would look like."
  since: 2026-08-20
  recommendation: "Read this at office hours and pick one disposition per
    observation; nothing here is dispatchable as written and this node must
    never be sent to a phase worker. Suggested per item — (1) DROP: the
    population count is already corrected in
    tactic-attributes-phase-squatter-retire's statement and body this round, so
    nothing is owed unless you want the general lesson (an out-of-band hand
    migration should touch the owning tactic) recorded as a clarification or
    mechanized as a census check. (2) CLARIFY-ONLY at most: the cross-subtree
    effect is the deliberate point of retiring the dual representation, so it
    needs no ratification; record it only if you want the foreign-subtree
    consequence stated on the record before the backfill lands. (3) RATIFY OR
    NARROW: this is the one worth your attention — the plan widened the new
    validate-graph rule from 'reject attributes.phase' to 'reject any attributes
    key shadowing a first-class field'. Ratify the widening (a key census found
    phase to be the only live collision, so there are zero false positives), or
    tell the implementer to ship the narrow phase-only ban and accept that
    attributes.office_hours and attributes.execution stay silently ignored once
    their readers are gone. (4) RE-MEASURE AND RE-STAMP: run an /align round on
    strategy-graph-native-dispatch to refresh its reading — the recorded
    denominator (236) is materially smaller than the live population (301), so
    the stored series is not comparable to a fresh sample. A second consecutive
    rise is the signal the burden condition actually names; this first one is
    not. A per-node tactic-target session cannot write the strategy, which is
    why this is owed to you rather than done here."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier — 2026-08-20 /align-tactics drift sweep on tactic-attributes-phase-squatter-retire

## What this node is

This is an **observation carrier**, not planned work. It has no units, no
scope, and no verification, and it must **never** be dispatched to a phase
worker. It exists because the 2026-08-20 `/align-tactics` tactic-mode round
that finalized `tactic-attributes-phase-squatter-retire` surfaced four
immaterial Side-B drift observations, and an autonomous lane has nowhere
legal to put them: strategy clarification 245 (violation V1, which overturned
clarification 118) forbids an autonomous session writing `clarifications` onto
a strategy, and a tactic-target session never touches the serving strategy's
frontmatter at all. Every observation here is `plan_depends: false` — none
gates the plan the round landed.

Its disposition is a human's at office hours. The `office_hours.recommendation`
carries a suggested disposition per item; this body carries the evidence.

## Observation 1 — an out-of-band hand migration rotted the owning tactic's count

`tactic-attributes-phase-squatter-retire` was filed 2026-07-30 naming **six**
nodes carrying `phase: null` plus `attributes.phase: main-qa`. Three remain.
Commit `f42da977` (2026-08-04, "graph: bootstrap step 1a — unpark 7 nodes,
migrate 3 attributes.phase squatters to phase main-qa, resolve baseline-proxy
to done") lifted `tactic-noncodegen-session-model-defaults`,
`tactic-outcome-envelope-qa-accounting` and `tactic-token-audit-node-attribution`
to `phase: done` with `attributes: {}` and their `execution` objects intact. No
data was lost, and the migration was correct.

What is worth a human's eye is the **shape**, not the correction: an operator
landed half of a tactic's own migration out of band and nothing touched the
tactic that owns it, so its recorded population silently rotted for sixteen
days. The count was only caught because this round re-measured before planning.
The generalizable form — a hand migration that partially discharges a tactic
should leave a trace on that tactic — is either a clarification or a mechanized
census check; it is not obviously either, which is why it is here rather than
decided.

Both the statement and the plan body of `tactic-attributes-phase-squatter-retire`
were corrected to three in this same round, so **nothing is owed on the count
itself**.

## Observation 2 — the backfill reaches into three foreign subtrees

All three surviving squatters serve strategies other than the one being
decomposed:

| node | `execution.pr` | serves |
|---|---|---|
| `tactic-attention-surface-analytics-collector` | 2783 | `strategy-attention-surface` |
| `tactic-budget-txn-identity` | 2832 | `strategy-recover-finance` |
| `tactic-indieweb-audience` | 2802 | `strategy-own-audience` |

Lifting them to first-class `phase: main-qa` makes them visible to every reader
that consults `node.phase` directly — which the squatter keyspace currently
hides them from — so three dormant nodes enter the `/qa-main` lane in three
subtrees this strategy does not own.

That is the deliberate point of retiring the dual representation, it has the
`234e52e7` and `f42da977` precedents, and it needs no author ratification. It is
recorded only because the tactic's own record does not state the cross-subtree
consequence anywhere, and a reader of that node would not learn it from the node.

## Observation 3 — the recorded ban is narrower than the reader set it deletes

Measured graph-wide this round: **zero** nodes carry `attributes.execution`,
`attributes.office_hours`, `attributes.validates`, `attributes.blocked_by`,
`attributes.rounds` or `attributes.pace_exempt`. `attributes.phase` on the three
nodes above is the entire live squatter population.

So of the six squatter-aware readers in
`packages/intentionsutil/scripts/check-node-selection.ts` that the retirement
deletes, only `readPhase` has any live data behind it; `readParked`,
`readStrategyFingerprint`, `readMarkers`, `readFixState` and `readConflictState`
already read a keyspace no node populates. The last four say so in their own doc
comments ("in practice only the first-class read fires; the squatter fallback is
kept for uniformity").

The asymmetry: the tactic's recorded statement scoped the new `validate-graph`
gate to `attributes.phase` alone. Taken literally, deleting the `office_hours`
and `execution` fallbacks while banning only `phase` would leave those two
keyspaces **un-banned** — a future re-squat there would be silently ignored
rather than producing the clear error `.claude/rules/code-style.md` asks for.

This round's plan resolved that by **widening** Rule 23 to reject any
`attributes` key whose name collides with a first-class `IntentionNode` field,
with the forbidden set derived from the schema's own field list under a
compiler-enforced completeness check. A census of every `attributes` key in use
across `intentions/` (51 distinct keys) found `phase` to be the only live
collision, so the wider rule has exactly the three known violations — all fixed
by the plan's Unit 1 — and zero false positives.

**That widening is the plan's own greenfield judgment, not an author ruling**,
which is why it is surfaced here. It is the one item in this carrier where a
human's answer would change shipped behavior.

## Observation 4 — the strategy's maintenance-burden reading is stale and re-measures upward

Re-derived 2026-08-20 with the strategy's own declared sensor
(`npx tsx packages/intentionsutil/scripts/align-tactics-census.ts strategy-graph-native-dispatch intentions`),
not a grep:

| | open | born-parked | total serving tactics | backlog |
|---|---|---|---|---|
| recorded reading (2026-08-10) | — | — | 236 | 58 = **24.6%** |
| re-measured (2026-08-20) | 68 | 26 | 301 | 94 = **31.2%** |

The 68 open tactics break down as 33 `implement`, 21 `main-qa`, 13 `qa`, 1
`review`.

Against the declared band on `strategy-graph-native-dispatch`: the **≤35%
ceiling clause holds**. The **"non-increasing across consecutive samples" clause
does not hold on this sample**, ending the recorded 28-day descent
(47.6% → 38.2% → 31.4% → 24.6%).

This sweep does **not** read that as the condition failing. The condition names
its own failure as burden "growing without bound", which one sample inside the
declared ceiling is not; the strategy's derived `gap` already declares the
reading short of threshold; and the band bears on no premise of the node under
review — which is itself burden-reducing work, so blocking it on a burden rise
would be perverse.

Two things are nevertheless owed to the author. The `reading` field is ten days
stale and its **denominator** (236) is materially smaller than the live
population (301), so the stored series is not comparable to a fresh sample —
part of the rise is population growth the recorded series cannot separate out.
And a **second consecutive rise** would be the signal the condition actually
names. Refreshing `reading` requires an `/align` round on the strategy; a
per-node tactic-target session cannot write it, which is why this is recorded
rather than fixed.

## Provenance

Round: `/align-tactics tactic-attributes-phase-squatter-retire`, 2026-08-20,
tactic mode (per-node finalize), against `origin/main` at `c281e300`. The
Workflow returned `proceed: true`, no parks, and one planned tactic; these four
observations came back as `drift.unrecorded_premises`, all
`material: false` / `plan_depends: false`.

The caller thread re-verified every factual limb before transcribing it here,
per the standing distrust of Workflow-returned claims:

- Observation 1's population and the three drained ids were re-derived by
  reading all 728 nodes' frontmatter and by `git log` on
  `intentions/tactic-token-audit-node-attribution.md`, which names `f42da977`.
  **Confirmed as returned.**
- Observation 2's `serves` and `execution.pr` values were read off the three
  node files. **Confirmed as returned.**
- Observation 3's "zero `attributes.execution` / `attributes.office_hours`"
  claim was re-derived from the same full-store read. **Confirmed as returned.**
- Observation 4's numbers were re-run through the census script on the caller
  thread: 301 serving tactics, 68 open, 26 born-parked, and the exact
  33/21/13/1 phase split. **Confirmed as returned.**

Two claims in the round's **plan body** were corrected by the caller before
landing, and are noted here so the next reader knows the checking was done: the
`attributes`-key census count (returned as 57 distinct keys; the real count is
51, and the returned example list named a `wait_*` family no node currently
carries), and eight `path:line` anchors that were off by 1–10 lines
(the squatter-read block bounds, four of the six reader spans, and three test
anchors in `packages/intentionsutil/test/check-node-selection.test.ts` and
`packages/intentionsutil/test/schema.test.ts`). No substantive finding changed.

The carrier for fixing `/align-tactics` to mint this node shape automatically —
rather than leaving the caller thread to do the redirect by hand — is
`tactic-align-tactics-immaterial-drift-redirect`.
