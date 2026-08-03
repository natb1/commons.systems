---
id: tactic-token-audit-node-attribution
kind: tactic
statement: node-id session attribution — graph-native sessions stamp node id
  into the dispatch sidecar; the token audit gains a by-node join and a
  UTC-consistent window
owner: ai
status: codified
parent: null
rationale: Finalized from the 2026-07-04 interview draft by /align-tactics round
  1. Implements the attribution-parity commitment on
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
attention:
  boost: 20
  override: null
  rationale: "Author-directed 2026-08-03: prioritize progression of
    token-efficiency work ahead of bug-fix work and ahead of the undecomposed
    baseline. Matches the boost 20 already carried by the review-phase
    token-cost cluster (tactic-review-skill-body-decomposition and its
    siblings). Simulated over the live store before writing: 0 tier changes,
    0 value drift onto non-target nodes, resolves to 20.00."
  tier: 1
phase: null
execution:
  branch: tactic-token-audit-node-attribution
  pr: 2777
  attempts:
    qa: 1
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: 157bc07dd1dbc4a1c7a5095f7c3094ee88accf5879271bc6d2c4cd4794029848
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  phase: main-qa
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

Unit 4 below folds in two adjacent, independently-verified token-audit
correctness bugs from the 2026-07-05 code review, previously misfiled in
`tactic-review-low-severity-sweep` at higher severity than a "low" sweep
warrants: the daily topic-usage doc's systematic undercount (rated high)
and a subagent double-count (rated medium). Both live in the same
aggregation family as Units 1-3, so they land here rather than as a
separate tactic.

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

## Unit 4 — daily doc completeness and subagent double-count

**Recommended model:** sonnet

Scope:
- `.claude/skills/dispatch-token-audit/scripts/topic-usage-writer.mjs:566-569`
  + `.claude/skills/dispatch-propagate/scripts/dispatch-tick:193-201`: the
  producer emits *today's* Firestore doc and the tick launches it only on
  the first tick after UTC midnight, so day D's doc captures only the
  minutes of day D before that single launch and is never revisited —
  every normal-path daily doc systematically undercounts nearly the whole
  day (gap-recovery days are complete, making the series inconsistent by
  construction). Re-run (or backfill) the writer at a later point in the
  day, or on every tick with an idempotent upsert, so day D's doc reflects
  the full day once it has fully elapsed.
- `topic-usage-writer.mjs:489-494` + `aggregate-usage.sh:828`: the
  file-issue attribution exclusion matches only the top-level
  `<sid>.jsonl`; the session's `subagents/agent-*.jsonl` transcripts stay
  in the scan while the sidecar totals *include* subagent usage, so those
  tokens are counted twice, breaking the file's own "each token exactly
  once" invariant. Exclude subagent transcripts from the direct scan when
  their parent session's sidecar total already includes them.
- Fixture tests: a `.jsonl` set spanning UTC midnight into the next tick
  produces a complete day-D doc once day D has elapsed; a session with a
  `subagents/agent-*.jsonl` present is counted once, not twice.

## Dependencies

Unit 2 depends on Unit 1 (sidecar shape). Unit 4 is independent of Units
1-3. One tactic, one PR.

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
`artifact.node_id` set and in `by_node`, not in the `<none>` bucket. Run a
same-day-then-next-tick fixture and confirm the completed day's doc
reflects the full day; confirm a session with a subagent transcript is
not double-counted.

## Implementation notes

Four units, one PR; implement each in a subagent with its Recommended
model; supply this Context and the unit's Scope; constrain to working-tree
edits. `strategy_fingerprint` recipe (interim until
tactic-graph-dispatch-schema lands): sha256 hex of
`JSON.stringify({statement, clarifications, conditions, serves,
success_signal, tooling_goals})` as loaded by intentionsutil `listNodes`.

## main-qa residue (qa 2026-07-06)

- Unit 4 daily-doc-completeness fix (topic-usage-writer.mjs re-finalizing yesterday's doc in arrears) can only be observed against live Firestore. After merge, on the first tick after the next UTC midnight, confirm the previous day's topic-usage Firestore doc was re-written with byTopic/byType totals reflecting the full day (not just the partial-day snapshot from the first post-midnight tick) — compare against the sentinel last-day file's prior value to confirm re-finalization ran.
- The full production attribution loop (a graph-native dispatch phase-worker session on a node-id/graph-* branch stamping node_id and landing in aggregate-usage.sh's by_node instead of <none>) has no live occurrence on origin/main yet since this stamping code isn't deployed until merge. After merge, once a phase-worker session runs on a node-id/graph-* branch, confirm its sidecar carries node_id and it appears in by_node in the next token-audit run.
