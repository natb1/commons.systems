---
id: tactic-mount-skill
kind: tactic
statement: A general /mount skill mounts external graphs onto the current graph
  — its onboarding lane bootstraps a practitioner's own graph, mounts the
  commons.systems graph as a delegatee through periagoge dialectic, enrolls
  held-on-trust content in the practitioner's curriculum, and converges on an
  /align directive
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-04 /align README-practitioner round: the
  README runbook (point 2) funnels prospects through /mount, a skill that does
  not exist yet. The author directed the design beyond onboarding-only: a
  general mount skill folding in the recorded mount use cases (tradition
  deferral, vendor delegation), with the onboarding lane triggered by the
  absence of a graph in the invoking repo. /mount supersedes /align's no-prompt
  onboarding funnel."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
  - strategy-graph-mounts
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
# A general /mount skill — onboarding, tradition, and delegation lanes

## Context

The 2026-08-04 /align README-practitioner round recorded the practitioner
runbook (README point 2): install this repo's skills as a Claude plugin → run
`/mount` → run `/align <directive>`. `/mount` does not exist yet. The author
directed a general mount skill, not an onboarding-only one: mounting is
first-class in the graph (strategy-graph-mounts), and the recorded mount use
cases — deferring to a tradition during /align or curriculum review,
delegating to a vendor — share mechanics with practitioner onboarding. The
onboarding lane is differentiated by its trigger: the absence of an
`intentions/` graph in the invoking repo.

## Design (endorsed 2026-08-04 interview)

**Lane selection by context:**

- **Onboarding lane** — no `intentions/` graph exists in the invoking repo
  (the practitioner's repo, with this repo's skills installed as a plugin).
- **Tradition lane** — a graph exists; the mount target is a tradition
  (deferral surfaced during /align or a curriculum review sitting).
- **Delegation lane** — a graph exists; the mount target is a vendor or
  other delegatee.

**Onboarding lane steps:**

1. **Periagoge dialectic.** The practitioner articulates their own model of
   goals/alignment/project management first (their account before Claude's —
   the type-b interview rules from the align skill's interview-type
   doctrine). Then the load-bearing concepts are taught Socratically, one
   open question at a time: node kinds (virtue/strategy/tactic/delegation),
   mounting, attention, signals, the office-hours queue, the curriculum.
   AskUserQuestion only for bounded gates; open elicitation is conversational.
   Practitioner-facing language is plain (recorded copy doctrine,
   strategy-promote-progressive-detachment 2026-08-04): the skill teaches the
   concepts without the philosophical vocabulary — no "periagoge",
   "dialectic", "hexis" in what the practitioner reads — and describes
   virtues as **unconditional** (kind-virtue's doctrine: exceptionless in
   application, amendable), never "permanent".
2. **Mechanical mount.** Scaffold the practitioner's own `intentions/` graph:
   their virtue roots and first nodes (owned by them, from the dialectic).
   Record the commons.systems graph as a **mounted delegatee**: a delegation
   node with divergence/irreversibility axes, by-reference mount shape per
   strategy-graph-mounts (mount structure never assumes same-repo residence).
3. **Curriculum frontier.** Every concept the practitioner takes on trust
   (the kind schema, dispatch doctrine, attention semantics, ...) enrolls as
   born-parked review items in the practitioner's own graph — the same
   deferral typology this repo's curriculum uses: deferral is tracked, never
   forgotten. Significant delegation to commons.systems is expected; the
   frontier is its audit trail.
4. **Converge and hand off.** The dialectic converges on a directive in the
   practitioner's own words; `/mount` ends by instructing (not invoking on
   its own authority) `/align <directive>` to record their first strategy
   under interview.

**Tradition/delegation lanes:** fold the existing mount mechanics
(strategy-graph-mounts: mount anchors on tradition/delegation records, graft
relation distinct from serves, hand-assessed + derived degree) into skill
form; the dialectic scales down to confirming what is grafted and what is
held on trust, with the same curriculum enrollment for deferral.

**Funnel supersession:** `/mount` fully supersedes /align's no-prompt
onboarding funnel (author decision 2026-08-04). No-prompt `/align` delegates
to `/mount`; the funnel's deployment-validation step
(validate-deployment.sh) moves into the onboarding lane. The /align SKILL.md
onboarding branch is rewritten to delegate when this lands — removing, with
it, the superseded orientation text (which still described virtues as
"permanent dispositions"; the corrected term is "unconditional").

## Scope

- New skill directory `.claude/skills/mount/` (SKILL.md + any scripts).
- Edit `.claude/skills/align/SKILL.md`: no-prompt branch delegates to /mount.
- Scaffolding logic: kind-node bootstrap for a fresh practitioner graph
  (reference or copy of this repo's kind-* nodes — decide at plan time
  against the by-reference doctrine).
- Out of scope: marketplace/directory submission of the plugin (gated on the
  tier-3 declaration per strategy-distribute-workflow's narrowed gate);
  mount schema/tooling changes (owned by strategy-graph-mounts' own tactics).

## Verification (sketch, refined at plan time)

- Dry-run the onboarding lane in a scratch repo with no intentions/ graph:
  confirm the dialectic runs before any write; the mount delegation node and
  born-parked curriculum items land in the practitioner graph; the session
  ends handing off to /align with a crafted directive.
- Tradition lane dry-run against an existing graph: confirm no scaffolding
  occurs and the mount anchors on the tradition record.
- /align with no prompt delegates to /mount.
