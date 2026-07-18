---
id: tactic-align-tactics-workflow
kind: tactic
statement: Rearchitect /align-tactics into a deterministic Workflow (Sonnet
  orchestrator, Opus decision subagents, Sonnet gathering subagents) —
  /review-fix-shaped
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview
  (strategy-token-economy clarification 14). Clarification 10's
  Sonnet-orchestrator + Opus-decompose/plan split is currently shipped as an
  ad-hoc per-callsite model:opus addition to /align-tactics' caller-thread
  Explore/Plan subagents (PR #2886, tactic-align-family-opus-default). This
  tactic carries the greenfield target: /align-tactics executes as a real
  Workflow (.claude/workflows/align-tactics.js via the Workflow tool), the same
  architecture as /review-fix and /qa-fix, so the model tiering is structural
  rather than a fragile per-callsite convention. Draft — a later /align-tactics
  round decomposes and plans it."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
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
# Rearchitect /align-tactics into a deterministic Workflow (Sonnet orchestrator, Opus decision subagents, Sonnet gathering subagents) — /review-fix-shaped

> Draft — retained context from the 2026-07-18 `/align-strategy` interview, not
> yet decomposed or planned. A later `/align-tactics` round consumes this body.
> Full intent: `strategy-token-economy` clarification 14.

## Context

`strategy-token-economy` clarification 10 fixed *who* runs on which model for the
`/align-tactics` align-family split (Sonnet orchestrator; Opus for the two
high-stakes acts). Clarification 14 (2026-07-18) fixes *how* that split executes:
a deterministic Workflow, not an ad-hoc per-callsite `model: opus` addition.

Today `/align-tactics` "runs in the caller's thread ... no orchestrator"
(`.claude/skills/align-tactics/SKILL.md:377`) and fans out the built-in
`Explore`/`Plan` subagents directly. PR #2886 (`tactic-align-family-opus-default`,
at qa) only adds `model: opus` to those ad-hoc calls — a correct but fragile
subset: any future edit that adds a `Plan`/`Agent` call without `model: opus`
silently regresses the highest-stakes act to Sonnet (the exact motivating bug).
The greenfield target is a real Workflow (`.claude/workflows/align-tactics.js`
invoked through the Workflow tool), the same architecture as
`.claude/workflows/review-fix.js` and `qa-fix.js`, so the tiering is structural.

## Target delegation (three tiers)

- **Sonnet top-level orchestrator** — node-id reservation, park-field writes, the
  clause-coverage walk, `graph-commit`, and assembling node bodies from subagent
  output. Carries no plan substance.
- **Opus subagents (key decisions)** — the two-sided drift-review verdict (which
  `attributes.conditions` failed), the decompose-to-signal judgment (which tactic
  nodes exist), and each claude-eligible tactic's plan-body authoring.
- **Sonnet subagents (delegable gathering)** — the `Explore` reuse-hunt /
  prior-art scan (stays demotable to Sonnet or Haiku per clarifications 4/10), the
  mechanical drift scan (grep the corpus, gather candidates), and clause-coverage
  evidence gathering.

## Autonomy-contract coupling (do not weaken)

`/align-tactics`' "never `AskUserQuestion` mid-run" contract holds *inside* the
Workflow. When the plan cannot be fully derived from the graph or otherwise needs
author intervention, the orchestrator parks the tactic node to `office_hours` via
the existing three-condition park mechanism (`align-tactics/SKILL.md:139-186`);
the resulting office-hours session is where `AskUserQuestion` legitimately runs
with the author. The rearchitecture must preserve this park escape hatch — a
Workflow (which cannot itself run an interactive dialectic) makes the park the
*only* author-input path, so every non-derivable decision must reach a park, not a
silent guess.

## Scope and asymmetry

The Workflow is the single autonomous execution model for **all** `/align-tactics`
invocations — router-launched and hand-triggered alike. There is no separate
interactive path; a human invocation just triggers the same autonomous flow.
`/align-strategy` stays **out** and remains whole-session Opus: its interview *is*
interactive `AskUserQuestion` dialectic a Workflow cannot run. Clean rule:
`/align-tactics` is autonomous → Workflow-able; `/align-strategy` is interactive →
not.

## Guardrails (bind as conditions when planned)

- **Plan-quality / phase-success parity** — the rearchitecture must not regress the
  decompose-to-signal quality bar or `/plan-issue`'s plan-quality bar the current
  Step 3 fan-out inherits; dropped instruction regresses the skill invisibly.
- **Standup-cost discipline** (clarification 12) — the Workflow script carries the
  reasoning and the SKILL body stays thin (under the 500-line guidance, detail in
  `references/*.md` loaded on demand), so workflow-ifying does not re-inflate the
  fixed per-session standup cost.

## Relationship to PR #2886

Brownfield: PR #2886 lands the `model: opus` params as increment 1 (keep it — a
correct subset). This tactic is increment 2: replace the ad-hoc calls with the
Workflow. Sequence after #2886 merges to avoid churning the same Step-3 region
twice.
