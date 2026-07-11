---
id: tactic-grounding-gap-analysis
kind: tactic
statement: Grounding gap analysis — tick-runnable sensor ranking unmarked
  durable-layer nodes by deference/capture exposure
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-10 /align-tactics round from the 2026-07-07
  /align-strategy draft: the round's instrument tactic —
  strategy-complete-grounding has a null reading, so the round must first buy
  the sensor its success signal names (worker gap analysis at tick; the
  strategy's sensor tooling goal). The draft's second half (workers drafting
  candidate chunks from the report) is deliberately not part of this leaf:
  worker chunk-drafting is already authorized as tick-lane behavior by strategy
  clarification 4, and its concrete decomposition belongs to the round after the
  first reading exists, when the report says which nodes are owed chunks."
reading: null
gap: null
serves:
  - strategy-complete-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-grounding-gap-analysis
  pr: 2816
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: 1bcaff9037314f477f00aab1cf86a4cd27a4dfab2d7bed79106123a60a5a6efb
validates:
  - strategy-complete-grounding
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Grounding gap analysis — tick-runnable sensor ranking unmarked durable-layer nodes by deference/capture exposure

## Context

`strategy-complete-grounding`'s success signal is "the tick gap analysis
reports zero unmarked durable-layer nodes"; its sensor is "worker gap analysis
at tick"; its `reading` is null — the strategy cannot be measured until this
instrument exists. This tactic builds the sensor and produces the strategy's
first reading; it is the round's validates-terminal.

The marking convention (strategy clarifications 1 and 5; kind-tradition's
grounding clarification):

- Durable layer = nodes with `kind` `virtue`, `strategy`, `kind`, or
  `delegation`. Tactics are exempt (they inherit grounding through the
  strategy they serve); `tradition-*` records are the grounding itself, not
  audited nodes.
- A durable-layer node is **marked** when its `attributes` carry `traditions`
  (a list of `tradition-*` ids — shape:
  `intentions/virtue-philosophical-mobility.md` `attributes.traditions`) or
  `grounding` (a string: `"circumstantial: <why>"` or
  `"none-found: <date>"`). Unmarked = neither — that is the gap this sensor
  reports.
- Workers may compute and refresh this analysis at tick and consume its
  ranking; they never write `attributes.traditions`/`attributes.grounding`
  marks (strategy clarification 4 — marks are author-side).

## Units of work

### Unit 1 — ranking library + script

**Scope.** Two new files: `packages/intentionsutil/src/grounding.ts` (pure
functions over `IntentionNode[]`) and
`packages/intentionsutil/scripts/grounding-gap.ts` (CLI in the pattern of
`packages/intentionsutil/scripts/validate-graph.ts` — optional intentions-dir
argument defaulting to `intentions`, loaded with `listNodes` at
`packages/intentionsutil/src/store.ts:124`). No changes to `schema.ts`,
`store.ts`, or the router.

Behavior:

- Enumerate durable-layer nodes: `node.kind` in
  `{virtue, strategy, kind, delegation}`.
- Partition marked vs unmarked per the Context convention (`attributes` is a
  free-form map; check for own-property `traditions` / `grounding`).
- Rank unmarked nodes by deference/capture exposure, descending:
  1. **Delegation nodes** score from their own record:
     `attributes.divergence.level` (parse the leading token of the free-text
     level: high > moderate > low-moderate > low) and
     `attributes.irreversibility.gated` (a string beginning `true` outranks
     one beginning `false`) — shape:
     `intentions/delegation-anthropic-claude.md` `attributes`.
  2. **Non-delegation nodes** score by recovers-proximity: BFS hop distance
     over `serves`/`recovers` edges (traversed in either direction) to the
     nearest delegation node — fewer hops = higher exposure, inheriting that
     delegation's own score as the base.
  3. Tie-breaks at equal exposure: `virtue` outranks `kind` outranks
     `strategy` ("virtue roots outrank strategies at equal exposure" —
     2026-07-07 interview, retained draft); then id ascending for
     determinism.
- Output (stdout): default human-readable — a summary header (durable-layer
  total, marked-by-traditions, marked-by-grounding, unmarked count), then one
  ranked line per unmarked node: rank, kind, id, exposure factors. A `--json`
  flag emits the same as one JSON object for tooling.
- Exit 0 always — this is a sensor, not a gate (a reported gap is the
  expected initial state, not an error).

Exact exposure weights are implementation judgment; the three ordering
guarantees above (delegation-divergence dominance, recovers-proximity,
virtue-over-strategy tie-break) are fixed and test-pinned in Unit 2.

**Recommended model**: opus

### Unit 2 — tests

**Scope.** One new file: `packages/intentionsutil/test/grounding.test.ts`
(vitest, fixture style of `packages/intentionsutil/test/attention.test.ts`).
Pin at minimum: (a) `tactic` and `tradition` kinds never appear in the
report; (b) a node with `attributes.traditions` or `attributes.grounding` is
excluded; (c) an unmarked delegation with divergence level `high` ranks above
one with `low`; (d) an unmarked virtue that recovers-chains to a delegation
ranks above an unmarked strategy at equal proximity; (e) order is
deterministic (id tie-break); (f) `--json` output parses and its counts match
the fixture.

**Dependencies**: Unit 1.
**Recommended model**: sonnet

### Unit 3 — first reading

**Scope.** Graph write only (no code change): run
`npx tsx packages/intentionsutil/scripts/grounding-gap.ts` over `intentions/`,
then stamp `strategy-complete-grounding`'s frontmatter — `reading` = one line
`"gap analysis <YYYY-MM-DD>: <N> unmarked durable-layer nodes of <M>; top
exposure: <first three ids>"` and refresh `gap` with a one-sentence ranked
summary. Write via
`npx tsx packages/intentionsutil/scripts/write-node.ts --file <json>` on a
readNode-dumped, jq-patched JSON (never hand-edit YAML) and land via
`packages/intentionsutil/scripts/graph-commit strategy-complete-grounding`.
Do **not** touch `rounds` — round accounting stamps when the round's final
tactic completes, not here.

**Dependencies**: Units 1–2.
**Recommended model**: sonnet

## Reuse

- `listNodes` — `packages/intentionsutil/src/store.ts:124` (the loader
  `validate-graph.ts` uses).
- Script skeleton: `packages/intentionsutil/scripts/validate-graph.ts`
  (arg parsing, dir default).
- Fixture style: `packages/intentionsutil/test/attention.test.ts`.
- `packages/intentionsutil/scripts/write-node.ts` and
  `packages/intentionsutil/scripts/graph-commit` for Unit 3's strategy stamp.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
npx tsx packages/intentionsutil/scripts/grounding-gap.ts
```

- The second command prints a summary with a nonzero unmarked count (the
  graph currently has unmarked durable-layer nodes — e.g.
  `delegation-anthropic-claude` carries neither mark) and ranks
  high-divergence delegation exposure at the top.
- After Unit 3: `intentions/strategy-complete-grounding.md` frontmatter
  carries the dated reading, and
  `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes.
