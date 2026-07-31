---
id: tactic-attention-boost-scripts
kind: tactic
statement: Script the author's attention-write operations — boost-to-top-rank
  (now) and tier-change (gated on the tier model) — each a considered act
  requiring a rationale, with the tier-change re-selecting a fresh boost in the
  target tier's per-tier namespace
owner: ai
status: raw
parent: null
rationale: Surfaced 2026-07-21 /align-strategy interview. Today 'escalating an
  issue means authoring a boost on its tactic node' is a hand-edit; the author
  wants it scripted. Retained as a draft for /align-tactics to decompose and
  finalize; not selectable work yet.
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
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
pace_exempt: true
rounds: null
attributes: {}
---
# Script the author's attention-write operations

Retained draft (2026-07-21 `/align-strategy` interview). `/align-tactics` owns
decomposition, edge-authoring, and the final plan — the units below are the
byproduct's shape, not a finalized breakdown.

## Motivation

Today "escalating an issue means authoring a boost on its tactic node"
(`strategy-graph-drives-dispatch`) is a hand-edit of `attention.boost` in the
node frontmatter, verified by hand against the selector
(memory-practice `graph-boost-top-rank-verify-via-selector`). The author wants
this as a first-class scripted operation a session runs on request. The three
governing clarifications recorded this round on `strategy-graph-drives-dispatch`
are the contract:

- **considered boost, mandatory rationale** — minimal boost to top the tier,
  show current ranks, require an author `rationale`; not a mechanical
  max+epsilon;
- **per-tier boost namespace** — boost values are tier-scoped; a tier change
  never carries the old value (author-directed, mechanical guarantee);
- **tier change is a distinct operation** — never inferred from a boost request.

## Units (indicative; `/align-tactics` finalizes)

- **Unit 1 — boost-to-top-rank script (buildable now, ungated).** A script a
  session invokes on author request. Reads the resolved ranks the selector uses
  (`resolveAttention` + `selectGraphTargets` / `check-node-selection.ts`,
  `packages/intentionsutil`), computes the MINIMAL `attention.boost` that tops
  the node's current ranking scale, prints the current ranking for the author,
  requires an author-supplied `rationale`, writes the whole node via
  `write-node.ts`, lands via `graph-commit`, and verifies the node now sorts
  top via the selector. Pre-tier there is one ranking scale, so "top of tier"
  is "top of the resolved-rank scale". `blocked_by`: none.
- **Unit 2 — tier-aware default (gated on `tactic-attention-tier-ranking`).**
  Once tiers land, Unit 1's script defaults to top-of-**current-tier** and
  never changes the node's tier. Computes the minimal boost against the node's
  own tier's per-tier boost namespace. `blocked_by`: `tactic-attention-tier-ranking`.
- **Unit 3 — tier-change script (gated on `tactic-attention-tier-ranking`).**
  A distinct script, run only on an explicit tier-change request. Sets
  `attributes.tier` (or the semantic `bug_fix`/`security` marks) and selects a
  FRESH boost in the target tier's per-tier namespace — the old tier's value is
  never carried (per the per-tier-namespace clarification). Precedent:
  `strategy-main-health`'s boost-100 → tier-3 migration (the must-land-first
  change inside `tactic-attention-tier-ranking`) drops a large boost rather than
  carrying it. `blocked_by`: `tactic-attention-tier-ranking`.

## Coordination notes

- The per-tier boost namespace is a schema/semantics change owned by
  `tactic-attention-tier-ranking` (the `attention` field's `Attention` interface
  in `packages/intentionsutil/src/schema.ts`, plus `validate-graph` shape
  checks). Units 2–3 consume it; they do not define it. That tactic carries a
  dated pointer note to this round's clarifications.
- **Open design consideration (owned by `tactic-attention-tier-ranking`, not
  resolved here):** how a per-tier boost composes with the recorded downward
  flow of authored boosts along `parent`/`serves` (the 2026-07-07 / 2026-07-13
  flow clarifications on `strategy-graph-drives-dispatch`).
