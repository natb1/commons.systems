---
id: tactic-duplicate-finding-sensor
kind: tactic
statement: Build the duplicate-findings sensor — count distinct tactics
  recording the same root-cause defect, read over tactics carrying
  attributes.measured_impact, attributed to /rsi
owner: ai
status: raw
parent: null
rationale: Drafted 2026-08-14 by the /align round that dissolved the finding
  ledger as a distinct graph primitive. Carries the observable that round added
  to this strategy's success_signal. It lives here rather than on
  strategy-graph-native-dispatch because the instrument that reads it is /rsi
  and a sensor lives with its instrument, while the rule it measures lives on
  strategy-graph-native-dispatch.
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
blocked_by:
  - tactic-eval-finding-ledger
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Build the duplicate-findings sensor

Drafted 2026-08-14 by the `/align` round that dissolved the finding ledger as a
distinct graph primitive. It carries the observable that round added to
`strategy-recursive-self-improvement`'s `success_signal` — see that node's "What
observable says uniform finding recording actually holds" clarification, which
is the normative statement of what this sensor reads and why it lives here.

## What it reads

- **Observable:** the count of distinct tactics recording the SAME root-cause
  defect.
- **Sensor:** a graph read over tactics carrying `attributes.measured_impact`.
- **Threshold:** no new duplicate pair per evaluation window.

## Baseline already on the graph

Measured 2026-08-13 on `tactic-eval-finding-eval-finding-list-misses-nonledger`
and reusable as the first reading:

| metric | value |
|---|---|
| `duplicate_finding_nodes_same_defect` | 2 |
| `finding_nodes_outside_ledger_namespace` | 1 |
| `finding_nodes_without_recurrence_metric` | 3 |
| `ledger_invisible_fraction` | 0.158 |

## Why it can only now be read honestly

Today a duplicate minted outside the `tactic-eval-finding-*` namespace is
structurally invisible to `dispatch-eval-finding --list`, so the figure is
unreadable rather than merely unread. Once the namespace stops being the
membership test (`tactic-eval-finding-ledger`), the whole finding population is
in scope and the count means what it says.

## The honest limit, carried from the interview

"The same root-cause defect" is a **similarity judgment**, so this sensor is
model-read, not mechanical — the same delegated judgment merge-on-similarity
already rests on. Under `strategy-token-economy`'s standing condition, a yield
metric credited to a named instrument must be verified to have come from that
instrument, so the reading must be sensor-attributed to `/rsi` and not
hand-entered. Do not present this figure as a mechanical count.

Register it through the graph's existing `success_signal`/readings machinery on
its owning strategy, per `read-sensors.ts`; note that the sensor's registered
name is coupled to the owning node's prose, so renaming the observable in that
clarification silently de-registers it.

## Dependencies

`tactic-eval-finding-ledger` — the namespace must stop being the membership test
before the count is meaningful.

## Verification

- The sensor emits a dated reading attributed to `/rsi` on the owning strategy.
- Re-running it over `origin/main` at `1fe2dd85` reproduces the 2026-08-13
  baseline figures above, or explains each difference.
- A hand-planted duplicate pair is detected; a genuine recurrence recorded on a
  single node is not counted as one.
