---
id: tactic-gap-derive-on-read
kind: tactic
statement: gap leaves the stored model — deriveGap computes it on read, joining
  attention's derived-state doctrine
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round: 31 of 47
  signal-bearing strategies stored gap: null against deriveGap's total rule
  (signal + null reading → 'no reading yet'), 6 stored the derived string, 3
  stored prose — three conventions for one derived value. Derived state is never
  stored."
reading: null
serves:
  - strategy-graph-self-description
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-gap-derive-on-read
  pr: 3063
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: 15b5ef1dc7ce30e0a267440a124bd558c5506c86bd79f91fa2dc39b909df79b9
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-10T15:11:34Z
    mergeCommitSha: 455ae5d15c7a19e104d5e51c5d004ba732cad710
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-gap-derive-on-read

## Context

`deriveGap` (`packages/intentionsutil/src/sensors.ts:88`) is a total, local
rule; storing its output invites drift — the 2026-07-09 review found stored
`gap` contradicting the derivation on most signal-bearing strategies, and the
2026-07-11 sweep counts 16 nodes still storing a non-null `gap` (a mix of
derived strings, readings pasted into the wrong field, and prose).
Derived values are never stored (the doctrine `attention` already follows).
Compatibility verified 2026-07-09: `attention.ts:55` and `/align-tactics`'s
eligibility rule both already treat a null `reading` as unvalidated
independently of stored `gap`, so the wrongly-stored values were never
load-bearing.

## Units

### Unit 1 — Review the stored non-null gaps and fold real information

**Scope:**

- Enumerate stored non-null gaps:
  `grep -rn "^gap: " intentions/*.md | grep -v "gap: null"` (16 at sweep
  time; also catch multi-line YAML continuations of those entries).
- For each: if the text is exactly (or trivially) what `deriveGap` would
  return, no action — the field vanishes on the node's next rewrite. If it
  carries real information the derivation would lose (hand-written prose,
  observations), fold that into the node's `rationale` or `reading`
  (whichever it actually is) via
  `packages/intentionsutil/scripts/write-node.ts` in this PR.
- Out of scope: rewriting all 16 nodes just to strip the field — removal is
  incremental via the schema change (Unit 2).

**Recommended model:** opus

### Unit 2 — Remove `gap` from the stored model; readers derive

**Scope:**

- `packages/intentionsutil/src/schema.ts`: remove `gap` from `IntentionNode`
  (line 117), the input type (line 153), and `validateNode` (line 461).
  Unknown keys are already dropped on read, so legacy files stay readable and
  normalize on their next rewrite — no flag day.
- Readers switch to `deriveGap(node)` (`sensors.ts:88`):
  - `packages/intentionsutil/src/goals.ts:85-86` (sort discriminator) and
    `goals.ts:164` (render suffix).
  - `packages/intentionsutil/src/attention.ts:55` — currently
    `strategy.gap !== null || strategy.reading === null`; `deriveGap` returns
    a non-null "no reading yet" string when a signal-bearing strategy has a
    null reading, so the disjunction collapses to
    `deriveGap(strategy) !== null` — verify against `deriveGap`'s
    documented semantics (`sensors.ts:130-160`) rather than assuming.
  - Any other `\.gap\b` consumer a repo-wide grep finds.
- `packages/intentionsutil/scripts/read-sensors.ts:594-595`: stop deriving
  and persisting `gap` — write `{ ...node, reading }` only.
- Update the doc home: kind-node body text documents `gap` as derived-on-read
  (coordinates with tactic-schema-md-deprecation — whichever lands second
  reconciles; if SCHEMA.md still exists when this lands, fix it there too).
- Unit tests: goals ordering and attention terms unchanged on a corpus where
  stored gap disagreed with the derivation.

**Recommended model:** sonnet

**Dependencies:** Unit 1.

## Reuse

- `deriveGap` (`packages/intentionsutil/src/sensors.ts:88`) — the single
  derivation; do not re-implement it at call sites.
- `packages/intentionsutil/scripts/write-node.ts` for any Unit-1 node
  rewrites.

## Verification

```verify
npx vitest run --project intentionsutil --root . || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts || exit 1
if grep -n '"gap"' packages/intentionsutil/src/schema.ts; then echo "FAIL: the forbidden pattern is still present in packages/intentionsutil/src/schema.ts"; exit 1; fi
```

Prose: `git grep -n "\.gap\b" packages/intentionsutil/src` returns only
`deriveGap` internals/tests, no stored-field readers. Nodes rewritten in this
PR carry no `gap:` line; untouched nodes may — that is the incremental
normalization working as designed (coordinates with
tactic-omit-default-serialization, which shrinks the same frontmatter;
whichever lands second rebases mechanically).
