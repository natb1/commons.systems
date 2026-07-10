---
id: tactic-graph-digest-tooling
kind: tactic
statement: graph-digest.ts — read-only, token-bounded digest of the whole graph
  (per-node summary lines plus derived check tables) as the first-read surface
  for /align-audit and the align skills' corpus sweeps
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy graph-integrity round
  (the author's point 2: tooling that minimizes token usage for whole-graph
  analysis). Prototyped ad-hoc in that session: a 57KB digest with ~15KB of
  derived check tables covered a 1.37MB, 302-node graph, and the prototype's
  misfires fixed the spec's extractor requirements. Partially absorbs
  tactic-align-tactics-mechanical-floor Unit 4's strategy-corpus census —
  coordinate rather than duplicate."
reading: null
gap: null
serves:
  - strategy-graph-integrity
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
# graph-digest.ts — read-only, token-bounded digest of the whole graph (per-node summary lines plus derived check tables) as the first-read surface for /align-audit and the align skills' corpus sweeps

Retained draft from the 2026-07-09 /align-strategy graph-integrity round —
input to a future /align-tactics pass; not yet a plan.

## Context

The author's point 2 for strategy-graph-integrity: the recurring /align-audit
evaluation must not re-read the whole graph as text. At 2026-07-09 the graph is
302 nodes / 1.37MB; the session's ad-hoc prototype produced a 57KB digest
(~15KB of derived check tables) that carried the entire mechanical portion of
the emulated audit. The audit reads the digest first and opens full node
bodies only where a table flags them (strategy-graph-integrity's token-bounded
condition).

## Spec (draft)

Placement: `packages/intentionsutil/scripts/graph-digest.ts`, read-only,
built on `listNodes`/`validateGraph` from the package — never a parallel
parser.

**Section 1 — per-node digest lines**, one line per node: id, kind, status,
parent, serves, phase, clarification count + latest recorded date, condition
count, signal presence (direct/proxy/none), body byte length.

**Section 2 — derived check tables:**
- `VALIDATE`: validateGraph rules 1–15 result.
- `CLOSURE`: strategies/tactics whose motivation chain (serves + parent,
  cycle-guarded) fails to reach a virtue root.
- `DONE-PRESENT`: tactics at `phase: done` still present (prune lifecycle
  leaks).
- `DUP-SERVES`: any child re-declaring an entry of its parent's serves —
  partial overlaps included, strategy AND tactic layers (the extended
  inheritance rule, ratified 2026-07-09 on strategy-graph-integrity).
- `NEAR-DUP STATEMENTS`: token-Jaccard pairs above threshold (parsimony
  shortlist only — disposition needs judgment; parallel per-strategy sweep
  families are a known benign pattern).
- `DANGLING REFS`: node-id references in prose classified live / planned /
  pruned / never-created per the three-class convention recorded on
  strategy-graph-integrity. Extractor requirements learned from the
  prototype's misfires: match only backtick-quoted ids or ids from the known
  vocabulary (union of current ids and git-history ids), never bare regex over
  prose — compounds like 'tactic-only' and 'strategy-id' are not references;
  a family wildcard (`tactic-recovery-drill-*`) resolves against its member
  nodes, not as a bare id. Pruned classification derives from
  `git log --diff-filter=D` over `intentions/`.
- `STORED-DEFAULTS`: count of default-valued serialized fields per node
  (structure-parsimony signal; remediation owned by
  tactic-omit-default-serialization / strategy-graph-self-description).

Output budget: ≤ 25KB for the derived tables at current graph size; per-node
section may be requested separately (`--tables-only` flag) so an audit session
can skip it entirely.

Consumers: /align-audit (tactic-align-audit-skill); /align-strategy's
improvement-pass corpus sweep and /align-tactics' drift review delegate their
hand-rolled greps to the digest by pointer once it lands. Coordinate with
tactic-align-tactics-mechanical-floor Unit 4 (strategy-corpus census script):
this digest partially absorbs that unit — reconcile scope at planning time
rather than shipping two census tools.

Prototype: the session's throwaway implementation lived in the job tmp
directory and is not committed; this spec supersedes it.

Out of scope: any write path; storing derived values on nodes (violates
strategy-graph-self-description's derived-never-stored doctrine).
