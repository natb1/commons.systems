---
id: tactic-delegation-reading-drift-observations
kind: tactic
statement: "Observation carrier (no plan, do not dispatch): two immaterial drift
  premises recorded while parking tactic-orphaned-delegation-records-reading —
  the orphan's unreachability is mechanically confirmed, and sensor reading
  prose is doubly constrained by deriveGap's string equality and the router's
  fresh-reading date scrape"
owner: human
status: delegated
parent: null
rationale: "Minted 2026-08-20 by the /align-tactics per-node finalize of
  tactic-orphaned-delegation-records-reading. The drift review surfaced two
  premises it judged IMMATERIAL (plan_depends: false). Per
  strategy-graph-native-dispatch clarification 245 (violation V1 of the
  autonomous-substance invariant, ruled 2026-08-14, extended 2026-08-15) an
  autonomous session may not append these to the serving strategy's
  clarifications — clarification 118, which once allowed it, carries an
  OVERTURNED 2026-08-15 prefix. They land here instead, as one born-parked
  carrier serving the strategy, for a human to promote, mechanize, or drop at
  office hours."
reading: null
serves:
  - strategy-graph-drives-dispatch
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
  reason: "Born-parked observation carrier: holds two immaterial drift premises
    from the 2026-08-20 /align-tactics park of
    tactic-orphaned-delegation-records-reading. It carries NO plan and must
    never be dispatched to an implement lane. OBSERVATION 1 (confirmation,
    likely just drop it): the dead-code half of that tactic's claim is
    mechanically confirmed. readDelegationRecordsReading
    (packages/intentionsutil/scripts/read-sensors.ts:970) has zero production
    callers. makeDelegationRecordsSensor (read-sensors.ts:1166-1183) dispatches
    by node id to exactly two branches — strategy-exercise-recovery-paths ->
    readExerciseRecoveryPathsReading (read-sensors.ts:1028) and
    strategy-realign-attachments -> readRealignAttachmentsReading — with a
    non-throwing fallback string for any other id, and buildDefaultRegistry
    (read-sensors.ts:1604) registers only that factory. Exactly two strategy
    nodes name the sensor \"the delegation records themselves\", so no third
    node can reach the orphan. Its only remaining references are
    packages/intentionsutil/test/delegation-records-sensor.test.ts:14,163,179.
    OBSERVATION 2 (the generalization actually worth a human's eye): any edit to
    a sensor reading's PROSE is constrained on two independent sides at once,
    and neither constraint is documented anywhere a plan author would look.
    deriveGap (packages/intentionsutil/src/sensors.ts:241-255) compares reading
    against success_signal.threshold for trimmed, case-insensitive STRING
    EQUALITY — no numeric or fuzzy parsing — so a reading rewrite not paired
    with an edit to the owning node's threshold silently changes gap state, and
    a threshold no reading will ever equal verbatim is a permanently open gap.
    Separately, readingDate (packages/intentionsutil/src/router.ts:204-208)
    takes the lexicographically newest YYYY-MM-DD token in the reading as its
    timestamp, and the fresh-reading gate (router.ts:526-550) silently starves a
    strategy out of align selection when that date is missing or not newer than
    rounds.last_aligned. The trailing literal \"(sensor read <YYYY-MM-DD>)\"
    clause both live reading functions emit exists solely to satisfy that
    consumer and must survive any rewrite as the newest date-shaped token in the
    string. Every future sensor or reading change is exposed to both traps."
  since: 2026-08-20
  recommendation: "Pick one disposition per observation; none of this is urgent.
    OBSERVATION 1 — DROP. It is a confirmation of a claim already stated on
    tactic-orphaned-delegation-records-reading and adds nothing durable once
    that node is dispositioned. OBSERVATION 2 — choose between: (a) CLARIFY-ONLY
    — record it as a dated clarification on strategy-graph-drives-dispatch,
    whose success signal is precisely 'sensor-run readings exist for every
    strategy that names a sensor', making it the right home for how readings
    must be shaped; or (b) MECHANIZE — the stronger option: add a validate-graph
    rule or a read-sensors self-check asserting that every non-null reading on a
    sensor-naming node ends with a parseable \"(sensor read <YYYY-MM-DD>)\"
    clause, which converts the silent align-selection starvation into a loud
    failure. (b) is worth a real tactic if the starvation failure has bitten
    more than once; otherwise (a) is enough. Delete this carrier once both are
    dispositioned."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier — delegation-records reading drift, 2026-08-20

**This node carries no plan and must not be dispatched.** It is a born-parked
observation carrier: a place to hold two immaterial drift premises until a
human dispositions them at office hours. There is no unit of work here, no
`Scope`, and no `Verification` — an implement lane picking this up would find
nothing to build.

## Why this node exists rather than a clarification

The 2026-08-20 `/align-tactics` per-node run on
`tactic-orphaned-delegation-records-reading` parked that node for requirement
ambiguity, and its drift review surfaced two further premises it judged
**immaterial** (`plan_depends: false`).

An autonomous session may not append those to the serving strategy's
`clarifications`. `strategy-graph-native-dispatch` clarification 118 once
allowed it and now carries an `OVERTURNED 2026-08-15` prefix; clarification
245 (violation V1 of the autonomous-substance invariant, ruled 2026-08-14 and
extended 2026-08-15) binds instead. The reasons are worth restating, because
the reference file still describes the old behaviour: `clarifications` is an
allowlist member of `strategyFingerprint`, so an autonomous write there
soft-freezes *every* open child of the strategy for an observation defined as
gating nothing; and a model-authored dated clarification is
byte-indistinguishable from an author-ruled one, so provenance in the field
that carries doctrine would collapse irreversibly.

So the observations land here, as one carrier serving the strategy, for a
human to promote, mechanize, or drop.

## Observation 1 — the orphan really is unreachable (confirmation)

Mechanically confirmed, so the parked node's dead-code claim needs no
re-verification:

- `readDelegationRecordsReading`
  (`packages/intentionsutil/scripts/read-sensors.ts:970`) has zero production
  callers.
- `makeDelegationRecordsSensor` (`read-sensors.ts:1166-1183`) dispatches by
  node id to exactly two branches — `strategy-exercise-recovery-paths` →
  `readExerciseRecoveryPathsReading` (`read-sensors.ts:1028`) and
  `strategy-realign-attachments` → `readRealignAttachmentsReading` — with a
  non-throwing fallback string for any other id.
- `buildDefaultRegistry` (`read-sensors.ts:1604`) registers only that factory.
- Exactly two strategy nodes name the sensor `the delegation records
  themselves`, so no third node can reach the orphan.
- Its only remaining references are
  `packages/intentionsutil/test/delegation-records-sensor.test.ts:14,163,179`.

**Suggested disposition: drop.** This confirms a claim already stated on
`tactic-orphaned-delegation-records-reading` and adds nothing durable once
that node is dispositioned.

## Observation 2 — reading prose is doubly constrained, and neither constraint is documented

This is the generalization worth a human's attention. Any edit to a sensor
reading's prose is constrained on two independent sides at once, and neither
constraint is written down anywhere a plan author would look:

- **`deriveGap`** (`packages/intentionsutil/src/sensors.ts:241-255`) compares
  `reading` against `success_signal.threshold` for trimmed, case-insensitive
  **string equality** — no numeric or fuzzy parsing; equality is the only
  "met" condition. So a reading rewrite that is not paired with an edit to the
  owning node's `threshold` silently changes gap state, and a threshold that
  no reading will ever equal verbatim is a permanently open gap.
- **`readingDate`** (`packages/intentionsutil/src/router.ts:204-208`) takes
  the lexicographically newest `YYYY-MM-DD` token in the reading as its
  timestamp, and the fresh-reading gate (`router.ts:526-550`) silently starves
  a strategy out of align selection when that date is missing or not newer
  than `rounds.last_aligned`. The trailing literal `(sensor read
  <YYYY-MM-DD>)` clause both live reading functions emit exists solely to
  satisfy that consumer, and must survive any rewrite as the newest
  date-shaped token in the string.

Every future sensor or reading change is exposed to both traps. The parked
sibling node is a live instance of the first one.

**Suggested dispositions — pick one:**

- **(a) Clarify only.** Record it as a dated clarification on
  `strategy-graph-drives-dispatch`, whose success signal is precisely
  "sensor-run readings exist for every strategy that names a sensor", making
  it the right home for how readings must be shaped.
- **(b) Mechanize.** The stronger option: add a `validate-graph` rule or a
  `read-sensors` self-check asserting that every non-null reading on a
  sensor-naming node ends with a parseable `(sensor read <YYYY-MM-DD>)`
  clause, converting the silent align-selection starvation into a loud
  failure. Worth a real tactic if that starvation has bitten more than once;
  otherwise (a) is enough.

## Closing this node

Delete this carrier once both observations are dispositioned.
