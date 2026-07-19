---
id: tactic-align-skills-dataviz-guidance
kind: tactic
statement: Wire the /dataviz built-in into the align family — /align-strategy
  step 2.9 (design-canvas support) and /align-tactics Step 3 (plan each
  claude-eligible tactic) — as the mandated design-guidance source for
  chart/dashboard/data-viz requirements, composed with the DesignSync canvas
owner: ai
status: codified
parent: null
rationale: "Recorded as a clarification on strategy-graph-native-dispatch
  (2026-07-08 /align-strategy interview): chart/dashboard/data-viz requirements
  are gathered under the /dataviz built-in, binding the align family, composed
  with — not replacing — the design canvas. This tactic carries the skill-text
  encoding of that binding. Finalized standalone by /align-tactics rather than
  folded into tactic-align-skills-greenfield-gate (the draft's speculative 'most
  likely folds into' note) because that tactic does not exist as a landed node
  on origin/main — nothing to fold into."
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
  branch: tactic-align-skills-dataviz-guidance
  pr: 2907
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Wire the /dataviz built-in into the align family — /align-strategy step 2.9 (design-canvas support) and /align-tactics Step 3 (plan each claude-eligible tactic) — as the mandated design-guidance source for chart/dashboard/data-viz requirements, composed with the DesignSync canvas

Finalized by `/align-tactics` (per-node finalize path). Standalone — not
folded into `tactic-align-skills-greenfield-gate`, which does not exist as a
landed node on `origin/main` (the draft's "most likely folds into" note was
speculative, not a directive).

## Context

Recorded as a clarification on `strategy-graph-native-dispatch` (2026-07-08
`/align-strategy` interview, see that node around line 1031): whenever an
`/align-strategy` interview or an `/align-tactics` decomposition develops a
requirement for any data visualization — chart, graph, plot, dashboard, stat
tile/KPI, sparkline, heatmap, or the choice of whether to visualize at all —
the session must load the `/dataviz` built-in skill and follow its procedure:
form chosen by the data's job (including its "is it even a chart" test),
color assigned by role (categorical/sequential/diverging/status) never by
rank, the categorical palette run through `/dataviz`'s own bundled validator
script (never eyeballed), mark specs and spacers, a default hover layer, and
an accessibility pass (legend for ≥2 series, table view, a selected — not
auto-flipped — dark mode).

`/dataviz` and the design canvas (`/align-strategy`'s existing step-9
mockup/variant-on-`@commons-systems/ds` dialectic, synced via `DesignSync`)
compose, not compete: `/dataviz` supplies the design method and its
computable checks; the canvas still supplies author-disambiguation artifacts,
now built to follow `/dataviz`.

Retain-not-refine governs where output lands: `/align-strategy` records the
author's chart design intent as an ordinary dated clarification during the
interview; `/align-tactics` carries the concrete per-unit chart guidance
(chosen form, validated palette, mark/interaction specs) in tactic plan
bodies for the implement phase to execute against. This tactic wires both
skills so that split holds mechanically, not just by convention.

Neither skill file currently mentions `/dataviz`
(`grep -rn dataviz .claude/skills/align-strategy/SKILL.md
.claude/skills/align-tactics/SKILL.md` — no matches at plan time), so both
edits below are net-new insertions, not corrections.

**Note for the implementing session:** re-confirm the exact current line
numbers for both anchors before editing — line numbers drift as these
frequently-edited SKILL.md files change between planning and implementation.
Anchor on the `old_string` text, not the line numbers, which are given only
as a starting pointer.

## Unit 1 — bind `/dataviz` into `/align-strategy` step 2.9 (design-canvas support)

**Recommended model:** sonnet — well-specified, mechanical prose insertion
into one paragraph; no architectural judgment or ambiguity left for
implementation time (per the model-selection heuristic,
`.claude/skills/implement-unit/SKILL.md` lines 31–39).

Scope: `.claude/skills/align-strategy/SKILL.md`, "### Dialectic steps" (Step
2), item 9, "**Design-canvas support (UI-design requirements only).**"
(currently ~lines 320–329). Out of scope: every other dialectic step, the
`/file-issue` coverage-matrix table below it, and any other file.

Insert a middle clause into the item-9 paragraph, immediately after the
sentence ending "...so the author disambiguates by pointing at a variant."
and before "Canvas artifacts are interview aids...":

```
For a chart, dashboard, or data-viz requirement, first load the
`/dataviz` built-in skill — its procedure governs the recorded design:
form chosen by the data's job (including its "is it even a chart" test),
color assigned by role (categorical/sequential/diverging/status) never by
rank, the categorical palette run through `/dataviz`'s validator script
(never eyeballed), mark specs and spacers, a default hover layer, and an
accessibility pass (legend for ≥2 series, table view, a selected — not
auto-flipped — dark mode). `/dataviz` and the design canvas compose, not
compete: `/dataviz` supplies the design method and its computable checks;
the canvas still supplies the mockup/variant artifacts for author
disambiguation, now built to follow `/dataviz`.
```

Leave the existing "Canvas artifacts are interview aids... ordinary dated
clarification like any other" sentence and the trailing sync-caveat sentence
completely unchanged — they still apply, just later in the paragraph.

Dependencies: none.

## Unit 2 — bind `/dataviz` into `/align-tactics` Step 3 (plan each claude-eligible tactic)

**Recommended model:** sonnet — same rationale as Unit 1: mechanical prose
insertion into an existing bullet list, no judgment call for implementation
time.

Scope: `.claude/skills/align-tactics/SKILL.md`, "## Step 3 — Plan each
claude-eligible tactic" (currently ~lines 382–439) — two insertions in this
section only. Out of scope: every other step in this file, and
`.claude/skills/align-strategy/SKILL.md` (that's Unit 1).

**2a. Plan-agent-feed bullet** (currently ~lines 397–403, the "Launch 1–3
`Plan` agents..." bullet). Append a clause to the existing sentence "Feed
each the Explore findings, the tactic scope, the plan schema below, and the
`/implement-unit` model-selection heuristic inline (the `Plan` agent will not
read the skill file)." — immediately after that parenthetical, before
"Synthesize multiple proposals...":

```
 when the unit delivers a chart, dashboard, or other data-viz
surface, also feed the `/dataviz` procedure inline, same reason.
```

**2b. Plan-schema units-of-work bullet list** (currently ~lines 411–421, the
"An ordered list of **units of work**, each with:" list — the sub-bullets
are **Scope**, **Recommended model**, **Dependencies**). Insert a new
sub-bullet immediately after **Scope** and before **Recommended model**:

```
- **Data-viz guidance (chart/dashboard units only)** — when the unit
  delivers a chart, graph, plot, dashboard, or other data-viz surface: the
  chosen form, the validated categorical palette, and mark/interaction
  specs, per `/dataviz`. Run the palette through `/dataviz`'s validator
  script in a fenced ` ```verify ` block so it runs headless.
```

The `` ` ```verify ` `` phrasing matches the existing convention already used
a few lines down in the **Verification** bullet ("go in fenced ` ```verify `
blocks").

Dependencies: none — independent edits to a different section of the same
file; land in either order.

## Reuse

- Reuse the existing item-9 / Step-3 paragraph and bullet structure verbatim
  around the insertions — do not restructure either section.
- Reuse the exact terminology from the strategy clarification (`intentions
/strategy-graph-native-dispatch.md`, 2026-07-08 entry): "is it even a chart"
  test, color by role never by rank, validator script never eyeballed,
  legend for ≥2 series, table view, selected-not-auto-flipped dark mode. No
  new terminology to invent.
- Reuse the `` ` ```verify ` `` fenced-block convention already established
  in `.claude/skills/align-tactics/SKILL.md`'s own Verification bullet — do
  not introduce a different code-fence convention for the palette-validator
  command.

## Non-goals

- Not a review-phase change. The author scoped this to requirements
  collection (align family); "make `/dataviz` a review-phase finder lens"
  was declined this round. Revisit only via a fresh `/align-strategy`
  interview.
- Not a delegation-node edit. The capture note (leans further on
  `delegation-anthropic-claude`, bounded because the guidance is
  design-system-agnostic and its reference files are vendorable) lives in
  the strategy clarification; a `delegation-anthropic-claude`
  `divergence.imported` entry, if wanted, is a separate single-node commit,
  not this tactic.
- Not a vendoring change. Whether to vendor `/dataviz`'s bundled
  `references/palette.md` and validator script into this repo is optional
  future work the strategy clarification only notes as *possible*
  ("forkable content that can be vendored") — not part of either unit here.
- Not `tactic-align-skills-greenfield-gate`. That tactic does not exist as a
  landed node (`git show origin/main:intentions/tactic-align-skills-greenfield-gate.md`
  fails — checked at plan time); this tactic ships standalone.

## Verification

Prose only — this is a skill-text change with no runnable suite.

- Re-read both edited files in full after the edits land; confirm neither
  paragraph/list reads as truncated or contradictory around the insertion
  point.
- Confirm `grep -n dataviz .claude/skills/align-strategy/SKILL.md
  .claude/skills/align-tactics/SKILL.md` now matches in both files.
- Confirm the composition framing is consistent between the two files:
  `/dataviz` supplies method/computable checks; the design canvas (in
  align-strategy) / the unit plan body (in align-tactics) supplies the
  author-facing or implementation-facing artifact, never the reverse.
- Confirm the existing "Canvas artifacts are interview aids... ordinary
  dated clarification" sentence in align-strategy item 9 is untouched aside
  from now appearing later in the same paragraph.
- Confirm no other section of either file (the `/file-issue` coverage-matrix
  table, the "Out of scope" sections, etc.) was touched.

```verify
grep -n "dataviz" .claude/skills/align-strategy/SKILL.md .claude/skills/align-tactics/SKILL.md
```
