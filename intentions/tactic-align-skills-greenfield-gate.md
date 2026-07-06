---
id: tactic-align-skills-greenfield-gate
kind: tactic
statement: "align skills: encode the recorded doctrines — greenfield-relevance
  gate, artifact-owner placement, graph-as-sole-tracker, record-completeness,
  park-time recommendation — into the /align-strategy and /align-tactics
  SKILL.md files"
owner: ai
status: codified
parent: null
rationale: "The 2026-07-06 /align-strategy rounds recorded five doctrines as
  clarifications/conditions on strategy-graph-native-dispatch: the
  greenfield-relevance gate (clarification 26), artifact-owner placement (27),
  graph-as-sole-tracker with pointer-only TODOs (28), the record-completeness
  contract binding /align-strategy (31 / condition 7), and the park-time
  recommendation on every office_hours park (30 / condition 6). The skill files
  that execute those doctrines do not yet state them; until they do, the
  requirements bind only via the strategy node. This tactic carries them into
  .claude/skills/align-strategy/SKILL.md and
  .claude/skills/align-tactics/SKILL.md."
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
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# align skills: encode the recorded doctrines (greenfield gate, placement, sole tracker, record completeness, park recommendation)

## Context

The 2026-07-06 `/align-strategy` rounds recorded five doctrines as dated
clarifications/conditions on `strategy-graph-native-dispatch`:

1. **Greenfield-relevance gate** — at `/align-tactics` finalization and in
   every `/align-strategy` improvement pass, each candidate and open tactic's
   subject is checked against non-draft nodes that delete or supersede it.
   Per-unit: doomed units are dropped from the plan body naming the
   superseding node; only a fully-superseded tactic demotes to draft; an
   interim-live-risk exception must be explicit and name its expiry event.
2. **Artifact-owner placement** — `serves` names the strategy that owns the
   changed artifact, never a nearest-fit; genuinely cross-cutting subjects
   use an honest multi-entry `serves`; no owner means surface the gap, not
   force-fit.
3. **Graph as sole tracker** — the intentions/ graph is the source-of-truth
   issue tracker, bug tracker included; every defect worth fixing is a tactic
   or a unit of one; no side channels; code TODOs are pointer-only
   (`TODO(tactic-<id>)`), and a substantive TODO with no node is a
   review-phase finding.
4. **Record completeness** (clarification 31 / condition 7) — the graph
   record is the sole carrier from `/align-strategy` to `/align-tactics`:
   the target router queues re-evaluation as a fresh session with only the
   graph, so every decision, edge-case resolution, and tactical byproduct
   lands in the node at record time; same-session execution is a bootstrap
   safety, not a carrier.
5. **Park-time recommendation** (clarification 30 / condition 6) — every
   `office_hours` park writes recoverable context at park time: reason plus
   a best-next-steps recommendation; session attach/resume is not a
   supported recovery path, so a park whose context lives only in the
   parking session is a defect.

The SKILL.md files that execute these doctrines do not yet state them. This
tactic carries them into the skill text so a clean session running either
skill applies them without reading the strategy node first.

Landing note: `.claude/skills/**` edits are agent-behavior config — dispatch
auto mode blocks the commit (not the edit); if the worker hits that denial,
park for an interactive session to land the PR.

## Unit 1 — /align-strategy SKILL.md

**Recommended model:** sonnet

Scope (`.claude/skills/align-strategy/SKILL.md`):
- Step 1 improvement-pass branch: add a fourth staleness check — sweep open
  tactics for subjects deleted or superseded by non-draft nodes
  (greenfield-relevance gate, per-unit semantics, interim-live-risk
  exception with expiry).
- Step 4 (retain draft tactics): state the artifact-owner placement rule for
  the `serves` of retained drafts (owning strategy; multi-serves for
  cross-cutting; gap-surfacing when unowned).
- Out-of-scope/context prose: note the graph is the sole issue tracker,
  bug tracker included (pointer-only TODO rule), citing the
  strategy-graph-native-dispatch clarifications as the durable home.
- Record-completeness contract (strategy clarification 31 / condition 7,
  added by the 2026-07-06 re-evaluation): state in the skill preamble and
  at step 6 that the graph record is the sole carrier to /align-tactics —
  the target router queues re-evaluation as a fresh session with only the
  graph, so every decision, edge-case resolution, and tactical byproduct
  must land in the node (clarifications/conditions/signal + draft-tactic
  bodies) at record time; same-session /align-tactics execution is a
  bootstrap safety, not a carrier, and step 6's clause-coverage walk is
  the check that discharges the condition.

## Unit 2 — /align-tactics SKILL.md

**Recommended model:** sonnet

Scope (`.claude/skills/align-tactics/SKILL.md`):
- Finalization step: before promoting a draft or recording a new tactic,
  run the greenfield-relevance gate per unit against non-draft superseding
  nodes; drop doomed units naming the superseding node.
- Placement step: `serves` = artifact-owning strategy; multi-serves for
  cross-cutting subjects; surface gaps instead of force-fitting.
- Recording guidance: every defect worth fixing lands as a tactic or a unit
  of an existing one (sole-tracker doctrine); TODOs pointer-only.
- Park mechanics (Autonomy contract section and Step 4 born-parked
  authoring): every park writes `office_hours` with reason **and** a
  best-next-steps recommendation for the human (condition 6 / clarification
  30) — this applies to escalation parks and born-parked tactics alike.
  Transitional note until the first-class field lands: the
  `office_hours.recommendation` schema addition is homed in
  `tactic-office-hours-graph-entry` Unit 1 / `tactic-phase-skill-node-targets`
  Unit 2 (shared, skip-if-present); while it is absent from `schema.ts`,
  `write-node.ts` rejects the key, so the skill text must say to carry the
  recommendation inside the `reason` string (a labelled trailing sentence)
  and switch to the field once it validates — never to drop it.
- Unrecorded-context park framing: when a decomposition or re-evaluation
  cannot proceed because needed context is not in the graph, the park
  reason names the missing context as a record-completeness defect of the
  `/align-strategy` round that produced it (condition 7) — the fix is an
  author `/align-strategy` pass, not guessing.

## Dependencies

None — the clarifications this encodes are already on `origin/main`.

## Verification

```verify
grep -q "greenfield-relevance" .claude/skills/align-strategy/SKILL.md && grep -q "greenfield-relevance" .claude/skills/align-tactics/SKILL.md && grep -qi "sole.*tracker\|source-of-truth issue tracker" .claude/skills/align-tactics/SKILL.md && grep -qi "record.completeness\|sole carrier" .claude/skills/align-strategy/SKILL.md && grep -qi "recommendation" .claude/skills/align-tactics/SKILL.md && echo OK
```

- Prose check: a clean-session read of each SKILL.md finds the five
  doctrines stated where the flow applies them (improvement pass /
  finalization / park mechanics / step-6 coverage walk), each citing
  strategy-graph-native-dispatch as the durable home rather than restating
  interview provenance.
