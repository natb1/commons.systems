---
id: tactic-token-audit-node-attribution
kind: tactic
statement: "draft: node-id session attribution — graph-native sessions stamp
  node id and phase into the dispatch sidecar; the token audit gains a by-node
  join"
owner: ai
status: raw
parent: null
rationale: Draft retained from the 2026-07-04 strategy-token-economy interview
  (retain, not refine). Implements the attribution-parity commitment on
  strategy-graph-native-dispatch and the first sensor tooling goal of the
  strategy it serves.
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes: {}
---
# draft: node-id session attribution — graph-native sessions stamp node id and phase into the dispatch sidecar; the token audit gains a by-node join

Notes retained from the interview session (no plan schema, no quality bar):

- Today's join: the sidecar `<session-id>.dispatch-stamp.json` next to the
  transcript carries `{repo, issue, pr, base_sha, branch}`; the audit's
  `.sessions[].artifact` joins on session id
  (`.claude/skills/dispatch-token-audit/SKILL.md` step 3). Phase attribution
  comes from the skill frame. Graph-native sessions have neither an issue
  number nor (for align-family and router ticks) a skill frame the audit
  recognizes.
- Consequence measured in the 2026-06-26→07-03 audit: the unattributed
  `<none>` bucket was the largest single line — $5,680 proxy / $1,842 real,
  19,733 turns. Every graph-native session added today would land there.
- Sketch: extend the sidecar with `node_id` and a graph-native `phase`;
  `aggregate-usage.sh` groups by node id and folds per-node spend/yield;
  spend-per-closed-tactic becomes derivable, which the strategy's
  utilization+velocity signal needs.
- Also fold weekly-allowance utilization (from
  `~/.local/share/commons-dispatch/rate_limits.json`, the
  dispatch-target-workers telemetry) into the audit aggregate so one artifact
  carries both halves of the signal.
- Open thread from the same audit worth folding in: `aggregate-usage.sh`
  window computation mixes local-TZ `date -d` with a `TZ=UTC` `find
  -newermt` comparison — very recent sessions can silently fall outside the
  window in non-UTC shells (repro in
  `worktrees/2737-fable-price-table/tmp/dispatch-token-audit-findings.md`).
