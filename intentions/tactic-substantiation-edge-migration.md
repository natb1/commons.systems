---
id: tactic-substantiation-edge-migration
kind: tactic
statement: Migrate the graph to the symmetric substantiation edges —
  attributes.traditions → substantiated_by, contradicted_by edges added from
  rationale prose, validate-graph mirror enforcement, and the stamp vocabulary
  sweep (old state names → ratified/deferred/delegated)
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-08-30 resolution round, which ratified the
  symmetric locus doctrine (strategy-explicit-intent's superseded locus
  clarification): substantiation and contradiction are two typed edges on the
  substantiated node (attributes.substantiated_by / attributes.contradicted_by),
  each REQUIRED to be mirrored by a locus-naming entry on the tradition record
  (adopted ⇔ substantiated_by; diverged/chosen_over ⇔ contradicted_by); prose is
  optional narrative. Scope: (1) rename attributes.traditions → substantiated_by
  on every bearer (the two new virtues already migrated in the resolution-round
  commit; the legacy bearers — virtue-temperance and siblings — remain); (2) add
  contradicted_by edges where contradictions live only in rationale prose; (3)
  land the validate-graph mirror check (edge without matching record entry, or
  vice versa, fails); (4) sweep remaining old-vocabulary stamps
  (delegated-pending-review → deferred, delegated-review-declined → delegated)
  on nodes the resolution-round commit did not touch (e.g.
  tactic-align-indifference-option, tactic-keystone-decomposition-reorg). The
  doctrine is author-ratified; this tactic is the mechanical carry."
reading: null
serves:
  - strategy-explicit-intent
recovers: []
clarifications:
  - question: Is the attributes.traditions rename mechanical (drift review, 2026-08-30)?
    answer: "No — the park reason records the measured counter-case. (Recorded
      2026-08-30 /align-tactics tactic-target drift review; measured baseline
      for this tactic's scope, so a later session does not re-derive it.) On
      origin/main: the new spelling exists on 2 content nodes only
      (virtue-right-livelihood, virtue-knowledge-as-gift) plus the
      kind-tradition spec and this tactic; 10 nodes still carry legacy
      attributes.traditions; 9 files still carry the interim stamp vocabulary
      (delegated-pending-review / delegated-review-declined) —
      delegation-anthropic-claude, kind-virtue, strategy-explicit-intent,
      strategy-graph-mounts, strategy-graph-review-curriculum,
      tactic-align-indifference-option, tactic-keystone-decomposition-reorg,
      tactic-node-review-skill, and this node itself. Code support is zero: grep
      for substantiated_by / contradicted_by across packages/intentionsutil/src
      and scripts returns nothing, so the locus clarification's \"validate-graph
      enforces the mirror\" is aspirational and this tactic is its only carrier.
      Rule numbering: the highest landed validateGraph rule is 23
      (checkAttributesShadowing, wired at
      packages/intentionsutil/src/schema.ts:1884);
      tactic-supersession-edge-and-terminal claims 23 and 24 and has NOT landed,
      so the mirror rule must take a fresh unclaimed number checked at
      implementation time — rule numbers are never reused."
  - question: Is the validate-graph mirror check enforceable against today's
      tradition records?
    answer: "(Recorded 2026-08-30 /align-tactics tactic-target drift review;
      observation about this tactic's scope item (3), not a gate on it.) The
      mirror check this tactic lands is not enforceable against tradition
      records as they are shaped today. attributes.adopted / diverged /
      chosen_over entries are free-form prose strings, and they name the graph
      locus inconsistently: tradition-buddhism's adopted entry names
      virtue-right-livelihood explicitly, while tradition-stoicism's two adopted
      entries name strategy-exercise-recovery-paths in one and no locus at all
      in the other. Enforcing \"edge without matching record entry, or vice
      versa, fails\" therefore requires either an id-substring convention on
      entry text or a structural change to the entries, plus a grandfather
      baseline for pre-existing violations — the prose-ref-baseline.json /
      plan-body-baseline.json rollout pattern at
      packages/intentionsutil/scripts/validate-graph.ts and
      packages/intentionsutil/src/planlint.ts is the reusable precedent.
      Mount-record shape and lint mechanics are delegated to Claude under the
      2026-08-30 resolution round, so this is Claude's to settle by greenfield
      merit in the plan, not an author gate."
  - question: What rule disposes each legacy (node, tradition) pair, and who
      exercises it (finalize interview, 2026-08-31)?
    answer: "(Recorded 2026-08-31 finalize interview.) The per-pair disposition rule
      is ratified: for each of the 24 legacy (node, tradition) pairs across the
      10 attributes.traditions bearers, an adopted entry on the tradition record
      naming the node becomes substantiated_by; a diverged/chosen_over entry
      contradicting the node's content becomes contradicted_by, with Claude
      back-filling the missing locus into the tradition entry where the entry
      names none (an inference, deferred-stamped); where neither kind of entry
      exists the pair is dropped and the drop recorded as a dated clarification
      on the bearer. Contradictions become edges, never clarifications -
      clarifications record only drops. Claude exercises the disposition for all
      pairs, virtue-layer included, under the standing greenfield-merit
      delegation; every virtue-layer edge write and locus back-fill carries a
      deferred stamp so it enters the /exetasis review queue. (decision:
      author-ratified, 2026-08-31)"
  - question: How does the mirror check land - rule number, id convention, baseline
      (finalize interview, 2026-08-31)?
    answer: "(Recorded 2026-08-31 finalize interview; delegated by the author as a
      testing detail.) Take the next free validateGraph rule number at land
      time, never pinned in the plan. Re-measured 2026-08-31:
      tactic-supersession-edge-and-terminal landed rules 24/25/26 on main
      (commit f0603ff7), superseding this node's earlier '23 and 24 claimed,
      unlanded' baseline, so the expected claim is 27 - re-checked against the
      schema.ts collision note at implementation time. The mirror check keys
      tradition-record entries to node ids by an id-substring convention over
      adopted/diverged/chosen_over entry text, and a grandfather baseline
      freezes the asymmetries present at the migration commit (the
      prose-ref-baseline.json / plan-body-baseline.json rollout precedent), so
      only new edges are enforced. (decision: delegated,
      delegation-anthropic-claude, 2026-08-31)"
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Migrate the graph to the symmetric substantiation edges — attributes.traditions → substantiated_by, contradicted_by edges added from rationale prose, validate-graph mirror enforcement, and the stamp vocabulary sweep

## Context

The symmetric locus doctrine is author-ratified (strategy-explicit-intent's
superseded locus clarification): substantiation and contradiction are two typed
edges on the substantiated node (`attributes.substantiated_by` /
`attributes.contradicted_by`), each mirrored by a locus-naming entry on the
tradition record (adopted ⇔ substantiated_by; diverged/chosen_over ⇔
contradicted_by), prose optional narrative. The 2026-08-30 park was resolved by
the 2026-08-31 finalize interview: the rename is NOT mechanical — the legacy
`attributes.traditions` field records traditions ENGAGED, not substantiating
(counter-case: virtue-philosophical-mobility × tradition-stoicism, whose record
is `origin: declined` with a diverged entry contradicting the virtue) — and the
author ratified the per-pair disposition rule recorded in this node's
2026-08-31 clarifications, with Claude exercising it for all pairs. The landed
edge precedent is `intentions/virtue-right-livelihood.md:54-60`
(`substantiated_by` + `contradicted_by`), mirrored at
`intentions/tradition-franciscan.md:37-46` and
`intentions/tradition-stoicism.md:73-78`. Contradictions become edges, never
clarifications; clarifications record only dropped pairs.

## Unit 1 — per-pair migration of the 10 legacy bearers

**Recommended model:** opus

Scope:

- Dispose all 24 legacy (node, tradition) pairs per the ratified rule
  (2026-08-31 clarification on this node). The bearers, measured 2026-08-31:
  `intentions/strategy-join-existing-practice.md:75` (aristotle, kant);
  `intentions/strategy-external-calibration.md:98` (plato);
  `intentions/strategy-open-source-as-gift.md:110` (aristotle);
  `intentions/strategy-tabletop-storytelling.md:59` (aristotle);
  `intentions/strategy-philosophical-grounding.md:370` (aristotle, plato, kant,
  augustine); `intentions/virtue-temperance.md:70` (aristotle, plato);
  `intentions/virtue-respect-for-persons.md:87` (kant, aristotle);
  `intentions/virtue-progressive-detachment.md:72` (aristotle, stoicism);
  `intentions/virtue-philosophical-mobility.md:118` (aristotle, plato, kant,
  stoicism, augustine); `intentions/virtue-alignment-of-attachments.md:79`
  (kant, aristotle). Re-measure the set at execution time before editing.
- Known contradiction pairs, both becoming `contradicted_by:
  [tradition-stoicism]`: virtue-philosophical-mobility × stoicism (the diverged
  entry "detachment as telos" at `intentions/tradition-stoicism.md:71-72` names
  no locus — back-fill the locus into that entry, deferred-stamped) and
  virtue-progressive-detachment × stoicism (the record's `review_trigger` at
  `intentions/tradition-stoicism.md:84-86` treats that virtue as a divergence
  tripwire, and no adopted entry names it — verify against the record at
  execution and dispose per rule).
- Check every remaining pair against its tradition record's
  adopted/diverged/chosen_over entries; write `substantiated_by`,
  `contradicted_by`, or drop the pair per rule; record every drop as a dated
  clarification on the bearer. Virtue-layer edge writes and locus back-fills
  carry `(decision: deferred, delegation-anthropic-claude, YYYY-MM-DD)` stamps.
- Update the spec text still describing the legacy field:
  `intentions/kind-strategy.md:101`, `intentions/kind-virtue.md:160`, and the
  legacy phrasing at `intentions/kind-tradition.md:34-36`.
- Update the grounding sensor: `packages/intentionsutil/src/grounding.ts:48-51`
  (`hasTraditionsMark`) keys the grounded/unmarked split on
  `attributes.traditions`; make `substantiated_by` or `contradicted_by` count
  as the grounding mark (keeping `attributes.traditions` accepted until the
  last bearer migrates), and update the fixtures at
  `packages/intentionsutil/test/grounding.test.ts:63-89`. Without this the
  rename silently converts all 10 bearers to "unmarked" in
  strategy-complete-grounding's gap report.
- Out of scope: the mirror rule (Unit 2), the stamp sweep (Unit 3), and any
  tradition-record restructuring beyond the locus back-fills this unit's edges
  mirror.

## Unit 2 — the validate-graph mirror rule

**Recommended model:** opus

Dependencies: Unit 1 (the edges must exist before the mirror is enforced).

- New `validateGraph` rule at the next free number — measured 2026-08-31 rules
  24/25/26 are landed (the supersession family, commit f0603ff7), so 27 is the
  expected claim; re-check the collision note in
  `packages/intentionsutil/src/schema.ts` at implementation time and extend it
  to record this claim. Burned numbers are never reused.
- Shape: a `substantiated_by`/`contradicted_by` edge without a matching
  tradition-record entry naming the node (id-substring convention over
  adopted/diverged/chosen_over entry text), or a locus-naming entry without its
  edge, is a violation — except pairs recorded in a grandfather baseline
  captured at the migration commit (a `substantiation-baseline.json`, following
  the `prose-ref-baseline.json` rollout at
  `packages/intentionsutil/scripts/validate-graph.ts` and the
  `plan-body-baseline.json` pattern in
  `packages/intentionsutil/src/planlint.ts`).
- Follow the rule 19/21/22 shape: inert when the keys are absent, shape-checked
  when present. Unit tests in `packages/intentionsutil/test/`.

## Unit 3 — stamp vocabulary sweep

**Recommended model:** sonnet

No dependency on Units 1–2.

- Sweep the interim stamp vocabulary — `delegated-pending-review → deferred`,
  `delegated-review-declined → delegated` — across the bearer files measured in
  this node's 2026-08-30 baseline clarification (9 files then; re-measure at
  execution, the set moves). tactic-node-review-skill's Unit 2 parser reads
  both spellings tolerantly, so this sweep gates nothing; sweep prose only and
  never weaken that tolerance.
- Leave deliberate historical citations of the old spelling in place (grammar
  templates and meta-quotes that cite the interim form as history) — judgment
  per site, each rewrite preserving the sentence's meaning.

## Reuse

- `packages/intentionsutil/src/schema.ts` — rule wiring and the collision
  note; rules 19/21/22 as the inert-when-absent shape template.
- `packages/intentionsutil/scripts/validate-graph.ts` and
  `packages/intentionsutil/src/planlint.ts` — grandfather-baseline rollout
  precedent.
- `packages/intentionsutil/src/grounding.ts` +
  `packages/intentionsutil/test/grounding.test.ts` — the sensor to re-key.
- `intentions/virtue-right-livelihood.md:54-60` — the landed edge precedent to
  copy, mirrored at `intentions/tradition-franciscan.md:37-46` and
  `intentions/tradition-stoicism.md:73-78`.
- `packages/intentionsutil/scripts/write-node.ts` + `graph-commit` — the only
  write path; never hand-author frontmatter.

## Verification

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
npm test --prefix packages/intentionsutil
```

```verify
grep -n contradicted_by intentions/virtue-philosophical-mobility.md
```

Manual checks: after Unit 1, every one of the 24 pairs has exactly one
disposition (edge or recorded drop) and no `attributes.traditions` key remains
on any bearer; after Unit 2, the baseline file exists and validate-graph is
green with the new rule wired; after Unit 3, a repo grep for
`delegated-pending-review` and `delegated-review-declined` returns only
deliberate historical citations.
