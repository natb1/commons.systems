---
id: tactic-read-sensors-arg-rejection-drift-observations
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics tactic-mode
  round on tactic-read-sensors-arg-rejection-check-mode: four Side-B drift
  observations with no legal autonomous destination — stale draft anchors
  refreshed against a 173-line file drift, a concurrent same-file editor under a
  different strategy, a verified zero-blast-radius finding for the CLI contract
  tightening, and a condition-2/condition-3 status review of the serving
  strategy"
owner: human
status: delegated
parent: null
rationale: "Auto-created by the 2026-08-20 /align-tactics tactic-mode finalize
  of tactic-read-sensors-arg-rejection-check-mode. The Workflow's drift phase
  returned four immaterial Side-B observations as clarifications_to_add. A
  per-node tactic-target session may not write them to the serving strategy:
  strategy clarification 245 (violation V1 of the autonomous-substance
  invariant) overturned clarification 118, and
  .claude/skills/align-tactics/references/tactic-target.md forbids any strategy
  frontmatter write from this path. They are recorded here instead, born-parked,
  for a human to promote, mechanize, or drop at office hours. This node carries
  NO plan and must not be dispatched."
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
  reason: "Observation carrier, not planned work — four Side-B drift observations
    from the 2026-08-20 /align-tactics tactic-mode round on
    tactic-read-sensors-arg-rejection-check-mode, with no legal autonomous
    destination (clarification 245 / V1 forbids an autonomous lane writing
    strategy clarifications, and a tactic-target session never touches the
    serving strategy's frontmatter at all). (1) STALE DRAFT ANCHORS,
    MECHANICALLY REFRESHED: the draft's cited anchors into
    packages/intentionsutil/scripts/read-sensors.ts were ~150 lines stale (file
    grew 1592 -> 1765 lines since the 2026-08-13 filing at 8f1dff05). Recomputed
    against origin/main c281e300 and folded into the finalized plan; the
    structural shape the tactic targets is unchanged and the defect is confirmed
    live. The generalization that stays unrecorded: a draft filed with line
    anchors decays silently, and nothing in the graph flags it — the
    /align-tactics caller note is the only thing that caught it, by convention
    rather than by mechanism. (2) CONCURRENT SAME-FILE EDITOR ACROSS STRATEGIES:
    tactic-realignment-coverage-sensor (codified, phase implement, serves
    strategy-realign-attachments) is actively editing read-sensors.ts in the
    buildDefaultRegistry region (:1604-1626). This node's edits are disjoint
    (main() :1735-1761, a new argv parser, and a write-loop guard in
    readStoreSensors :1724-1728), so a textual conflict is unlikely, but the
    graph surfaces no cross-strategy same-file contention signal at all — the
    overlap was found only by grepping node bodies. (3) ZERO BLAST RADIUS,
    VERIFIED: strict unknown-argument rejection breaks no existing caller. The
    only invocation surface is the npm script read-sensors
    (packages/intentionsutil/package.json:18), invoked as `npm run read-sensors
    --prefix packages/intentionsutil` with no script arguments (--prefix is
    consumed by npm, not forwarded). No CI workflow, hook, or dispatch script
    invokes it; remaining repo references are prose. The only argument in live
    use is --report, which the tactic keeps. (4) SERVING-STRATEGY CONDITION
    REVIEW: condition 1 holds (strategy-autonomous-execution is codified;
    dispatch-tick is live). Condition 2's enforcement half is outstanding —
    validateGraph's only cycle rule is the blocked_by DFS at
    packages/intentionsutil/src/schema.ts:1507-1546, and
    packages/intentionsutil/src/attention.ts:442-455 states that rejecting
    mixed-relation cycles on the write path is out of scope for the resolver and
    belongs to tactic-attention-unified-relation-cycle-rule (status raw, phase
    null) — but its empirical half holds and the obligation is filed and owned,
    so it is outstanding work, not a dead premise. Condition 3 is currently
    vacuous: no COUNT-nodes-by-tier consumer exists (census.ts is tier-free,
    frontier-view.ts tier-agnostic); the ownTier readers in goals.ts and
    router.ts are per-node ordering fallbacks. Naming trap worth knowing:
    officeHours.ts's QueueMember.ownTier is populated with the RESOLVED tier
    (`ownTier: tier`, :99). ADDITIONAL OBSERVATION surfaced by the plan phase,
    recorded here because it is a second instance rather than this tactic's own
    scope: packages/intentionsutil/scripts/validate-graph.ts:93-105 carries the
    same silently-drops-unknown-flags defect (`argv.filter((a) =>
    !a.startsWith('-'))` discards every flag before the positional count check),
    so the defect this tactic closes is a class, not an isolated case."
  since: 2026-08-20
  recommendation: "Three explicit dispositions, pick per observation rather than
    wholesale. DROP: (1) and (3) are round-local bookkeeping — (1) was already
    absorbed into the finalized plan's Context section and (3) is a one-off
    blast-radius verification with no standing consequence; dropping both loses
    nothing. CLARIFY-ONLY: (4) is the natural candidate — if the
    condition-2/condition-3 status review is worth keeping, promote it verbatim
    as a dated clarification on strategy-graph-drives-dispatch so the next round
    does not re-derive it, and note there that condition 3 is currently vacuous.
    MECHANIZE: (2) and the validate-graph.ts second instance are the two with
    real leverage. For (2), consider whether the selector or a lint should
    surface cross-strategy same-file contention between open tactics, since
    today it is only findable by grepping node bodies. For the validate-graph.ts
    instance, file it as its own tactic serving whichever strategy owns the
    graph readers — it is the same defect class as this node's, in a script that
    IS inside clarification 242's required-explicit-tree scope, which makes it
    the stronger of the two candidates."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier — four Side-B drift observations from the 2026-08-20 /align-tactics round on tactic-read-sensors-arg-rejection-check-mode

**This node carries no plan and must not be dispatched.** It is a born-parked
observation carrier: a place to record drift-review observations that have no
legal autonomous destination, so a human can promote, mechanize, or drop them at
office hours. It is `office_hours`-parked from birth and never advances a phase.

## Why these are recorded here rather than on the strategy

The Workflow's drift phase returned four **immaterial** Side-B observations as
`clarifications_to_add`. A per-node `/align-tactics <tactic-id>` session may not
write them to the serving strategy:

- Strategy clarification **245** (violation **V1** of the autonomous-substance
  invariant, ruled 2026-08-14, extended 2026-08-15) **overturned** clarification
  118's permission for a per-node session to append clarifications. `clarifications`
  is an allowlist member of `strategyFingerprint`, so an autonomous write would
  soft-freeze every open child of the strategy for an observation defined as
  gating nothing — and a model-authored dated clarification is
  byte-indistinguishable from an author-ruled one.
- `.claude/skills/align-tactics/references/tactic-target.md` independently
  forbids any strategy frontmatter write from the tactic-target path.

## The observations

### 1. Stale draft anchors, mechanically refreshed (verified)

The draft's cited anchors into `packages/intentionsutil/scripts/read-sensors.ts`
were roughly 150 lines stale: the file grew from 1592 to 1765 lines between the
2026-08-13 filing (`8f1dff05`) and this round (`origin/main` `c281e300`). Every
anchor was recomputed against the current checkout and folded into the finalized
plan; the structural shape the tactic targets is unchanged and the defect is
confirmed live and unfixed.

What stays unrecorded is the generalization: **a draft filed with `path:line`
anchors decays silently, and nothing in the graph flags it.** The staleness was
caught only by the `/align-tactics` caller-note convention, not by any mechanism.

### 2. Concurrent same-file editor under a different strategy

`tactic-realignment-coverage-sensor` (`status: codified`, `phase: implement`,
`serves: [strategy-realign-attachments]`) is actively editing the same file, in
the `buildDefaultRegistry` region (`read-sensors.ts:1604-1626`). This node's edits
are disjoint — `main()` (`:1735-1761`), a new argv parser, and a write-loop guard
inside `readStoreSensors` (`:1724-1728`) — so a textual conflict is unlikely, and
the plan already tells the implementer to merge `origin/main` before opening the
PR.

The observation is that **the graph surfaces no cross-strategy same-file
contention signal at all.** The overlap was found by grepping node bodies for the
filename; nothing in the selector, the router, or `validate-graph` would have
raised it.

### 3. Zero blast radius for the CLI contract tightening (verified)

Strict unknown-argument rejection in `read-sensors.ts` breaks no existing caller.
The only invocation surface is the npm script `read-sensors`
(`packages/intentionsutil/package.json:18`, `tsx scripts/read-sensors.ts`),
invoked in the recorded procedures as
`npm run read-sensors --prefix packages/intentionsutil` with **no script
arguments** — `--prefix` is consumed by npm, not forwarded. No CI workflow, hook,
or dispatch script invokes it at all; the remaining repo references are prose. The
only argument in live use is `--report`, which the tactic keeps. So the change is
additive at the contract level and needs no caller migration.

### 4. Serving-strategy condition review (all three checked)

- **Condition 1 holds.** `strategy-autonomous-execution` is `status: codified`;
  `dispatch-tick` is live and recently touched.
- **Condition 2's enforcement half is outstanding.** `validateGraph`'s only cycle
  rule is the `blocked_by` DFS `checkBlockedByCycles`
  (`packages/intentionsutil/src/schema.ts:1507-1546`), and
  `packages/intentionsutil/src/attention.ts:442-455` states that rejecting
  mixed-relation cycles on the write path is out of scope for the resolver and
  belongs to `tactic-attention-unified-relation-cycle-rule` (`status: raw`,
  `phase: null`). The condition's empirical half (the relation stays acyclic
  today) holds and the obligation is filed and owned, so this is outstanding work
  rather than a dead premise — **not** a Side-A failure.
- **Condition 3 is currently vacuous.** No COUNT-nodes-by-tier consumer exists:
  `census.ts` is tier-free and `frontier-view.ts` tier-agnostic; the `ownTier`
  readers in `goals.ts` and `router.ts` are per-node ordering fallbacks. A naming
  trap worth knowing: `officeHours.ts`'s `QueueMember.ownTier` is populated with
  the **resolved** tier (`ownTier: tier`, `officeHours.ts:99`), not the own tier
  its name promises.

None of the three bear on this node's CLI argument-parsing change. Recorded so
the check is not re-run from scratch next round.

### Additional: the defect is a class, not an isolated case

Surfaced by the plan phase, recorded here because it is a second instance rather
than this tactic's own scope:
`packages/intentionsutil/scripts/validate-graph.ts:93-105` carries the same
silently-drops-unknown-flags defect — `parseIntentionsDir` runs
`argv.filter((a) => !a.startsWith("-"))`, discarding **every** flag before the
positional-count check, so an unknown or misspelled flag is swallowed exactly as
`read-sensors.ts` swallows `--dir`. Unlike `read-sensors.ts`, `validate-graph.ts`
**is** inside clarification 242's required-explicit-tree scope, which makes it the
stronger follow-up candidate of the two.

## Recommended dispositions

See `office_hours.recommendation` for the three-way split (drop / clarify-only /
mechanize) applied per observation. In short: (1) and (3) are round-local
bookkeeping and can be dropped; (4) is the natural clarify-only candidate; (2) and
the `validate-graph.ts` second instance are the two with real leverage.
