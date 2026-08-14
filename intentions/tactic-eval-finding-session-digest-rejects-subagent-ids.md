---
id: tactic-eval-finding-session-digest-rejects-subagent-ids
kind: tactic
statement: dispatch-session-digest validates --session against a hex-only
  pattern that no agent-prefixed subagent id can ever match, and --transcript
  does not bypass it, so the per-phase evaluator prescribed escape hatch is
  unreachable for the 95 percent of a fan-out phase session rows that are
  subagents — including every anomalous row the review phase produced
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: subagent_share_of_phase_sessions
      value: 0.949
      unit: ratio
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: undigestible_price_proxy_usd
      value: 232.6
      unit: usd
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: undigestible_anomalous_sessions
      value: 2
      unit: sessions
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
## What was observed

Evaluating `tactic-attention-namespaced-rank` phase `review` (2026-08-13),
step 3 of `.claude/skills/rsi/SKILL.md` — "Only if a specific session needs
explaining" — was unreachable for every session that needed explaining.

`dispatch-session-digest` rejects the id:

```
$ .claude/skills/dispatch-propagate/scripts/dispatch-session-digest \
    --session agent-a9013e7662d8c3183
dispatch-session-digest: --session must match ^[0-9a-fA-F-]+$, got: agent-a9013e7662d8c3183
```

The guard is `dispatch-session-digest:120`. Subagent ids are `agent-<17 hex>` —
the literal prefix `agent-` contains `g`, `n` and `t`, so no subagent id can
ever match a hex-only pattern.

The `--transcript <path>` escape hatch does not help: `--session` is still
required and is validated at line 120 **before** `--transcript` is consulted, so
passing the transcript path explicitly fails identically.

## Why it bites the review phase specifically

Of the review phase's 39 measured session rows, **37 are subagents** (94.9%).
Both anomalous rows are subagents:

- `agent-a9013e7662d8c3183` — the serialized `/code-review` pre-stage, 173
  turns, peak context 196,815, $46.64 price proxy, and the carrier of **all 7
  `user_rejections`** and the entire **$1.74 `retry_price_proxy_usd`** measured
  in the phase. An unattended job accumulating 7 tool rejections is exactly the
  anomaly step 3 exists to explain, and it cannot be read.
- `agent-a8a8196ffd80200e9` — 80 turns, peak context 160,289, $22.66 price
  proxy, attributed to no skill (`<none>` bucket).

Only the two non-subagent rows are digestible, and one of them
(`e2af2a98-…`, the `claude -p` parent) carries 0 turns and $0 — its digest
returns `turn_count: 2` and a `last_user_request`, and nothing else, because all
its work is in the child it cannot reach.

The `review` phase is the most subagent-heavy rung on the ladder — the worker's
own outcome envelope records `subagents_launched: 32` — so this is where the
gap is widest, but every fan-out phase has it.

## What would have to change

The decision belongs to `dispatch-session-digest`, which owns its id contract.
The observation is only that its `--session` pattern was written for
UUID-shaped worker ids and silently excludes the entire subagent id space, while
its consumers (this evaluator among them) are pointed at sessions that are
predominantly subagents. Whether the answer is widening the pattern, honouring
`--transcript` without a matching `--session`, or a separate subagent path is
the author's call.

## Positive control

The rejection is a hard error on stderr, not an empty result, so no absence is
being inferred. The same script run against the digestible parent
(`e2af2a98-7077-4927-b909-98afe4200033`) returned a well-formed digest in the
same session, which demonstrates the instrument works and that its blindness is
specific to the id shape.
