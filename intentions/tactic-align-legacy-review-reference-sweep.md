---
id: tactic-align-legacy-review-reference-sweep
kind: tactic
statement: "Sweep the load-bearing in-graph references to
  tactic-align-audit-legacy-review — repoint the content pointers at commit
  44493733 and correct the prose that still calls the inclusion decision pending
  — so D1's prune strands nothing"
owner: ai
status: codified
parent: null
rationale: "Filed 2026-08-29 by the author sitting's Part I rulings. D1
  re-authorized the prune of tactic-align-audit-legacy-review, but attempting it
  surfaced a gate no document had recorded: the node is cited by 38 prose lines
  across 12 other nodes, and none of those citations is a structural edge. A
  grep for a serves/blocked_by/validates list entry naming the node returns
  nothing, so validate-graph stays green through the prune and every stranded
  citation fails silently. tactic-retire-assessor-contract-docs covers the
  file-tree residue only — two .claude/docs files and one skill — and no node
  scoped the in-graph residue until this one. Serves strategy-graph-integrity
  because the defect is record coherence: instructions that point at content
  which no longer exists."
reading: null
serves:
  - strategy-graph-integrity
recovers: []
clarifications:
  - question: Which references are load-bearing, and which are merely stale framing?
    answer: "Two kinds, both in scope but needing different fixes. (1) Five LIVE
      CONTENT POINTERS, all in tactic-align-entrypoint-consolidation, send the
      reader to the node for the retained engine specifications themselves —
      lines 99, 176, 279, 291 and 349. Line 291 is the sharpest: it instructs
      'PRESERVE the content, not delete', giving as its reason that the node is
      a live plan for a future /align-audit that will re-consume the contract.
      That premise is now false — the 2026-07-23 sitting decided against
      re-consumption — so 291 must be rewritten, not merely repointed. Line 279
      is a rewrite directive aiming other prose at the node, so it compounds if
      left. (2) STALE-FRAMING REFERENCES — strategy-explicit-intent (5),
      tactic-condition-review-sweep (4), tactic-align-audit-skill (2) and others
      describe the inclusion decision as pending when it was settled
      2026-07-23. These are wrong today regardless of the prune; the prune only
      adds a second defect on top of a first."
  - question: Does tactic-retire-assessor-contract-docs block this, given it carries
      the most references (10)?
    answer: "No. It is written prune-safe already: its line 145 names the node as
      'still present on origin/main as of 2026-08-28 — expect it, and do not
      read its presence as a live consumer'. Its references are provenance and
      guard prose, not content pointers. One line does need correcting — line 47
      describes the filing round as 'the /align-tactics
      tactic-align-audit-legacy-review round that pruned the node these files
      cite', narrating the prune as already done when it has never run. That is
      a provenance error to fix in this sweep, not a dependency. Do not widen
      that tactic to absorb this work: it is owner ai at phase implement, so
      widening it means re-planning work in flight."
  - question: Where do the five content pointers get repointed to?
    answer: "To origin/main commit 44493733, which holds both
      .claude/skills/align-init/ and .claude/skills/align-strategy/ verbatim.
      Their source directories were deleted from the tree by c845d50f
      ('Consolidate /align-strategy + /align-init into /align'), and the graph
      already records the surviving copy — tactic-align-entrypoint-consolidation
      lines 280-281 say 'verbatim source also survives at origin/main commit
      44493733'. Verified present 2026-08-29. So the author's ruling that the
      retained engine content needs no new in-graph home does not lose the
      content; it relocates the reader from a curated copy to the source."
  - question: Does the prune really pass CI silently — and if so, why can no tooling
      change catch it?
    answer: "Yes, and the reason is a deliberate exemption rather than a gap.
      Corrected 2026-08-29: this node originally claimed prose references are
      unchecked and only structural YAML edges are validated. That is false.
      validate-graph runs validateGraphProseRefs
      (packages/intentionsutil/src/schema.ts:1780) over every backticked,
      id-shaped reference in a node's statement, rationale, attention.rationale,
      clarification answers and body. But it skips any reference that does not
      classify as 'missing', and classifyRef consults a 'deleted' set built by
      deletedNodeIds()
      (packages/intentionsutil/scripts/lib-deleted-node-ids.ts) from
      git log --diff-filter=D -- intentions/. So the instant the prune commit
      lands, the id is in that set and all 38 references classify as 'pruned'
      and pass. The exemption is correct in general — a prune should not break
      every node that ever cited the pruned node — and
      tactic-retire-assessor-contract-docs:103 relies on it explicitly. The
      consequence is that green CI after the prune carries no information about
      whether the surviving references still make sense, so a human sweep is the
      only remedy. Three further references live outside intentions/, where no
      prose check reaches at all; those belong to
      tactic-retire-assessor-contract-docs."
  - question: Should all 38 references be rewritten?
    answer: "No — 8 of them, in 4 files. Triaged 2026-08-29. The load-bearing
      group is prose that is false in the present tense or that sends a reader to
      the node for content it no longer holds: five sites in
      tactic-align-entrypoint-consolidation, the body paragraph at
      tactic-align-audit-skill:149-153 whose twin in
      .claude/skills/align-audit/SKILL.md is quoted at
      tactic-retire-assessor-contract-docs:185-199 and called false in every
      clause (that tactic covers the skill file, not the node body, so the node
      body is left to this sweep), the content pointer at
      tactic-graph-native-dispatch:190,
      and the provenance error at tactic-retire-assessor-contract-docs:47. The
      other 30 are dated records naming the sitting as a historical event, or
      superseded premises that the same node's own later clarification already
      corrects in sequence. Rewriting those would falsify a correct record to
      tidy a reference that is not broken — the decision stays findable through
      the two surviving records named at
      tactic-retire-assessor-contract-docs:69-72, and the citations keep
      resolving through the pruned classification. Scope discipline here is the
      point: the defect is instructions pointing at content that no longer
      exists, not the mere appearance of a pruned id in prose."
  - question: Why does this node carry no dispatch markers, and why was its done stamp written by hand?
    answer: "Because it was not produced by the dispatch lane. The sweep was
      authored interactively during the 2026-08-28/29 author sitting, in the same
      session that recorded the D1 ruling gating the prune on it, and landed as an
      ordinary branch and PR (#3122) rather than through a worker. The planned and
      qa-done markers are lane artifacts; writing them here would misrepresent how
      the work was produced, so markers is empty by construction rather than by
      omission. The edits are the whole of the node's scope, so nothing remained
      for a worker to implement. PR #3122 merged 2026-08-29 as b36fe3d6, which
      satisfied tactic-align-audit-legacy-review's blocked_by edge, and D1's prune
      ran immediately after as b40bd123. The done stamp was written by hand for
      the same reason the markers are empty. A clean review completion arms
      auto-merge and writes no phase change
      (packages/intentionsutil/src/transitions.ts:224-226), leaving the
      review-to-done write to the tick reconciler — and that reconciler never ran
      here, because the merge happened out of band and dispatch is paused. So
      completion records the merge facts directly and markers stays empty."
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: legacy-review-reference-sweep
  pr: 3122
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-08-29T16:23:51Z
    mergeCommitSha: b36fe3d6618b9e9cfccfa7cdb10f962212ff3b35
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Sweep the load-bearing in-graph references to tactic-align-audit-legacy-review so D1's prune strands nothing

**Recommended model:** opus — the work is almost entirely judgment about which
references are load-bearing and which are dated records that must not be
rewritten. The edits themselves are trivial; deciding which 8 of 38 to touch is
the task, and getting it wrong in either direction is a defect (leave a live
pointer dangling, or falsify a correct historical record).

## Context

The 2026-08-28 author sitting re-authorized D1's prune of
`tactic-align-audit-legacy-review` and ruled that the retained engine content is
not wanted in-graph — it may die with the node, its verbatim source surviving at
`origin/main` commit `44493733`. Attempting the prune surfaced a gate no
document had recorded: the node is cited by 38 prose lines across 12 other
nodes, none of them a structural edge, and the prune would strand every one of
them without CI noticing. This node is that sweep, and the prune target now
carries a structural `blocked_by` edge to it so the gate is machine-checked
rather than a sentence in a plan.

## Why this is not caught by CI

**Corrected 2026-08-29.** An earlier draft of this node said prose references
are unchecked and only structural YAML edges are validated. That is wrong, and
the real mechanism is worse.

`validate-graph` runs `validateGraphProseRefs`
(`packages/intentionsutil/src/schema.ts:1780`), which **does** check every
backticked, id-shaped reference in a node's statement, rationale,
`attention.rationale`, clarification answers and markdown body. It exists
precisely to catch a node naming a sibling id that does not resolve.

It will not catch this prune, because a pruned id is **deliberately exempted**.
The check classifies each reference with `classifyRef(ref, storeIds, deleted)`
and skips anything that is not `missing`; `deleted` comes from
`deletedNodeIds()` (`packages/intentionsutil/scripts/lib-deleted-node-ids.ts`),
which shells out to `git log --diff-filter=D -- intentions/` and so contains
every id whose file was ever deleted. The moment the prune commit lands, the id
joins that set and all 38 references classify as `pruned` rather than
`missing`.

That exemption is correct in general — pruning a node should not break every
node that ever cited it, and `tactic-retire-assessor-contract-docs` relies on
exactly this property. But it means **no tooling change would catch this
particular loss**, and the check being green after the prune says nothing about
whether the references still make sense. A human sweep is the only remedy,
which is why the prune is gated on this node rather than run alongside it.

Structural edges are separately irrelevant here: measured 2026-08-29, a grep
for `^  - tactic-align-audit-legacy-review$` across `intentions/` returns zero
hits, so there is no structural edge to break either.

## Measured residue, 2026-08-29

38 reference lines across 12 nodes, up from 28 across 11 when the sitting first
measured it on 2026-08-28 — the residue grows while the prune waits.

| Node | Refs | Kind |
| --- | --- | --- |
| `tactic-retire-assessor-contract-docs` | 10 | provenance + guard prose; one wrong line |
| `tactic-align-entrypoint-consolidation` | 6 | **five live content pointers** |
| `strategy-explicit-intent` | 5 | stale framing |
| `tactic-condition-review-sweep` | 4 | stale framing |
| `tactic-node-ancestry-context` | 2 | stale framing |
| `tactic-align-audit-skill` | 2 | stale framing |
| `strategy-graph-review-curriculum` | 2 | stale framing |
| `strategy-graph-native-dispatch` | 2 | stale framing |
| `strategy-discovered-requirements` | 2 | stale framing |
| `tactic-validate-graph-ordering-inversion-lint` | 1 | stale framing |
| `tactic-graph-read-at-ref-cli` | 1 | stale framing |
| `tactic-graph-native-dispatch` | 1 | stale framing |

## Scope — the 8 load-bearing sites, not all 38

Triaging the 38 on 2026-08-29 split them three ways, and only one group is
load-bearing. **Blanket-rewriting all 38 would be wrong**: most are dated
records of what was decided at a sitting, and editing those to read as though
they had always been correct falsifies the record this graph exists to keep.

**Fix (8 sites, 4 files)** — prose that is false in the present tense, or that
sends a reader to the node for content:

1. `tactic-align-entrypoint-consolidation:99` — content pointer ("both engines'
   content is retained verbatim in ..."). Repoint at commit `44493733`.
2. `tactic-align-entrypoint-consolidation:176` — content pointer for the
   improvement pass. Repoint at `44493733`.
3. `tactic-align-entrypoint-consolidation` Unit 5 — add a supersession banner:
   the unit shipped, and `tactic-retire-assessor-contract-docs` now deletes the
   very files it chose to retain.
4. `tactic-align-entrypoint-consolidation:279` — a rewrite directive aiming the
   two docs at the node. Aim it at `44493733` instead.
5. `tactic-align-entrypoint-consolidation:291` — states the node "is a live plan
   for a future `/align-audit` that will re-consume this exact contract", and
   makes that the reason to retain four files. The premise is false; record the
   refutation rather than silently deleting the recommendation.
6. `tactic-align-audit-skill:149-153` — body prose describing the inclusion
   decision as pending and owned by a born-parked sitting. The same false
   framing was copied into `.claude/skills/align-audit/SKILL.md`, and
   `tactic-retire-assessor-contract-docs:185-199` quotes *that* copy and says
   "Every clause of that is now false" — the node body is the twin it did not
   cover, since that tactic's scope is the skill file. Rewrite it as settled.
7. `tactic-graph-native-dispatch:190` — content pointer, present tense.
   Repoint at `44493733`.
8. `tactic-retire-assessor-contract-docs:47` — narrates the prune as already
   performed. Correct it, and note at :145 that the prune now carries a
   structural `blocked_by` edge to this node.

**Leave (the remaining 30)** — dated provenance naming the sitting as an event
("resolved 2026-07-23 at the `tactic-align-audit-legacy-review` office-hours
sitting"), and superseded premises that the *same node's* later clarification
already corrects in sequence. These stay accurate as history, keep resolving
after the prune via the `pruned` classification above, and the decision itself
remains findable: `tactic-retire-assessor-contract-docs:69-72` names its two
surviving records. Rewriting them would destroy a correct record to tidy a
reference that is not broken. This applies to `strategy-explicit-intent` (5),
`tactic-condition-review-sweep` (4), `tactic-node-ancestry-context` (2),
`strategy-graph-review-curriculum` (2), `strategy-graph-native-dispatch` (2),
`strategy-discovered-requirements` (2), `tactic-validate-graph-ordering-inversion-lint` (1),
`tactic-graph-read-at-ref-cli` (1), `tactic-align-audit-skill:26` (1), and
`tactic-align-entrypoint-consolidation:123` (1).

**Not ours (3 sites outside `intentions/`)** — `.claude/docs/delegability.md:11`,
`.claude/docs/signal-identification.md:11` and
`.claude/skills/align-audit/SKILL.md:332`. No prose check covers these at all.
All three belong to `tactic-retire-assessor-contract-docs` (`phase: implement`),
which deletes the two docs outright and carries a `verify` fence asserting the
id is gone from the skill. Do not touch them here — that tactic is in flight,
and `.claude/skills/**` edits are denied under dispatch auto mode anyway.

Line numbers are as measured on `origin/main` 2026-08-29 and will drift; match
on the surrounding text, not the anchor.

## Out of scope

The prune itself. This tactic clears the way; D1's prune runs after it ships,
as a separate change. The file-tree residue is likewise out of scope — that is
`tactic-retire-assessor-contract-docs`, already at phase implement.

## Verification

The graph must stay clean, and the load-bearing pointers must name the commit
rather than the node:

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Both surviving content pointers in `tactic-align-entrypoint-consolidation` must
cite the commit that actually holds the engines:

```verify
grep -c "44493733" intentions/tactic-align-entrypoint-consolidation.md
```

Judgment checks, which no fence can carry. Re-read each of the 8 fixed sites and
confirm it reads correctly to someone who never saw the node — a reader must be
able to reach the engine source without it. Then re-read a sample of the 30 left
alone and confirm each is still a dated record of a past decision rather than a
present-tense claim; if any reads as a live instruction, it belongs in the fixed
group instead.

Note that `validate-graph` passing after D1's prune proves nothing about this
sweep: a pruned id is deliberately exempted from the prose check (see "Why this
is not caught by CI"), so the check is green either way. The verification that
matters here is the reading, not the fence.
