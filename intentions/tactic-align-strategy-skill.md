---
id: tactic-align-strategy-skill
kind: tactic
statement: "/align-strategy SKILL.md: interview-driven strategy recording —
  supersedes /file-issue requirements definition"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Codifies the 2026-07-03 prototype run (this strategy's own record)
  into a repeatable skill: frame, dialectic interview with design-canvas
  support, delegation advice, retain-not-refine draft tactics, graph-commit
  record."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-graph-commit
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# /align-strategy SKILL.md: interview-driven strategy recording — supersedes /file-issue requirements definition

## Context

Supersedes `/file-issue`'s requirements-definition role. The 2026-07-03
prototype run is recorded on `intentions/strategy-graph-native-dispatch.md`
— its clarifications are the interview's output shape. Full skill spec:
`intentions/tactic-graph-native-dispatch.md` §2.2; the `/file-issue`
coverage rows this skill must absorb are in §4 of the same body.

## Unit 1 — author `.claude/skills/align-strategy/SKILL.md`

**Recommended model:** opus

Scope — codify the five steps:
1. **Frame.** Virtues lacking strategies; requirements input → new strategy
   vs edit to an existing one (overlap detection over
   `intentions/strategy-*.md`); no input → improvement pass (failing
   conditions, stale signals, contradicted clarifications).
2. **Interview dialectic.** Intent; `serves`/`parent` placement; benefit;
   `success_signal`; `attributes.conditions`. Edge cases and consequences
   surfaced; resolutions recorded as dated `clarifications`. For UI-design
   requirements, supplement AskUserQuestion with design-canvas artifacts
   (`@commons-systems/ds` via DesignSync to claude.ai/design) — interview
   aids, not deliverables; note the stale-until-project-refresh caveat.
3. **Delegation advice.** Propose `recovers` edges and review-trigger
   updates; flag capture risk per the delegation kind's
   divergence/irreversibility axes.
4. **Retain draft tactics.** Tactical context developed in-session lands as
   draft tactic nodes (`status: raw`, no phase, `serves` the strategy) —
   retain, not refine: no plan schema, no quality bar.
5. **Record** via graph-commit; the interview is the audit; the push makes
   the strategy schedulable. When the edit touches a strategy with open
   non-draft tactics, warn the author at record time that the edit queues
   a soft freeze and re-evaluation of the open subtree (strategy
   clarification 10).

6. **Requirements coverage check** (added 2026-07-03 by the
   `/align-tactics strategy-attention-surface` round): before record, map
   every clause of the author's requirement text to a recorded element —
   a clarification, a rationale sentence, a tooling goal, a condition, or
   a draft-tactic bullet. An unmapped clause returns to the interview or
   lands in a draft body; it is never dropped silently. Found live: the
   requirement's "similar to the WIP queue visualization and metrics on
   the existing office hours ui" anchor for the velocity signal survived
   only in session context and had to be restored by the tactic round.

Coverage rows to handle visibly: multi-topic separation into independent
strategies; duplicate detection; the 8-category quality evaluation folded
into interview probes (per the §4 matrix).

Out of scope: `/align-tactics` and `/align-init` (sibling/deferred tactics);
deleting `/file-issue` (`tactic-legacy-router-removal`).

## Dependencies

- `tactic-graph-commit` — step 5's write path.

## Reuse

- Rung detection in the legacy `.claude/skills/align/SKILL.md` — this
  skill supersedes its `refine-workflow` outcome; rung-0 onboarding moves
  to `/align-init` (`tactic-align-init-skill`), which retires the legacy
  skill outright rather than leaving it in place.
- Interview convention from the prototype run: one AskUserQuestion per
  decision, recommended option first.

## Verification

Prose: dry-run on a toy requirement in an interactive session — the written
node passes `validateGraph`, lands via graph-commit, and no gh issue is
created anywhere in the flow.

## Implementation notes

Single unit; implement in a subagent with `model: opus`; supply this
Context and Scope; constrain to working-tree edits.
