---
id: tactic-align-strategy-stepref-drift-dataviz
kind: tactic
statement: "Update the stale /align-strategy step-number reference (step 2.7 to
  step 2.9, design-canvas support) at all three sites in the
  tactic-align-skills-dataviz-guidance draft after PR #2867's Step 2
  renumbering"
owner: ai
status: raw
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
  strategy-explicit-intent."
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
attributes:
  bug_fix: true
---
# Update the stale /align-strategy step-number reference (step 2.7 to step 2.9, design-canvas support) at all three sites in the tactic-align-skills-dataviz-guidance draft after PR #2867's Step 2 renumbering

> Draft context retained per review-fix follow-up filing (node-target lane).
> Not a plan — a future `/align-tactics` round (or a direct edit) finalizes or
> folds this in.

## Findings this draft retains

**Finding 3 — stale design-canvas step number in a live raw draft
(`intentions/tactic-align-skills-dataviz-guidance.md:5,36,52`).** This separate,
unrelated, still-`status:raw`/unimplemented draft cites "/align-strategy step
2.7 (design-canvas support)" in three places — the frontmatter `statement`
(line 5), the body H1 (line 36), and a body bullet (line 52). PR #2867 shifted
design-canvas support from step 2.7 to **step 2.9** (step 2.7 is now
"Conditions"). Git-blame-traced live drift: the dataviz draft was authored when
design-canvas really was step 2.7, and two later commits in PR #2867 each shifted
it by one without updating this file.
*Failure scenario:* a future `/align-tactics` finalization pass reading this
draft literally would land the `/dataviz` guidance in the wrong step (2.7,
"Conditions") instead of the actual design-canvas step (2.9).
*Verdict:* CONFIRMED (live drift; independently re-confirmed by reading all
three sites and mapping the PR diff's new numbering).
*Surfaced during /review-fix of PR #2867, tactic-align-strategy-alignment-tests.*

**Sweep note (why this is the only external file):** grepping `intentions/` and
`.claude/skills/` for shifted align-strategy step references, the dataviz draft
is the sole external node carrying a now-stale step number. Other design-canvas
mentions (`tactic-attention-surface-status-page`,
`tactic-mainqa-ds-storybook-visual`, `strategy-owned-web-platform`,
`strategy-graph-native-dispatch:963`) cite no step number and are unaffected.
The only other match — this review's source node
(`tactic-align-strategy-alignment-tests`)'s own plan body citing old steps
2.4/2.6 — was classified Informational this run (an inert, soon-to-be-completed
plan), not filed as a follow-up.

## Concrete edits this draft anticipates

- Update all three sites in
  `intentions/tactic-align-skills-dataviz-guidance.md` from "step 2.7
  (design-canvas support)" to "step 2.9 (design-canvas support)": the
  frontmatter `statement` (line 5), the body H1 (line 36), and the body bullet
  (line 52, "step 2.7 (Design-canvas support, UI-design requirements only)").
- Before editing, re-confirm against the merged `align-strategy/SKILL.md` that
  design-canvas is still step 2.9 at edit time — the step count could shift
  again if another interview-step change lands first.
- Mechanics: this is a graph-node edit of a `status: raw` draft. Change the
  frontmatter `statement` via `write-node.ts` (whole-node reconciliation, never
  a hand-edit of the YAML) and the H1/bullet via a direct body `Edit`, landed in
  one `graph-commit`. No `phase`/`execution` change — it stays a raw draft.
- Apply only after PR #2867 has merged to `origin/main`, so the new numbering is
  the authoritative source the reference is corrected against.

## Verification

Prose only (graph-node text edit, no runnable suite): re-read the three sites
in `tactic-align-skills-dataviz-guidance.md` and confirm each now says "step
2.9 (design-canvas support)" and matches the merged `align-strategy/SKILL.md`.
