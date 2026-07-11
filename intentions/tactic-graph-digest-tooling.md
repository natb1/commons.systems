---
id: tactic-graph-digest-tooling
kind: tactic
statement: graph-digest.ts — read-only, token-bounded digest of the whole graph
  (per-node summary lines plus derived check tables) as the first-read surface
  for /align-audit and the align skills' corpus sweeps
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy graph-integrity round
  (the author's point 2: tooling that minimizes token usage for whole-graph
  analysis); prototyped ad-hoc that session — a 57KB digest with ~15KB of
  derived check tables covered a 302-node/1.37MB graph — and the prototype's
  misfires fixed the spec's extractor requirements. Finalized and planned by the
  2026-07-11 /align-tactics round as the round's instrument tactic: the
  strategy's reading is null and /align-audit (tactic-align-audit-skill, blocked
  on this node) cannot run token-bounded without it. Partially absorbs
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
phase: implement
execution:
  branch: tactic-graph-digest-tooling
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: ba2a6baf40da43d7217194977f7ecd4dbba424a343251236340d524b05479917
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-digest.ts — read-only, token-bounded digest of the whole graph (per-node summary lines plus derived check tables) as the first-read surface for /align-audit and the align skills' corpus sweeps

One PR. On the round's signal path: `tactic-align-audit-skill` (the round's
validates-terminal) is `blocked_by` this node — the audit cannot run
token-bounded without the digest. Planned 2026-07-11 /align-tactics round.

## Context

strategy-graph-integrity's success signal is the recurring /align-audit
report, and its token-bounded condition requires digest-first reading: the
audit must never re-read the whole graph as text. At 2026-07-11 the graph is
319 nodes / ~1.5MB under `intentions/`. A 2026-07-09 ad-hoc prototype
(throwaway, never committed; this plan supersedes it) produced a 57KB digest
with ~15KB of derived check tables that carried the entire mechanical portion
of an emulated audit — this tactic lands the committed, tested version.
Read-only; built on the intentionsutil package's own loaders, never a
parallel parser.

Coordination: `tactic-align-tactics-mechanical-floor` (parked 2026-07-09,
serving strategy-graph-native-dispatch) plans child-tactic and strategy-corpus
census scripts in its Units 2–5; this digest partially absorbs its Unit 4
strategy-corpus census. Before implementing, check
`packages/intentionsutil/scripts/` for census scripts landed since this plan
was written and reuse their enumeration rather than duplicating it. Other
consumers once landed: /align-strategy's corpus sweep and /align-tactics'
drift review delegate their hand-rolled greps to the digest by pointer.

## Unit 1 — digest module with derived check tables

**Recommended model:** opus

**Scope:** new pure module `packages/intentionsutil/src/digest.ts` plus tests
in `packages/intentionsutil/test/digest.test.ts`. Pure functions over inputs
the CLI gathers (no fs/git/network inside the module): `IntentionNode[]`
(from `listNodes`), a map of node id → raw markdown body (from
`readNodeBody`), a map of node id → raw file text (for STORED-DEFAULTS), and
a list of ids deleted from git history (for DANGLING-REFS pruned
classification).

Section 1 — per-node digest lines, one per node, id-sorted: id, kind, status,
parent, serves, phase, clarification count + latest recorded date (max
`YYYY-MM-DD` match across clarification answers), condition count
(`attributes.conditions` length), signal presence (direct / proxy / none via
`success_signal.is_proxy`), body byte length.

Section 2 — derived check tables:

- `VALIDATE`: run `validateGraph` (packages/intentionsutil/src/schema.ts)
  catching `IntentionSchemaError`; emit pass or the failure message.
- `CLOSURE`: every strategy and tactic whose motivation chain — `serves`
  entries plus the `parent` chain, walked transitively with a cycle guard —
  never reaches a `kind: virtue` node. Reuse the memoized-DFS pattern of
  `computeSignalPath` (packages/intentionsutil/src/attention.ts:130). An
  empty-serves strategy whose parent chain reaches a virtue root is NOT a
  failure (the sub-strategy inheritance case).
- `DONE-PRESENT`: tactics at `phase: done` still present in the store (prune
  lifecycle leaks).
- `DUP-SERVES`: any node re-declaring an entry of its direct parent's
  `serves` — partial overlaps included, strategy AND tactic layers (the
  extended inheritance rule ratified 2026-07-09 on strategy-graph-integrity).
  Emit node id plus only the redundant entries.
- `NEAR-DUP-STATEMENTS`: statement pairs with token-Jaccard similarity above
  a threshold (start at 0.6; tune so the known benign pair
  tactic-review-lows-finance / tactic-review-lows-publishing appears — the
  table is a shortlist, never a disposition; parallel per-strategy sweep
  families are a known benign pattern).
- `DANGLING-REFS`: node-id references in prose bodies classified live /
  pruned / missing. Extractor requirements (learned from the prototype's
  misfires): match only backtick-quoted ids or ids in the known vocabulary
  (union of current store ids and the deleted-ids input) — never a bare
  kind-prefix regex over prose, which over-matches compounds like
  `tactic-only` and `strategy-id`; a family wildcard reference
  (`tactic-recovery-drill-*`) resolves against its member nodes, not as a
  bare id. live = resolves in the store; pruned = in the deleted-ids input;
  missing = neither — annotate each missing id with whether any open
  (non-done) tactic's statement or body mentions it (the planned-reference
  heuristic of the three-class convention recorded on
  strategy-graph-integrity; the planned-vs-violation judgment stays with the
  audit).
- `STORED-DEFAULTS`: per node, the count of serialized frontmatter keys whose
  value equals the schema default (`[]`, `null`, `false`, `{}`) — parse the
  raw file text's frontmatter with the same YAML library store.ts uses.
  Structure-parsimony signal only; remediation owned by
  tactic-omit-default-serialization / strategy-graph-self-description.

Output budget: Section 2 ≤ 25KB at current graph size (assert
order-of-magnitude in a test against a synthetic store, not a brittle byte
count).

**Out of scope:** any write path; storing derived values on nodes (violates
strategy-graph-self-description's derived-never-stored doctrine).

## Unit 2 — CLI wrapper

**Recommended model:** sonnet

**Dependencies:** Unit 1.

**Scope:** new script `packages/intentionsutil/scripts/graph-digest.ts`
following the conventions of
`packages/intentionsutil/scripts/frontier-view.ts` (repo root resolved from
the script file's own location, never cwd; deterministic output; reads only
the local store, writes only stdout; usage header comment matching the
sibling scripts). The CLI gathers the module's inputs — `listNodes` +
`readNodeBody`, raw file texts, and deleted ids via
`git log --diff-filter=D --name-only -- intentions/` (shelled from the CLI;
the module stays pure). Flags: default emits both sections; `--tables-only`
emits Section 2 only, so an audit session can skip the per-node section
entirely.

## Reuse

- `listNodes` / `readNode` / `readNodeBody` —
  packages/intentionsutil/src/store.ts:137 / :110 / :123
- `validateGraph`, `IntentionSchemaError` —
  packages/intentionsutil/src/schema.ts
- memoized chain-walk pattern — `computeSignalPath`,
  packages/intentionsutil/src/attention.ts:130
- script conventions (path resolution, determinism, usage header) —
  packages/intentionsutil/scripts/frontier-view.ts:16-27 and
  packages/intentionsutil/scripts/validate-graph.ts

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

Manual: run
`node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only`
against the live store; confirm the tables reproduce the shape of the
2026-07-09 emulated-audit findings (a DUP-SERVES list in the dozens,
DONE-PRESENT non-empty, DANGLING-REFS classifying without compound false
positives like `tactic-only`) and Section 2 stays ≤ 25KB.
