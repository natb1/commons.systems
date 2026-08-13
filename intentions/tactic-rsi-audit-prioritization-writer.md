---
id: tactic-rsi-audit-prioritization-writer
kind: tactic
statement: "Build /rsi-audit's delegated attention writer — within-band boosts
  on owner: ai tactics, each appended to attributes.priority_log with a
  read-before-write anti-thrash check"
owner: ai
status: raw
parent: null
rationale: Recorded 2026-08-13 from the 2026-08-12 author interview, which
  assigned /rsi-audit two prioritization duties and found only one of them
  buildable today. The recommend half — strategy boosts proposed with measured
  justification, ratified by the author — shipped with PR 3074 because it
  depends on no part of the Attention shape. This node carries the write half,
  which does, and is blocked on tactic-attention-namespaced-rank rewriting
  interface Attention itself.
reading: null
serves:
  - strategy-rsi-delegated-prioritization
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-attention-namespaced-rank
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Build /rsi-audit's delegated attention writer — within-band boosts on owner: ai tactics, each appended to attributes.priority_log with a read-before-write anti-thrash check

## Context

The 2026-08-12 author interview assigned `/rsi-audit` two prioritization duties.
The **recommend** half — proposing strategy boosts with measured justification
for the author to ratify — shipped with PR 3074, because it depends on no part
of the `Attention` shape and writes nothing. This node is the **write** half.

Read `strategy-recursive-self-improvement`'s clarification "With /rsi-evaluate
retired unbuilt, who writes a delegated boost" before starting; it is
authoritative on the split, and this node is one piece of its mechanism. The
ownership bound is recorded on that node's conditions and is not restated here:
this writer touches `owner: ai` tactics and nothing else.

**This node is blocked, and the block is measured rather than assumed.**

- **No attention writer exists on `main` at all.** `boost-node` lives only on
  `origin/tactic-attention-boost-scripts`, whose PR was **closed, not merged**,
  and abandoned under a fix cap. Treat it as a design reference, never as
  reusable code — and confirm its status before copying anything from it.
- **`attributes.priority_log` has zero code behind it.** No schema entry, no
  `validate-graph` rule, no reader, no writer. It is prose in eight node files.
- **`band` is not a computed value today.** It is derivable in a few lines from
  `resolveAttention` (`packages/intentionsutil/src/attention.ts`) and
  `servingStrategyIds` (`packages/intentionsutil/src/router.ts`), but
  `tactic-attention-namespaced-rank` **rewrites `interface Attention` itself**
  to `{boosts: Record<string, number>, rationale}`, deletes
  `attention.override`, deletes `router.ts`'s `effectivePrecedence`, and retires
  the matching `validateGraph` rule.

A writer built against today's shape would be deleted by that node's first unit.
That is why this is `blocked_by: [tactic-attention-namespaced-rank]` rather than
work someone could start now.

## Scope

Plan against the **post-rewrite** `Attention` shape, not today's.

- **The within-band boost writer.** `/rsi-audit` writes attention only on
  `owner: ai` tactics, only within the tactic's distributing-strategy band, and
  never on a strategy, a virtue, or an `owner: human` tactic. It never writes
  `attributes.tier`, never removes or downgrades a recognized
  `bug_fix`/`security` mark, and no attention value it writes may cross a band.
- **The `priority_log` append.** Every write appends `{date, old→new,
  rationale}` to `attributes.priority_log` on the re-ranked node — append-only,
  capped around ten entries, fingerprint-exempt.
- **The read-before-write anti-thrash rule.** Read the existing log first; a
  prior reordering is never reversed without citing new evidence. The
  anti-thrash rule binds within the log's retained window — an entry scrolled
  off the cap no longer constrains.

**Out of scope:** the strategy-boost recommendation path, which already ships
and stays recommend-only; and the `priority_log` schema documentation and lint,
which is `tactic-priority-provenance-schema` and deliberately lands first — the
bound should exist before the actuator it bounds.

## Dependencies

`tactic-attention-namespaced-rank` must complete first. Re-read its landed shape
before planning units; this node's scope is stated against its *intended*
rewrite, and the intended and landed shapes may differ.

## Reuse

- `packages/intentionsutil/src/attention.ts` — `resolveAttention`, the
  band arithmetic this writer must stay inside.
- `packages/intentionsutil/src/router.ts` — `servingStrategyIds`, which resolves
  a tactic's distributing strategies (band = max across distributors).
- `packages/intentionsutil/scripts/write-node.ts` — the single validation gate
  for any node write. Hand-authored markdown is against doctrine.
- `packages/intentionsutil/scripts/graph-commit` — the only landing path for an
  `intentions/` change.

## Verification

Automated checks belong on the units, once the post-rewrite shape is known.
State them then rather than guessing a suite name here.

Manual, and the point of the whole node: run `/rsi-audit` against a window,
confirm every attention write it made lands on an `owner: ai` tactic, stays
inside that tactic's band, and carries a matching `priority_log` entry — and
that a second run over the same window does not reverse the first without citing
new evidence. Then confirm no strategy, virtue, or `owner: human` tactic changed
attention at all: `git diff` over `intentions/` is the check, and a single such
write is a bound violation, not a nit.
