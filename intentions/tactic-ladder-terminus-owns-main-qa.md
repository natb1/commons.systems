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
clarifications:
  - question: Where in the lifecycle does the merged-but-not-terminal population
      actually sit, and is the stored baseline figure safe to trust?
    answer: "(Measured 2026-08-19 /align-tactics tactic-mode round at origin/main
      dcf1baa6; the same count PR #3091 measured at ed5a9ecc.) Every one of the
      29 merged-not-done nodes sits at phase: main-qa. The merged-not-terminal
      population is therefore entirely a main-qa terminus problem, which is
      corroborating evidence this requirement is aimed at the right joint rather
      than at the ladder generally. The figure is NOT safe to trust as a stored
      number: it moves as soon as any of the five violations is driven to
      terminal by a direct /dispatch-ladder invocation, which clarification
      232's corollary says is available today. Re-measure with `npx tsx
      packages/intentionsutil/scripts/ladder-terminus-census.ts intentions
      --lint` before and after any change rather than citing a recorded count."
  - question: Does the census observable have a blind spot — is there a way for a
      merge whose graph write never landed to escape the count entirely?
    answer: "(Recorded 2026-08-19 /align-tactics tactic-mode round.) Yes, and this
      node is itself an instance of it. classifyTerminus
      (packages/intentionsutil/src/terminus.ts:57-66) evaluates `not-merged`
      FIRST, keyed on execution.completion.mergedAt: a node whose PR genuinely
      merged but whose mergedAt was never stamped classifies `not-merged` and is
      excluded from the census rows altogether. This node's own implementation
      merged as PR #3091 on 2026-08-14 and its execution is still null at
      dcf1baa6, so it is invisible to its own sensor. The
      merged-but-not-terminal count therefore under-reports exactly the failure
      mode of a merge whose graph write never landed — the class this node
      exists to catch. Recorded as an observation for whoever plans the
      residual, NOT as license to widen the predicate: the ordering is
      deliberate and documented, and the fix direction is stamping completion
      honestly, not loosening classifyTerminus."
  - question: "What invariants does the landed PR #3091 code carry that a later
      editor must not break?"
    answer: "(Recorded 2026-08-19 /align-tactics tactic-mode round, read off the
      shipped source.) Two, both carried in the code's own doc comments. (1)
      classifyTerminus requires a STRICT enumeration — listNodesStrict, per
      terminus.ts:46-55, as used at ladder-terminus-census.ts:91 — because
      classifyTerminus and router.ts's blockersComplete fail open in OPPOSITE
      directions on a missing byId entry: the router reads a missing blocker as
      'not blocking', terminus reads it as 'not excused'. A tolerant enumeration
      would let a dropped node file silently vanish from the census instead of
      surfacing. (2) findUnstructuredWaits' result must NEVER feed back into
      classifyTerminus to reclassify a prose wait as excused
      (terminus.ts:153-162 carries an explicit warning). Closing the wait gap
      means converting prose to real blocked_by edges, never loosening the
      predicate — this is this node's own recorded ruling, restated in the
      source so a later reader does not undo it. The bash side
      (dispatch-ladder-run classify_terminus:933-956, terminus_probe:884-887,
      halt:708-731) mirrors the same classification order and preserves
      verify-landed's 0/4/1 contract, mapping an unknown read to 'unknown' and
      never to 'violation'."
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
office_hours:
  reason: >-
    Two premises need author ratification before this node can be planned.


    (1) RESIDUAL SCOPE AND NODE RECORD. The code half of this tactic already
    merged out-of-band as PR #3091 / commit de347430 (2026-08-14), an ad-hoc PR
    whose own body says it implements this node and deliberately bypasses the
    dispatch ladder. It landed scope item 1 and the measurement half of scope
    item 3: packages/intentionsutil/src/terminus.ts (classifyTerminus,
    ladderTerminusCensus, findUnstructuredWaits),
    packages/intentionsutil/scripts/ladder-terminus-census.ts (report-only;
    --strict deliberately unwired), the ladder-terminus sensor in
    read-sensors.ts, and dispatch-ladder-run's classify_terminus /
    classify_absent_node / halt wiring with 48 new shell assertions. Its 'Not in
    this PR' section defers scope item 2 behind a real blocked_by on
    tactic-mainqa-record-time-routing, under the rule 'No cross-node machinery
    is built while no caller can exercise it'. The promised follow-on graph
    edits never landed: re-verified at origin/main dcf1baa6, this node is still
    status: raw, phase: null, execution: null, blocked_by: [] — it reads as
    unstarted while its implementation is merged, and the deferral edge does not
    exist. The author must rule (a) whether this node's residual scope is scope
    item 2 alone with items 1 and 3's measurement half recorded as landed, or
    whether the node is complete as shipped and item 2 re-homed onto a fresh
    tactic; and (b) whether to plan now behind a blocked_by on
    tactic-mainqa-record-time-routing — which is itself status: raw / phase:
    null / unplanned, so no unit of item 2 is implementable or exercisable today
    — or to leave this node unplanned until that sibling lands. Planning
    autonomously would either duplicate merged code or author units nothing can
    exercise.


    (2) THRESHOLD VERSUS THE NO-BACKFILL RULING. Scope item 3 and this node's
    0-violations threshold collide with strategy clarification 210, which rules
    that pre-existing prose 'Verifiability: WAIT' marks are NOT backfilled by
    tactic-wait-calendar-release. The two nodes whose prose waits keep --strict
    unwired are re-verified at dcf1baa6 as still phase: main-qa, blocked_by: [],
    office_hours: null. tactic-attention-namespaced-rank's wait names a real
    node (tactic-attention-per-tier-boost-migration) and so IS expressible as a
    blocked_by edge today; tactic-pause-disables-merge-lane's awaits an episode
    — a heartbeat tick with the pause sentinel present and a reviewed green
    node-lane PR pending merge — which is neither a node nor a calendar
    deadline, so neither blocked_by nor tactic-wait-calendar-release's
    wait_until shape fits it. The author must rule whether this node owns giving
    those two structural edges, or whether they drain through the interim park
    path with --strict wiring gated on that. Note that clarification 232's
    explicit escape — 'the sensor stays approximate and says so' — is NOT
    combinable with this node's threshold of 0 violations as recorded; taking
    the escape requires amending this node's success_signal, which is an author
    decision, not one this round may make.


    ROUND BOOKKEEPING, so the record is accurate. This session landed no edit to
    strategy-graph-native-dispatch — a tactic-target round never writes the
    serving strategy's frontmatter. The round's three measured observations are
    recorded as dated clarifications on THIS node (entries added 2026-08-19),
    not on the strategy. The two premises above are PROPOSED for author
    ratification and are recorded as accepted nowhere. No plan body was authored
    and the node body is unchanged, so it still describes the pre-#3091 world;
    reconciling it is part of ruling (1), not something this round decided.
  since: 2026-08-19
  recommendation: >-
    Rule the two questions in the park reason — an office-hours sitting on this
    node is enough; a full /align round on the strategy is not required — then
    re-run `/align-tactics tactic-ladder-terminus-owns-main-qa`, which will
    finalize against the ruling.


    For question (1), the two live options:
      (a) RESIDUAL SCOPE IS ITEM 2 ONLY. Record items 1 and 3's measurement half as landed (stamp execution/completion from PR #3091, or say so in the body), and add blocked_by: [tactic-mainqa-record-time-routing] so this node holds until that enabler is real. Because that sibling is an unplanned raw draft, nothing here is implementable until it is decomposed — so run `/align-tactics tactic-mainqa-record-time-routing` FIRST if you take this option.
      (b) THIS NODE IS COMPLETE AS SHIPPED. Transition it to done crediting PR #3091, and re-home scope item 2 ('the requirement follows the work, not the node' — answerability across a node boundary) onto a fresh tactic serving strategy-graph-native-dispatch, blocked_by tactic-mainqa-record-time-routing. This keeps the graph honest about what merged and stops this node reading as unstarted work.
    Option (b) is the cleaner record if you agree items 1 and 3's measurement
    half are genuinely finished, because it stops a merged implementation
    sitting under a raw node; option (a) is right if you want the residual
    tracked under the original requirement id.


    For question (2), the decision is which of clarification 232's two recorded
    outcomes this node takes: structural edges for the waits, or an approximate
    sensor that says so. If structural edges: tactic-attention-namespaced-rank
    can take blocked_by: [tactic-attention-per-tier-boost-migration] today with
    no new machinery, but tactic-pause-disables-merge-lane needs a shape that
    does not exist (its awaited event is an episode with no node and no
    deadline) — that is a design question worth its own tactic rather than a
    unit here. If the approximate sensor: amend this node's success_signal
    threshold off 0, and have ladder-terminus-census.ts state the approximation
    in its output rather than leaving readers to infer it. Either way, wiring
    `ladder-terminus-census.ts --strict` into CI is gated on the answer; it is
    wired into nothing today, by the script's own deliberate choice.


    SEPARATELY AND CHEAPLY, whichever way you rule: three of the five violations
    are plain stranded nodes with no wait involved —
    tactic-align-tactics-mark-terminal-skipped (#3047),
    tactic-dependency-justification-audit (#2875),
    tactic-graph-commit-landing-signal-unreliable (#3050). Per clarification
    232's own corollary they are recoverable right now by invoking
    `/dispatch-ladder <id>` on each, since the ladder picks up wherever its
    target stands. Doing so would move the observable from 5 violations to 2 and
    leave only the two prose waits, which sharpens question (2) considerably.
    Re-measure with `npx tsx
    packages/intentionsutil/scripts/ladder-terminus-census.ts intentions --lint`
    before and after rather than trusting any stored figure.
  session_type: other
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
