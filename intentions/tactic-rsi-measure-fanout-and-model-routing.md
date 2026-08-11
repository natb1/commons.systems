---
id: tactic-rsi-measure-fanout-and-model-routing
kind: tactic
statement: Measure this harness's own subagent fan-out and model-routing
  economics before importing either external finding -- both were measured on
  configurations this repo does not run
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-11 from the /rsi-research dry run. Two findings look
  actionable and are not, yet. CooperBench (600+ tasks, 12 libraries, 4
  languages, 5 leading models, ICLR 2026 workshop) measured agents collaborating
  on shared code scoring 30% lower on average than the same agents solo,
  degrading further with agent count (68.6% -> 46.5% -> 30.0% for 2 -> 3 -> 4
  agents), and Anthropic's own numbers put agents at ~4x plain-chat token cost
  and multi-agent systems at ~15x. But the report flagged the load-bearing open
  question it could not resolve: whether that penalty generalizes to
  orchestrator plus independent-subagent patterns, or is specific to concurrent
  edits on shared files. This repo fans out across separate worktrees -- the
  non-shared case, precisely the unresolved one. Separately, SICA found
  scaffolding degrading o3-mini against calling it bare (76% wrapped vs
  87%/79%), which argues for routing by task role rather than maxing out; this
  repo already has a model-selection heuristic in
  .claude/skills/implement-unit/SKILL.md, so the question here is whether that
  heuristic is paying off, not whether to adopt one. Importing either magnitude
  directly would be exactly the endogenous-primacy violation this strategy
  prohibits. The deliverable is a measurement that either motivates a follow-on
  tactic or records the finding as not applicable to this configuration."
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: a dated reading on strategy-recursive-self-improvement states, from
    this harness's own telemetry, whether subagent fan-out and the existing
    model-routing heuristic pay for themselves here
  sensor: aggregate-usage.sh -- by_phase_outcome (subagents_launched against
    findings_actionable and fixes_applied, pooled per phase), by_phase_model and
    by_model price proxy read against the same phases' pooled disposition rates,
    and by_node cost per closed tactic
  threshold: the reading lands with this harness's own comparison made, and either
    a follow-on tactic is drafted or the finding is recorded as not applicable
    to this configuration. A reading that restates the external numbers without
    this harness's own measurement is a failed measurement, not a completed one
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
    source: "2026-08-11 /rsi-research dry run: CooperBench (ICLR 2026 workshop);
      Anthropic multi-agent research-agent cost figures; SICA scaffolding
      result; Simon Willison on routing by task role"
    claimed_effect: fan-out costs 4x-15x and loses ~30% success on shared-file
      collaboration; extra scaffolding can degrade a strong reasoning model
      rather than merely cost more
    confidence: high on the measurements, but measured on a shared-file
      configuration this repo does not run -- the report explicitly left
      generalization to non-shared fan-out unresolved
    magnitude_is_provisional: true
    do_not_import_directly: true
  priority: P2 -- measure locally, do not import
---
# Measure this harness's own subagent fan-out and model-routing economics before importing either external finding -- both were measured on configurations this repo does not run

## Context

Two findings from the 2026-08-11 dry run look immediately actionable and are
not. Both were measured on configurations this repo does not run, and importing
either magnitude directly would be exactly the endogenous-primacy violation
`strategy-recursive-self-improvement` prohibits — the external finding enters as
a hypothesis, and this harness's telemetry accepts or refutes it.

**Fan-out.** CooperBench (600+ tasks, 12 libraries, 4 languages, 5 leading
models including GPT-5 and Sonnet-4.5, ICLR 2026 workshop) measured two agents
collaborating on **shared code** scoring 30% lower on average than the same
agents solo, degrading further with agent count (68.6% → 46.5% → 30.0% for
2 → 3 → 4 agents). Anthropic's own figures put agents at ~4x plain-chat token
cost and multi-agent systems at ~15x, with an explicit economic bar: task value
must be high enough to pay for it.

But the report named the load-bearing question it **could not resolve**: does
the penalty generalize to an orchestrator dispatching *independent,
non-code-sharing* subagents, or is it specific to concurrent edits on shared
files? This repo fans out across **separate worktrees** — the non-shared case,
precisely the unresolved one. The cost multipliers are configuration-independent
and do apply; the −30% success penalty may not apply here at all.

(The report also killed, on adversarial verification, the claim that subagent
isolation reduces orchestrator token cost via condensed summaries — 1-2 — and
the widely-cited "token usage explains 80% of performance variance" figure —
0-3. Neither is available as support for any position here.)

**Model routing.** SICA found scaffolding *degrading* o3-mini against calling it
bare (76% agent-wrapped vs 87%/79%), suggesting scaffolding meant to induce
reasoning can interrupt a reasoning model's own chain of thought. Simon
Willison's practice corroborates routing by task role rather than maxing out.
This repo **already has** a model-selection heuristic
(`.claude/skills/implement-unit/SKILL.md`, "Model-selection heuristic" — the
canonical home the planning rule points at). So the local question is not
whether to adopt one; it is whether the one in force is paying off.

## Scope

This tactic's deliverable is a **measurement and a dated reading**, not a
harness change. It either motivates a follow-on tactic or records the finding as
not applicable to this configuration.

- Fan-out: pooled `subagents_launched` against `findings_actionable` and
  `fixes_applied` per phase, and cost per closed tactic for high-fan-out vs
  low-fan-out phases.
- Model routing: `by_phase_model` and `by_model` price proxy read against the
  same phases' pooled disposition rates — does the heuristic's expensive tier
  buy disposition quality where it is spent?
- **Out of scope:** changing fan-out or the model heuristic in this tactic. A
  change drafted from a measurement not yet taken is the import this tactic
  exists to prevent.

## Reuse

- `aggregate-usage.sh`: `by_phase_outcome` (already sums `subagents_launched`,
  `findings_surfaced`, `findings_actionable`, `fixes_applied`,
  `followups_filed`, plus `disposition_distribution`), `by_phase_model`,
  `by_model`, `by_node`. Every input exists; nothing new needs instrumenting.
- The readings machinery on `strategy-recursive-self-improvement`.

## Verification

The reading lands with **this harness's own comparison made** — the pooled
numbers above, over a window large enough to carry them — and with an explicit
disposition per finding: follow-on tactic drafted, or recorded as not applicable
to this configuration.

**Refutation condition:** a reading that restates the external numbers without
this harness's own measurement is a **failed measurement**, not a completed
tactic. That failure mode is the specific thing this node guards against: the
citations are strong enough to be persuasive on their own, which is exactly why
they must not be acted on before the local numbers exist.
