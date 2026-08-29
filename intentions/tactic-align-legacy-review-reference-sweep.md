---
id: tactic-align-legacy-review-reference-sweep
kind: tactic
statement: "Sweep the 38 in-graph references to tactic-align-audit-legacy-review
  across 12 nodes — repoint the five live content pointers at commit 44493733,
  correct the stale-framing references — so D1's prune strands nothing"
owner: ai
status: raw
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
# Sweep the 38 in-graph references to tactic-align-audit-legacy-review so D1's prune strands nothing

## Why this is not caught by CI

Only structural YAML edges — a node id as a `  - <id>` list entry under
`serves`, `blocked_by`, `validates` or `recovers` — are what `validate-graph`
checks. Every one of the 38 citations is prose: a backticked mention inside a
`rationale`, a `clarifications` answer, or a body paragraph. Measured
2026-08-29, a grep for `^  - tactic-align-audit-legacy-review$` across
`intentions/` returns zero hits.

So `graph-commit --prune` on that node deletes the file outright, every check
passes, and twelve nodes are left citing something that no longer exists. The
failure is silent by construction, which is why the prune is gated on this
sweep rather than run alongside it.

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

## Scope

1. Rewrite `tactic-align-entrypoint-consolidation:291` — it instructs preserving
   the content on a premise the 2026-07-23 sitting overturned.
2. Repoint `tactic-align-entrypoint-consolidation` lines 99, 176, 279 and 349 at
   commit `44493733` rather than at the node.
3. Correct `tactic-retire-assessor-contract-docs:47`, which narrates the prune
   as already performed.
4. Correct the stale-framing references so they describe the inclusion decision
   as settled 2026-07-23, not pending.

Line numbers are as measured on `origin/main` 2026-08-29 and will drift; match
on the surrounding text, not the anchor.

## Out of scope

The prune itself. This tactic clears the way; D1's prune runs after it ships,
as a separate change. The file-tree residue is likewise out of scope — that is
`tactic-retire-assessor-contract-docs`, already at phase implement.
