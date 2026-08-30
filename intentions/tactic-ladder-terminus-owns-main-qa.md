---
id: tactic-ladder-terminus-owns-main-qa
kind: tactic
statement: A /dispatch-ladder run drives its node to a terminal state —
  including the main-qa work it spawned — instead of ending at merge and leaving
  the post-merge write to a fleet-wide reconciler sweep it does not control
owner: ai
status: codified
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
  - question: "The code half merged out-of-band as PR #3091 while this node still
      read status: raw / phase: null / execution: null. Is the node complete as
      shipped, or is its residual scope item 2 tracked here?"
    answer: "(Ruled by the author in a 2026-08-19 /office-hours sitting over the PR2
      park cohort.) COMPLETE AS SHIPPED. The node transitions to phase: done,
      status: codified, with execution credited to PR #3091 (merge commit
      de347430, merged 2026-08-14T15:00:49Z) — the stamp whose absence made this
      node invisible to its own sensor, which is the very blind spot the
      preceding clarification records. Delivered and credited here: scope item 1
      and the MEASUREMENT half of scope item 3 — terminus.ts (classifyTerminus,
      ladderTerminusCensus, findUnstructuredWaits), ladder-terminus-census.ts,
      the ladder-terminus sensor in read-sensors.ts, and dispatch-ladder-run's
      classify_terminus / classify_absent_node / halt wiring with 48 new shell
      assertions. Scope item 2 — 'the requirement follows the work, not the
      node', a run answerable for spawned main-qa work ACROSS a node boundary —
      is RE-HOMED onto the fresh sibling tactic
      tactic-ladder-run-answerable-across-node-boundary, blocked_by
      tactic-mainqa-record-time-routing, rather than tracked here. The
      alternative (keep this node open holding only item 2) was declined because
      it leaves a merged implementation sitting under a raw node, which is
      precisely the dishonest record this tactic exists to eliminate. The
      enforcement half of scope item 3 is NOT delivered and is not claimed:
      --strict is deliberately unwired in ladder-terminus-census.ts, and this
      node's own success_signal threshold of 0 violations was NOT met at done
      (census re-measured 2026-08-19 at origin/main cfd3b4f0:
      merged-not-done=29, excused=24, violations=5, unstructured waits=2). What
      shipped is the INSTRUMENT, not the enforced invariant; see the following
      clarification for where enforcement went."
  - question: "The 0-violations threshold collides with clarification 210's
      no-backfill ruling for pre-existing prose 'Verifiability: WAIT' marks.
      Which of clarification 232's two outcomes is taken, and who executes it?"
    answer: "(Ruled by the author in a 2026-08-19 /office-hours sitting over the PR2
      park cohort.) NEITHER outcome is ruled on this node; the resolution is
      FOLDED INTO PR2 of the serialized RSI PR plan and executed AD HOC. The
      author's standing decision for that PR: it will NOT be implemented via
      /dispatch-ladder — no ladder invocation is to be used to drive any of it,
      including the stranded-node recovery below — and the terminus resolution
      rides in the same PR if it fits in one. Standing facts for whoever
      executes it, re-measured 2026-08-19 at origin/main cfd3b4f0. The census
      reports 5 violations: three are PLAIN STRANDED NODES with no wait involved
      — tactic-align-tactics-mark-terminal-skipped (#3047),
      tactic-dependency-justification-audit (#2875),
      tactic-graph-commit-landing-signal-unreliable (#3050), all sitting at
      phase main-qa — and recovering them by hand moves the observable from 5 to
      2, leaving only the two prose waits and sharpening the remaining question
      considerably. Of those two: tactic-attention-namespaced-rank's wait names
      a real node (tactic-attention-per-tier-boost-migration) and IS expressible
      as a blocked_by edge today with no new machinery;
      tactic-pause-disables-merge-lane's awaits an EPISODE — a heartbeat tick
      with the pause sentinel present and a reviewed green node-lane PR pending
      merge — which is neither a node nor a calendar deadline, so neither
      blocked_by nor tactic-wait-calendar-release's wait_until shape fits it,
      and inventing a shape for it deserves its own tactic rather than a unit.
      Clarification 232's escape ('the sensor stays approximate and says so')
      therefore remains live for that second wait, and taking it means having
      ladder-terminus-census.ts state the approximation in its own output rather
      than leaving readers to infer it. Wiring ladder-terminus-census.ts
      --strict into CI is gated on that answer; it is wired into nothing today
      by the script's own deliberate choice. Two invariants from the preceding
      clarification bound every option: findUnstructuredWaits must never feed
      back into classifyTerminus to reclassify a prose wait as excused, and
      closing the wait gap means converting prose to real blocked_by edges,
      never loosening the predicate. Re-measure with 'npx tsx
      packages/intentionsutil/scripts/ladder-terminus-census.ts intentions
      --lint' before and after rather than citing any stored figure."
tooling_goals: []
success_signal:
  observable: "the merged-but-not-terminal count: nodes at origin/main whose
    execution.completion.mergedAt is set but whose phase is not done and which
    carry neither office_hours nor a non-empty blocked_by"
  sensor: ladder-terminus census over the intention store (merged-but-not-terminal
    count)
  threshold: "0 violations, EXCLUDING the one deliberately-approximate prose wait
    the sensor declares in its own output. Amended off an unqualified 0 by
    author ruling 2026-08-19 over the PR2 park cohort
    (plans/dispatch-rsi-serialized-pr-plan.md §\"PR2 Unit 7\"; indexed in
    plans/dispatch-rsi-author-rulings.md): closing the wait gap means converting
    prose waits to real blocked_by edges, never loosening the predicate — and
    tactic-pause-disables-merge-lane's wait is on an EPISODE (a heartbeat tick
    with the pause sentinel present and a reviewed green node-lane PR pending
    merge), which is neither a node nor a calendar deadline, so neither
    blocked_by nor tactic-wait-calendar-release's wait_until shape fits it.
    Inventing a shape for it deserves its own tactic. Clarification 232's
    recorded escape is therefore taken for that one wait: the sensor stays
    approximate and SAYS SO, in ladder-terminus-census.ts's own output, rather
    than leaving readers to infer it. Baseline 2026-08-14 at origin/main
    206a6994: 29 merged-not-done, 24 excused, 5 violations. Re-measure with `npx
    tsx packages/intentionsutil/scripts/ladder-terminus-census.ts intentions
    --lint` before and after; never cite a stored figure."
  is_proxy: true
attention: null
phase: done
execution:
  branch: align-ladder-mainqa-terminus
  pr: 3091
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-14T15:00:49Z
    mergeCommitSha: de347430a326f56d519baaa1d69648853e982482
    graphCommitSha: null
  lane_pass: null
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


## Amendment 2026-08-19 — `success_signal.threshold` moves off an unqualified 0

*(Author ruling over the PR2 park cohort; carried into
`plans/dispatch-rsi-serialized-pr-plan.md` §"PR2 Unit 7" and indexed in
`plans/dispatch-rsi-author-rulings.md`. Transcribed onto this node 2026-08-29
under Ruling 5.)*

The clarification above records the author's decision that clarification 232's
resolution is folded into PR2 and executed ad hoc. **The consequence for this
node's own signal was never written down:** its recorded threshold of **0
violations** was not met at `phase: done` (census re-measured 2026-08-19 at
origin/main `cfd3b4f0`: merged-not-done 29, excused 24, violations 5, unstructured
waits 2), and one of the two remaining prose waits is structurally unclosable
today. So the threshold is **amended off an unqualified 0**: it becomes 0
violations *excluding the one deliberately-approximate prose wait the sensor
declares in its own output*.

**What that does and does not license.** It does **not** loosen the predicate:
`findUnstructuredWaits` must never feed back into `classifyTerminus` to reclassify
a prose wait as excused (`packages/intentionsutil/src/terminus.ts:153-162`), and
`classifyTerminus` keeps its strict predicate unchanged. Note the enumeration
asymmetry recorded at `packages/intentionsutil/src/terminus.ts:46-55`: because
`classifyTerminus` and `router.ts`'s `blockersComplete` fail open in *opposite*
directions on a missing `byId` entry, the tolerant-enumerating census sensor may
call this predicate **without** adopting the router's strict-enumeration
precondition — a dropped blocker file makes it OVER-report a violation rather than
hide one. (The PR2 prose said `classifyTerminus` "keeps its strict enumeration
(`listNodesStrict`)"; re-measured 2026-08-30 that is inverted — `terminus.ts` is
fs-free and never calls `listNodesStrict`. Corrected here.) What the amendment
licenses is `ladder-terminus-census.ts` stating the approximation in its own
output — and only then wiring `--strict`, which is unwired today by the script's
own deliberate choice.
