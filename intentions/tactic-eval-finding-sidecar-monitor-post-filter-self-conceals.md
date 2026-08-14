---
id: tactic-eval-finding-sidecar-monitor-post-filter-self-conceals
kind: tactic
statement: aggregate-usage.sh computes window.sidecar_eligible/present/rate over
  the post-filter session list, so under --node a session missing its sidecar
  leaves both numerator and denominator and the monitor the stamping hook
  designates as its failure signal reports eligible:0 / rate:null —
  indistinguishable from "no workers scanned" — exactly when the stamping it
  monitors has failed
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
    - metric: sidecar_eligible_reported_at_node_scope
      value: 0
      unit: worker sessions
      window: tactic-align-review-skill align-tactics 2026-08-14
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: worker_sessions_actually_present_in_scope
      value: 1
      unit: worker sessions
      window: tactic-align-review-skill align-tactics 2026-08-14
      sensor: filesystem
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
The stamping hook `.claude/hooks/stamp-dispatch-session.sh` designates one
signal as its own failure detector. Its header:

> MONITOR: rsi-audit now surfaces `window.sidecar_eligible` … `window.sidecar_present`
> … and a derived `window.sidecar_present_rate` … **A drop in
> `sidecar_present_rate` for worker sessions is observable from existing
> transcripts** — this is the data-driven signal for the two uncertainties above.

That monitor cannot fire at `--node` scope, because it is computed *after* the
filter that the missing sidecar already removed the session from.

## Mechanism

`aggregate-usage.sh:1345-1354` computes all three fields over `$sessions`:

```jq
sidecar_eligible:  ( [ $sessions[] | select(.type=="worker") ] | length ),
sidecar_present:   ( [ $sessions[] | select(.type=="worker" and .artifact!=null) ] | length ),
sidecar_present_rate:
  ( ( [ $sessions[] | select(.type=="worker") ] | length ) as $elig
    | if $elig==0 then null else … end )
```

`$sessions` is the **post-filter** list. The `--node` filter at
`aggregate-usage.sh:1437-1443` `continue`s on a missing sidecar *before*
`FILES_SCANNED` is incremented and before the session ever reaches the stage-1
pipeline. So a session with no sidecar leaves the numerator **and** the
denominator together — the rate is not depressed, it is undefined.

The observed output for `--node tactic-align-review-skill` (2026-08-14,
`align-tactics` phase, exit-11 ladder run):

```json
"sidecar_eligible": 0,
"sidecar_present": 0,
"sidecar_present_rate": null
```

`null` is documented to mean "no workers were scanned." Here it means "every
worker was scanned and every one was silently discarded." The two states are
indistinguishable in the output, and the second is precisely the failure the
monitor exists to catch.

## Why it matters

This is a self-concealing instrument. The per-phase evaluator prescribed by
condition 14 runs at node scope by construction (the `/rsi` skill's Step 2
passes `--node <node-id>`), so the evaluator best positioned to notice that
stamping has broken is the one configuration in which the detector is guaranteed
to read `null`. Detection is possible only from a fleet-scope run that nobody is
obliged to make, and only if that run happens before the transcripts age out.

Companion finding: the stamping gap this monitor failed to report is
`ladder-worker-unstamped-audit-blind`, landed the same run — $81.94 price-proxy
and 314 turns of one phase left unmeasured.

## What would have to change

Count sidecar eligibility/presence over the sessions enumerated by the `find`
sweep *before* the `--node` / `--session` scope filter, or emit a separate
`window.scope_filter_dropped_unstamped` count so a scoped run can distinguish
"no workers" from "workers dropped for want of a stamp." Either way the fix is
in `aggregate-usage.sh`, not in the hook. Recommendation only — not applied.
