---
id: tactic-token-audit-node-attribution
kind: tactic
statement: node-id session attribution — graph-native sessions stamp node id
  into the dispatch sidecar; the token audit gains a by-node join and a
  UTC-consistent window
owner: ai
status: codified
parent: null
rationale: Finalized from the 2026-07-04 interview draft by /align-tactics
  round 1. Implements the attribution-parity commitment on
  strategy-graph-native-dispatch and the first sensor tooling goal of
  strategy-token-economy.
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  phase: implement
  execution:
    strategy_fingerprint: 10f0314e331696714d42b26313b80c5a289d68ab0e3ce4d614bf2c97a94d4a67
---
# node-id session attribution — graph-native sessions stamp node id into the dispatch sidecar; the token audit gains a by-node join and a UTC-consistent window

## Context

The token audit attributes cost two ways: per-session GitHub artifacts via
the `<session-id>.dispatch-stamp.json` sidecar, and phase via skill-frame
detection. Both go blind on graph-native sessions:

- The sidecar writer
  (`.claude/skills/dispatch-propagate/scripts/dispatch-stamp-session`,
  Mode A at lines 20-39) no-ops unless the branch matches `^[0-9]+-`
  (line 30) — graph-native branches (`graph-*`, node-id names) get no
  sidecar at all.
- The session-type classifier
  (`.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:269-280`)
  recognizes only the legacy phase-skill command names; align-family
  sessions classify as `other`.

Measured 2026-06-26→07-03: the unattributed `<none>` bucket was the
largest single line — $5,680 proxy / $1,842 real, 19,733 turns. Every
graph-native session added today lands there. Separately, the window
computation mixes local-TZ `date -d` (`aggregate-usage.sh:163-174`) with a
`TZ=UTC find -newermt` consumer (`aggregate-usage.sh:846`), silently
shifting the window boundary by the local UTC offset (repro in the
2026-07-03 findings doc).

## Unit 1 — sidecar node-id stamping

**Recommended model:** sonnet

Scope:
- `dispatch-stamp-session` Mode A (lines 20-39): extend branch
  recognition. Numeric `^[0-9]+-` branches keep today's behavior; add
  graph-native recognition — a branch named `graph-<slug>` or exactly a
  node id (`tactic-*` / `strategy-*`) stamps `node_id` (the node id, or
  the slug's best-effort node id for `graph-` branches when a matching
  `intentions/<id>.md` exists, else null) with `issue: null`.
- Extend the documented sidecar shape (doc comment lines 15-18) with
  `"node_id": <string|null>`; preserve idempotency across resumes
  (lines 35-39) and the atomic tmp+mv write (line 48).
- Hook (`.claude/hooks/stamp-dispatch-session.sh`) unchanged — it only
  forwards session id and transcript path.
- Tests: extend the dispatch-stamp-session coverage in
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`
  with a graph-branch case and a node-id-branch case.

## Unit 2 — aggregate by-node join and align-family classification

**Recommended model:** sonnet

Scope:
- `aggregate-usage.sh` stage-1 join (line 401): carry `node_id` through
  the artifact object (`{repo, issue, pr, base_sha, branch, node_id}`).
- Stage-2 assembly (lines 776-811): add a top-level `by_node` sibling key
  — per `artifact.node_id`, summed `price_proxy_usd`, `cost_usd`, `turns`,
  `sessions` — following the `$by_phase` reduce pattern (lines 554-577).
- Session-type classifier (lines 269-280): add
  `align-strategy|align-tactics|align-init` to the worker command-name
  alternation, per the maintenance comment at lines 275-278.
- Fixture test mirroring the haiku/fable fixtures
  (`test-aggregate-usage.sh:831-915`): a session whose sidecar carries a
  `node_id`, asserting the `by_node` row and worker classification.
- Depends on Unit 1's sidecar field shape (same PR, ordered).

## Unit 3 — UTC-consistent window computation

**Recommended model:** sonnet

Scope:
- `aggregate-usage.sh:163-174`: compute `SINCE`/`UNTIL` with `date -u`
  consistently so the strings match the `TZ=UTC` interpretation at the
  `find` call (line 846). `--day` mode already computes `UNTIL` with
  `-u` (line 165) — make `SINCE` forms match.
- Fixture test: a `.jsonl` with `mtime = now` must appear in a `--days 7`
  window regardless of host TZ (run the aggregator under `TZ=America/New_York`
  in the test to pin the regression).

## Dependencies

Unit 2 depends on Unit 1 (sidecar shape). One tactic, one PR.

## Reuse

- Sidecar writer atomic-write and idempotency patterns —
  `dispatch-stamp-session:35-48`.
- Fixture-test structure — `test-aggregate-usage.sh:831-915` (isolated
  mktemp root, two-line transcript, targeted asserts).

## Verification

```verify
.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh
```

Manual: run the aggregator over the live transcripts directory after a
graph-native session has run — the session appears with
`artifact.node_id` set and in `by_node`, not in the `<none>` bucket.

## Implementation notes

Three units, one PR; implement each in a subagent with its Recommended
model; supply this Context and the unit's Scope; constrain to working-tree
edits. `strategy_fingerprint` recipe (interim until
tactic-graph-dispatch-schema lands): sha256 hex of
`JSON.stringify({statement, clarifications, conditions, serves,
success_signal, tooling_goals})` as loaded by intentionsutil `listNodes`.
