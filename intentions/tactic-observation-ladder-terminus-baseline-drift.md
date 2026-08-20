---
id: tactic-observation-ladder-terminus-baseline-drift
kind: tactic
statement: "Observation (born-parked, for author promotion): the 2026-08-20
  /align-tactics round on tactic-ladder-run-answerable-across-node-boundary
  found two immaterial drifts — sibling nodes giving contradictory re-plan
  triggers, and a moved ladder-terminus baseline that also refutes a premise
  carried in tactic-mainqa-record-time-routing's R1 ruling"
owner: human
status: delegated
parent: null
rationale: "Minted 2026-08-20 by the /align-tactics tactic-mode round on
  tactic-ladder-run-answerable-across-node-boundary, as the born-parked
  observation node clarification 245 (violation V1, ruled 2026-08-14 and
  extended 2026-08-15) requires: an autonomous session may not write dated
  clarifications onto a strategy, so the round's IMMATERIAL Side-B observations
  land here for a human to promote, drop, or mechanize at office hours.
  Clarification 118, which had permitted the direct strategy write, carries an
  OVERTURNED 2026-08-15 prefix and does not bind. This node carries no plan and
  must never be dispatched."
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
  reason: "Born-parked observation carrier — not a defect, not blocked work, and
    not dispatchable. The 2026-08-20 /align-tactics tactic-mode round on
    tactic-ladder-run-answerable-across-node-boundary parked that node for
    requirement ambiguity (two material premises needing ratification); these
    are the round's two IMMATERIAL observations, which gate nothing and so must
    not interrupt, but are worth an author's eye. (a) CONTRADICTORY RE-PLAN
    TRIGGERS BETWEEN SIBLINGS.
    tactic-ladder-run-answerable-across-node-boundary's own body gates planning
    on its blocker being PLANNED ('run /align-tactics
    tactic-mainqa-record-time-routing before planning this node'), while that
    blocker's 'Sibling relationships bearing on sequencing' section gates it on
    the blocker being DONE ('becomes unblocked when this node reaches done;
    re-plan it immediately after'). Both are prose in node bodies, neither is
    mechanical, and they disagree by a full phase ladder. The generalization
    worth deciding: when two nodes each carry hand-written sequencing prose
    about the other, nothing reconciles them, and a session can satisfy one
    while violating the other. (b) THE LADDER-TERMINUS BASELINE MOVED, AND WITH
    IT A PREMISE IN THE BLOCKER'S R1 RULING. Strategy clarification 232 measured
    29 merged-not-done / 24 excused / 5 violations at origin/main 206a6994 on
    2026-08-14, and tactic-ladder-terminus-owns-main-qa re-measured 29/24/5 with
    2 unstructured waits on 2026-08-19. A live run of
    packages/intentionsutil/scripts/ladder-terminus-census.ts on 2026-08-20
    reports 30 merged-not-done / 24 excused / 6 violations and 3 unstructured
    waits; the new violation and the new prose wait are both
    tactic-wait-calendar-release, whose PR #3051 merged 2026-08-20 (merge commit
    38934c61, follow-up 6cc9c25f / PR #3097). That merge also refutes a premise
    carried in tactic-mainqa-record-time-routing's R1 ruling that 'arm-wait /
    release-wait do not exist in code': wait-node-decide.ts (decideWait,
    attributes.wait_until), arm-wait / release-wait and lib-wait-recheck.sh are
    landed and tested — so converting a prose 'Verifiability: WAIT' mark into a
    structural blocked_by edge, the known predicate gap clarification 232
    carries into its implementing tactic, now has a primitive to build on."
  since: 2026-08-20
  recommendation: "Three explicit dispositions, per observation — do not treat
    promotion as the default. (1) DROP: judge either observation not worth the
    strategy's record and delete this node; the underlying facts stay
    recoverable in this round's commit. (2) CLARIFY-ONLY: promote (a) and/or (b)
    into dated clarifications on strategy-graph-native-dispatch by author ruling
    in an /align sitting, changing no machinery — appropriate if the
    sibling-sequencing disagreement is judged a one-off rather than a pattern.
    (3) MECHANIZE: for (a), decide whether cross-node sequencing prose should be
    replaced by a mechanical edge or a lint that detects two nodes making
    contradictory claims about each other, and file a tactic; for (b), fold the
    refuted 'arm-wait does not exist' premise into
    tactic-mainqa-record-time-routing's R1 ruling before its units are
    implemented, since that plan is at phase implement and not yet built. Note
    (b) is time-sensitive in a way (a) is not: the blocker's plan is about to be
    executed against a premise now known false."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier: two immaterial drifts from the 2026-08-20 ladder-answerability round

## This node carries no plan and must not be dispatched

It is a **born-parked observation carrier**, minted under strategy
clarification 245 (violation V1, ruled 2026-08-14, extended 2026-08-15): an
autonomous `/align-tactics` session may not write dated `clarifications` onto a
strategy, because `clarifications` is allowlist member two of
`strategyFingerprint` — so an autonomous write would soft-freeze every open
child of that strategy for an observation defined as gating nothing — and
because a model-authored dated clarification is byte-indistinguishable from an
author-ruled one. Clarification 118, which had permitted the direct write,
carries an `OVERTURNED 2026-08-15` prefix and does not bind.

Its whole content is in `office_hours.reason` and `office_hours.recommendation`.
A human promotes, drops, or mechanizes each observation at office hours; nothing
here is a defect and nothing here is blocked work.

## Provenance

Minted by the `/align-tactics` tactic-mode round of 2026-08-20 on
`tactic-ladder-run-answerable-across-node-boundary`, run at `origin/main`
`6cc9c25f` under an explicit author exception to plan that node ahead of its
blocker. That round produced **no plan**: its drift review found two *material*
premises the plan could not avoid depending on, and parked the target node for
author ratification. The two observations recorded here are the round's
*immaterial* findings — they gate nothing, so under the same doctrine they must
not interrupt, but they were judged worth an author's eye.

## The two observations, in brief

1. **Contradictory re-plan triggers between two sibling nodes.** The target node
   gates planning on its blocker being *planned*; the blocker gates it on
   reaching *done*. Both are hand-written prose in node bodies, nothing
   reconciles them, and they disagree by a full phase ladder.
2. **The ladder-terminus baseline moved, refuting a premise in a plan about to
   be executed.** The census now reads 30 merged-not-done / 24 excused / 6
   violations with 3 unstructured waits (was 29/24/5 with 2). The new violation
   and new prose wait are both `tactic-wait-calendar-release`, whose merge also
   makes `arm-wait` / `release-wait` real — refuting the "they do not exist in
   code" premise carried in `tactic-mainqa-record-time-routing`'s R1 ruling,
   which sits at `phase: implement` and is not yet built.

Observation 2 is time-sensitive in a way observation 1 is not; the
recommendation field says why and what to do about each.
