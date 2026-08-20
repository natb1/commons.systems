---
id: tactic-ladder-run-answerable-across-node-boundary
kind: tactic
statement: A /dispatch-ladder run may not report complete until the main-qa work
  it spawned is itself terminal or excused, whether that work sits on the source
  node's own phase or on a standalone tactic-mainqa-* node the run created —
  making a run answerable ACROSS a node boundary, which no ladder code does
  today
owner: ai
status: raw
parent: null
rationale: "Re-homed scope item 2 of tactic-ladder-terminus-owns-main-qa, by
  author ruling in a 2026-08-19 /office-hours sitting over the PR2 park cohort.
  That node's code half merged out-of-band as PR #3091 (merge commit de347430,
  2026-08-14) delivering scope item 1 and the measurement half of item 3, and
  was transitioned to done crediting that PR; item 2 was the one piece it did
  NOT land, and PR #3091's own 'Not in this PR' section deferred it behind
  tactic-mainqa-record-time-routing under the rule 'No cross-node machinery is
  built while no caller can exercise it'. Keeping item 2 on the original node
  would have left a merged implementation sitting under a raw node, so it moves
  here instead of being tracked there. The deferral edge that PR promised but
  never landed is now real: blocked_by tactic-mainqa-record-time-routing."
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
blocked_by:
  - tactic-mainqa-record-time-routing
office_hours:
  reason: "Requirement ambiguity — two premises the plan cannot avoid depending on
    are unrecorded and need author ratification, and the node's own body flags
    this piece as 'the part of the original tactic most likely to need design
    work'. (1) WHAT 'MAY NOT REPORT COMPLETE' RESOLVES TO. Under the blocker's
    target design the source reaches done and is pruned, which strips the
    spawned tactic-mainqa-<slug>-machine node's inbound blocked_by; at exactly
    the instant the run would report complete (dispatch-ladder-run:1508-1509,
    `if phase_is_done; then halt 0 complete`), that spawned node is open — phase
    main-qa, office_hours null, blocked_by empty — and so classifies as
    `violation`, not as either recorded excuse, under classifyTerminus
    (packages/intentionsutil/src/terminus.ts:57-66, mirrored in bash at
    dispatch-ladder-run:933-956). A literal reading therefore lets the run NEVER
    report complete, and the record does not say which mechanism discharges
    that: chain onto the spawned node with a second sequential claim (extending
    a detached, hours-long run across another node's full main-qa cycle, against
    clarification 226's 'progresses ONE NODE all the way' span), await it
    without claiming (a wait on a node the run does not own, while the ordinary
    tick may be driving it concurrently), or halt for a person (which makes
    halts routine on every residue-bearing run, against 226's 'detached
    execution, attended judgment' where halts are the exception). Proposed
    clarification for author ratification: rule which of chain / await / halt
    discharges answerability when the spawned main-qa node is open and
    independently dispatch-selectable, and reconcile that ruling with
    clarification 226's one-node span and the 'throws always halt, never
    resolve' condition. (2) THE SPAWN-SITE SET AND ITS RECURSION BOUND.
    Clarification 232 names only 'a standalone tactic-mainqa-* node it created',
    but /qa-main's broken branch mints tactic-<source-id>-main-qa-regression at
    phase implement with NO blocked_by edge back to the source
    (.claude/skills/qa-main/SKILL.md:310-350) — live instances exist (e.g.
    tactic-graph-review-exclusion-stall-recovery-main-qa-regression) — and the
    deploy-lag lane mints tactic-wait-* hold nodes; a spawned main-qa node's own
    /qa-main pass can mint further nodes in turn. Proposed clarification for
    author ratification: declare which spawn sites answerability covers
    (tactic-mainqa-*-{machine,author} only, or also regression and wait nodes)
    and the recursion bound, since an unbounded chain makes a detached run's
    duration unbounded. Recommendation: ratify both in one /align sitting on
    strategy-graph-native-dispatch as an amendment to clarification 232, then
    re-plan this node — noting the blocker tactic-mainqa-record-time-routing
    (phase implement, seven codified units, itself blocked_by
    tactic-wait-calendar-release) directs re-planning this node once the blocker
    reaches done, so the ratification and the re-plan can be sequenced together
    with no lost time."
  since: 2026-08-20
  recommendation: "Ratify both premises in ONE /align sitting on
    strategy-graph-native-dispatch, as an amendment to clarification 232. (1)
    Rule which mechanism discharges answerability when the spawned
    tactic-mainqa-<slug>-machine node is open and independently
    dispatch-selectable — CHAIN (the run takes a second sequential claim and
    walks it to terminal), AWAIT (the run blocks on its terminus without
    claiming it, tolerating the tick driving it concurrently), or HALT (the run
    ends non-complete for a person) — and reconcile that ruling with
    clarification 226's 'progresses ONE NODE all the way' span and the standing
    'throws always halt, never resolve' condition. (2) Declare which spawn sites
    answerability covers — tactic-mainqa-*-{machine,author} only, or also
    /qa-main's tactic-<source-id>-main-qa-regression nodes (which carry
    blocked_by: [] — four live instances today) and the deploy-lag tactic-wait-*
    holds — and state the recursion bound, since a spawned node's own /qa-main
    pass can mint further nodes and an unbounded chain makes a detached run's
    duration unbounded. Then re-plan this node with /align-tactics. Sequencing:
    the blocker tactic-mainqa-record-time-routing (phase implement, seven
    codified units, itself blocked_by tactic-wait-calendar-release) already
    directs re-planning this node once it reaches done, so the ratification and
    the re-plan can be sequenced together with no lost time."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# A run is answerable for the main-qa work it spawned, across a node boundary

## Context

Re-homed scope item 2 of `tactic-ladder-terminus-owns-main-qa` by author ruling
in the 2026-08-19 `/office-hours` sitting over the PR2 park cohort. Read that
node's clarifications first — they carry the ruling, what PR #3091 actually
delivered, and why this piece moved rather than staying.

The standing requirement lives on `strategy-graph-native-dispatch` as the dated
`/align` clarification recorded 2026-08-14 ("Must a /dispatch-ladder run carry
its node all the way to a terminal state, or may it stop once the PR merges?").
A run may not report a terminal disposition until its node's work is terminal
(`phase: done`) or legitimately excused — parked to office-hours, or blocked on
an awaited event. This node is the cross-node-boundary half of that.

## Scope

**The requirement follows the work, not the node.** The 2026-07-28 clarification
on the same strategy adopted a greenfield in which the source tactic goes
`review -> done` directly ("no main-qa phase on the source, no residue body
append") and post-merge work lives on standalone `tactic-mainqa-*` nodes. Under
that shape a run that reports complete when its SOURCE node reaches `done` is
reporting on the wrong object: the main-qa work it spawned is a different node,
and no ladder code follows it today.

This is a real scope increase, not a patch. It is the part of the original
tactic most likely to need design work.

## Explicitly out of scope

- Scope items 1 and 3 of `tactic-ladder-terminus-owns-main-qa`. Item 1 and the
  measurement half of item 3 merged as PR #3091 (`terminus.ts`,
  `ladder-terminus-census.ts`, the `ladder-terminus` sensor, the
  `dispatch-ladder-run` classification wiring). The ENFORCEMENT half of item 3
  — `--strict` wiring, the 0-violations threshold, and the two prose
  `Verifiability: WAIT` marks — was folded into PR2 of the serialized RSI PR
  plan by the same ruling and is executed ad hoc there, NOT here.
- The reconciler's own availability defects
  (`tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt`,
  `tactic-eval-finding-ladder-gate-stale-main-checkout-halt`). Fixing them makes
  the failure rarer but does not make a run answerable for its terminus.

## Why this is blocked

`blocked_by: [tactic-mainqa-record-time-routing]`, which is the edge PR #3091's
own "Not in this PR" section promised and never landed. The governing rule is
its: **no cross-node machinery is built while no caller can exercise it.** Until
record-time main-qa routing is real, there is no standalone `tactic-mainqa-*`
node for a run to be answerable FOR, so any unit written here would be
unexercisable.

That precondition is now met, and the sentence that stood here — asserting the
blocker was `status: raw`, `phase: null` and unplanned as of 2026-08-19, and
directing a `/align-tactics` run on it first — is superseded. As of 2026-08-20
`tactic-mainqa-record-time-routing` is `status: codified`, `phase: implement`,
carrying seven codified units plus binding author rulings landed at `5f8dbc0a`.
It is **planned but not built**: `execution: null` (no branch, no PR), and it is
itself `blocked_by: [tactic-wait-calendar-release]`.

So the `blocked_by` edge on this node stands, and stands for the original
reason — the machinery this node must be answerable for does not exist on main
yet. Note the two nodes state **different** re-plan triggers: this section gates
planning on the blocker being planned, while the blocker's own "Sibling
relationships bearing on sequencing" section says this node "becomes unblocked
when this node reaches `done`; re-plan it immediately after". Neither is
mechanical; see `tactic-observation-ladder-terminus-baseline-drift`.

A 2026-08-20 `/align-tactics` round ran against this node under an explicit
author exception to plan it ahead of the blocker. It did **not** produce a plan:
the drift review found two material premises that any plan here must depend on
and that the record does not settle, and parked this node to `office_hours` for
author ratification. The park's `reason` and `recommendation` carry both
questions in full and are the entry point for the next session — read them
before planning.

## Reuse

- `packages/intentionsutil/src/transitions.ts` — `forwardPhase` and
  `reconcileMergedPhase` already model `review -> main-qa -> done`, and the
  schema needs no change (`main-qa` is in `schema.ts`'s `PHASES`, so node
  writes accept it). **Correction, measured 2026-08-20:** the `LADDER`
  constant does **not** model it — it is
  `["implement", "qa", "review", "done"]`, and its own doc comment says
  `main-qa` "is inserted only when needs-main residue is present
  (`forwardPhase`)". An earlier revision of this bullet named `LADDER`
  alongside the two functions; do not plan against `LADDER` containing
  `main-qa`.
- `packages/intentionsutil/src/terminus.ts` — `classifyTerminus` and
  `ladderTerminusCensus`, shipped by PR #3091, are the existing classification
  vocabulary. Two invariants their doc comments carry must not be broken: the
  census requires a STRICT enumeration (`listNodesStrict`), and
  `findUnstructuredWaits` must never feed back into `classifyTerminus` to
  reclassify a prose wait as excused.
