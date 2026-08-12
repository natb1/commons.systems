---
id: tactic-measured-impact-schema
kind: tactic
statement: Add attributes.measured_impact — summary {metric, value, unit,
  window, sensor, measured} records, fingerprint-exempt, never an ordering
  authority — with the validate-graph rule that keeps it honest
owner: ai
status: raw
parent: null
rationale: Drafted 2026-08-12 /align round. One field carries every ranking
  metric that is not a tier mark — recurrence_count and recoverable_tokens are
  two metrics in one shape, not two primitives. Serves
  strategy-graph-self-description as well because a new node field must be
  declared in the kind node, which is the sole schema.
reading: null
serves:
  - strategy-rsi-delegated-prioritization
  - strategy-graph-self-description
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
pace_exempt: false
rounds: null
attributes: {}
---
# Add attributes.measured_impact — summary {metric, value, unit, window, sensor, measured} records, fingerprint-exempt, never an ordering authority — with the validate-graph rule that keeps it honest

Drafted by the 2026-08-12 `/align` round. The ledger's **prioritization
column**. Read the "How are metrics other than tier marks recorded" and "Does a
recurrence count ever move rank or tier automatically" clarifications on
`strategy-rsi-delegated-prioritization` for the bounds this executes.

## The field

`attributes.measured_impact` — a set of summary records:

```
{metric, value, unit, window, sensor, measured}
```

`recurrence_count` and `recoverable_tokens` are two **metrics in one shape**,
not two primitives. That is the unifying observation: recurrence and impact are
both measured figures about a ledger entry, so the column is one field, not a
field per question.

## Four bounds, all recorded as conditions

1. **It never orders.** Queryable INPUT to a within-band attention write or to a
   classification act; never an ordering authority of its own. This preserves
   "no attention number, from any author, crosses a band" and "the model's only
   tier instrument stays classification."
2. **It must be cited.** A delegated attention write justified by a measurement
   names the record in `attributes.priority_log`'s rationale.
3. **It is sensor-attributed.** The `sensor` field brings it under
   `strategy-token-economy`'s condition that a yield metric credited to a named
   instrument is verified to have come from that instrument.
4. **It is summary, not an event log.** Deliberately unlike
   `attributes.priority_log`, which it otherwise resembles.

## How recurrence reaches tier — without new authority

Crossing a recurrence threshold makes an entry **eligible** for an act the model
is already permitted: adding `attributes.bug_fix: true` when the recurrence is
genuinely a defect. That lifts tier 1→2 through `ownTier`'s existing
`max(explicit, semantic, 1)` derivation
(`packages/intentionsutil/src/schema.ts:408`), with the `measured_impact` record
as the cited justification. **No new ordering authority is created by this
unit.**

## Scope

- Typed field in `packages/intentionsutil/src/schema.ts`.
- Declared in the kind node — `intentions/kind-tactic.md` — per
  `strategy-graph-self-description` (kind nodes are the sole schema).
- Fingerprint exemption, parallel to `attributes.priority_log` and
  `queue_summary`, so re-measurement does not freeze the measured entry's open
  children. **Unverified this round: how priority_log's exemption is
  implemented.** Find it before designing this half — it is likely in
  `strategyFingerprint` / the substance-fields set
  (`packages/intentionsutil/src/router.ts:111`).
- A `validate-graph` rule for shape. **Also unverified: whether a new attributes
  key needs its own rule to be trustworthy at all**, or whether the free-form
  `attributes` record makes one optional. Decide explicitly rather than by
  default.

## Out of scope

Any auto-write of `attention` or `attributes.tier` from a measured value. That
was considered and refused — it would contradict `dispatch-fleet-alarm`'s live
`attention: null` convention for machine-minted nodes.
