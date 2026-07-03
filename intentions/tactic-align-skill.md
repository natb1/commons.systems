---
id: tactic-align-skill
kind: tactic
statement: "/align SKILL.md: fork entrypoint — orient, validate deployment,
  review virtues, delegate to /align-strategy"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Off-path tactic (strategy clarifications 9 and 11): round 1 deferred
  this by omission; the first re-evaluation recorded it, and the second removed
  the interim backlog flag — off-path status now derives at read time from the
  absence of any blocked_by/parent chain to a validates-terminal, demoting it
  via the calculated-attention signal term with zero stored judgment. It neither
  blocks the strategy's /align-tactics eligibility nor disappears from
  selection."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  phase: implement
  blocked_by:
    - tactic-align-strategy-skill
---
# /align SKILL.md: fork entrypoint — orient, validate deployment, review virtues, delegate to /align-strategy

## Context

The fork/plugin-consumer entrypoint (spec:
`intentions/tactic-graph-native-dispatch.md` §2.1). **Off-path tactic** —
no `blocked_by`/`parent` chain from a validates-terminal reaches it, so
the calculated-attention signal term (strategy clarification 11,
`tactic-calculated-attention`) demotes it at read time; no stored flag.
Recorded by the 2026-07-03 re-evaluations after round 1 had deferred it by
omission: fully planned and selectable, it neither blocks the strategy's
eligibility nor disappears from selection.

## Unit 1 — author `.claude/skills/align/SKILL.md` (graph-native rewrite)

**Recommended model:** opus

Scope — codify the four steps onto the existing skill (rung-0 detection is
retained; `refine-workflow` is superseded by `/align-strategy`; the rung-5
dialectic remains the scheduled periodic review):

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

Out of scope: `/align-strategy` and `/align-tactics` internals (sibling
tactics).

## Dependencies

- `tactic-align-strategy-skill` — step 4 delegates to it.

## Reuse

- Rung detection and the rung-0 Socratic flow in
  `.claude/skills/align/SKILL.md` — this is a rewrite of that skill's
  entry flow, not a new skill file.

## Verification

Prose: dry-run in a fresh clone posing as a fork — orientation fits one
screen, deployment validation catches a missing store, the virtue review
commits, and the session hands off to `/align-strategy`; no gh issue
created anywhere.

## Implementation notes

Single unit; subagent with `model: opus`; constrain to working-tree edits.
