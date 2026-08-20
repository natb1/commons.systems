---
id: tactic-fleet-watch-cadence-drift-observations
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics tactic-mode
  finalize of tactic-hold-alerts-unbounded-scan-cadence: two immaterial Side-B
  drift observations about per-predicate cadence in dispatch-fleet-watch — that
  a cadence-throttled pass must report `quiet` rather than `clear` or `unknown`,
  and that a throttle interval is bounded by predicate 5's two FAST limbs (top-K
  rank, claimed status) rather than by its 24-hour age bound"
owner: human
status: delegated
parent: null
rationale: "Born-parked carrier, not planned work. The 2026-08-20 tactic-mode
  /align-tactics round on tactic-hold-alerts-unbounded-scan-cadence surfaced two
  Side-B premises its drift review judged IMMATERIAL (the round's plan does not
  depend on either being ratified; both are already absorbed into that node's
  plan body, which is self-sufficient). They are recorded here rather than on
  the serving strategy because clarification 245 (violation V1, ruled 2026-08-14
  and extended 2026-08-15) OVERTURNED clarification 118: no autonomous lane may
  write to a strategy's clarifications array — it is allowlist member two of
  strategyFingerprint, so such a write would soft-freeze every open child of the
  strategy over an observation defined as gating nothing, and a model-authored
  dated clarification is byte-indistinguishable from an author-ruled one. A
  tactic-target session never touches the serving strategy's frontmatter at all.
  The observations are recorded for their generalizable form; the human decides
  at office hours whether each is worth a clarification, worth mechanizing, or
  worth dropping."
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
  reason: "Observation carrier, not planned work — two immaterial Side-B drift
    observations from the 2026-08-20 /align-tactics tactic-mode finalize of
    tactic-hold-alerts-unbounded-scan-cadence, which have no legal autonomous
    destination (clarification 245 / V1 forbids an autonomous write to the
    strategy's clarifications, and a tactic-target round never edits the serving
    strategy). Neither gates that round: both are already absorbed into its plan
    body, which stands on its own, and the round landed with proceed=true and no
    park. (1) A cadence-throttled pass of dispatch-fleet-watch's predicate 5
    must report the `quiet` verdict — never `clear` (which routes to
    resolve_alarm and would CLOSE an already-open unclaimed-hold alarm node, the
    exact false all-clear the predicate's own FAIL DIRECTION block exists to
    prevent) and never `unknown` (which would raise watch-unknown on every
    throttled pass). A cadence skip is a deliberate not-yet-due, not an
    unreadable input, so clarification 172's 'an unreadable input still emits'
    inversion is not engaged. (2) The node's '~288x oversampling' framing rests
    on the AGE limb alone; predicate 5's alert condition is a conjunction of
    three limbs, of which only the age bound is 24h-granular — top-K rank and
    claimed status both move within minutes — so the throttle interval is
    bounded by acceptable latency on those two fast limbs, and governs alarm
    RESOLUTION latency too, since a throttled pass resolves nothing. See the
    body for both in full."
  since: 2026-08-20
  recommendation: "Read at office hours and pick one disposition per observation,
    not one for both. (a) DROP — judge each already adequately captured by the
    finalized plan body of tactic-hold-alerts-unbounded-scan-cadence and prune
    this carrier. (b) CLARIFY-ONLY — promote either or both, in the author's own
    words, into a dated clarification on strategy-graph-native-dispatch:
    observation 1 generalizes to a standing rule that any future per-predicate
    throttle in dispatch-fleet-watch reports `quiet`, which would bind the two
    sibling cost drafts (tactic-fleet-watch-predicate5-cold-start,
    tactic-fleet-watch-alarm-noop-overhead) without re-deriving it; observation
    2 generalizes to 'a sampling interval is bounded by an alert condition's
    FASTEST limb, not its slowest', which is the reusable half. Note that
    promoting either re-stamps strategyFingerprint and soft-freezes this
    strategy's open children — that cost is the reason an autonomous lane may
    not do it, and it applies to the author's write too. (c) MECHANIZE — treat
    observation 2 as an instrument-design rule worth a check rather than prose.
    Do NOT dispatch this node: it carries no plan and no units of work."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier: two immaterial Side-B drift observations on per-predicate cadence in dispatch-fleet-watch

## What this node is

**A record, not work.** It carries no plan, no units, and no verification, and
it must not be dispatched. It exists because the 2026-08-20 `/align-tactics`
tactic-mode round that finalized
[`tactic-hold-alerts-unbounded-scan-cadence`](tactic-hold-alerts-unbounded-scan-cadence.md)
surfaced two Side-B premises its drift review judged **immaterial**, and an
immaterial observation has no legal autonomous destination other than a node
like this one.

Why not the serving strategy's `clarifications`: `strategy-graph-native-dispatch`
clarification **245** (violation **V1**, ruled 2026-08-14 and extended
2026-08-15) **overturned** clarification 118, which had permitted a per-node
session to append there. `clarifications` is allowlist member two of
`strategyFingerprint`, so an autonomous write would soft-freeze every open child
of the strategy over an observation defined as gating nothing; it is a second
requirement-entry surface reserved to the `/align` interview; and a
model-authored dated clarification is byte-indistinguishable from an
author-ruled one, so provenance in the field that carries doctrine would
collapse irreversibly. Separately, a tactic-target round never touches the
serving strategy's frontmatter at all.

Neither observation gates the round it came from. Both are already absorbed
into that node's plan body, which stands on its own; the round landed with
`proceed: true`, no parks, and `deviation: false`. What is recorded here is the
**generalizable** form of each — the part that would bind future work beyond
the one tactic — for a human to promote, mechanize, or drop.

## Observation 1 — a cadence-throttled predicate must report `quiet`, never `clear`

A pass of `dispatch-fleet-watch` that skips predicate 5's full-store scan
because the scan interval has not elapsed must report the **`quiet`** verdict.

- Not `clear`: `dispatch_predicate` routes `clear` to `resolve_alarm`, which
  sends `--resolve --kind unclaimed-hold` and **closes an already-open alarm
  node**. A pass that did not look would silently retract a live alarm — the
  exact false all-clear that predicate 5's own FAIL DIRECTION block exists to
  prevent.
- Not `unknown`: that raises the `watch-unknown` alarm and forces exit 2 on
  every throttled pass, which in steady state is most passes.

Verified against the live script this round: `quiet` is already a no-op in the
dispatch layer and needs no new plumbing. `dispatch_predicate` matches only
`finding` and `clear`; `note_verdict` ignores `quiet` so it never counts toward
`FINDING_COUNT` or `UNKNOWN_COUNT`; and the header's exit-code contract already
excludes it — "0 = every EVALUATED predicate is clear (quiet predicates do not
count)".

Why this is a premise and not merely an implementation detail: a cadence skip
is a **deliberate not-yet-due**, not an unreadable input, so clarification 172's
inversion — "for an instrument, an unreadable pause state reports UNKNOWN and
STILL EMITS; it never silently suppresses" — is **not** engaged here. That
inversion governs inputs the instrument could not read. Predicates 1 and 3
already go `quiet` on a deliberate condition (a standing pause), which is the
precedent this follows.

One adjacent constraint the round recorded while checking this: the throttle is
**orthogonal to the pause path**. The header's PAUSE block deliberately keeps
predicate 5 evaluating under a standing pause — "a top-ranked node blocked by a
hold nobody is holding is exactly what the human driving that paused fleet needs
told" — so a cadence stamp must be its own branch and must never be folded into
the pause-quiet branch.

**Generalizable form.** Any future per-predicate throttle in
`dispatch-fleet-watch` reports `quiet` on a not-due pass. Stated as a standing
rule it would bind the two sibling cost drafts —
[`tactic-fleet-watch-predicate5-cold-start`](tactic-fleet-watch-predicate5-cold-start.md)
and
[`tactic-fleet-watch-alarm-noop-overhead`](tactic-fleet-watch-alarm-noop-overhead.md)
— without each of them re-deriving it.

## Observation 2 — a sampling interval is bounded by the alert condition's fastest limb

The finalized node's framing — "~288x more sampling than the signal needs" —
rests on the **age** limb of predicate 5 alone. The predicate's alert condition
is a conjunction of three limbs, and only one of them is 24h-granular:

1. the hold's age exceeding `HOLD_MIN_AGE` (24h — **slow**);
2. the blocked source ranking within the top `HOLD_TOP_K` live, unparked,
   eligible nodes (**fast** — resolved rank shifts as the graph and the fleet
   move);
3. the hold being unclaimed (**fast** — a session can claim or release within
   minutes).

So the throttle interval is bounded by acceptable latency on limbs 2 and 3, not
by the age bound. It governs two distinct latencies, and the second is easy to
miss: how late a newly-qualifying alert fires, **and** how long an alarm stays
open after its hold is claimed — because a throttled pass resolves nothing
(observation 1). An interval chosen against the 24h bound alone would be far too
coarse on both counts.

A conservative interval well inside the age bound — on the order of
`dispatch-fleet-alarm`'s existing `DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL`
default of 3600s — captures nearly all of the available saving while holding
fast-limb latency to about an hour. The value belongs in `dispatch-fleet-watch`'s
existing `DISPATCH_FLEET_WATCH_*` threshold block (a `${VAR:-default}` line plus
the shared non-negative-integer validation loop that already covers
`HOLD_MIN_AGE` and `HOLD_TOP_K`), so it stays tunable without a code change.
The finalized plan adopts exactly this.

**Generalizable form.** *A sampling interval is bounded by an alert condition's
fastest-moving limb, not its slowest.* That is the reusable half, and it applies
to any future instrument in this family whose predicate is a conjunction over
limbs with different timescales — the slow limb is the one that makes the
oversampling argument, and the fast limbs are the ones that bound the remedy.

## Recommended dispositions

Pick one **per observation**, not one for both — they generalize differently.

- **(a) Drop.** Judge each already adequately captured by the finalized plan
  body of `tactic-hold-alerts-unbounded-scan-cadence` and prune this carrier.
  Defensible: the plan implements both correctly, so nothing is lost operationally.
- **(b) Clarify-only.** Promote either or both, in the author's own words, into
  a dated clarification on `strategy-graph-native-dispatch`. Observation 1 is
  the stronger candidate for this — it is a fail-direction rule about an alarm
  surface, the class of thing this strategy's conditions already govern.
  **Cost to weigh:** promoting either re-stamps `strategyFingerprint` and
  soft-freezes this strategy's open children. That cost is precisely why an
  autonomous lane may not do it, and it applies to the author's write too.
- **(c) Mechanize.** Treat observation 2 as an instrument-design rule worth a
  check rather than prose — the "interval versus fastest limb" question asked
  wherever a sampling interval is declared.

Do **not** dispatch this node.

## Provenance

- Round: `/align-tactics tactic-hold-alerts-unbounded-scan-cadence`, tactic
  mode, 2026-08-20, against `origin/main` `a0bd6c82`.
- Drift result that produced these: two `unrecorded_premises` entries, both
  `material: false` and `plan_depends: false`; `side_a_failed_conditions: []`;
  `parks: []`; `proceed: true`.
- Routing rule applied: clarification 245 / V1 (which overturned clarification
  118). The carrier tactic for making this redirect automatic rather than
  hand-applied by the caller thread is
  [`tactic-align-tactics-immaterial-drift-redirect`](tactic-align-tactics-immaterial-drift-redirect.md),
  still `status: raw`.
