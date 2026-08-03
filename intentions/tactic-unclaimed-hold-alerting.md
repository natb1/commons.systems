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
clarifications:
  - question: Does the greenfield conflict redesign dissolve this tactic, since it
      removes the provision-conflict hold that motivated it?
    answer: "(Recorded 2026-08-03, author-confirmed.) It dissolves the MOTIVATING
      CASE but not the tactic. [[tactic-graph-router-conflict-routing]]'s
      ratified target design retires the provision-conflict hold entirely: a
      conflict is handled exactly like a failing CI check — interrupt phase
      progression, launch the resolver directly, and park the SOURCE node's own
      `office_hours` when (and only when) author intention is required. With no
      hold node standing between the conflicted node and the queue, the source
      carries its real attention into `officeHoursQueue` by construction, and
      both halves recorded here — the missing alerting surface and the false
      de-prioritization — stop applying to conflicts specifically. THIS TACTIC'S
      LIVE SURFACE IS THEREFORE RE-SCOPED to the hold kinds the redesign does
      not reach: `fix-attempt-cap` (which deliberately KEEPS the hold shape —
      see [[tactic-mechanical-park-producers]]' companion clarification, because
      a source can be blocked by several independent fix caps at once and
      resolving one auto-resumes it through `blockersComplete`),
      `worktree-residue`, and any future kind. That surface is not hypothetical:
      three live `fix-attempt-cap` holds were parked 2026-08-01/08-03
      (`tactic-hold-fix-cap-attention-boost-scripts`,
      `tactic-hold-fix-cap-graph-router-live-worker-read-robust`,
      `tactic-hold-fix-cap-stale-hold-auto-resolve`), each with the identical
      structural problem this node describes. SEQUENCING: this tactic is no
      longer gated on, nor duplicated by, the conflict redesign — the two are
      independent, and neither blocks the other. If the `officeHoursQueue` fix
      recorded in the clarification below lands FIRST it is still correct and
      still needed (it is keyed on `hold_kind`-agnostic structure, not on
      `provision-conflict`); if the redesign lands first, this tactic simply has
      one fewer producer to cover. Update the `statement` to drop
      'provision-conflict' in favor of the general hold case at the next
      `/align-tactics` round."
  - question: Where should a provision-conflict hold's office-hours queue
      priority be computed — snapshotted into the hold at birth, or resolved
      live from its source at queue time?
    answer: "Live at queue time (2026-08-01). Two implementation sites were
      considered. (1) buildHoldNode
      (packages/intentionsutil/scripts/hold-node-decide.ts:161-196) could write
      an attention.override computed from the source's own
      resolveAttention(...).value at hold-creation time — simpler, one write, no
      read-path cost. Rejected on two grounds: it is a point-in-time SNAPSHOT
      that goes stale the moment the source's own attention changes (an
      authored boost, a serves re-parent, or any strategy-level distribution
      shift), and it is already ruled out by this node's own 'What is explicitly
      NOT in scope' section, which excludes changes to hold-node-decide.ts's
      hold birth. (2) officeHoursQueue
      (packages/intentionsutil/src/officeHours.ts:48-75) should instead, for a
      queue member carrying attributes.hold_for, substitute the LIVE resolved
      (tier, value) of the named source node for the hold's own — always
      current, never stale, at the cost of one extra map lookup per hold in the
      queue. Preferred. attributes.hold_for is currently WRITE-ONLY: set at
      hold-node-decide.ts:188 and read nowhere in production code (grep finds it
      only in test/hold-node-decide.test.ts and scripts/test-hold-node.sh), so
      no existing mechanism propagates it and nothing depends on its present
      semantics."
  - question: Does inheriting the source's attention for queue priority reverse
      tactic-mechanical-park-producers' decision to park an ambiguous conflict
      via a separate hold node?
    answer: "No (2026-08-01). tactic-mechanical-park-producers decided that an
      ambiguous provision conflict is recorded as a NEW sibling hold node
      carrying attributes.hold_for/hold_kind, born parked with no phase, with
      the source holding a blocked_by edge on it — rather than by writing the
      source's own office_hours. That rationale is entirely about PHASE and
      cross-branch-remediation mechanics (a source already at a phase must not
      have that phase overwritten by a park; the remediation happens on a
      different branch than the source's), and it stands unchanged here. The
      hold still exists as a separate node, still born parked, still carries the
      edge. Only its QUEUE PRIORITY changes — a concern
      tactic-mechanical-park-producers never discusses; its record contains no
      treatment of attention, ranking, or office-hours ordering at all. This is
      an oversight in how two correct decisions compose, not a considered
      tradeoff being reopened."
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
attention:
  boost: 12
  override: null
  rationale: "Author-directed 2026-08-03: prioritize bug-ledger fixes directly
    BELOW the token-efficiency cluster. Boost 12 resolves to 17.33 because an
    inbound distributor adds 5.33 — under that cluster's 20.00 and above the
    5.33 undecomposed baseline. Simulated over the live store before writing:
    0 tier changes, 0 value drift onto non-target nodes."
  tier: 1
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
- **`tactic-mechanical-park-producers`' phase/edge-mechanics decision.** That
  node ruled that an ambiguous provision conflict is recorded as a separate
  sibling hold node — born parked, no phase, `attributes.hold_for` naming the
  source, with the source carrying the `blocked_by` edge — rather than by
  writing the source's own `office_hours`. Its rationale is entirely about
  phase preservation and cross-branch remediation, and it is correct. This node
  changes none of it: the hold still exists as its own node, still born parked,
  still holds the edge. Only the hold's **queue priority** is at issue — a
  subject `tactic-mechanical-park-producers` never addresses (its record has no
  treatment of attention, ranking, or office-hours ordering). This is an
  oversight in how two individually-correct decisions compose, not a reopening
  of either.

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

## Concrete fix locations for the priority half (recorded 2026-08-01)

The ordering question above is narrowed by a second, code-cited measurement of
the same defect. Two sites can carry the priority inheritance; the second is
preferred. See `clarifications` for the full reasoning.

- **`buildHoldNode`** — `packages/intentionsutil/scripts/hold-node-decide.ts:161-196`.
  Set an `attention` block (an `override`) on the born hold, computed from the
  source's own `resolveAttention(...).value` at hold-creation time. Simpler: one
  write, zero read-path cost, and every downstream consumer of resolved
  attention picks it up for free. **Not preferred.** It is a point-in-time
  snapshot that goes stale as soon as the source's own attention moves, and it
  is already excluded by this node's own out-of-scope list above (no changes to
  hold birth).
- **`officeHoursQueue`** — `packages/intentionsutil/src/officeHours.ts:48-75`.
  When a queue member carries `attributes.hold_for`, substitute the LIVE
  resolved `(tier, value)` of the named source node in place of the hold's own
  `attention.get(n.id)` result at `officeHours.ts:59-60`, leaving
  `resolveAttention` itself untouched. **Preferred** — always current, no
  staleness window, and it keeps the change inside the surfacing layer exactly
  as the settled `attention.ts` doctrine directs ("blocking precedence is a
  separate, structural concern of the selector"). Cost: one extra map lookup per
  hold in the queue.

`attributes.hold_for` is today **write-only** — set at `hold-node-decide.ts:188`
and read by no production code (grep 2026-08-01 finds it only in
`packages/intentionsutil/test/hold-node-decide.test.ts` and
`packages/intentionsutil/scripts/test-hold-node.sh`). Nothing currently
propagates it, so reading it in the surfacing layer breaks no existing
contract. Note it is a single forward pointer, whereas the candidate shape
above keys on the inbound `blocked_by` edges naming the hold; the inbound form
generalizes to a hold blocking more than one source, `hold_for` is the O(1)
authoritative key for the provision-conflict case. Decomposition picks one, or
uses `hold_for` with an inbound-edge fallback.

Measured live 2026-08-01 on the same pair as above: source
`tactic-review-code-review-invocation-contract` resolved to **60.33**, its hold
`tactic-hold-conflict-review-code-review-invocation-contract` to **5.33** —
15th of 119 in the passive queue. The hold's `parent` is always `null` and
`buildHoldNode` authors no `attention` of its own, so all it inherits is what
its copied `serves` distributes; the 60.33 behind it is structurally invisible
to `officeHoursQueue`.
