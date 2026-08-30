---
id: tactic-mount-delegation-migration
kind: tactic
statement: Mount the high-divergence delegations — transpose divergence.imported
  prose into mounted nodes and graft edges, including the canonical
  strategy-financial-sustainability growth graft
owner: ai
status: codified
parent: null
rationale: "Round-1 threshold work: the strategy's threshold requires every
  high-divergence delegation record to carry mounted structure, and the
  canonical query (strategy-financial-sustainability surfaces the grafted
  commercial growth virtue) to answer from graph structure alone. Transposition
  of the human-authored divergence.imported prose only — condition 1 plus the
  round clarification make agent work here drafting, ratified at
  tactic-mount-owner-review."
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
  branch: tactic-mount-delegation-migration
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
# Mount the high-divergence delegations — transpose divergence.imported prose into mounted nodes and graft edges, including the canonical strategy-financial-sustainability growth graft

## Context

strategy-graph-mounts' success threshold requires (a) every high-divergence
delegation record to carry mounted structure, not only prose lists, and (b)
the canonical query — strategy-financial-sustainability surfaces the grafted
commercial growth virtue — to answer from graph structure alone. This tactic
transposes the existing, already-human-authored `divergence.imported` prose
into mounted nodes and graft edges. **Transposition only** (strategy
condition 1 plus the 2026-07-11 round clarification): invent no claims beyond
the recorded prose; where the prose is too thin to model a node, list the gap
for the author instead of filling it. The author ratifies or amends every
mount at tactic-mount-owner-review — record every judgment call and gap in
the PR description for that review to walk.

In-scope records:
- The four `level: high` delegations —
  `intentions/delegation-attention-services.md` (imported: engagement
  maximization, advertising revenue, institutional growth as a virtue),
  `intentions/delegation-finance-saas.md`,
  `intentions/delegation-social-publishing.md`,
  `intentions/delegation-communications.md`.
- `intentions/delegation-anthropic-claude.md` (level: low-moderate) — in
  scope solely for the canonical growth graft: its imported list carries
  "promote the vendor's growth via spend"
  (intentions/delegation-anthropic-claude.md:47), the capture
  strategy-recover-finance's rationale records
  (intentions/strategy-recover-finance.md:21) and the strategy's canonical
  query names. Its other imported entries are out of scope this round.

Depends on tactic-mount-schema (the `mount`/`grafts` fields, the `duty` kind,
the `mount_anchor` kind attribute, validateGraph rules 16-18, and the
mounted-id naming convention `<kind>-<counterparty>-<slug>`).

## Unit 1 — mounted nodes and graft edges

**Recommended model:** opus

Scope:
- For each in-scope record, each in-scope `divergence.imported` entry becomes
  a mounted node: `mount: <record-id>`, native kind by judgment — `virtue`
  where the prose names a held good of the counterparty ("institutional
  growth as a virtue", "engagement maximization"), `strategy` where it
  describes an operating aim; record the classification reasoning in the
  mounted node's `rationale`. Id per the naming convention (e.g.
  `virtue-attention-services-growth`,
  `virtue-anthropic-claude-growth`). Mounted nodes carry `owner: human` (the
  author's model), `status: refining` (ratification pending at
  tactic-mount-owner-review), `statement` quoting or closely paraphrasing the
  prose entry, and internal `serves` edges only where the record's prose
  itself relates the entries.
- Graft edges: set `grafts` on the native node **only where existing prose
  records that the native node partly holds the imported virtue**. Required:
  `strategy-financial-sustainability` gains
  `grafts: [virtue-anthropic-claude-growth]` (the growth-via-spend capture —
  the canonical query's edge). Other candidate edges (e.g. from the
  contradictions/rationale prose on delegation-attention-services) land only
  with prose support; otherwise the mounted node stands anchored without a
  graft edge and the missing-edge question goes on the ratification list.
- Keep the `divergence.imported` prose lists in place this round — the
  strategy migrates prose into structure over time (clarification 5);
  deleting the prose is the owner review's call, not this PR's.
- Every frontmatter write (new mounted nodes, `grafts` on native strategies)
  goes through `packages/intentionsutil/scripts/write-node.ts` — never
  hand-edit YAML.

Out of scope: tradition records (tactic-mount-tradition-migration), duty
content, person mounts, any change to hand-assessed divergence fields, any
rendering.

## Reuse

- `packages/intentionsutil/scripts/write-node.ts` (single validation gate).
- The mounted-node conventions and validateGraph rules from
  tactic-mount-schema — run validate-graph rather than re-deriving rules.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts || exit 1
npm test --prefix packages/intentionsutil
```

Manual: the canonical query answers from structure —
`strategy-financial-sustainability`'s `grafts` resolves to a mounted growth
virtue anchored on delegation-anthropic-claude; each of the four high-
divergence records has at least one mounted node attributed to it; the PR
description carries the judgment-call/gap list for tactic-mount-owner-review.

## Implementation notes

One unit, one PR; run it in a subagent with the Recommended model; supply
this Context and the Scope; constrain the subagent to working-tree edits
only.
