---
id: tactic-reading-review-comprehension-staging
kind: tactic
statement: Encode the comprehension-then-ratify session staging in
  .claude/skills/reading-review/SKILL.md
owner: ai
status: codified
parent: null
rationale: "2026-07-16 /align-tactics round on strategy-philosophical-grounding.
  The 2026-07-13 chunk-2 live sitting recorded a binding conduct rule on the
  strategy (\"How is a review sitting staged\"): every /reading-review sitting
  must run two explicitly separated stages, in order — a comprehension test of
  the text, then a ratification interview on graph verdicts — never interleaved.
  That clarification is not yet encoded in
  .claude/skills/reading-review/SKILL.md's Session flow (grep for
  \"comprehension\" across .claude/skills/*/SKILL.md returns nothing), so a
  fresh /reading-review invocation with no memory of the chunk-2 sitting would
  not know the rule. This is genuinely new claude-executable scope surfaced by
  this round's drift review, distinct from the two already-in-flight tooling
  tactics this strategy also owns: tactic-sync-reader-skill (phase qa, parked on
  an unrelated multi-work-chunk design decision since 2026-07-10) and the
  now-merged-and-pruned tactic-context-capstone-review — neither covers this
  staging gap, so decomposing it does not duplicate their scope. Off the minimum
  signal path by design (a tooling-fidelity fix, not a reading round itself),
  consistent with how the sibling reading-review/sync-reader/capstone tooling
  tactics also carry no validates edge."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
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
# Encode the comprehension-then-ratify session staging in .claude/skills/reading-review/SKILL.md

## Context

`strategy-philosophical-grounding`'s clarifications carry (as of the
2026-07-13 chunk-2 live sitting) a binding conduct rule for every
`/reading-review` sitting:

> Author-directed 2026-07-13 at the chunk-2 sitting, standing for all review
> sittings: two explicitly separated stages, in order — first a comprehension
> test of the reading (dialectic probes citing the text, the author
> articulates first, no verdict or draft-wording content enters), then a
> ratification interview on the graph verdicts. [...] Mixing the stages lets
> draft verdicts leak into and bias the comprehension test; the periagoge
> conduct rules above assume this separation and it is now explicit.

`.claude/skills/reading-review/SKILL.md` is the sole executable spec for
these sittings — `/reading-review [chunk-node-id]` runs from it directly, with
no other source of session-conduct instructions. As of this round's drift
review, the skill file does not encode this rule anywhere: `grep -n
comprehension .claude/skills/reading-review/SKILL.md` returns nothing, and its
`## Session flow` (lines 91-107 at plan time) still runs steps 1-4 as one
undifferentiated dialectic — step 3 ("Run the demonstration as a dialectic")
covers both text-comprehension probing and verdict content in the same
breath, with no stage boundary. A fresh session invoking `/reading-review`
with no memory of the chunk-2 sitting has no way to learn the rule from the
skill alone. This tactic closes that gap by editing the skill file directly;
it changes no other file.

**Scope note on concurrent editing.** PR #2871
(`tactic-review-sitting-skill-generalization`, a `strategy-graph-review-curriculum`
tactic, currently `phase: qa` parked at office-hours) is an **open, unmerged**
PR that also edits this same file, adding new Mode-A/Mode-B sections
elsewhere in it. This unit's edit is confined to `## Session flow` (and,
optionally, `## Prohibitions` / `## Verification`, per the units below) —
sections that PR does not touch per its own scope (Mode-A/Mode-B additions).
No `blocked_by` edge is set: the two changes target different sections for
different, independently-motivated reasons, so forcing a sequencing
dependency would stall this unit on an indeterminate office-hours timeline for
no logical-precondition reason. The implementing session should simply rebase
against current `origin/main` before opening its PR, same as any other unit —
if PR #2871 has landed by then, resolve the (likely non-overlapping) diff
normally; if not, this unit's PR is independent and mergeable on its own.

## Units of work

### Unit 1 — split `## Session flow` into explicit comprehension/ratification stages

**Scope.** `.claude/skills/reading-review/SKILL.md` only, three edits, in
order:

1. **`## Session flow`** (currently lines 91-107): replace the current
   4-step list with a 5-step list that splits step 3 into two explicit
   stages. Read the file first — the exact line numbers may have shifted
   since plan time if PR #2871 landed first — and locate the section by its
   `## Session flow` heading and the four numbered steps beginning "Read the
   chunk node body" / "Surface the text citation" / "Run the demonstration as
   a dialectic" / "Record each resolution". Replace with:

   ```markdown
   1. **Read the chunk node body.** Its `## Text`, agenda section (`##
      Questions to re-open against the text` for a verify chunk, `## Questions
      to establish relevance` for a candidate chunk), and `## Completion`
      sections are the session script.
   2. **Surface the text citation and the questions** — the citation so the
      author has the passage in view, the questions as the agenda. Do not
      summarize the reading (periagoge).
   3. **Stage 1 — comprehension test.** Probe the author's understanding of
      the text itself: cite the text, never Claude's gloss, and let the
      author articulate before any account of Claude's appears. This stage
      carries **no** verdict-wording or draft-answer content — hold every
      draft verdict back until Stage 2. Use plain conversation only;
      `AskUserQuestion` is reserved for Stage 2's bounded choices.
   4. **Stage 2 — ratification interview.** Only after the author has
      committed answers in Stage 1, open the review of draft verdicts and
      clarification wordings on the graph — this is where the verdict
      refinement loop (below) runs. Use `AskUserQuestion` for bounded
      choices, recommended option listed first; plain conversation for open
      dialectic — the same split as `.claude/skills/align-strategy/SKILL.md`.
   5. **Record each resolution** per the recording rules below.

   Author-directed 2026-07-13 (chunk-2 live sitting), standing for every
   `/reading-review` sitting — verify chunks, candidate chunks, and capstones
   alike, since they all share this session frame unchanged (`## Candidate
   chunks` and `## Capstone sittings` both say "the whole session frame above
   applies unchanged"): the two stages run in this order and never interleave.
   Mixing them lets draft verdicts leak into and bias the comprehension test.
   ```

   Do not alter the meaning of steps 1, 2, and the old step 4 — only split
   step 3 and renumber. Do not touch `### Verdict refinement loop`, `###
   Session bounds`, `### Cross-chunk boundary rule`, or `### Notes-for-later
   exit` (the subsections immediately following) — Stage 2 above already
   cross-references the verdict refinement loop by pointing at it, so no
   further edit is needed there.

2. **`## Prohibitions`** (currently near line 349): add one bullet, matching
   the existing terse imperative style of the other bullets in that list
   (e.g. "Never weaken or skip a chunk..."):

   ```markdown
   - Never let Stage 2 verdict or draft-wording content appear before Stage
     1's comprehension test is complete.
   ```

3. **`## Verification`** (currently near line 367): this file's Verification
   section is prose-only dry-run checklists (no automated test surface, per
   its own opening line — a SKILL.md has none). Add one bullet to the
   existing chunk-1 dry-run checklist item (the first bullet, which already
   dry-runs `tactic-reading-chunk-1-plato-cave`) confirming the new behavior:

   ```markdown
   confirm the session plan explicitly separates a comprehension-test stage
   (text-only probes, no verdict content) from a ratification-interview stage
   (draft verdict review), in that order.
   ```

**Recommended model:** `opus`. The insertion text above is fully specified,
but the edit is prose to a model-instruction document whose coherence is a
known subtle judgment call in this project — the sibling tactic
`tactic-review-sitting-skill-generalization` needed office-hours escalation
specifically because a bounded fix-planner could not mechanically verify
"do the new sections read coherently as executable session instructions."
Per the model-selection heuristic
(`.claude/skills/implement-unit/SKILL.md`, "Model-selection heuristic"): pick
`opus` when unsure, and getting the integration with the surrounding
Periagoge/Prohibitions/Verification prose right is judgment-heavy even though
the diff shape is small.

**Dependencies:** none.

## Reuse

- The insertion text above is drawn near-verbatim from the already-ratified
  2026-07-13 clarification on `strategy-philosophical-grounding` — no new
  wording is being invented, only transposed into skill-instruction form.
- Follow the existing subsection pattern under `## Session flow` (`###
  Verdict refinement loop`, `### Session bounds`, etc.) for style — the new
  Stage 1/Stage 2 split lives in the numbered list itself, not as a separate
  `###` subsection, since it restructures the existing steps rather than
  adding a new one.

## Verification

```verify
grep -n "Stage 1 — comprehension test" .claude/skills/reading-review/SKILL.md || exit 1
grep -n "Stage 2 — ratification interview" .claude/skills/reading-review/SKILL.md || exit 1
grep -n "Never let Stage 2 verdict" .claude/skills/reading-review/SKILL.md
```

Manual/judgment checks:

- Read the edited `## Session flow` top to bottom and confirm it still reads
  as one coherent 5-step sequence — no orphaned step, no contradiction with
  the Periagoge section above it or the Verdict refinement loop / Session
  bounds / Cross-chunk boundary rule / Notes-for-later exit subsections below
  it.
- Confirm `## Candidate chunks` and `## Capstone sittings` still correctly
  inherit the new staging by virtue of "the whole session frame above applies
  unchanged" — no separate edit needed in either section, and this plan makes
  none.
- If PR #2871 (`tactic-review-sitting-skill-generalization`) has merged by
  implementation time, confirm the rebase is clean or the conflict (if any)
  is confined to non-overlapping sections, per the Context scope note above.
- QA-time note: per the established precedent on this same file, a subjective
  "does this read coherently" judgment on a SKILL.md edit is not always
  bounded-Opus-fixable and may need office-hours ratification rather than a
  blocking QA failure — do not force-fix a coherence nit mechanically if QA
  raises one; escalate per the qa-fix skill's own disposition rules.
