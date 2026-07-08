---
id: tactic-align-skills-dataviz-guidance
kind: tactic
statement: Wire the /dataviz built-in into the align family — /align-strategy
  step 2.7 (design-canvas support) and /align-tactics decomposition — as the
  mandated design-guidance source for chart/dashboard/data-viz requirements,
  composed with the DesignSync canvas
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-07-08 /align-strategy interview that recorded
  the /dataviz binding as a clarification on strategy-graph-native-dispatch.
  That clarification is the requirement; this retains the skill-text encoding as
  draft content per retain-not-refine (clarification 6). Likely folds into
  tactic-align-skills-greenfield-gate (the align-skill-text doctrine home per
  clarifications 32/38) when /align-tactics next finalizes that subtree, rather
  than shipping standalone.
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
# Wire the /dataviz built-in into the align family — /align-strategy step 2.7 (design-canvas support) and /align-tactics decomposition — as the mandated design-guidance source for chart/dashboard/data-viz requirements, composed with the DesignSync canvas

> Draft context retained per retain-not-refine (strategy-graph-native-dispatch
> clarification 6). Not a plan — `/align-tactics` finalizes, splits, merges, or
> folds this into `tactic-align-skills-greenfield-gate`.

## Requirement (the durable home)

The binding itself is recorded as a clarification on
`strategy-graph-native-dispatch` (2026-07-08 interview): chart/dashboard/data-viz
requirements are gathered under the `/dataviz` built-in, binding the align
family, composed with — not replacing — the design canvas (clarification 7).
This node only retains the *skill-text encoding* of that requirement.

## Concrete edits this draft anticipates

- **`.claude/skills/align-strategy/SKILL.md`, step 2.7 (Design-canvas support,
  UI-design requirements only):** add that for a chart/dashboard/data-viz
  requirement the session first loads `/dataviz` and its procedure governs the
  recorded design — form by the data's job (including the "is it even a chart"
  test), color by role (categorical/sequential/diverging/status) never by rank,
  the categorical palette validated by `scripts/validate_palette.js` (run it,
  never eyeball ΔE), mark specs, a default hover layer, the accessibility pass.
  The DesignSync canvas artifacts are built to *follow* `/dataviz`; the two
  compose. Author design decisions land as clarifications; concrete chart
  guidance is retained as draft-tactic content (retain-not-refine).

- **`.claude/skills/align-tactics/SKILL.md`, decomposition:** when a unit
  delivers a chart/dashboard/data-viz surface, apply `/dataviz` per unit and
  carry the concrete guidance in the unit plan body — the chosen form, the
  validated palette (with the validator command in the ```verify``` block where
  it can run headless), and the mark/interaction specs. Cross-reference the
  clarification-7 composition rule so the two skills stay consistent.

## Non-goals

- Not a review-phase change. The author scoped this to requirements collection
  (align family); the "make `/dataviz` a review-phase finder lens" option was
  declined this round. Revisit only via a fresh interview.
- Not a delegation-node edit. The capture note (leans further on
  `delegation-anthropic-claude`, bounded because the guidance is agnostic and
  the reference files are vendorable) lives in the strategy clarification; a
  `delegation-anthropic-claude` `divergence.imported` entry, if wanted, is a
  separate single-node commit, not this tactic.

## Home note

Most likely folds into `tactic-align-skills-greenfield-gate` (the align-skill
doctrine-text home, clarifications 32/38) when `/align-tactics` next finalizes
that subtree, rather than shipping standalone.
