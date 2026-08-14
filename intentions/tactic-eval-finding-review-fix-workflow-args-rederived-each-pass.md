---
id: tactic-eval-finding-review-fix-workflow-args-rederived-each-pass
kind: tactic
statement: The /review-fix worker re-derives the Workflow args contract by
  grepping .claude/workflows/review-fix.js source on every pass — three greps
  costing about 100 seconds, dumping 80 arg lines plus the scripts first 60 into
  a context already at 193827 tokens — because SKILL.md carries an args block
  that nothing declares authoritative, so a careful worker re-verifies it
  against the script body every single time
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
    - metric: args_rederivation_wall_clock_s
      value: 100
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: args_rederivation_bash_calls
      value: 3
      unit: calls
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: orchestrator_peak_context_tokens
      value: 193827
      unit: tokens
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
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

Between finishing the `/code-review` pre-stage (22:51:23Z) and calling the
Workflow tool (22:53:03Z) the worker spent **100 seconds and 8 Bash calls**
assembling the Workflow `args`. Three of those calls exist only to re-derive,
from source, which fields `review-fix.js` actually consumes:

```
wc -l .claude/workflows/review-fix.js
grep -n "args\.\|args\[" .claude/workflows/review-fix.js | head -80

grep -n "args\.review_plan\|args\.pr_num\|args\.surface\|args\.deps\b\|args\.implementing_issues\|args\.security_note\|args\.prior_phase_log\|args\.prescanned_findings" .claude/workflows/review-fix.js | head -30

grep -n "^const {" .claude/workflows/review-fix.js | head -5
grep -n "= args\b\|const args" .claude/workflows/review-fix.js | head -10
sed -n '1,60p' .claude/workflows/review-fix.js
```

That is up to 80 `args.` reference lines plus the script's first 60 lines pulled
into a context already at `peak_context=193827` — the highest of any session in
the phase.

`.claude/skills/review-fix/SKILL.md` **does** carry a Workflow args block (the
`review_base_recorded: <REVIEW_BASE_RECORDED>` line sits in it at :874). The
worker read that block and then went to the source anyway. So the defect is not
a missing list — it is that nothing in the SKILL declares the list complete and
authoritative, and the Workflow tool gives no schema error a worker could rely
on instead. A careful worker facing a tool call it cannot retry cheaply will
always choose to verify, so the verification happens on **every pass**, forever.

# What would have to change

One of these, none requiring redesign:

1. State in `SKILL.md` that the args block is the complete and authoritative
   field list, and that the script must not be read to confirm it — with the
   pairing obligation that any new `args.` field in `review-fix.js` updates the
   block in the same commit.
2. Or make `review-fix.js` validate `args` against a declared schema at entry
   and fail loudly on an unknown/missing field, so a worker can pass its best
   guess and be corrected in one cheap round trip instead of pre-verifying.

Option 2 is strictly better — it survives drift, where option 1 depends on the
pairing obligation being honoured — but option 1 is a one-paragraph edit.

The same shape is worth checking for the other Workflow-tool skills
(`qa-fix.js`, `align-tactics.js`); the ledger already carries
`qa-fix-workflow-named-by-path`, which is the same class of "the SKILL's
hand-off to the Workflow tool is not trustworthy enough to use as written."

# Evidence

Worker transcript `6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6.jsonl`, tool_use
entries timestamped 22:51:55.719Z, 22:51:58.908Z and 22:52:02.380Z, with
descriptions "Inspect review-fix.js Workflow script for expected args fields",
"Check additional args field usages", "Check top of script for args
destructuring".
