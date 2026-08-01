---
id: tactic-unclaimed-hold-alerting
kind: tactic
statement: A provision-conflict hold blocking a top-ranked source node has no
  active alerting surface — it sits in the generic office-hours pull queue
  ranked by its OWN attention (near zero), so the highest-attention work in the
  graph can stay silently blocked indefinitely
owner: ai
status: raw
parent: null
rationale: "Found live 2026-08-01 on
  tactic-review-code-review-invocation-contract (PR #3007). That node resolves
  to attention value 60.33 — the highest UNPARKED value in the graph — yet sat
  invisible behind tactic-hold-conflict-review-code-review-invocation-contract
  (attributes.hold_kind: provision-conflict) with ZERO proactive signal until a
  human happened to investigate why it was not progressing. Three code-read
  confirmations behind this: (1) select-targets.ts/router.ts never select a
  provision-conflict hold as work — router.ts:300 and :344 gate every candidate
  loop on office_hours !== null, and hold-node-decide.ts:167-196's buildHoldNode
  births the hold already parked with no phase, so a hold is parked furniture
  from birth and is never attention-ranked as work. (2) Nothing autonomously
  re-attempts /dispatch-conflict Lane 3 against an EXISTING hold:
  dispatch-graph-execute case 11 and reconcile-graph-review-stall both only
  CREATE a hold once on first failure, and resolve-hold only clears state. (3)
  The gap this node records is that there is also no ACTIVE alerting. The
  measured mechanism: attention.ts:251-256,324-327 deliberately excludes
  blocked_by from the distributor relation, so a boost on a blocked node does
  not flow into its blocker; officeHours.ts:48-74 then ranks the office-hours
  queue by each PARKED node's own resolved attention. Measured on the live store
  2026-08-01: the source resolves to 60.33 while its hold resolves to 5.33, tier
  1 — 15th in a 119-deep pull queue, in a flat band with five unrelated 5.33
  nodes. The queue is drained only when a human happens to run /office-hours.
  Nothing pages, nothing appears in a fleet-health check, and nothing
  distinguishes a provision-conflict hold sitting unclaimed for days from
  ordinary office-hours volume. Sibling finding to
  tactic-stale-hold-auto-resolve (bug M), NOT a duplicate: M mechanizes
  re-checking a hold's own predicate and gives provision-conflict KIND_RECHECK
  policy manual with a written reason, whose only surface is one
  skip-manual-policy stderr line and a manual=N counter in a per-tick journald
  summary. That auto-retry doctrine is correct and this node does NOT reopen it
  — re-running a subagent's own ambiguous verdict with no new information would
  just loop. What is missing is the operator surface for the kinds correctly
  excluded from auto-retry. Filed as a sibling rather than an amendment to M
  because M is phase: qa with PR #3011 open and a scope-fingerprint stamp on
  disk: tacticScopeFingerprint hashes (statement, body), so extending M's body
  would demote it back to implement (scope-sweep.ts:60-80,
  check-node-selection.ts check 5) and discard in-flight work."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: "A hold node that is (a) office_hours non-null, (b)
    attributes.hold_kind whose KIND_RECHECK policy is manual (provision-conflict
    today), and (c) unclaimed — no live session under
    .claude/worktrees/<attributes.hold_for> — is surfaced with a priority
    derived from the MAXIMUM resolved attention of the sources it blocks, not
    from its own near-zero resolved attention. Verified by a fixture: a
    manual-policy hold whose hold_for source resolves near the top of the graph
    must surface ahead of unrelated parked nodes ranking above the hold's own
    value, and its age since office_hours.since must be visible on that
    surface."
  sensor: test fixture over the surfacing enumerator (shape of
    packages/intentionsutil/test/officeHours.test.ts / scope-sweep.test.ts)
  threshold: the fixture passes; no existing office-hours ordering test is weakened
  is_proxy: false
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
# A provision-conflict hold blocking a top-ranked source node has no active alerting surface — it sits in the generic office-hours pull queue ranked by its OWN attention (near zero), so the highest-attention work in the graph can stay silently blocked indefinitely

Draft finding, not yet decomposed — recorded per the standing rule that a
confirmed defect becomes a tracked node rather than prose in a session
transcript. `/align-tactics` owns the decomposition and the plan.

## What was measured

`tactic-review-code-review-invocation-contract` (PR #3007) resolves to attention
value **60.33** — the highest unparked value in the graph. It was blocked by
`tactic-hold-conflict-review-code-review-invocation-contract`
(`attributes.hold_kind: provision-conflict`, `attributes.hold_for` naming the
source), born parked by `hold-node`. Measured against the live store on
2026-08-01, that hold resolves to **5.33, tier 1** — 15th in a **119-deep**
office-hours queue, sharing a flat 5.33 band with five unrelated parked nodes.
Nothing paged. The block was found only because a human went looking for why the
top-ranked node was not moving.

## Why the hold is invisible, in code

Two settled, individually-correct design decisions compose into the gap:

- `packages/intentionsutil/src/attention.ts:251-256,324-327` — `blocked_by` is
  **deliberately excluded** from the attention distributor relation: "a boost on
  a blocked node no longer lifts its blockers... an authored value flowing into
  a blocker made the blocker's rank a function of who happened to be blocked on
  it, which is not what the author claimed." The same comment names the escape
  hatch this node needs: *"Blocking precedence is a separate, structural concern
  of the selector."*
- `packages/intentionsutil/src/officeHours.ts:48-74` — `officeHoursQueue` orders
  parked nodes by **each parked node's own** resolved `(tier, rank)`. A hold
  carries `attention: null`, so it inherits only what its `serves` strategies
  distribute. The 60.33 on the source it blocks is invisible to the ordering.

So the queue that is supposed to surface the hold ranks it as if nothing
important were behind it, and the queue is drained only when a human happens to
run `/office-hours`.

## What is explicitly NOT in scope

- **The auto-retry doctrine stays as-is.** `tactic-stale-hold-auto-resolve`
  (bug M) classifies `provision-conflict` as `KIND_RECHECK` `policy: "manual"`
  because no single-call predicate distinguishes "resolved" from "not yet
  attempted". That reasoning is correct — re-running a resolver subagent's own
  `ambiguous` verdict with no new information would just loop. This node adds an
  **alerting** requirement only; it must not make `provision-conflict`
  auto-re-checkable.
- **Re-adding `blocked_by` to the attention distributor.** That reverses the
  settled doctrine quoted above. Blocked-source priority belongs to the
  surfacing/selection layer, not to resolved attention.
- Any change to `hold-node`, `hold-node-decide.ts`'s hold birth, or
  `resolve-hold`.

## Relationship to bug M (`tactic-stale-hold-auto-resolve`)

Sibling, not duplicate. M's Unit 4 sweep emits one `skip-manual-policy` stderr
line per manual-policy hold and a `manual=N` counter in a per-tick journald
summary. That is the *passive* half. Per this strategy's ALARM SURFACE
clarification (2026-07-31): *"A journald-only instrument has no counter, no
hold, no park and no operator surface, which is the exact defect class these
instruments exist to close."* This node is the active half M's plan explicitly
leaves out ("surfaced per sweep pass, which is the whole requirement" — it is
not).

Filed as a sibling rather than as an amendment to M because M is `phase: qa`
with PR #3011 open and a scope-fingerprint stamp on disk. `tacticScopeFingerprint`
hashes `(statement, body)`, so extending M's body would trip the scope-chained
staleness gate (`packages/intentionsutil/src/scope-sweep.ts:60-80`,
`check-node-selection.ts` check 5) and demote M back to `implement`, discarding
in-flight work.

## Candidate shape (for `/align-tactics`, not a decision)

Greenfield: give the hold's *surfacing* priority a **blocked-source-derived**
key — the max resolved `(tier, value)` over the sources naming it in
`blocked_by` — computed in the surfacing layer, leaving `resolveAttention`
untouched. Then a detect over the store: hold node, `office_hours !== null`,
`KIND_RECHECK[hold_kind].policy === "manual"`, no live session under
`.claude/worktrees/<attributes.hold_for>` (`worktree_has_live_session`), age
from `office_hours.since` past a declared bound. The finding lands as an
operator-visible surface, per the ALARM SURFACE ruling — never journald alone,
and never a fleet halt.

Open questions for decomposition: whether the fix belongs in `officeHoursQueue`'s
ordering, in `office-hours-select --list`, in a dedicated fleet-health detect, or
in some combination; and what age bound (if any) the author declares.
