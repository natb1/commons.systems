---
id: tactic-align-strategy-stepref-drift-dataviz
kind: tactic
statement: "Update the stale /align-strategy step-number reference (step 2.7 to
  step 2.9, design-canvas support) at all three sites in the
  tactic-align-skills-dataviz-guidance draft after PR #2867's Step 2
  renumbering"
owner: ai
status: codified
parent: null
rationale: "Surfaced by /review-fix of PR #2867
  (tactic-align-strategy-alignment-tests). That PR renumbered /align-strategy's
  Step 2 dialectic steps, shifting design-canvas support from step 2.7 to step
  2.9. The separate, still-raw draft tactic-align-skills-dataviz-guidance cites
  /align-strategy step 2.7 (design-canvas support) in three places, which now
  point at step 2.7 (Conditions) instead of the real design-canvas step 2.9. A
  repo sweep of intentions/ and .claude/skills/ confirms this draft is the only
  external node carrying a now-shifted align-strategy step number, so one
  reference update clears the drift. This draft is owned by
  strategy-graph-native-dispatch, so this follow-up serves that strategy per
  artifact-owner placement (strategy clarification 27), not
  strategy-explicit-intent. PR #2867 has merged to origin/main (commit 1249fea4)
  and re-verified at finalize time (2026-07-18) that design-canvas support is
  still step 2.9 in the current align-strategy/SKILL.md, so this tactic is
  finalized into a directly-executable one-unit plan."
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
attributes:
  bug_fix: true
---
# Update the stale /align-strategy step-number reference (step 2.7 to step 2.9, design-canvas support) at all three sites in the tactic-align-skills-dataviz-guidance draft after PR #2867's Step 2 renumbering

## Context

PR #2867 (`tactic-align-strategy-alignment-tests`, merged as commit
`1249fea4`) renumbered `/align-strategy`'s Step 2 dialectic steps, shifting
design-canvas support from step 2.7 to step 2.9 (step 2.7 is now
"Conditions"). The separate, still-`status:raw` draft
`tactic-align-skills-dataviz-guidance` cites "/align-strategy step 2.7
(design-canvas support)" in three places — frontmatter `statement` (line 5),
body H1 (line 36), and a body bullet (line 52) — which now point at the wrong
step. Surfaced during `/review-fix` of PR #2867; re-confirmed by reading all
three sites and mapping the PR diff's new numbering. A repo sweep of
`intentions/` and `.claude/skills/` found this draft is the only external node
carrying a now-stale step number (other design-canvas mentions —
`tactic-attention-surface-status-page`, `tactic-mainqa-ds-storybook-visual`,
`strategy-owned-web-platform`, `strategy-graph-native-dispatch:963` — cite no
step number and are unaffected; the review's own source node's plan body
citing old steps 2.4/2.6 was classified Informational, not filed).

*Failure scenario if not corrected:* a future `/align-tactics` finalization
pass reading `tactic-align-skills-dataviz-guidance` literally would land the
`/dataviz` guidance in the wrong step (2.7, "Conditions") instead of the
actual design-canvas step (2.9).

PR #2867 has merged to `origin/main` (commit `1249fea4`), so the precondition
for this edit is satisfied. Re-verified at finalize time (2026-07-18):
`.claude/skills/align-strategy/SKILL.md` line 320 confirms design-canvas
support is step 2.9 ("9. **Design-canvas support (UI-design requirements
only).**"); line 311 confirms step 2.7 is now "Conditions".

## Unit 1 — Correct the three stale step-number citations

**Scope:** `intentions/tactic-align-skills-dataviz-guidance.md` only, exactly
three sites:
- Frontmatter `statement` (line 5): "step 2.7 (design-canvas support)" →
  "step 2.9 (design-canvas support)".
- Body H1 (line 36): same replacement.
- Body bullet (line 52): "step 2.7 (Design-canvas support, UI-design
  requirements only)" → "step 2.9 (Design-canvas support, UI-design
  requirements only)".

Before editing, re-confirm against the current
`.claude/skills/align-strategy/SKILL.md` that design-canvas is still step 2.9
— the step count could have shifted again since this plan was written, if
another interview-step change landed first.

Out of scope: no other content in `tactic-align-skills-dataviz-guidance.md`
changes — its `status: raw` and all other frontmatter/body content stay as-is.
This unit corrects a stale cross-reference only; it does not finalize, split,
merge, or otherwise decompose that draft (that remains a future
`/align-tactics tactic-align-skills-dataviz-guidance` or
`/align-tactics strategy-graph-native-dispatch` round's job).

**Recommended model:** sonnet — a small, well-specified mechanical text
substitution across three known sites with a clear diff shape
(model-selection heuristic, `.claude/skills/implement-unit/SKILL.md` lines
31–39).

**Dependencies:** none.

## Reuse

No new code or utilities — this is a graph-node text edit using the existing
write path: `write-node.ts` for the frontmatter `statement` (whole-node
write, never a hand-edited YAML fence) and a direct body `Edit` for the H1
and bullet, landed via `graph-commit`
(`packages/intentionsutil/scripts/graph-commit`).

## Verification

Prose only — this is a text correction with no runnable suite:

- Re-read all three sites in
  `intentions/tactic-align-skills-dataviz-guidance.md` (frontmatter
  `statement`, body H1, body bullet) and confirm each now reads "step 2.9
  (design-canvas support)" / "step 2.9 (Design-canvas support, UI-design
  requirements only)".
- Confirm this matches the current `.claude/skills/align-strategy/SKILL.md`
  numbering (design-canvas support at step 2.9) at edit time.
- Confirm no other frontmatter or body content in
  `tactic-align-skills-dataviz-guidance.md` changed.
