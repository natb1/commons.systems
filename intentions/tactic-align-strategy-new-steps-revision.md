---
id: tactic-align-strategy-new-steps-revision
kind: tactic
statement: "Revise /align's two Step 2 dialectic gates (step 3
  doctrinal-consistency, step 5 steelman): make the gate re-test the finalized
  rationale and post-steelman intent, record clean passes, define its
  overlapping-strategies scope, and cross-reference rather than restate the
  shared origin/main, question-mechanics and tradition-record rules"
owner: ai
status: codified
parent: null
rationale: "Surfaced by /review-fix of PR #2867
  (tactic-align-strategy-alignment-tests, since pruned), which inserted a
  doctrinal-consistency gate and a steelman-alternative challenge into the Step
  2 interview dialectic. Seven review findings land on the same contiguous
  ~40-line block: the gate runs before the rationale (drafted at the Benefit
  step, constructed at Step 5 Record) and the intent (still mutable at the
  steelman step) are finalized, and nothing downstream re-tests them; a clean
  gate pass records nothing, so it is indistinguishable from a skipped gate; the
  gate's \"overlapping strategies\" scope is undefined and cannot mean step
  1.2's single strong match, which is absent by definition on the new-strategy
  path; and both steps restate doctrine whose canonical home is elsewhere in the
  same file, with the restatements already drifted apart. Retained as one node
  because all seven touch identical lines — separate PRs would self-conflict —
  so one revision in three sequenced units fixes them together. (Reconciled
  2026-08-21 by the /align-tactics per-node finalize: the target was renamed and
  moved by commit c845d50f, which consolidated /align-strategy and /align-init
  into /align, so the surface is .claude/skills/align/SKILL.md and the steps are
  dialectic items 3 and 5 of an eleven-item list, not \"2.3\" and \"2.5\" of a
  nine-item one. All seven findings were re-verified live at that path and two
  that were PLAUSIBLE are now CONFIRMED. The finalize also settled the open
  design choice the draft left to the implementer — the gate becomes a two-pass
  gate with a path-agnostic pre-write re-test in Step 5's preamble, rather than
  being moved — because moving it would renumber ordinals that intentions/*.md
  nodes cross-reference, forcing a graph write inside an implementation PR.)"
reading: null
serves:
  - strategy-discovered-requirements
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
# Revise /align's two Step 2 dialectic gates (step 3 doctrinal-consistency, step 5 steelman): make the gate re-test the finalized rationale and post-steelman intent, record clean passes, define its overlapping-strategies scope, and cross-reference rather than restate the shared origin/main, question-mechanics and tradition-record rules

## Context

`/review-fix` of PR #2867 (tactic-align-strategy-alignment-tests, since pruned)
produced seven findings against the two interview steps that PR inserted into
the Step 2 dialectic: a **doctrinal-consistency gate** and a
**steelman-alternative challenge**. All seven land on the same contiguous
~40-line block, which is why they are one node rather than seven: separate PRs
would self-conflict on identical lines.

**Naming and path, corrected.** The findings were written against
`.claude/skills/align-strategy/SKILL.md`. That skill no longer exists — commit
`c845d50f` consolidated `/align-strategy` and `/align-init` into `/align`, and
the file is now `.claude/skills/align/SKILL.md` (812 lines). There is no
`align-strategy` directory and no compatibility stub. Every `SKILL.md:NNN`
anchor in the original findings is stale by roughly +62 to +72 lines. The
findings' informal "step 2.3" / "step 2.5" shorthand still resolves: the
`### Dialectic steps` list is now **eleven** items, and the gate is item **3**,
the steelman item **5**.

**All seven findings re-verified live on 2026-08-21** against
`.claude/skills/align/SKILL.md` at `origin/main` `53eefa33`. Nothing has been
half-fixed by a sibling; two findings that were PLAUSIBLE are now CONFIRMED.

The two problems, stated once:

1. **The gate is positioned before the things it tests.** Dialectic step 3
   (line 330) tests "the drafted `statement`/`rationale`", but the rationale's
   conclusion is only produced at step 4 Benefit (line 352: "its conclusion
   should be visible in the eventual `rationale`") and the rationale itself is
   constructed at `## Step 5 — Record` (line 530). Worse, dialectic step 5's
   resolution branch (lines 366–368) lets the strategy "adopt the rival
   framing" — a real shift of intent — after the gate has already completed.
   Nothing in steps 4–11, Step 5, or Step 6 re-runs the gate. So the round's
   own dedicated consistency check can never see the content it exists to
   check.
2. **The block duplicates doctrine that already has a canonical home in the
   same file**, and the duplicates have already drifted apart in wording —
   exactly the decay `.claude/skills/ref-write-instructions/SKILL.md:35`
   ("Restating the same point multiple ways") names as an anti-pattern.

### The design decision, made here rather than left open

The stored draft listed three options for problem 1: (a) move the gate to run
after Benefit and Steelman; (b) keep the early gate and add an explicit re-run
at record time; (c) fold the re-check into Step 5's amendment-completeness
reconciliation. **This plan takes (b), and rejects (a) and (c).** A clean-session
implementer must not re-litigate this.

Why (b) is the right design on its own terms, not merely the cheap one: the
early gate has independent value that a single late gate destroys. A doctrinal
contradiction surfaced at step 3 re-shapes the rest of the interview — intent
may be reframed, placement revisited, the steelman put differently. Surfaced
only at record time, the same contradiction invalidates an interview already
run. And the second pass is cheap and bounded: the doctrine read-set is already
loaded, so the re-test re-diffs only the fields that changed after the gate ran.
A gate that probes early and re-tests before the write is the greenfield shape,
not a compromise. There is no brownfield/greenfield split here — the change is a
prose revision of one skill file with no migration surface.

Why not (c): Step 5's amendment-completeness block (lines 557–571) is scoped to
the **edit** path only — it sits inside the `- **Edit:**` bullet. Hanging the
re-test there would leave the new-strategy path, which is the majority path for
this gate, entirely uncovered. The re-test goes in Step 5's **pre-write
preamble** (lines 532–536), which sits before the New/Edit fork and is therefore
path-agnostic. That preamble already carries the exact precedent: the dialectic
step-10 ownership gate restated there "as the final pre-write check so a
resolution made earlier in a long interview is not silently dropped by the time
the JSON is constructed." The re-test is the second occupant of that slot, using
the file's own established pattern.

Why not (a) — **the renumbering blast radius, measured exhaustively 2026-08-21.**
The dialectic list is cross-referenced *by ordinal* in these places, so moving
the gate would require updating all of them in one change:

- `.claude/skills/align/SKILL.md` itself, 7 sites: `:266` (step-2.1), `:267`
  (step-2.9), `:295` (step-2.8), `:334` (step 2.2), `:346` (step-2.8), `:368`
  (step-2.8), `:424` (step-2.8).
- The coverage-matrix rows `:444`–`:447`: "Step 1.2", "Step 2.2", "Step 2.1",
  "Step 2.6".
- `intentions/strategy-graph-native-dispatch.md:1980` — "dialectic step 2.5",
  naming the steelman step.
- `intentions/strategy-discovered-requirements.md:215` — this node's own serving
  strategy, clarification 6: "(Steelman challenge, dialectic step 5)".

The last two are **graph node files**. Editing them is a graph write that must
go through `write-node.ts` + `graph-commit`; a PR that hand-edits
`intentions/*.md` is a doctrine violation. Option (b) preserves ordinals 1–11
exactly and appends no step 12, so **this plan requires no graph write at all**.
That is a hard constraint on every unit below: if an implementer finds
themselves wanting to renumber, stop and park rather than hand-edit
`intentions/`.

### Prior disposition this plan does not overturn

An earlier qa-fix pass on PR #2867 itself (commit `60bd37ae`) evaluated
"item 9 (doctrinal-consistency gate prose clarity, step 2.3)" and closed it
NO DEFECT, two skeptics having verified that the gate's "read-set, source
restriction, cross-references, and edit-path clause" were all present and
consistent. That disposition was about **presence and clarity** of those
elements. This plan does not contest any of it: every element it found present
stays present. What this plan changes is **when** the gate runs relative to the
content it tests, **whether a clean pass is recorded**, and **what set
"overlapping strategies" denotes** — none of which that pass examined.

### Live anchors (1-indexed, `.claude/skills/align/SKILL.md`, verified 2026-08-21)

- `## Step 1 — Frame` step 1.2 "Duplicate / overlap detection" — **122–133**
  (runs `align-strategy-census.ts` + keyword grep; its stated output is the
  binary "A strong match means this is an **edit**" at line 129; step 1.3 at
  134–139 branches new-vs-edit on it).
- `## Step 2 — Interview dialectic` — **223**.
- `### Interview type — classify first, and state it` — **227–262**; the
  origin/main rule is the type-b bullet at **236–238**.
- `### Question mechanics — every round, both types` — **264–286**; its
  self-generalizing scope sentence at 266–267 ("…and any other"), the three
  numbered items at 268–274, the delivery-inside-the-tool paragraph at 276–286.
- `### Deferral mechanics` — **287–319**.
- `### Dialectic steps` — **320**; list runs **322–437**: 1 Intent 322,
  2 Placement 325, **3 Doctrinal-consistency gate 330–349**, 4 Benefit 350–352,
  **5 Steelman-alternative challenge 353–368**, 6 Signal 369, 7 Conditions 373,
  8 Edge cases 376–391 (the "step-2.8 provenance convention" every other step
  cites; the amendment rule is line 387), 9 Design-canvas 392–412,
  10 Persistent-layer ownership gate 413–424, 11 Layer-placement gate 425–437.
- The `/file-issue` 8-category coverage matrix — header **442**;
  `| Duplicates | Step 1.2 overlap detection |` is **444**.
- `## Step 5 — Record` — **530**; path-agnostic pre-write preamble **532–536**;
  edit-path-only amendment-completeness block **557–571**.
- `## Step 6 — Requirements coverage check` — **759–778** (walks the author's
  requirement text clause-by-clause; does not re-test doctrine — this is the
  confirmation that "nothing later re-runs the gate").
- `## Verification` — **789–812**, prose only, no ` ```verify ` block.

### The seven findings, re-verified

**F1 — the gate tests a rationale that does not exist yet** (step 3, 330–349).
CONFIRMED. Step 3 precedes step 4 Benefit (350). Its object is "the drafted
`statement`/`rationale`" (343–344); its edit-path clause is "run the gate
against the revised `statement`/`rationale` as well" (348–349). No step 4–11,
no Step 5, no Step 6 re-runs it.
*Failure:* an interview passes the gate clean on the statement; at step 4 the
Benefit discussion yields a rationale whose conclusion contradicts a served
virtue's `tension_with` pair; the contradiction is never tested and the strategy
records doctrinally inconsistent.

**F4 — steelman adoption escapes the already-completed gate** (330 vs 353).
CONFIRMED (was PLAUSIBLE). Step 3 precedes step 5; step 5's branch "either the
strategy adopts the rival framing, or it diverges from it" is at 366–368;
nothing downstream re-tests an adopted framing.
*Failure:* gate passes clean at step 3; at step 5 the author adopts a rival
framing that re-points the strategy at an end contradicting an overlapping
strategy's condition; the adoption-introduced contradiction lands unexamined in
the very round meant to catch this class of problem.

**F5 — a clean gate pass leaves no record** (346–347). CONFIRMED (was
PLAUSIBLE). "Each resolution lands as a dated `clarifications` entry" is
conditional on a contradiction having been found. Contrast step 5's
unconditional "Record the resolution as a dated `clarifications` entry"
(365–366) and step 8's unconditional "surface at least one edge case … and
resolve it" (376–377). Under the record-completeness contract (the graph record
is the sole carrier — no session memory), a later reader cannot distinguish
"gate ran and passed clean" from "gate never ran".
*Failure:* a rushed interview skips the gate; the resulting record is
byte-identical to a diligent interview that ran it and found nothing, so no
audit and no `/align-tactics` pass can detect the skip.

**F9 — "overlapping strategies" scope is undefined** (340). CONFIRMED. The
phrase occurs exactly once in the file (`grep -c 'overlapping strateg'` = 1) and
is never defined. It cannot mean "reuse step 1.2's result": step 1.2 yields a
single strong match used only to classify edit-vs-new, and the **new-strategy
path is defined by the absence of such a match**, yet the gate runs on both
paths and says "strategies", plural. The coverage matrix at 444 further treats
"Duplicates | Step 1.2" as a distinct category from the gate.
*Failure:* a clean-session interviewer on the new-strategy path reaches the
gate, finds no step-1.2 match to reuse, and either skips the read or invents an
ad-hoc grep — inconsistent behavior across sessions, the exact
record-completeness failure the skill warns against.

**F6 — the gate restates the origin/main justification** (236–238 vs 336–338).
CONFIRMED. "a stale checkout presents already-amended doctrine as current"
appears near-verbatim at both sites.

**F7 — both steps restate the Question-mechanics recipe, and the restatements
have already drifted** (344–346, 363–365). CONFIRMED. Step 3: "(recommendation +
boldness + accept-as-deferral, context delivered inside the `AskUserQuestion`
tool)". Step 5: "(recommendation + boldness + accept-as-deferral, context
delivered inside the tool)". Both already cite the "Question mechanics"
subsection **by name**, and that subsection self-generalizes to "any other"
round (266–267). The drift — named vs. bare "tool" — proves the duplication's
decay risk is not hypothetical.

**F8 — both steps re-read the same tradition-record corpus with no
cross-reference** (341 vs 359–361). CONFIRMED. Step 3 reads "the tradition
records those virtues cite"; step 5 reads "the tradition records the `serves`
virtues cite (their `adopted` / `diverged` / `chosen_over` entries)". Same
corpus — a virtue cites a tradition record only via `attributes.traditions`, and
a record's substantive content is exactly those three fields. Literal sequential
execution re-reads the same files at step 5 that step 3 read two steps earlier.

### In-file precedent to follow, not to reinvent

Step 11 already ends with the exact instruction Theme B wants applied to steps 3
and 5: **"Cite kind-tactic's test; do not restate its rationale here."** (line
436–437). Steps 8, 10 and 11 all reference the provenance convention by name as
"the step-2.8 provenance convention" rather than restating it. The house style
is: name the subsection, do not repeat the recipe. Match it.

### Hard constraints on all units

- **No graph writes.** This PR touches `.claude/skills/align/SKILL.md` only.
  `intentions/*.md` files are read-only here.
- **No renumbering.** Dialectic ordinals 1–11 stay exactly as they are; no
  step 12 is appended. Every ordinal cross-reference listed above must still
  resolve after the change.
- **One PR, sequenced units.** Units 1–3 edit overlapping lines (330–368). They
  must land as sequenced units on one branch, never as parallel PRs.
- **Do not touch:** `.claude/skills/align-audit/`,
  `.claude/skills/align-tactics/` (siblings with their own Step-2-like prose,
  out of scope), and `.claude/skills/office-hours/SKILL.md:331` (its "step 2.1"
  is office-hours' own step, not a reference to this list).

## Unit 1 — Make the doctrinal-consistency gate a two-pass gate (F1, F4)

**Scope.** `.claude/skills/align/SKILL.md` only. Three edit sites:

1. **Dialectic step 3, lines 330–349** — reframe the gate as an explicit *first
   pass*. Keep every element the prior qa-fix disposition verified present (the
   read-set, the `origin/main` source restriction, the `git show` example, the
   2026-07-08 grounding, the `validateGraph` rule-8 contrast, the edit-path
   clause). Add: this pass tests the drafted `statement` and whatever
   `rationale` material exists so far; it does not discharge the gate on its
   own, because the `rationale` is constructed at Step 5 and intent can still
   move at dialectic step 5. Name the second pass explicitly and by location
   ("Step 5's pre-write re-test"), and state that the doctrine read-set gathered
   here is retained for it.
2. **Dialectic step 5, lines 353–368** — add one sentence to the resolution
   branch (366–368): adopting the rival framing changes the intent the gate
   tested, so it re-arms Step 5's pre-write re-test. Do not restate the gate's
   procedure here; cite it, in the style of line 436–437.
3. **`## Step 5 — Record` pre-write preamble, lines 532–536** — add the re-test
   as a second paragraph in that preamble, **before** the `- **New strategy:**`
   / `- **Edit:**` fork so it binds both paths. It must say: before constructing
   the JSON, re-run dialectic step 3's contradiction test against (i) the final
   `statement`, (ii) the `rationale` as constructed for this write, and
   (iii) the intent as it stands after dialectic step 5's adopt/diverge
   resolution. Reuse the read-set gathered at step 3; re-read at `origin/main`
   only for doctrine nodes this round itself amended. Any contradiction the
   re-test surfaces goes back to the author through the "Question mechanics"
   subsection before the write — it is never fixed silently. Model the framing
   sentence on the existing step-10 restatement immediately above it ("This is
   the same gate as dialectic step 10, restated here as the final pre-write
   check…"), so the two pre-write checks read as one convention.

**Out of scope.** The edit-path-only amendment-completeness block at 557–571
(deliberately not the host — it would leave the new-strategy path uncovered;
say so in a short inline clause so a later reader does not "helpfully" move it
there). Dialectic steps 4 and 6–11. `## Step 6` at 759–778. Any renumbering.
Findings 5, 6, 7, 8, 9 — later units.

**Recommended model.** opus — this unit chooses where a gate binds across two
interview paths and writes doctrine prose that other sessions execute
literally; the wording carries the whole fix.

## Unit 2 — Record clean passes, and define the gate's overlapping-strategies scope (F5, F9)

**Scope.** `.claude/skills/align/SKILL.md` only. Four edit sites:

1. **Lines 346–347 (F5)** — make the `clarifications` entry **unconditional**.
   A gate pass that finds nothing still records a dated entry naming what was
   read (the read-set: the `serves` virtues' rationales and `tension_with`
   pairs, the overlapping-strategies set, the tradition records) and the outcome
   (clean, or N contradictions with their resolutions). Reuse the established
   phrasing from `.claude/skills/align-audit/SKILL.md:241-242` — "A run that
   changes nothing still records its clean result: a clean cycle is a real
   reading" — adapted to a gate pass. This restores symmetry with dialectic
   step 5's always-record (365–366) and step 8's unconditional "at least one"
   (376–377), and it is what makes "gate ran clean" distinguishable from "gate
   never ran" for a later auditor or `/align-tactics` session.
2. **The Step 5 re-test added by Unit 1** — state that the re-test **amends the
   step-3 entry with a new dated clause** rather than creating a second entry,
   per the step-2.8 amendment convention at line 387 ("An amendment adds a new
   dated clause rather than rewriting the old one"). One gate, one clarification
   entry, two dated clauses.
3. **Line 340 (F9)** — define "overlapping strategies" in place: the set of
   strategies whose census entry shows keyword overlap with the drafted
   `statement`/`rationale` — **the same census-and-grep step 1.2 runs**
   (`npx tsx packages/intentionsutil/scripts/align-strategy-census.ts
   intentions`), but taking the **full set of matches**, not only the single
   strongest. State explicitly that this runs on **both** paths, and that the
   absence of a step-1.2 strong match (which is what *defines* the new-strategy
   path) does **not** mean an empty overlapping set. Cross-reference step 1.2
   rather than restating the census command's purpose.
4. **Line 129–133 (step 1.2)** — add one sentence: the census dump and its match
   set are retained for dialectic step 3's read, so the census runs once per
   interview. **Line 444 (coverage matrix "Duplicates" row)** — add a short
   qualifier distinguishing step 1.2's use (edit-vs-new classification) from the
   gate's use (the neighbor set to check intent against), so the matrix and the
   gate no longer read as the same check.

**Out of scope.** Any change to
`packages/intentionsutil/scripts/align-strategy-census.ts` — this is a prose
change and reuses the script as-is. Introducing a numeric overlap threshold or
any scoring code: "overlap" stays the interviewer's keyword judgment, exactly as
step 1.2 already defines it. Coverage-matrix rows other than `Duplicates`.
Theme-B de-duplication.

**Dependencies.** Unit 1 (site 2 above edits prose Unit 1 introduces).

**Recommended model.** sonnet — both changes are fully specified above, with the
target wording, the source phrasing to reuse, and the exact lines; no design
decision is left open.

## Unit 3 — Cross-reference instead of restating (F6, F7, F8)

**Scope.** `.claude/skills/align/SKILL.md` only, over the text as it stands
after Units 1 and 2. Three edit sites:

1. **Lines 336–338 (F6)** — replace the repeated stale-checkout justification
   with a cross-reference to the `### Interview type — classify first, and state
   it` subsection (227–262, type-b bullet at 236–238), which is its canonical
   home. Keep the gate's unique content: that the read happens at
   `origin/main`, the 2026-07-08 round that caught the live failure, and the
   `git show origin/main:intentions/<id>.md` example. Use the file's own
   phrasing pattern from line 436–437 ("Cite … ; do not restate its rationale
   here").
2. **Lines 344–346 and 363–365 (F7)** — delete the three-part recipe
   parenthetical from **both** steps. The named "Question mechanics" citation
   already binds and that subsection already self-generalizes to "any other"
   round (266–267). Deletion also resolves the existing named-vs-bare "tool"
   drift, rather than fixing it in two places that will drift again.
3. **Line 341 and lines 359–361 (F8)** — keep exactly one substantive
   description of the tradition-record corpus and have the other cite it.
   Recommended direction: step 3 keeps the read (it happens first) and step 5
   references "the tradition records already read at the doctrinal-consistency
   gate", so the corpus is read once per interview. At the single remaining
   definition site, cite `intentions/kind-tradition.md:100-104` as the canonical
   home of the `adopted` / `diverged` / `chosen_over` field definitions instead
   of leaving them undefined in place.

**Out of scope.** Editing the `Interview type` or `Question mechanics`
subsections themselves — they are the canonical homes and must not shrink.
`.claude/skills/align-audit/`, `.claude/skills/align-tactics/`,
`.claude/skills/office-hours/SKILL.md`. Any content change to the gate's or
steelman's substance — this unit only removes duplication and adds citations.

**Dependencies.** Units 1 and 2 (this unit de-duplicates over the final text;
running it first would let Unit 1's additions reintroduce restatement).

**Recommended model.** sonnet — mechanical deletion and cross-reference
insertion against named line ranges, with the target phrasing pattern already
identified in-file.

## Reuse

- `.claude/skills/align/SKILL.md:330-349` — dialectic step 3, the gate. Revise
  this text; do not draft replacement prose from scratch.
- `.claude/skills/align/SKILL.md:353-368` — dialectic step 5, the steelman.
  Already cites "Question mechanics" and the step-2.8 convention correctly;
  follow that same citation style for anything added.
- `.claude/skills/align/SKILL.md:436-437` — `"Cite kind-tactic's test; do not
  restate its rationale here."` The canonical phrasing pattern for
  cross-reference-not-restate in this exact file. Reuse the phrasing shape.
- `.claude/skills/align/SKILL.md:227-262` (type-b bullet 236–238) — canonical
  home of the `origin/main` / stale-checkout rule. Point at it; do not copy it.
- `.claude/skills/align/SKILL.md:264-286` — `Question mechanics` subsection,
  already the shared cross-reference target for steps 3 and 5.
- `.claude/skills/align/SKILL.md:376-391` — step 8, the dated-provenance
  convention; line 387 is the amendment rule Unit 2 site 2 reuses.
- `.claude/skills/align/SKILL.md:413-437` — steps 10 and 11: existing precedent
  for a gate explicitly placed to run against final resolved content ("Before
  recording any interview outcome").
- `.claude/skills/align/SKILL.md:532-536` — Step 5's path-agnostic pre-write
  preamble, and the in-file precedent (the step-10 restatement) that Unit 1
  site 3 follows.
- `.claude/skills/align/SKILL.md:122-133` — step 1.2 overlap detection, the
  already-established mechanism Unit 2 reuses to define the gate's scope.
- `packages/intentionsutil/scripts/align-strategy-census.ts` — the script
  step 1.2 already runs (dumps id/statement/rationale/clarifications per
  strategy). Reuse; do not add a new detection method.
- `.claude/skills/align-audit/SKILL.md:241-242` — `"A run that changes nothing
  still records its clean result: a clean cycle is a real reading."` The closest
  existing clean-pass convention; adapt its wording for F5.
- `intentions/kind-tradition.md:100-104` — canonical schema home of
  `adopted` / `diverged` / `chosen_over`. Cite (read-only).
- `.claude/skills/ref-write-instructions/SKILL.md:35` — "Restating the same
  point multiple ways" (anchor re-verified 2026-08-21). The repo-wide style
  backing for Unit 3.
- `.claude/skills/align/SKILL.md:287-319` — `Deferral mechanics`, the existing
  path for recording an outcome the author holds on trust; the gate's and
  re-test's unresolved findings route here rather than growing a parallel
  mechanism.

## Verification

This is a skill-prose edit. The file has **no automated test surface** — its own
`## Verification` section (789–812) is prose-only and deliberately carries no
` ```verify ` block. Do not author one that runs a test suite; there is none.
The one mechanical check that is meaningful is the ordinal-preservation
invariant, which is what makes this plan safe to land without a graph write.

```verify
set -e
F=.claude/skills/align/SKILL.md
test -f "$F"
grep -q '^3\. \*\*Doctrinal-consistency gate\.\*\*' "$F"
grep -q '^5\. \*\*Steelman-alternative challenge\.\*\*' "$F"
grep -q '^8\. \*\*Edge cases and consequences\.\*\*' "$F"
grep -q '^10\. \*\*Persistent-layer ownership gate\.\*\*' "$F"
grep -q '^11\. \*\*Layer-placement gate\.\*\*' "$F"
if grep -qE '^1[2-9]\. \*\*' "$F"; then echo "FAIL: the forbidden pattern is still present"; exit 1; fi
grep -q 'dialectic step 5' intentions/strategy-discovered-requirements.md
grep -q 'dialectic step 2\.5' intentions/strategy-graph-native-dispatch.md
echo "dialectic ordinals 1-11 preserved; graph cross-references still resolve"
```

Manual checks, run after the last unit lands:

- **Re-read the revised block (dialectic steps 3 and 5, plus Step 5's pre-write
  preamble) and confirm each of the seven findings above no longer applies.**
  Take them one at a time against the failure scenario recorded for each.
- **F1/F4 trace.** Follow a hypothetical new-strategy interview end to end on
  paper: gate at step 3 → rationale drafted at step 4 → framing adopted at
  step 5 → Step 5 pre-write. Confirm the re-test is reachable on that path
  without an edit-path condition gating it, and that the same trace on the edit
  path also reaches it.
- **F5.** Confirm a clean gate pass now has a mandated record, and that the
  re-test amends that one entry rather than adding a second.
- **F7 residue check.** Run `grep -n 'accept-as-deferral'
  .claude/skills/align/SKILL.md` and confirm the only hits are inside the
  `Question mechanics` subsection (264–286). Run `grep -n 'boldness'` and
  confirm the same. (Stated as prose rather than as a negated grep in the verify
  fence: a negated grep over line-wrapped prose can pass vacuously, so a human
  or agent reads the hit list instead.)
- **F6 residue check.** Run `grep -n 'stale checkout'
  .claude/skills/align/SKILL.md` and confirm exactly one hit remains, at the
  `Interview type` subsection.
- **F8 residue check.** Run `grep -n 'tradition record'
  .claude/skills/align/SKILL.md` and confirm one site describes the corpus and
  the other cites it.
- **No graph write.** `git diff --name-only origin/main` must list
  `.claude/skills/align/SKILL.md` and nothing under `intentions/`.
- **Optional end-to-end.** In an interactive session, dry-run `/align` on a toy
  requirement per the skill's own Verification section and confirm the gate's
  clean-pass clarification and the pre-write re-test both actually fire.
