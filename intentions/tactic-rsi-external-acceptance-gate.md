---
id: tactic-rsi-external-acceptance-gate
kind: tactic
statement: Gate rsi's own harness changes on an acceptance signal outside rsi's
  control, and record the rate at which self-passed changes are refuted by it
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-11 from the /rsi-research dry run's strongest and
  best-corroborated finding: across 35 self-improvement runs every run
  self-reported a passing score while 43% (15/35) actually scored below random
  baseline, and the study's conclusion was that reliable continual
  self-improvement requires at least one deployment-acceptance signal outside
  the agent's own control. Condition 13 on this strategy already installs
  qa-main as that signal for tactics the research lane drafts. This tactic
  closes the remaining half of the same gap: /rsi's own judgment step and its
  rsi-implement shortcut work are proposed, executed, and judged inside one
  loop. rsi already reuses the dispatch phase skills verbatim, so the external
  gate exists -- what is missing is that rsi-originated work is never
  distinguished from ordinary dispatch work, so nobody can read how often rsi's
  self-judgment was wrong."
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: every rsi-originated harness change reaches its terminal disposition
    through a check rsi did not author or run, and each iteration records how
    many self-passed rsi changes that check refuted
  sensor: aggregate-usage.sh by_phase_outcome.disposition_distribution for the qa
    and qa-main phases, restricted to nodes whose execution record marks rsi as
    originator; plus the refuted-count line rendered into rsi-plan.md from dated
    readings on strategy-recursive-self-improvement
  threshold: zero rsi-originated changes reach phase done without an external-gate
    disposition. A nonzero refuted count is a healthy reading; a sustained zero
    refuted count across consecutive iterations is itself a review trigger,
    because a gate that never refutes anything is not measuring anything
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  reference:
    source: "2026-08-11 /rsi-research dry run: controlled self-improvement study (35
      model-game runs), corroborated by Lilian Weng on the evaluator/permission
      layer sitting outside the loop and by reward-hacking data
      (proxy-gain-without-real-gain rising 26.4% -> 57.8% as optimization
      proceeds unchecked)"
    claimed_effect: self-verification alone misses real failures at a high rate (43%
      of self-passed runs below random baseline); an acceptance signal outside
      the agent's control is required for reliable continual self-improvement
    confidence: high -- the report's best-corroborated finding, though the primary
      study is a recent unreplicated preprint
    magnitude_is_provisional: true
  priority: P1 -- highest-value import in the 2026-08-11 batch
---
# Gate rsi's own harness changes on an acceptance signal outside rsi's control, and record the rate at which self-passed changes are refuted by it

## Context

The 2026-08-11 research dry run's strongest and best-corroborated finding: in a
controlled study, **every one of 35 self-improvement runs reached a
self-reported score ≥0.70, while 43% (15/35) actually scored below random
baseline** on real deployment. The study's conclusion was that reliable
continual self-improvement requires at least one deployment-acceptance signal
**outside the agent's own control**. Corroborated independently by Lilian Weng's
argument that the evaluator/permission layer should sit outside the loop, and by
reward-hacking data showing proxy-gain-without-real-gain rates climbing from
26.4% to 57.8% as optimization proceeds unchecked.

Condition 13 on `strategy-recursive-self-improvement` (landed 2026-08-11)
already installs qa-main as that outside signal **for tactics the research lane
drafts**. This tactic closes the other half of the same gap.

`/rsi` proposes harness changes in its own judgment step, routes some of them to
its own shortcut implementation path, and evaluates the result in the next
iteration's `rsi-plan.md` — proposal, execution, and scoring inside one loop.
The external gate is not missing: rsi reuses the dispatch phase skills verbatim,
so rsi-originated work already passes through qa and qa-main. What is missing is
that **rsi-originated work is not distinguished from ordinary dispatch work**,
so no one can read how often rsi's self-judgment was wrong. An oversight signal
that exists but is never tallied provides no evidence.

## Scope

- Mark rsi-originated nodes at execution time so the gate's verdicts can be
  grouped — the `execution` record is the natural carrier (it already exists on
  tactics; see the field list in `packages/intentionsutil/src/schema.ts:184-189`).
- Render a **refuted-count** line into `rsi-plan.md` from dated readings on
  `strategy-recursive-self-improvement`, per that strategy's fully-rendered
  condition (readings are the source of truth; the `.md` is derived).
- **Out of scope:** adding a new QA phase, a second review surface, or any
  divergent copy of the dispatch quality bar. The strategy's verbatim-reuse
  condition forbids all three. This tactic adds *accounting*, not machinery.

## Reuse

- The dispatch phase skills and their `by_phase_outcome` envelopes — already
  emitted, already parsed (`aggregate-usage.sh`, the `by_phase_outcome` section
  keyed on the envelope `.phase` with `disposition_distribution`).
- The readings machinery on strategy nodes, and `render-rsi-plan.ts`.
- Condition 13's refuted-hypothesis vocabulary — same disposition, applied to a
  different origin.

## Verification

The check is the tally itself, read across iterations:

1. Every rsi-originated change reaching phase `done` must carry an
   external-gate disposition. A `done` with none is a defect.
2. Each iteration records how many self-passed rsi changes that gate refuted.

**Refutation condition, and the anti-decoration guard:** a nonzero refuted count
is a *healthy* reading — it is the gate doing work. A sustained **zero** refuted
count across consecutive iterations is a review trigger, not a success:
either rsi's self-judgment is perfect (implausible against the 43% figure that
motivated this) or the gate is not actually independent of the loop it is
supposed to check. Recording the count without that asymmetry would reproduce
exactly the self-scoring failure the source measured.
