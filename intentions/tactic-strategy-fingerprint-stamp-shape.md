---
id: tactic-strategy-fingerprint-stamp-shape
kind: tactic
statement: strategy_fingerprint stamps written in the flat {hash,sha} form
  silently disable the scope-freeze gate — repair the two bad stamps AND the
  align-strategy instruction text that reproduces the shape
owner: ai
status: raw
parent: null
rationale: "Found 2026-07-23 during the wezterm-pin /align-strategy round, while
  classifying open children for the materiality-scoped freeze. schema.ts:349
  documents execution.strategy_fingerprint as a per-strategy map {<strategy-id>:
  {hash, sha}}, and isFingerprintStale (transitions.ts:365-374) returns FALSE
  when the strategy id key is absent from the object. Two open tactics —
  tactic-node-toolchain-single-source and tactic-practitioner-support-boundary,
  both stamped 2026-07-22 — instead carry a flat {hash, sha} object with no
  strategy-id key, so they can never go stale for any strategy and the freeze
  gate is inert on them. Fail-open, and invisible to a grep over the field name.
  Likely source: .claude/skills/align-strategy/SKILL.md's re-stamp instruction,
  whose literal text reads {hash: strategyFingerprint(strategy), sha: <sha>}
  without the enclosing strategy-id key — so following the skill as written
  reproduces the bug. Census at find time: 2 flat, 4 correctly keyed, 31 legacy
  bare strings (which DO compare, per transitions.ts:371), 21 null."
reading: null
gap: null
serves:
  - strategy-graph-self-description
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
# strategy_fingerprint stamps written in the flat {hash,sha} form silently disable the scope-freeze gate

Retained context from the 2026-07-23 `/align-strategy` round. Not planned —
`/align-tactics` owns decomposition and the quality bar.

## Scope — two parts, and the second is the one that matters

**Part 1 — the data.** Re-stamp the two open tactics carrying the flat shape
(`tactic-node-toolchain-single-source`, `tactic-practitioner-support-boundary`)
into the per-strategy map form `{<strategy-id>: {hash, sha}}` that
`schema.ts:349` documents and `isFingerprintStale`
(`transitions.ts:365-374`) actually reads.

**Part 2 — the generator.** Correct the re-stamp instruction in
`.claude/skills/align-strategy/SKILL.md`, whose literal text reads
`{hash: strategyFingerprint(strategy), sha: <sha>}` with no enclosing
strategy-id key. Any session following the skill as written reproduces the
defect, so Part 1 alone regresses on the next round that re-stamps. Recorded
2026-07-23 as explicit scope rather than left in `rationale` as a suspected
cause.

## Why it is invisible

`isFingerprintStale` returns `false` when the strategy-id key is absent
(`transitions.ts:371`), so a flat stamp can never go stale **for any strategy**
— the gate is not merely wrong, it is inert, and it fails open. A grep over the
field name finds these nodes and shows a populated-looking value; only the
authoritative predicate distinguishes them. That is the trap this round hit
live: a by-eye hash comparison suggested a re-stamp was owed, and
`isStrategyStale` returned `false` for both nodes.

## Census at find time (2026-07-23)

| stamp shape | count | compares? |
|---|---|---|
| flat `{hash, sha}` | 2 | **no — inert** |
| keyed `{<strategy-id>: {hash, sha}}` | 4 | yes |
| legacy bare string | 31 | yes (`transitions.ts:371`) |
| `null` | 21 | n/a (returns `false` by design) |

A regression test asserting `isFingerprintStale` is *not* silently false for a
populated-but-unkeyed stamp would have caught this; whether to add one is part
of the decomposition, not settled here.
