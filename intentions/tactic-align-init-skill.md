---
id: tactic-align-init-skill
kind: tactic
statement: "/align-init SKILL.md: fork entrypoint — orient, validate deployment,
  review virtues, delegate to /align-strategy; retires the legacy /align skill"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Off-path tactic (strategy clarifications 9 and 11): round 1 deferred
  this by omission; the first re-evaluation recorded it, and the second removed
  the interim backlog flag — off-path status now derives at read time from the
  absence of any blocked_by/parent chain to a validates-terminal, demoting it
  via the calculated-attention signal term with zero stored judgment. It neither
  blocks the strategy's /align-tactics eligibility nor disappears from
  selection. Renamed from tactic-align-skill (`/align`) to
  tactic-align-init-skill (`/align-init`) so the new fork-entrypoint skill does
  not collide with — or require an in-place rewrite of — the legacy `/align`
  skill (rung-0/refine-workflow/rung-5 dialectic); this tactic now retires that
  legacy skill outright instead of repurposing its file."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-align-init-skill
  pr: 2781
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# /align-init SKILL.md: fork entrypoint — orient, validate deployment, review virtues, delegate to /align-strategy; retires the legacy /align skill

## Context

The fork/plugin-consumer entrypoint (spec:
`intentions/tactic-graph-native-dispatch.md` §2.1). **Off-path tactic** —
no `blocked_by`/`parent` chain from a validates-terminal reaches it, so
the calculated-attention signal term (strategy clarification 11,
`tactic-calculated-attention`) demotes it at read time; no stored flag.
Recorded by the 2026-07-03 re-evaluations after round 1 had deferred it by
omission: fully planned and selectable, it neither blocks the strategy's
eligibility nor disappears from selection.

Named `/align-init` rather than `/align` so the new fork-entrypoint skill
never collides with the legacy `/align` skill's name during migration, and
so the legacy skill's removal is an explicit, visible step (Unit 2) instead
of a silent in-place overwrite.

## Unit 1 — author `.claude/skills/align-init/SKILL.md` (new skill, graph-native)

**Recommended model:** opus

Scope — codify the four steps as a new skill directory, carrying forward
rung-0 detection and the rung-5 dialectic from the legacy skill;
`refine-workflow` is superseded by `/align-strategy` and is not carried
forward:

1. **Orient.** One-screen description: a harness for long-horizon
   autonomous workflows built around the intention graph — virtues
   (permanent dispositions, roots), strategies (persistent,
   condition-bearing, signal-carrying goals), tactics (transient,
   completable, delegable work), delegations (attachment records).
2. **Validate deployment.** intentionsutil installed and tests pass
   (`npm test --prefix packages/intentionsutil`), store readable,
   `validateGraph` clean, router heartbeat wired.
3. **Review virtues.** Present inherited virtue roots (forks begin with
   the upstream repo's; inherited virtues and strategies are assumed
   preserved). Interview for additional or ambiguous virtues — Socratic,
   one question at a time, per the existing rung-0 flow. Commit and push.
4. **Delegate to `/align-strategy`.** Then confirm at least one new or
   updated strategy exists; if none, tell the user the dispatch router has
   no work until a strategy is recorded.

Carry the rung-5 dialectic engine (structural roles + perspectives,
synthesis/contrarian/re-synthesis, delegability findings) into
`/align-init` unchanged — it remains the scheduled periodic review,
invoked by the `align` jit trigger. Update the jit config's skill
reference (`.claude/skills/dispatch-propagate/scripts/jit.example.json`,
`"key": "align"` / `"skill": "align"`) to point at `align-init` — this is
the trigger's only wiring to the skill's file location.

Out of scope: `/align-strategy` and `/align-tactics` internals (sibling
tactics).

## Unit 2 — remove the legacy `/align` skill

**Recommended model:** sonnet

Depends on: Unit 1 — the new skill must cover rung-0 and rung-5 before the
legacy skill is deleted, so the scheduled dialectic is never left without
a home.

Scope: delete `.claude/skills/align/` (`SKILL.md` and `scripts/`)
entirely. This is a removal, not a rename-in-place — `/align-init` is
authored as a new skill directory in Unit 1, so nothing under
`.claude/skills/align/` survives. Grep the repo for remaining bare
`/align` references (skill lists, other skills' docs, the jit config) and
update or remove them; `/align-strategy` and `/align-tactics` are
unaffected (distinct skill names).

## Dependencies

- `tactic-align-strategy-skill` — step 4 delegates to it.

## Reuse

- Rung detection and the rung-0/rung-5 flow in the legacy
  `.claude/skills/align/SKILL.md` — ported into the new `align-init` skill
  in Unit 1, then the legacy file is deleted in Unit 2. This supersedes
  the prior plan (rewrite `.claude/skills/align/SKILL.md` in place under
  the same name): since the skill is renamed, the old file is retired
  outright instead of being overwritten.

## Verification

Prose: dry-run in a fresh clone posing as a fork — orientation fits one
screen, deployment validation catches a missing store, the virtue review
commits, and the session hands off to `/align-strategy`; no gh issue
created anywhere. Confirm `.claude/skills/align/` no longer exists and
that the `align` jit still fires the rung-5 dialectic, now via
`/align-init`.

## Implementation notes

Two units; subagents with `model: opus` (Unit 1) and `model: sonnet`
(Unit 2); constrain to working-tree edits.
