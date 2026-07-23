---
id: tactic-grounding-research-skill
kind: tactic
statement: "Interactive grounding-research skill — author-invoked: consume the
  tick gap analysis, mark circumstantial nodes, /deep-research the rest into
  candidate curriculum chunks"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-10 /align-tactics round from the 2026-07-07
  /align-strategy draft: instruments the strategy's interactive-research
  actuator tooling goal — the author-side consumer of the tick gap analysis,
  gated on it by blocked_by. Author-invoked only, never tick-invoked (strategy
  condition); the one place grounding/circumstantial marks are written outside a
  /reading-review session."
reading: null
gap: null
serves:
  - strategy-complete-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-grounding-research-skill
  pr: 2846
  attempts: {}
  markers:
    - reviewed
  strategy_fingerprint: null
validates: []
blocked_by:
  - tactic-grounding-gap-analysis
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Interactive grounding-research skill — author-invoked: consume the tick gap analysis, mark circumstantial nodes, /deep-research the rest into candidate curriculum chunks

## Context

Instruments `strategy-complete-grounding`'s interactive-research actuator
tooling goal: the author-side half of the grounding loop. The tick sensor
(`tactic-grounding-gap-analysis`, the `blocked_by` gate) reports ranked
unmarked durable-layer nodes; this skill is where the author walks that
ranking and closes gaps — the one place grounding/circumstantial marks are
written outside a `/reading-review` session (2026-07-07 interview, retained
draft). Strategy condition: `/deep-research` sourcing stays author-invoked;
the tick never runs it.

## Units of work

### Unit 1 — author `.claude/skills/grounding-research/SKILL.md`

**Scope.** One new file: `.claude/skills/grounding-research/SKILL.md`. No
scripts, no hooks, no other files. Follow `ref-write-instructions`. Note:
committing `.claude/skills/**` from an auto-mode dispatch session can be
denied by the permission classifier (agent-behavior config); if the commit is
blocked, surface it rather than retrying.

The skill must specify:

- **Trigger**: `/grounding-research` — an interactive office-hours skill,
  author present; **never tick-invoked** (a condition on
  `strategy-complete-grounding`). `AskUserQuestion` for bounded choices,
  plain conversation for open dialectic — the same split as
  `.claude/skills/align-strategy/SKILL.md`.
- **Session start**: refresh the gap report
  (`npx tsx packages/intentionsutil/scripts/grounding-gap.ts`) and walk the
  ranked unmarked nodes top-down with the author.
- **Per node, in order**: (1) ask whether the node is ungrounded because it
  is *circumstantial to the author* — if so record
  `attributes.grounding: "circumstantial: <the author's why>"`; (2) otherwise
  run `/deep-research` to source relevant frontier work across philosophical,
  technical, peer-review, and creative literature; (3) an empty search
  records `attributes.grounding: "none-found: <date -u +%Y-%m-%d>"`.
- **For each found candidate body of thought**: enqueue a candidate
  curriculum chunk in the chunks-10–17 convention — mirror
  `intentions/tactic-reading-chunk-10-hirschman-exit-voice.md`: owner
  `human`; born-parked (`office_hours` reason + since + recommendation,
  `phase` absent); `parent: tactic-tradition-reading-program`; `serves` and
  `validates` `[strategy-complete-grounding]`;
  `attributes.curriculum: {priority: <appended after the current queue max>,
  candidate: true, passages: [{work, range}]}`; body with the
  `Text` / `Questions to establish relevance` / `Completion` sections.
  Passages and questions only — never a summary of what the candidate
  teaches (the Cave-educator constraint, strategy clarification 9).
- **Recording rules**: every frontmatter write via
  `npx tsx packages/intentionsutil/scripts/write-node.ts --file <json>` on a
  readNode-dumped, jq-patched JSON — never hand-edit YAML; land everything in
  ONE `packages/intentionsutil/scripts/graph-commit` bundle at session end
  (marks + new chunks + any strategy clarification the author dictates).
- **Prohibitions**: no `gh` anywhere; marks only in this author-present
  session (tick workers never write them — strategy clarification 4); never
  create a `tradition-*` record here (records are created only at the
  office-hours session that examines a candidate chunk — strategy
  clarification 2; dismissal at that session lands as a strategy
  clarification — clarification 3).

**Recommended model**: opus

## Reuse

- `packages/intentionsutil/scripts/grounding-gap.ts`
  (`tactic-grounding-gap-analysis`) — the session's input.
- `packages/intentionsutil/scripts/write-node.ts`,
  `packages/intentionsutil/scripts/graph-commit` — the write path.
- `intentions/tactic-reading-chunk-10-hirschman-exit-voice.md` — the
  candidate-chunk template this skill instantiates.
- `.claude/skills/align-strategy/SKILL.md` — register and interaction
  conventions.

## Verification

No automated test surface — a SKILL.md is model instructions. Manual: dry-run
in an interactive session (stop before `graph-commit`): confirm the skill
refreshes the gap report, walks nodes in report order, asks circumstantial
before sourcing, produces mark JSON and one candidate-chunk node that
`npx tsx packages/intentionsutil/scripts/validate-graph.ts` accepts, and
plans exactly one graph-commit bundle. Confirm no `gh` invocation appears in
the flow and the skill states it is never tick-invoked.
