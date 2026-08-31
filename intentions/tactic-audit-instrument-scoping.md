---
id: tactic-audit-instrument-scoping
kind: tactic
statement: Give aggregate-usage.sh --session/--node scoping so one instrument
  and one lens catalog serve both the per-run session evaluation and the
  periodic fleet audit, with fleet-denominator lenses tagged fleet-only
owner: ai
status: codified
parent: null
rationale: "Drafted 2026-08-12 /align round. The parsimony finding:
  /dispatch-token-audit and the session evaluation were never two analyses —
  aggregate-usage.sh already emits both per-session rows and window aggregates
  from one pipeline. Collapsing them to one instrument at two scopes removes the
  duplicate lens catalog without losing the fleet-sized denominators that cannot
  exist at n=1."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: strategy-recursive-self-improvement
  pr: 3074
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T03:26:48Z
    mergeCommitSha: c3c229f0de63db09df7dc01ce02177f3d1b56c95
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Give aggregate-usage.sh --session/--node scoping so one instrument and one lens catalog serve both the per-run session evaluation and the periodic fleet audit, with fleet-denominator lenses tagged fleet-only

Drafted by the 2026-08-12 `/align` round, carrying the parsimony resolution
recorded that day on `strategy-token-economy` ("Can /dispatch-token-audit be
superseded entirely").

## The finding

The session evaluation and `/dispatch-token-audit` were never two analyses.
`aggregate-usage.sh` already computes per-session rows (`.sessions[]`) and
window aggregates from **one** pipeline, and its `by_phase` buckets already
carry `cache_creation` / `cache_read`. What duplicated was the *lens catalog*
and its drift, not the measurement.

## What changes

- `.claude/skills/rsi-audit/scripts/aggregate-usage.sh` — add
  `--session <id>` / `--node <id>` scoping alongside the existing `--days <N>`.
  Same script, same JSON schema, same lens catalog at both scopes.
- `.claude/skills/rsi-audit/SKILL.md` — reframe as the **fleet-scoped
  invocation** of that instrument, and tag each lens by the scope at which it is
  meaningful.
- The per-phase evaluator (`tactic-ladder-per-phase-evaluation`) invokes the
  same script scoped to its session, and never reads a transcript by hand.

## Fleet-only lenses

Absent at n=1, **never approximated** from one run — an n=1 hit-rate is a
category error, not a small sample:

- pooled `by_phase_outcome` rates (the routing-recommendation input)
- `lenses.baseline_context` median/peak
- `lenses.phase_standup`
- cross-session `tool_errors` signatures
- recurrence

Meaningful at both scopes: `tool_errors` (per-run), `payload_bytes`,
`context_over_120k`, cache efficiency (`tactic-audit-cache-efficiency-lens`),
permission friction (`tactic-audit-permission-friction`).

## Why not full supersession

Two reasons, both recorded. The fleet denominators above cannot be reconstructed
from ~5 sessions; and `strategy-token-economy`'s own `success_signal` is
**weekly allowance utilization**, which would be left with no weekly reader.

## Risk

"A scope filter, not a rewrite" is judgment from reading the pipeline's
structure, **not a measured diff** against a ~1000-line jq program. If scoping
turns out to require restructuring the aggregation, re-scope this unit rather
than forcing it.

## Ruling, 2026-08-30 — this node is a COMPLETION RECORD

**Instrument.** Ruling 4's BOUND clause
(`plans/dispatch-rsi-author-rulings.md`, quoting
`strategy-graph-native-dispatch`): *"a DEAD PREMISE is not a DEAD SCOPE … Where
clear-park is the wrong instrument — a `phase: null` node whose work already
shipped, which clear-park makes router-eligible rather than terminal — the
correct act is the completion record (`phase: done`), never the clear."* Here
the park's premise is alive and the **scope** is dead, so this node closes as a
completion record under the Ruling 1 convention: stamp `execution.completion`
against the carrier PR, `status: raw → codified`, `phase: null → done`, do not
prune.

**Applied here.** All three bullets of "What changes" are merged.
`--session <id>` / `--node <id>` scoping ships at
`.claude/skills/rsi-audit/scripts/aggregate-usage.sh:22,34,42`, with mutual
exclusion at `:222` and `:232`, the unbounded-mtime-window rule at `:261`, the
no-Firestore-persist rule for a scoped run at `:1534-1539`, and the
`scope: {type, id}` object documented at `:1463` and emitted at `:1488` and
`:1499`. `.claude/skills/rsi-audit/SKILL.md:15` frames the skill as the
fleet-scoped invocation of that one instrument, and its step 4 (`:108`, tag
definitions at `:110-111`) tags all twelve lenses `[fleet-only]` / `[any-scope]`
at `:113-138`. The per-phase evaluator the third bullet names exists as the
`/rsi` skill, which invokes `aggregate-usage.sh --node` at
`.claude/skills/rsi/SKILL.md:108-109` and rules an empty selection a missing
measurement at `:129`. Landed by `f9af1a69` (2026-08-12, the same day the
`/align` round drafted this node — which is why the draft was never reconciled
against its own implementation) and relocated by `c3c229f0` / PR #3074, which
collapsed the skill family into `/rsi` and `/rsi-audit`. Sibling carriers:
`tactic-rsi-audit-skill-rename` and `tactic-rsi-audit-ledger-findings`, both
`phase: done` against the same PR.

### The lens-1 question is answered by a live sibling, not by a new carrier

PARK 2 of the 2026-08-19 park asked whether `tool_errors` should be re-tagged
(per-run counts any-scope, cross-session recurrence fleet-only), or whether the
unqualified `/rsi` read should be dropped instead — and, if the former, whether
that lands here or on a new carrier alongside
`tactic-rsi-round-trips-lens-carrier`.

**It lands on neither this node nor a new one.** It is already carried by
`tactic-rsi-lens-catalog-decomposition` (`status: codified`, `phase: implement`,
`office_hours: null`, `blocked_by: []`), which names the identical contradiction
in its own body and rules the answer: `tool_errors` is re-tagged
`[node, fleet]`, under a `scope` list drawn from `{node, fleet}` that replaces
the binary `any-scope`/`fleet-only` vocabulary outright. Its catalog row
`rsi-lens-tool-errors` carries `node, fleet` and covers `/rsi` lens 1 and audit
lens 1 together, so the re-housing regenerates the `/rsi` read from the ruled
tag rather than leaving it to be deleted by hand — which closes both arms of
PARK 2's either/or in one place. Minting a second carrier for lens 1 would
create a duplicate-target pair with that node.

### Not discharged by this record — owed to an `/align` pass on `strategy-token-economy`

Transcribed here because clearing the park destroys it, and the router will
never surface a `phase: done` node again.

**`strategy-token-economy` still anchors on the removed
`.claude/skills/dispatch-token-audit/` path.** Seven live mentions remain on
that node, including a hard file anchor
(`.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:319`) and the
2026-08-12 parsimony clarification this node was drafted from. They read today
as `.claude/skills/rsi-audit/...`, and the per-phase evaluator that
clarification names is now the `/rsi` skill. A per-node round may not edit a
serving strategy, so this stays owed.

### Discharged by this record

- The sibling-bookkeeping half of the 2026-08-19 park's item (ii):
  `tactic-audit-cache-efficiency-lens` is `status: codified`, `phase: implement`
  and `tactic-audit-permission-friction` is `status: codified`, `phase: done`
  on `origin/main`. Both were `status: raw`, `phase: null` when the park was
  written; neither is now.
- Item (iii): `tactic-ladder-per-phase-evaluation` is `blocked_by` this node on
  a blocker already satisfied in code. That edge now resolves against a
  `phase: done` blocker. It stays blocked by its other edge,
  `tactic-rsi-session-sweep-trigger` (`phase: null`), so nothing becomes
  router-eligible as a side effect of this write.
