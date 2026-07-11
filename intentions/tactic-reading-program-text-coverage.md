---
id: tactic-reading-program-text-coverage
kind: tactic
statement: Extend the reading curriculum with chunks covering every text a
  tradition record cites — the delegated→codified flip must be completable
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-11 /align-tactics round from the 2026-07-09
  retained draft: five tradition records cite texts no curriculum chunk covers,
  so their status flip (delegated → codified, per kind-tradition: records flip
  as the reading program covers their texts) cannot complete as encoded. Texts
  are the doctrine's actual sources — the curriculum extends; the texts stay.
  Intentions-only work: new born-parked verify chunks for load-bearing texts,
  honest exclusion notes for provenance-only citations, and the program index
  update. Off the minimum signal path (no validates edge — the new chunks it
  mints will carry the validates edges, this tooling pass does not); the
  author's direct boost 7 carries its priority."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 7
  override: null
  rationale: "Author-directed 2026-07-09: curriculum-frontier machinery — it
    extends the reading curriculum with chunks covering every cited text, the
    coverage-completion mechanism. Same tier as the other curriculum tooling
    (tactic-reading-review-skill, tactic-sync-reader-skill: boost 7). It serves
    strategy-philosophical-grounding (unboosted, and too broad to boost as a
    whole), so it takes the full boost 7 directly rather than by inheritance to
    reach the same authored-7 curriculum tier."
phase: done
execution:
  branch: tactic-reading-program-text-coverage
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 4938e3dd607b936f594cb15964e7096ae8da08b91c2177910589282473b95a68
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Extend the reading curriculum with chunks covering every text a tradition record cites — the delegated→codified flip must be completable

## Context

`kind-tradition`'s status doctrine: a tradition record flips
`status: delegated → codified` as the reading program
(`tactic-tradition-reading-program`) covers its cited texts —
`/reading-review`'s "Codify a covered record" rule keys on **all** of a
record's cited texts being covered across chunks. Coverage audit (2026-07-09
review round, re-anchored 2026-07-11): five records cite texts no curriculum
chunk covers, so their flip cannot complete as encoded. Texts are the
doctrine's actual sources — the curriculum extends; the texts stay. This is
an intentions-only change (new chunk nodes + record notes + index update); no
code.

Preliminary diff at plan time (2026-07-11) — the implementing session MUST
recompute (the graph moves):

- `tradition-aristotle`: uncovered NE VIII–IX (friendship), Politics VIII.
  (Covered: NE I.3, I.8–10 by chunk 6; II.5–6 by chunk 2; III.10–12 by
  chunk 4; IV.1, X.7, Politics I.2 by chunk 7; VI by chunk 5.)
- `tradition-plato`: uncovered Apology; Republic 592a-b (the paradigm).
  (Covered: Republic IV by chunk 4; Republic VII 514a–521b and 519–520 by
  done chunk 1; Meno by chunk 18; Protagoras by chunk 23.)
- `tradition-kant`: uncovered Groundwork section III. (Covered: Groundwork
  4:429 and MM 6:434–437 by chunk 3.)
- `tradition-stoicism`: uncovered Marcus Aurelius, Meditations (apatheia in
  practice). (Covered: Enchiridion 1, Seneca Letters 18, 91 by chunk 8.)
- `tradition-utilitarianism`: uncovered Bentham, Introduction to the
  Principles of Morals and Legislation ch. 4. (Covered: Mill, Utilitarianism
  ch. 2, 4 by chunk 9.)
- `tradition-augustine`: fully covered (chunks 19–21) — no action.

## Units of work

### Unit 1 — recompute the coverage diff and dispose each uncovered text

**Scope.** No files change in this unit; its output is the disposition table
Unit 2 executes. Mechanically recompute the diff: for each
`intentions/tradition-*.md`, compare `attributes.texts` against the union of
`attributes.curriculum.passages` across `intentions/tactic-reading-chunk-*.md`.
A done chunk still counts as covered; chunk 1 (Republic VII 514a–521b) is
resolved and pruned, so also count the "done" rows in
`tactic-tradition-reading-program`'s index as covered. For each uncovered
text choose exactly one disposition:

- **(a) new curriculum chunk** — the text is load-bearing for an
  `adopted`/`diverged`/`chosen_over` entry on the record: the flip must
  verify it personally.
- **(b) provenance exclusion** — the text is cited for provenance or
  illustration and no recorded entry leans on it: a dated note on the
  tradition record stating the delegated→codified flip excludes this text
  and why, so the flip criterion stays honest.

Judgment calls (e.g. Republic 592a-b, a short paradigm passage the chunk-1
session already read from) go to (a) only if a recorded entry leans on the
text; otherwise (b) with the reason recorded.

**Recommended model**: opus (chunk selection is the delegatee-bias surface —
the same reason `tactic-context-chunk-selection` pinned Opus).

### Unit 2 — author the chunk nodes, record notes, and index update

**Scope.** Files created: one `intentions/tactic-reading-chunk-<n>-<slug>.md`
per disposition-(a) text, using the next unused stable chunk numbers (26+ at
plan time — recompute against existing ids). Each follows the chunk
convention exactly (template:
`intentions/tactic-reading-chunk-2-aristotle-hexis.md`):

- frontmatter via `write-node.ts`: `kind: tactic`, `owner: human`,
  `status: codified`, `parent: tactic-tradition-reading-program`,
  `serves: [strategy-philosophical-grounding]`,
  `validates: [strategy-philosophical-grounding]`, `phase` absent
  (born-parked), `office_hours: {reason, since, recommendation: null}` — the
  reason is a one-line pointer to `tactic-tradition-reading-program`'s shared
  verify-record reason plus the chunk's unique payload; `since` via
  `date -u +%Y-%m-%d` — and `attributes.curriculum:
  {priority, passages: [{work, range}]}` with priority appended after the
  current queue maximum (25 at plan time — recompute; no new chunk jumps the
  queue, per `strategy-recovery-critical-path`'s ordering doctrine).
- body: `## Text` / `## Questions to re-open against the text` /
  `## Completion` — passages and questions only, never conclusions (the
  Cave-educator constraint); the questions re-open the record entries the
  text underwrites.
- one work per chunk wherever the material allows: 9 existing multi-work
  chunks are un-syncable pending the design decision parked on
  `tactic-sync-reader-skill`'s `office_hours.reason` — do not grow that set.
- each chunk stays ≤30 author-minutes of independent reading; split a long
  text (e.g. NE VIII–IX) into multiple chunks.

Files changed: each disposition-(b) tradition record gets its dated exclusion
note (a `clarifications` entry via `write-node.ts`, ending with the standard
provenance sentence); `intentions/tactic-tradition-reading-program.md`'s body
gets the new chunks appended to its index table plus a one-line note of any
exclusions. All frontmatter writes go through
`packages/intentionsutil/scripts/write-node.ts`; bodies via `Edit`.

**Out of scope**: any change to `/sync-reader` or `/reading-review`;
re-prioritizing existing chunks; creating or amending tradition-record
`adopted`/`diverged` entries (only exclusion notes); creating tradition
records.

**Recommended model**: opus

**Dependencies**: Unit 1

## Reuse

- `intentions/tactic-reading-chunk-2-aristotle-hexis.md` — the verify-chunk
  template (frontmatter shape, body sections, shared-reason pointer).
- `intentions/tactic-tradition-reading-program.md` — the shared office-hours
  reason (single home) and the index table to extend.
- `packages/intentionsutil/scripts/write-node.ts` — every frontmatter write;
  `packages/intentionsutil/scripts/validate-graph.ts` — the acceptance gate.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Prose: re-run the Unit 1 coverage diff after landing — it is empty, or every
remaining uncovered text has a dated exclusion note on its tradition record.
Every new chunk: unique priority strictly greater than the pre-existing
maximum, exactly one work in `passages` (or a recorded reason why not),
parent/serves/validates as specified, born-parked with the pointer-style
reason, and present in `tactic-tradition-reading-program`'s index.
