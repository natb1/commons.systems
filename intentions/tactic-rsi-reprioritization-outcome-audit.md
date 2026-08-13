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
clarifications:
  - question: This node's blocker was pruned and its implementation file was
      deleted. Where does the work live now, and is the node still worth
      building?
    answer: >-
      (Recorded 2026-08-13 with the prune round that followed the collapse, PR
      3074.) Still worth building — this node is the SENSOR named by
      strategy-rsi-delegated-prioritization's success signal, so pruning it
      would leave that strategy's outcome half with no carrier at all. What
      changes is where it lives and what it waits on.


      The blocked_by on tactic-rsi-plan-priority-render is cleared. That node is
      pruned: it typed the rsi-plan.md task-plan section and added the
      renderer's staleness FLAG kinds, and both the section and the renderer are
      retired doctrine. This also settles a contradiction that was standing on
      main — the body below says 'No blocked_by' in its own Dependencies section
      while the frontmatter carried one. The body was right.


      The carrier moves from the renderer to /rsi-audit. The body says 'All work
      is in packages/intentionsutil/scripts/render-rsi-plan.ts'; that file was
      deleted by the collapse. Both halves — the per-iteration reprioritization
      delta and the post-hoc outcome audit — become /rsi-audit lens sections,
      alongside the per-workflow spend fold that landed with PR 3074. The
      measurement is unchanged: join attributes.priority_log entry dates with
      node closure dates, derived on read, no new stored state, and report
      'insufficient data' honestly rather than a median computed from three
      closures.


      The actuator whose acts it audits is /rsi-audit, not the /rsi-evaluate
      named in the statement and body — that skill was retired unbuilt and its
      node is pruned in this same round. The statement is left as written
      because it is a dated record and this clarification is what makes it
      readable as one.


      Worth stating rather than discovering: nothing can be measured yet.
      attributes.priority_log has no writer anywhere on main — it is prose in
      eight node files — so the join has an empty left side by construction. The
      real prerequisite is tactic-rsi-audit-prioritization-writer, itself
      blocked on tactic-attention-namespaced-rank. That is deliberately NOT
      recorded as a blocked_by: this node can be built against the field as
      written and will read 'insufficient data' until entries exist, which is
      the honest reading and not a failure.
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
