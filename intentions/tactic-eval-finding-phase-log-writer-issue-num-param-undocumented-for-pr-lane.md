---
id: tactic-eval-finding-phase-log-writer-issue-num-param-undocumented-for-pr-lane
kind: tactic
statement: dispatch-write-phase-log documents its positional argument as
  <issue-num> and errors with an issue-num argument is required, but a node-lane
  node has no issue and carries only execution.pr, so every node-lane worker
  spends three attempts and about 70 seconds reading the script body to
  rediscover that the PR number is the correct value because GitHubs issues API
  addresses pull requests by the same number
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
  first_seen: 2026-08-14
  measured_impact:
    - metric: phase_log_write_attempts
      value: 3
      unit: attempts
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: phase_log_rework_wall_clock_s
      value: 70
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Observed

`tactic-attention-namespaced-rank`, phase `review`, 2026-08-13, worker session
`6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6`.

Writing the phase-log entry took **70 seconds and three attempts**, 22:58:59Z →
23:00:09Z:

1. 22:59:36 — `Write` the entry body to
   `tmp/phase-log-entry-tactic-attention-namespaced-rank.md`.
2. 22:59:45 — "Inspect dispatch-write-phase-log script behavior".
3. 22:59:56 — "Write phase-log entry as attempt 2 to avoid clobbering attempt 1".
4. 23:00:02 — "Check remainder of script to see how N is used (issue vs PR)".
5. 23:00:07 — "Write phase-log entry using PR number as the issues-API target".

Step 4 is the tell. `dispatch-write-phase-log`'s header documents its positional
argument as an **issue** number:

```
# Usage: dispatch-write-phase-log <issue-num> --phase <p> [--attempt <n>] [--reentry <true|false>]
```

and it validates `^[1-9][0-9]*$` with the error text
`"an issue-num argument is required"`. A **node-lane** node has no issue — this
one carries `execution.pr: 3075` and nothing else. The correct value is the PR
number, which works only because GitHub's issues API addresses pull requests
too. Nothing in the script, its usage line, or its error message says so, so
every node-lane worker rediscovers it by reading the script body.

No residue was left: the worker's own step 3 shows it found a pre-existing
`phase-log:review:1` section (from the earlier review pass that halted at
21:51:58Z) and correctly wrote `attempt 2`. PR #3075's phase-log comment now
holds `qa:0`, `qa:1`, `review:1`, `review:2` — all legitimate.

The cost is purely the discovery, and it is paid on every node-lane phase that
writes a phase log — implement, qa and review alike.

# What would have to change

A comment-and-message edit, no behaviour change:

- Rename the usage placeholder to something lane-neutral (`<issue-or-pr-num>`)
  and say in the header that for node-lane nodes the value is `execution.pr`,
  because the issues API addresses PRs by the same number.
- Make the two error strings match ("an issue-or-PR number argument is
  required").

The `<issue-num>` name is load-bearing in the wrong direction: it reads as a
constraint the caller must satisfy, so a careful worker stops and checks rather
than passing the only number it has.

# Evidence

Worker transcript `6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6.jsonl`, tool_use
entries 22:59:36.448Z through 23:00:07.453Z. Script header at
`.claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log:1-38`.
