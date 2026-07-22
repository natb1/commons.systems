---
id: tactic-decision-trace-first-reading
kind: tactic
statement: "Office-hours sitting: take strategy-explicit-intent's first
  decision-traceability reading from the trace digest and record reading/gap"
owner: human
status: codified
parent: null
rationale: The strategy's sensor is owner review at office-hours — human
  judgment, never auto-written. This born-parked sitting consumes the digest
  tactic-decision-trace-instrument lands and produces the strategy's first
  reading, closing the fresh-reading gate for a future round. Chunked to about
  15 author-minutes.
reading: null
gap: null
serves:
  - strategy-explicit-intent
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-explicit-intent
blocked_by: []
office_hours:
  reason: "Office-hours reading sitting (~15 author-minutes): run the
    decision-trace digest (npx tsx
    packages/intentionsutil/scripts/trace-decisions.ts, landed by
    tactic-decision-trace-instrument — the blocked_by edge gates this) over the
    window since the last review cycle, judge the threshold (at least one
    decision that changed because a node changed), and record the result as
    reading/gap on strategy-explicit-intent via dump-node.ts then write-node.ts
    then graph-commit. The sensor is owner review, so the reading is
    owner-ratified, never auto-written."
  since: 2026-07-11
  recommendation: "At the first sitting after the instrument lands: review the
    digest, record reading (e.g. 'review cycle YYYY-MM-DD: N decisions traced to
    node changes — <node ids>') and gap against the threshold; if this closes
    the round's last open tactic, stamp rounds {count: 1, last_completed:
    <date>} on the strategy in the same commit."
pace_exempt: false
rounds: null
attributes: {}
---
# Office-hours sitting: take strategy-explicit-intent's first decision-traceability reading from the trace digest and record reading/gap

Born-parked (/align-tactics Step 4, 2026-07-11 round): the strategy's sensor
is owner review at office-hours, so the reading is taken by the author — the
`office_hours.reason` and `.recommendation` carry the sitting procedure. No
implement-phase plan belongs here. Blocked on tactic-decision-trace-instrument
(the digest the sitting reviews).
