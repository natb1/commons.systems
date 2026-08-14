---
id: tactic-eval-finding-workflow-file-writes-cost-subagent-roundtrips
kind: tactic
statement: Four of the twelve subagents a /review-fix pass launches exist only
  to write two result JSON files and stat them — 3.70 dollars and 9 turns of
  model inference for a write-plus-wc — because the Workflow tool has no
  filesystem access and the script must delegate every disk write to a subagent,
  and the result still records coverage_incomplete true because the size check
  is not exact
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
    - metric: plumbing_subagents_launched
      value: 4
      unit: subagents
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: plumbing_subagent_price_proxy_usd
      value: 3.7
      unit: usd
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: subagents_launched_total
      value: 12
      unit: subagents
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: review-fix result.json
      measured: 2026-08-14
    - metric: review_lens_subagents
      value: 5
      unit: subagents
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

`tactic-attention-namespaced-rank`, phase `review`, 2026-08-13. Workflow run
`wf_ffefa101-347` under worker session `6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6`.

`result.json` records `subagents_launched: 12`. Only **five** of them reviewed
anything — the opus lens agents that ran 22:53:07 → 22:54:51:
`security-review`, `input-validation`, a Firebase/Firestore + api-call-site
pass, a multi-domain `domain-sweep`, and `red-team`.

The other seven are post-processing, and **four of those exist only because a
Workflow script has no filesystem access**:

| started | model | turns | price | job |
| --- | --- | --- | --- | --- |
| 22:55:47 | sonnet | 2 | $1.14 | "Write a JSON file to disk. This is a mechanical copy — do NOT reformat, summarize, pretty-print, validate, or otherwise alter the content" |
| 22:56:03 | sonnet | 2 | $0.97 | "Report file sizes … Run EXACTLY this command line, and nothing else: `wc -c < …`" |
| 22:56:11 | sonnet | 3 | $1.42 | second mechanical JSON copy |
| 22:56:28 | sonnet | 2 | $0.17 | second `wc -c` receipt |

**$3.70 and 9 turns of model inference to write two files and stat them.**
The remaining three (a `pwd` prober at 22:54:54, a text-structurer at 22:55:04,
a disposition classifier at 22:55:14) are $8.74 more and are at least doing
judgment work.

The workaround does not even close. `result.json` carries:

```
"coverage_incomplete": true,
"coverage_note": "The result dump at …/result.json was not independently
 size-verified (this runtime has no TextEncoder, so the expected byte count is
 not exact); its integrity rests on the dump agents' own receipts."
```

So the phase pays four subagent round trips for a write-plus-verify and still
records the verification as incomplete. The sibling
`result.part1.json` / `part2.json` / `part3.json` files in the same directory
show the chunking dance the same constraint forces on larger dumps.

# What would have to change

The Workflow tool's documented contract is "No filesystem or Node.js API
access", so the script genuinely cannot write. The cheap fixes do not touch
that:

1. **Have the orchestrator write the dump, not a subagent.** `workflow()`
   returns its value to the calling session, which has `Write`. Returning the
   result object and letting the worker persist it removes all four agents for
   one Bash/Write call. This is the low-hanging one.
2. **Drop the `wc -c` receipt agents outright.** A separate model round trip to
   run one `wc -c` buys nothing the writer agent's own success does not already
   imply, and the `coverage_note` concedes the check is not exact anyway. If a
   size check is wanted, the orchestrator can do it in the same Bash call that
   writes.

Both are edits inside `review-fix.js`'s dump stage. Neither changes what is
reviewed, and (1) also removes the chunking split.

# Evidence

Workflow journal and the 12 per-agent transcripts under
`~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-namespaced-rank/6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6/subagents/workflows/wf_ffefa101-347/`;
each `agent-*.meta.json` carries the model, each `agent-*.jsonl` opens with the
prompt quoted above. `result.json` and `result.part*.json` under the node
worktree's `tmp/review-result-tactic-attention-namespaced-rank/` — worktree-local,
will not survive a sweep.
