---
id: tactic-align-entrypoint-consolidation
kind: tactic
statement: "Consolidate the interactive graph entry point as /align: rename
  /align-strategy, fold in and remove /align-init, retire the align jit and
  rung-5 dialectic engine, single-PR atomic rename with full reference sweep"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align consolidation interview
  (clarification on strategy-graph-native-dispatch): /align-strategy is a
  misnomer for a skill that manipulates the whole persistent layer,
  /align-init's interactive half duplicates the onboarding funnel the entry
  point should carry itself, and the /align name is free since PR #2781 deleted
  the legacy skill. Draft — input to a future /align-tactics pass; not yet a
  plan."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# Consolidate the interactive graph entry point as /align: rename /align-strategy, fold in and remove /align-init, retire the align jit and rung-5 dialectic engine, single-PR atomic rename with full reference sweep

Retained draft from the 2026-07-09 /align consolidation interview — input to a
future /align-tactics pass; not yet a plan. Decision record: the 2026-07-09
consolidation clarification on strategy-graph-native-dispatch.

## Context

/align-strategy is the interactive entry point to the graph's persistent layer
but its name says only "strategy" — the layer includes virtues, traditions, and
delegations, all of which the interview may record or amend. /align-init's
interactive half (orientation, deployment validation, handoff to
/align-strategy) duplicates the onboarding funnel the entry point should carry
itself. The /align name is free: PR #2781 (tactic-align-init-skill) deleted the
legacy /align skill, and its collision-avoidance rationale was explicitly
migration-scoped.

## Scope (draft)

One atomic PR — this is the backward-compatible path: /align-strategy remains
invocable until the PR merges; after the merge /align exists and /align-strategy
does not. No alias period.

1. **Rename** `.claude/skills/align-strategy/` → `.claude/skills/align/`.
   Trigger becomes `/align [prompt]`.
2. **Prompt path** (`/align <prompt>`): the existing interview, scope widened
   to the whole persistent layer — the prompt may require recording or
   amending virtue, strategy, tradition, or delegation nodes (no separate
   virtue-review step exists anywhere); draft-tactic byproduct retention
   unchanged. The interview conventions owed by the open drafts
   (tactic-align-interview-type-doctrine, tactic-align-strategy-alignment-tests)
   apply to this skill surface once encoded.
3. **No-prompt path** (onboarding funnel, replacing the improvement pass):
   orientation (the one-screen persistent-layer primer, carried from
   /align-init step 1); scripted deployment validation (carried from
   /align-init step 2 — push the checks into a script per the
   mechanical-floor doctrine, not prose); then walk the user Socratically to
   crafting a prompt and execute `/align <prompt>` with it in-session. The
   improvement pass is retired — its design is retained in
   tactic-align-audit-legacy-review pending the /align-audit inclusion
   decision.
4. **Fold and delete `.claude/skills/align-init/`** entirely. The rung-0
   virtue-review flow retires with it (virtue work enters via `/align
   <prompt>`); fork bootstrap is the no-prompt funnel.
5. **Retire the align jit and the rung-5 dialectic engine**: remove the
   `align` entry from `jit.example.json`; update `test-dispatch-scripts.sh`
   fixtures (Test 2d asserts `skill: align-init`) and any
   `dispatch-select-target` jit references; delete the engine's agent defs
   (`.claude/agents/align-decomposer|consistency|delegability-assessor|contrarian|financial|technical|product|marketing|signal-assessor.md`)
   and the align-init scripts (`gather-context.sh`, `fetch-analytics`,
   `fetch-psi`) — after checking for callers outside the engine (the
   ref-delegability and ref-signal-identification skills document contracts
   the assessor agents consume). Engine content is retained in
   tactic-align-audit-legacy-review; verbatim source survives in git history
   at origin/main 44493733 (`.claude/skills/align-init/SKILL.md`).
6. **Reference sweep** (grep for `align-strategy`, `align-init`,
   `Skill(align-`, `skills/align-`): `.claude/skills/align-tactics/SKILL.md`,
   `.claude/skills/office-hours/SKILL.md`, `.claude/settings.json`
   permissions, the spec `intentions/tactic-graph-native-dispatch.md` §2/§2.1/
   §2.2, and the open drafts naming the old skill path or name —
   tactic-align-interview-type-doctrine, tactic-align-strategy-alignment-tests,
   tactic-align-family-opus-default, tactic-align-skills-latest-graph-guard,
   tactic-align-session-claiming, tactic-align-skills-dataviz-guidance,
   tactic-align-tactics-mechanical-floor,
   tactic-fingerprint-recipe-single-callsite, tactic-reading-review-skill,
   tactic-graph-self-consistency-sweep (its condition-review-sweep repoint
   bullet), and tactic-dispatch-script-hardening (stale gather-context.sh
   path note).
7. **Dispatch-tick continuity**: no live `dispatch.config/jit.json` exists
   (the align jit is in the no-config inert state), so the emulated dispatch
   tick is unaffected at runtime; the example config and script fixtures
   update in the same PR so `test-dispatch-scripts.sh` stays green.

Landing caveat: `.claude/skills/**` and `.claude/agents/**` edits are
agent-behavior config — dispatch auto mode denies the commit; land
interactively if hit.

Out of scope: /align-tactics internals; /align-audit authoring
(tactic-align-audit-skill); the retired engines' /align-audit inclusion
decision (tactic-align-audit-legacy-review).
