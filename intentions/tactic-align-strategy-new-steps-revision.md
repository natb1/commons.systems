---
id: tactic-align-strategy-new-steps-revision
kind: tactic
statement: "Revise /align-strategy's two new Step 2 interview steps (the 2.3
  doctrinal-consistency gate and 2.5 steelman challenge): make the gate test the
  finalized rationale and post-steelman intent, record clean passes, define its
  overlapping-strategies scope, and cross-reference rather than restate the
  shared origin/main, question-mechanics, and tradition-record rules"
owner: ai
status: raw
parent: null
rationale: "Surfaced by /review-fix of PR #2867
  (tactic-align-strategy-alignment-tests), which inserted step 2.3
  (doctrinal-consistency gate) and step 2.5 (steelman-alternative challenge)
  into /align-strategy's Step 2 interview. Seven review findings land on the
  same ~40-line edit surface: the gate at 2.3 runs before the rationale (drafted
  at 2.4 Benefit) and the intent (mutable at 2.5 steelman) are finalized and
  never re-checks them; a clean gate pass records nothing, so it is
  indistinguishable from a skipped gate; the gate's overlapping-strategies scope
  is undefined; and both new steps restate doctrine already stated elsewhere in
  the file. Retained as one node because all seven touch the same contiguous
  lines - separate PRs would self-conflict - so a single revision (or a
  /align-tactics split into sequenced units on this one surface) fixes them
  together."
reading: null
serves:
  - strategy-discovered-requirements
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
# Revise /align-strategy's two new Step 2 interview steps (the 2.3 doctrinal-consistency gate and 2.5 steelman challenge): make the gate test the finalized rationale and post-steelman intent, record clean passes, define its overlapping-strategies scope, and cross-reference rather than restate the shared origin/main, question-mechanics, and tradition-record rules

> Draft context retained per review-fix follow-up filing (node-target lane).
> Not a plan — a future `/align-tactics` round (or a direct edit) finalizes or
> folds this in.

## Findings this draft retains

All line anchors are the **post-PR-#2867** numbering in
`.claude/skills/align-strategy/SKILL.md`. Surfaced during /review-fix of PR
#2867, tactic-align-strategy-alignment-tests.

### Theme A — the doctrinal-consistency gate's coverage and definition

**Finding 1 — gate tests a rationale that does not exist yet
(`SKILL.md:258-277`).** Step 2.3 instructs surfacing "every contradiction
between the drafted `statement`/`rationale` and that doctrine," but the
`rationale`'s conclusion is only produced at step 2.4 (Benefit — "its conclusion
should be visible in the eventual `rationale`") and finalized at record time
(step 5). At the point 2.3 runs there is no drafted rationale to test, and
nothing later (steps 2.4-2.9, step 5 Record, step 6 coverage walk) re-runs the
gate against the finalized rationale. The edit path's "revised
`statement`/`rationale`" clause has the same gap.
*Failure scenario:* an interview passes the 2.3 gate clean on the statement,
then at 2.4 the Benefit discussion yields a rationale whose conclusion
contradicts a served virtue's `tension_with` pair; the contradiction is never
tested and the strategy records doctrinally inconsistent.
*Verdict:* CONFIRMED (re-verified against the PR diff: 2.3 precedes 2.4; no
re-run exists).

**Finding 4 — steelman adoption escapes the already-completed gate
(`SKILL.md:258` vs `:281`).** Step 2.3 completes and records before step 2.5
(steelman) runs in the same round. Step 2.5 can resolve by the strategy
"adopt[ing] the rival framing," which meaningfully shifts intent, but nothing
re-runs 2.3's consistency check against the newly-adopted framing.
*Failure scenario:* gate passes clean at 2.3; at 2.5 the author adopts a rival
framing that re-points the strategy at an end contradicting an overlapping
strategy's condition; the adoption-introduced contradiction lands unexamined in
the very round meant to catch this class of problem.
*Verdict:* PLAUSIBLE (sweep-reasoned; step ordering re-checked against the PR
diff — 2.3 at step 3 precedes the 2.5 steelman, and the "adopts the rival
framing" branch has no downstream re-check).

**Finding 5 — a clean gate pass leaves no record (`SKILL.md:274`).** Step 2.3
produces a `clarifications` entry only when a contradiction is found ("Surface
every contradiction ... Each resolution lands as a dated `clarifications`
entry"). A clean pass records nothing. This is asymmetric with step 2.5 (always
records an adopt/diverge entry) and step 2.8 (mandates "at least one" edge case
unconditionally). Given the record-completeness contract (the graph record is
the sole carrier, no session memory), a later reader cannot distinguish "gate
ran and passed clean" from "gate never ran."
*Failure scenario:* a rushed interview skips the 2.3 gate; the resulting record
is byte-identical to a diligent interview that ran it and found nothing, so no
audit or /align-tactics pass can detect the skip.
*Verdict:* PLAUSIBLE (sweep-reasoned; asymmetry confirmed against 2.5's
always-record wording and 2.8's "at least one" at the Edge-cases step).

**Finding 9 — "overlapping strategies" scope is undefined (`SKILL.md:268`).**
Step 2.3 tells the interviewer to read "overlapping strategies' `clarifications`
and `attributes.conditions`," but step 1.2's overlap detection returns a single
strong match ONLY on the edit path (the new-strategy path is *defined* by the
absence of a step-1.2 match). So 2.3's "overlapping strategies" (plural, runs on
both paths) cannot mean "reuse step 1.2's result"; it must denote some other,
undefined sweep. The phrase occurs exactly once with no definition, and the
coverage-matrix table treats "Duplicates" (step 1.2) as a distinct category from
the 2.3 gate.
*Failure scenario:* a clean-session implementer on the new-strategy path reaches
2.3, finds no step-1.2 match to reuse, and either skips the "overlapping
strategies" read or invents an ad-hoc grep — inconsistent behavior across
sessions, the exact record-completeness failure the skill warns against.
*Verdict:* CONFIRMED.

### Theme B — redundancy the two new steps introduced

**Finding 6 — gate restates the origin/main justification already stated at
~line 166 (`SKILL.md:264-266`).** Step 2.3's "a stale checkout presents
already-amended doctrine as current" attached to "read at `origin/main`, never
the working tree" duplicates near-verbatim the same rule in the "Interview type"
type-b subsection (~line 166). `.claude/skills/ref-write-instructions/SKILL.md`
lists "Restating the same point multiple ways" as an anti-pattern and requires
"every line must add value ... remove redundancy."
*Verdict:* CONFIRMED (both sites read against the file; ref-write-instructions
anti-pattern quoted at its line 35).

**Finding 7 — both new steps restate the Question-mechanics recipe, and the
restatements already disagree (`SKILL.md:272`, `:291-292`).** Steps 2.3 and 2.5
each cite the "Question mechanics" subsection by name AND restate its three-part
recipe in a parenthetical — "recommendation + boldness + accept-as-deferral,
context delivered inside the `AskUserQuestion` tool" (2.3) vs "...inside the
tool" (2.5) — even though that subsection (lines 195-196) already
self-generalizes to "any other" round. The wording has already drifted between
the two, showing the duplication's drift risk is not hypothetical.
*Verdict:* CONFIRMED.

**Finding 8 — both new steps re-read the same tradition-record corpus with no
cross-reference (`SKILL.md:269`, `:288`).** Step 2.3 reads "the tradition
records those virtues cite" (for contradiction-checking) and step 2.5 reads "the
tradition records the `serves` virtues cite" (for rival framings) — the same
corpus (a virtue cites a tradition record only via `attributes.traditions`; a
record's substantive content is exactly its `adopted`/`diverged`/`chosen_over`
fields). Neither cross-references the other, so literal sequential execution
re-reads the same files at 2.5 that 2.3 read two steps earlier.
*Verdict:* CONFIRMED.

## Concrete edits this draft anticipates

A future implementer should treat this as one revision of the 2.3/2.5 block
(`SKILL.md:258-296`). A /align-tactics decomposition may split it into a
Theme-A unit and a Theme-B unit, but they must be **sequenced on the same
surface**, not shipped as parallel PRs (they edit identical lines).

**Theme A (gate coverage/definition — likely opus, design judgment):**
- Findings 1 & 4 share one root — the gate is positioned before the steps that
  finalize what it tests. Fix options: (a) move the gate to run after Benefit
  (2.4) and Steelman (2.5) so the rationale and post-adoption intent exist; or
  (b) keep an early gate but add an explicit re-run against the finalized
  `statement`/`rationale`/intent at record time (step 5) or in the step-6
  coverage walk; or (c) fold the re-check into step 5's amendment-completeness
  reconciliation so any field changed after the gate is re-tested. Cover the
  edit path's "revised `statement`/`rationale`" too.
- Finding 5: mandate a dated `clarifications` entry on a clean pass too (mirror
  2.5's always-record and 2.8's "at least one"), so "ran clean" is
  distinguishable from "never ran."
- Finding 9: define "overlapping strategies" for 2.3 explicitly — either specify
  the sweep (e.g. step 1.2's keyword grep returning ALL above-threshold matches,
  run on both paths) or cross-reference step 1.2 and state how the new-strategy
  path obtains the set (since 1.2 yields no match there). Reconcile with the
  coverage-matrix "Duplicates" row.

**Theme B (redundancy — likely sonnet, mechanical):**
- Finding 6: replace 2.3's repeated stale-checkout justification with a
  cross-reference to the Interview-type subsection's origin/main rule; keep
  2.3's unique content (which doctrine to read, the 2026-07-08 incident
  grounding, the `git show` example).
- Finding 7: drop the recipe parentheticals from both 2.3 and 2.5; the named
  "Question mechanics" citation already binds and self-generalizes to "any
  other" round. Deletion also resolves the wording drift.
- Finding 8: have 2.5 reference the tradition-record read 2.3 already performed
  (or hoist the read once), so the corpus is read once per interview.

## Verification

Prose only (skill-doc edit, no runnable suite), consistent with the
align-strategy skill's own Verification section: re-read the revised 2.3/2.5
block and confirm each of the seven findings above no longer applies.
