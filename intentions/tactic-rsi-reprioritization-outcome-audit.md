---
id: tactic-rsi-reprioritization-outcome-audit
kind: tactic
statement: Derive the reprioritization delta and the post-hoc outcome audit —
  did tactics /rsi-evaluate front-loaded actually close faster than the queue
  baseline
owner: ai
status: raw
parent: null
rationale: "Split out 2026-08-11 after adversarial review of the round that
  created strategy-rsi-delegated-prioritization. That strategy names this
  measurement as the sensor for its outcome signal, but the work was filed
  inside tactic-rsi-plan-priority-render, which serves the sibling
  strategy-rsi-plan-surface. That inverts the stay-vs-move principle the same
  round recorded on the parent: completing this audit moves THIS strategy signal
  and does not move the surface child at all, and filing it outside the subtree
  made this strategy signal unreadable until an unrelated tactic landed."
reading: null
serves:
  - strategy-rsi-delegated-prioritization
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-rsi-plan-priority-render
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Derive the reprioritization delta and the post-hoc outcome audit — did tactics /rsi-evaluate front-loaded actually close faster than the queue baseline
## Scope (split out 2026-08-11 after adversarial review)

This is the **sensor** named by `strategy-rsi-delegated-prioritization`'s
success signal. Until it lands, that strategy's outcome half — observable
(a), "the median closure interval of tactics the model front-loaded, against
the dispatch queue's baseline closure interval" — cannot be read at all.

All work is in `packages/intentionsutil/scripts/render-rsi-plan.ts`. It sits
here rather than under the surface child because *deriving* the measurement
answers to this strategy; *rendering* it into rsi-plan.md is the surface
child's concern, and the two happen to share a file.

### Per-iteration reprioritization delta

Render what `/rsi-evaluate` moved this iteration, from `attributes.priority_log`
entries dated within it. This is the "what changed" half — it reports the
model's actions without judging them.

### The outcome audit

Derived at render time by joining `priority_log` entry dates with node closure
dates: **did the nodes the model front-loaded close faster than the queue's
baseline closure interval?** No new stored state — derived-on-read, the same
doctrine as rank itself.

Render **"insufficient data"** honestly until enough reprioritized nodes have
closed to support a median. A confident number computed from three closures is
worse than an admission, because this section exists to be the check on the
model's own judgment, and a check that always answers is not a check.

This is the post-hoc fitness audit the steelman mitigation on
`strategy-rsi-delegated-prioritization` names. Its adversarial reading matters
as much as its favourable one: a sustained result showing front-loaded nodes
closing *no faster* than baseline is evidence the delegated reordering is not
earning its authority, and should be surfaced as such rather than buried as a
null result.

### Dependencies and boundaries

- **No `blocked_by`.** It reads `attributes.priority_log`, whose schema and
  lint are `tactic-priority-provenance-schema` (also under this strategy), and
  it can be built against the field as currently written. If that tactic
  changes the shape, whichever lands second reconciles.
- The **integrity** half of this strategy's signal — cross-strategy rank
  inversions and attention writes carrying no `priority_log` entry — is *not*
  here. It is `validate-graph` lint, and it belongs to
  `tactic-priority-provenance-schema`.
- Section 6's typing and the renderer's FLAG kinds stayed with
  `tactic-rsi-plan-priority-render` under the surface child.

### Verification

- With no `priority_log` entries anywhere, the section renders "insufficient
  data" and does not error.
- Seed a `priority_log` entry for a node that has since closed, and confirm
  the join finds it and reports its interval against the baseline.
- Confirm the delta lists only entries dated within the current iteration,
  not the whole log.
- Confirm the audit's output is reachable from `/rsi` without hand-computation
  — it is the reading that fills this strategy's signal, so if a human has to
  derive the median themselves, the sensor is not built.
