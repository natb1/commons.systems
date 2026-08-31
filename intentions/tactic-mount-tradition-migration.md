---
id: tactic-mount-tradition-migration
kind: tactic
statement: Mount the traditions — transpose adopted/diverged prose lists into
  mounted structure under each tradition anchor
owner: ai
status: codified
parent: null
rationale: "Round-1 threshold work: the strategy's threshold requires every
  tradition with adopted entries to carry mounted structure — all six tradition
  records qualify. Transposition of the human-authored
  adopted/diverged/chosen_over prose only; ratified at
  tactic-mount-owner-review. Split from the delegation migration to keep each
  leaf exactly one PR."
reading: null
gap: null
serves:
  - strategy-graph-mounts
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-mount-tradition-migration
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 04aa02adec88a3145460aa90242ca47578f633087667aba014c921593e28d1b3
validates:
  - strategy-graph-mounts
blocked_by:
  - tactic-mount-schema
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Mount the traditions — transpose adopted/diverged prose lists into mounted structure under each tradition anchor

## Context

strategy-graph-mounts' success threshold requires every tradition with
adopted entries to carry mounted structure, not only prose lists. All six
tradition records qualify: `intentions/tradition-aristotle.md` (9 adopted
entries), `tradition-plato.md` (5), `tradition-kant.md` (4),
`tradition-augustine.md` (3), `tradition-stoicism.md` (2),
`tradition-utilitarianism.md` (1). Adopting a tradition grafts its vocabulary
and problem-framings onto the graph — this tactic makes that graft
traversable. **Transposition only** (strategy condition 1 plus the 2026-07-11
round clarification): the adopted/diverged/chosen_over entries are already
human-authored; invent no claims beyond them, list thin-prose gaps for the
author, and record every judgment call in the PR description for
tactic-mount-owner-review to walk.

Depends on tactic-mount-schema (the `mount`/`grafts` fields, the `duty`
kind, `mount_anchor` on kind-tradition, validateGraph rules 16-18, naming
convention).

## Unit 1 — mounted doctrine nodes and graft edges

**Recommended model:** opus

Scope:
- Per tradition record, each `attributes.adopted` entry becomes a mounted
  node: `mount: tradition-<id>`, native kind by judgment — `strategy` for
  practices and framings (e.g. premeditatio malorum), `virtue` for held
  goods, `duty` for obligation-shaped doctrine (expected on
  tradition-kant) — with `statement` carrying the doctrine, `rationale`
  carrying the entry's source-text citation, `owner: human`,
  `status: refining`, and `attributes.disposition: adopted`. Ids per the
  `<kind>-<counterparty>-<slug>` convention (e.g.
  `strategy-stoicism-premeditatio-malorum`).
- Each `diverged` entry likewise becomes a mounted node with
  `attributes.disposition: diverged` and the recorded "why" in `rationale`.
  A diverged doctrine carries **no** graft edge — refusal is the absence of
  grafted motivation, made auditable by the node's existence.
- Graft edges: where an adopted entry names its graph locus (most do, e.g.
  stoicism's "premeditatio malorum → the recovery drills
  (strategy-exercise-recovery-paths, tactic-recovery-drill-*)"), the named
  native **strategy** gains `grafts: [<mounted-id>]`; a locus naming a tactic
  family grafts on the tactics' owning strategy instead. An entry whose locus
  is missing or unresolvable gets no invented edge — it goes on the
  ratification list.
- `chosen_over` entries stay prose this round; where one names a doctrine
  mounted here, cross-reference it in the mounted node's `rationale`.
- Keep the adopted/diverged prose lists in place this round; deleting prose
  is the owner review's call.
- Every frontmatter write goes through
  `packages/intentionsutil/scripts/write-node.ts` — never hand-edit YAML.

Out of scope: delegation records (tactic-mount-delegation-migration), the
tradition-reading curriculum machinery, any change to
adopted/diverged/chosen_over prose, rendering.

## Reuse

- `packages/intentionsutil/scripts/write-node.ts`.
- Mounted-node conventions and validateGraph rules from tactic-mount-schema.
- kind-tradition.md's documented adopted-entry shape ("doctrine, source text,
  graph locus") as the parse guide.

## Verification

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts || exit 1
npm test --prefix packages/intentionsutil
```

Manual: every tradition record has mounted structure attributed to it; every
adopted entry with a resolvable locus has a graft edge from that locus's
strategy; diverged nodes exist with no graft edge; the PR description carries
the ratification list.

## Implementation notes

One unit, one PR; run it in a subagent with the Recommended model; supply
this Context and the Scope; constrain the subagent to working-tree edits
only.
