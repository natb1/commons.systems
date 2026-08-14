---
id: tactic-ladder-terminus-owns-main-qa
kind: tactic
statement: A /dispatch-ladder run drives its node to a terminal state —
  including the main-qa work it spawned — instead of ending at merge and leaving
  the post-merge write to a fleet-wide reconciler sweep it does not control
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-14 /align interview that recorded the
  ladder-terminus requirement on strategy-graph-native-dispatch. The requirement
  is standing and lands as a clarification there; this is its completable
  implementing half, split per kind-tactic's authoring test. Measured at record
  time: 29 merged-but-not-done nodes at origin/main 206a6994, 24 legitimately
  excused, 5 violations."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: "the merged-but-not-terminal count: nodes at origin/main whose
    execution.completion.mergedAt is set but whose phase is not done and which
    carry neither office_hours nor a non-empty blocked_by"
  sensor: ladder-terminus census over the intention store (merged-but-not-terminal
    count)
  threshold: "0 violations. Baseline 2026-08-14 at origin/main 206a6994: 29
    merged-not-done, 24 excused, 5 violations."
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A /dispatch-ladder run drives its node to a terminal state — including the main-qa work it spawned — instead of ending at merge and leaving the post-merge write to a fleet-wide reconciler sweep it does not control

## Context

Recorded by the 2026-08-14 `/align` interview on
`strategy-graph-native-dispatch`. The standing requirement lives there as a
dated clarification ("Must a /dispatch-ladder run carry its node all the way to
a terminal state, or may it stop once the PR merges?"); read it first — it
carries the author's ruling, the state-versus-liveness divergence the
requirement rests on, and the measurement. This node is the completable half.

The requirement: a `/dispatch-ladder` run may not report a terminal disposition
until its node's work is terminal (`phase: done`) or legitimately excused.
Exactly two excuses count — parked to office-hours (`office_hours` non-null),
or blocked on an awaited event. A halt, a drained budget, a reconciler error,
or a phase left mid-flight is a violation.

## Why the code does not deliver this today

The intent is already in the code. `dispatch-ladder-run`'s exit-0 contract is
"the node reached phase `done` at origin/main, or was pruned", and
`dispatch-ladder-advance:239-245` calls the loop's job "follow this node to
main-qa". The gap is the actor:
`packages/intentionsutil/src/transitions.ts:75-78` records that `review`'s
clean completion arms auto-merge and the **fleet-wide reconciler sweep** writes
the post-merge phase. So the ladder's terminus depends on an actor it does not
control, and when that actor fails the run halts while the merge looks like
success.

Live case: `tactic-attention-namespaced-rank`. PR #3075 merged
2026-08-13T23:27:31Z. The ladder's own reconcile pass hard-errored at
23:38:10Z (exit 11, `reconcile-graph-merged hard-errored (rc=1)` — the
unrelated-dirty-main-checkout refusal, recorded separately as
`tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt`). The node
reached `main-qa` only when the fleet sweep ran ~2.5 hours later (commit
`1817ac7f`), and has sat there since.

## Scope

1. **A run is answerable for its own node's terminus.** A terminal disposition
   that is neither `done` nor one of the two recorded excuses is a violation
   the run must surface as such, rather than reporting a halt that reads as a
   stopping point.

2. **The requirement follows the work, not the node.** The 2026-07-28
   clarification on the same strategy adopted a greenfield in which the source
   tactic goes `review -> done` directly ("no main-qa phase on the source, no
   residue body append") and post-merge work lives on standalone
   `tactic-mainqa-*` nodes. A run may not report complete until the main-qa
   work it spawned is itself terminal or excused, whether that work sits on the
   source's own phase or on a standalone node it created. **This is a real
   scope increase** — it makes a run answerable across a node boundary, which
   no ladder code does today. It is the substance of this tactic and the part
   most likely to need design work rather than a patch.

3. **Make the second excuse machine-readable.** "Blocked on an awaited event"
   is not readable today. `tactic-attention-namespaced-rank`'s needs-main
   residue records `Verifiability: WAIT — awaited event:
   tactic-attention-per-tier-boost-migration lands`, which IS an awaited event
   under this requirement — but it lives as prose in a body section, not as a
   `blocked_by` edge, so the census below scores it a violation. Either such
   waits gain a structural edge, or the sensor stays approximate and says so.
   **Do not close this by loosening the census to accept prose.**

## Explicitly out of scope

- The reconciler's own availability defects — the dirty-main-checkout refusal
  (`tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt`) and the
  stale-main-checkout exit-12 halt
  (`tactic-eval-finding-ladder-gate-stale-main-checkout-halt`). Both are real
  and recorded; fixing them makes this failure rarer but does not make a run
  answerable for its own terminus, which is what this tactic is for.
- The dispatch pause sentinel. It gates scheduled dispatch ticks only, not
  `/dispatch-ladder`, and is out of scope by the author's ruling.

## Reuse

- `packages/intentionsutil/src/transitions.ts` — `forwardPhase`,
  `reconcileMergedPhase`, and the `LADDER` constant already model
  `review -> main-qa -> done`; the schema needs no change.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run` — the exit-code
  contract (its EXIT CODES comment block) and `phase_is_done`, which already
  reads `done` at origin/main through `verify-landed`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:189` —
  already routes `tactic:main-qa` to `/qa-main`, so launching main-qa needs no
  new wiring.

## Verification

The observable is the merged-but-not-terminal count: nodes at `origin/main`
whose `execution.completion.mergedAt` is set but whose `phase` is not `done`
and which carry neither `office_hours` nor a non-empty `blocked_by`. Threshold
0.

Baseline measured 2026-08-14 at `origin/main` `206a6994`: **29 merged-not-done,
24 excused, 5 violations** — `tactic-align-tactics-mark-terminal-skipped`
(#3047), `tactic-attention-namespaced-rank` (#3075),
`tactic-dependency-justification-audit` (#2875),
`tactic-graph-commit-landing-signal-unreliable` (#3050),
`tactic-pause-disables-merge-lane` (#3068).

That 24 of 29 classify as excused is the evidence the two-excuse predicate
discriminates rather than passing everything — a re-implementation that scores
all 29 excused, or all 29 violations, has the predicate wrong.

Note for whoever implements: the five violations are recoverable today by
invoking `/dispatch-ladder <id>` directly on each, since the ladder picks up
wherever its target stands. Doing so would move the baseline, so re-measure
before and after rather than trusting the figure above.
