---
id: tactic-unclaimed-hold-alerting
kind: tactic
statement: A manual-policy hold blocking a top-ranked source node has no active
  alerting surface — it sits in the generic office-hours pull queue ranked by
  its OWN attention (near zero), so the highest-attention work in the graph can
  stay silently blocked indefinitely
owner: ai
status: codified
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
  - question: Where should a provision-conflict hold's office-hours queue priority
      be computed — snapshotted into the hold at birth, or resolved live from
      its source at queue time?
    answer: "Live at queue time (2026-08-01). Two implementation sites were
      considered. (1) buildHoldNode
      (packages/intentionsutil/scripts/hold-node-decide.ts:161-196) could write
      an attention.override computed from the source's own
      resolveAttention(...).value at hold-creation time — simpler, one write, no
      read-path cost. Rejected on two grounds: it is a point-in-time SNAPSHOT
      that goes stale the moment the source's own attention changes (an authored
      boost, a serves re-parent, or any strategy-level distribution shift), and
      it is already ruled out by this node's own 'What is explicitly NOT in
      scope' section, which excludes changes to hold-node-decide.ts's hold
      birth. (2) officeHoursQueue
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
    answer: No (2026-08-01). tactic-mechanical-park-producers decided that an
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
      tradeoff being reopened.
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
    5.33 undecomposed baseline. Simulated over the live store before writing: 0
    tier changes, 0 value drift onto non-target nodes."
  tier: 1
phase: review
execution:
  branch: tactic-unclaimed-hold-alerting
  pr: 3036
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A manual-policy hold blocking a top-ranked source node has no active alerting surface — it sits in the generic office-hours pull queue ranked by its OWN attention (near zero), so the highest-attention work in the graph can stay silently blocked indefinitely

## Context

**The failure, measured live 2026-08-01.**
`tactic-review-code-review-invocation-contract` (PR #3007) resolved to attention
value **60.33** — the highest UNPARKED value in the graph. It was blocked by
`tactic-hold-conflict-review-code-review-invocation-contract`
(`attributes.hold_kind: provision-conflict`, `attributes.hold_for` naming the
source), born parked by `hold-node`. Measured against the live store that day,
the hold resolved to **5.33, tier 1** — 15th in a **119-deep** office-hours
queue, sharing a flat 5.33 band with five unrelated parked nodes. Nothing paged.
The block was found only because a human went looking for why the top-ranked node
was not moving. (That specific pair has since been cleared by hand — at HEAD the
hold is `phase: done` and the source's `blocked_by` is empty. The by-hand clear
IS the manual path this tactic replaces; the defect class is unchanged.)

**Why the hold is invisible, in code.** Two settled, individually-correct design
decisions compose into the gap:

- `packages/intentionsutil/src/attention.ts:251-256` — `blocked_by` is
  **deliberately excluded** from the attention distributor relation: "a boost on
  a blocked node no longer lifts its blockers… an authored value flowing into a
  blocker made the blocker's rank a function of who happened to be blocked on it,
  which is not what the author claimed." The same comment names the escape hatch
  this node needs: *"Blocking precedence is a separate, structural concern of the
  selector."*
- `packages/intentionsutil/src/officeHours.ts:48-75` — `officeHoursQueue` orders
  parked nodes by **each parked node's own** resolved `(tier, rank)`
  (`attention.get(n.id)` at `officeHours.ts:59-60`). A hold carries
  `attention: null` and `parent: null` (`hold-node-decide.ts:96-131`), so it
  inherits only what its copied `serves` distributes. The 60.33 on the source it
  blocks is invisible to the ordering.

Three further code-read confirmations, still true at HEAD:

1. `select-targets.ts` / `router.ts` never select a provision-conflict hold as
   work — `router.ts:300` and `:344` gate every candidate loop on
   `office_hours !== null`, and `buildHoldNode`
   (`packages/intentionsutil/scripts/hold-node-decide.ts:96-131`) births the hold
   already parked with no phase. A hold is parked furniture from birth and is
   never attention-ranked as work.
2. Nothing autonomously re-attempts `/dispatch-conflict` Lane 3 against an
   EXISTING hold: `dispatch-graph-execute` case 11 and
   `reconcile-graph-review-stall` only CREATE a hold once on first failure, and
   `resolve-hold` only clears state.
3. There is no ACTIVE alerting. The queue that is supposed to surface the hold
   ranks it as if nothing important were behind it, and that queue is drained
   only when a human happens to run `/office-hours`.

**Intended outcome.** Two halves, both landed by this node:

- **Priority** — a hold's *surfacing* position reflects the work it blocks, so it
  cannot sit 15th behind unrelated 5.33 parks. Computed in the surfacing layer,
  leaving `resolveAttention` untouched.
- **Active alerting** — a manual-policy hold that has blocked top-ranked work
  past a declared age bound with nobody working it raises a fleet alarm that
  lands as a graph node, per this strategy's ALARM SURFACE ruling (2026-07-31):
  *"A journald-only instrument has no counter, no hold, no park and no operator
  surface, which is the exact defect class these instruments exist to close."*

### What is explicitly NOT in scope

- **The auto-retry doctrine stays as-is.** `tactic-stale-hold-auto-resolve`
  (bug M, now landed — `src/holds.ts`, `src/hold-sweep.ts`,
  `scripts/list-recheckable-holds.ts`, `lib-stale-hold-recheck.sh` are all on
  main) classifies `provision-conflict` as `KIND_RECHECK` `policy: "manual"`
  because no single-call predicate distinguishes "resolved" from "not yet
  attempted" (`packages/intentionsutil/src/holds.ts:117-132`). That reasoning is
  correct — re-running a resolver subagent's own `ambiguous` verdict with no new
  information would just loop. This node adds an **alerting** requirement only;
  it must not make any hold kind auto-re-checkable, and it must not add a second
  hold-resolution code path. Nothing here writes a hold, resolves a hold, or
  touches a `blocked_by` edge.
- **Re-adding `blocked_by` to the attention distributor.** That reverses the
  settled doctrine quoted above. Blocked-source priority belongs to the
  surfacing/selection layer, not to resolved attention. `attention.ts` is not
  edited by any unit of this plan.
- **Any change to `hold-node`, `hold-node-decide.ts`'s hold birth, or
  `resolve-hold`.** In particular the rejected alternative of stamping an
  `attention.override` onto the born hold: it is a point-in-time snapshot that
  goes stale the moment the source's attention moves, and it edits hold birth.
- **`tactic-mechanical-park-producers`' phase/edge-mechanics decision.** That
  node ruled that an ambiguous provision conflict is recorded as a separate
  sibling hold node — born parked, no phase, `attributes.hold_for` naming the
  source, with the source carrying the `blocked_by` edge — rather than by writing
  the source's own `office_hours`. Its rationale is about phase preservation and
  cross-branch remediation, and it is correct. This node changes none of it: the
  hold still exists as its own node, still born parked, still holds the edge.
  Only the hold's **queue priority** and its **alerting** are at issue — subjects
  `tactic-mechanical-park-producers` never addresses. This is an oversight in how
  two individually-correct decisions compose, not a reopening of either.
- **Any fleet halt.** The 2026-07-31 NEVER FLEET-HALT ruling is binding: the new
  instrument reports, it never pauses the fleet, never writes `office_hours` on
  another node, and never writes a `blocked_by` edge. Its only graph side effect
  is its own `tactic-fleet-alarm-<kind>` node via `dispatch-fleet-alarm`.

### Relationship to bug M (`tactic-stale-hold-auto-resolve`)

Sibling, not duplicate. M's sweep emits one `skip-manual-policy` stderr line per
manual-policy hold and a `manual=N` counter in a per-tick journald summary
(`lib-stale-hold-recheck.sh`, step 3b). That is the *passive* half. This node is
the active half M's plan explicitly leaves out. Filed as a sibling rather than as
an amendment to M because M was `phase: qa` with PR #3011 open and a
scope-fingerprint stamp on disk; `tacticScopeFingerprint` hashes
`(statement, body)`, so extending M's body would have tripped the scope-chained
staleness gate (`packages/intentionsutil/src/scope-sweep.ts:60-80`,
`check-node-selection.ts` check 5) and demoted M back to `implement`, discarding
in-flight work. M has since reached `main-qa`; this plan builds ON its landed
primitives (`listHoldCandidates`, `list-recheckable-holds.ts`, `KIND_RECHECK`)
and modifies none of them.

### Correction to this node's own earlier record

An earlier draft of this body stated that `attributes.hold_for` is "write-only —
set at `hold-node-decide.ts:188` and read by no production code (grep
2026-08-01)". **That is now stale**: bug M landed `hold-sweep.ts:116`, which
reads `attributes.hold_for` in production. It does not change the design below —
this plan still keys the priority lift off the **inbound `blocked_by` edge**
rather than off `hold_for` (see Unit 1's rationale), so `hold_for` gains no new
consumer here.

---

## Unit 1 — blocked-source-derived surfacing priority in `officeHoursQueue`

**Scope.** `packages/intentionsutil/src/officeHours.ts` only (plus its tests).

Today `officeHoursQueue` (`officeHours.ts:48-75`) builds each `QueueMember` from
`attention.get(n.id)` alone (`:59-60`). Change it so a parked node's **surfacing
key** is the lexicographic max of its own resolved `(tier, value)` and the
resolved `(tier, value)` of every node it blocks.

Precise semantics:

1. `resolveAttention(nodes)` is already called once at `officeHours.ts:49` —
   reuse that Map. Do NOT call it a second time and do NOT modify `attention.ts`.
2. Build a reverse-blocker index ONCE before the member loop:
   `for (const n of nodes) for (const b of n.blocked_by) reverse.get(b).push(n)`.
   Mirror the loop shape at `attention.ts:162-173` (`reverseBlockers` inside
   `computeSignalPath`) — but write it locally in `officeHours.ts`; that helper
   is private to `attention.ts` and `attention.ts` is out of scope.
3. For each parked member `n`, the **blocking-source set** is
   `reverse.get(n.id)` filtered to sources with `phase !== "done"`. A `done`
   source is a cleared blocker, matching the convention `openBlockers` already
   uses at `officeHours.ts:89-103` — reuse that convention, do not invent a
   second one.
4. `liftedFrom` = the id of the blocking source with the maximum
   `(tier, value)`, ties broken by id ascending; `null` when the set is empty or
   when no source's `(tier, value)` strictly exceeds the member's own.
5. `tier` and `rank` on the emitted `QueueMember` become the surfacing key:
   `tier` = max tier over `{own} ∪ sources`; the pre-penalty value = the value
   paired with that max under lexicographic `(tier, value)` comparison (i.e.
   compare `(tier, value)` pairs, not tier and value independently). The existing
   `SESSION_TYPE_PENALTY` multiplication (`officeHours.ts:57-58,62`) then applies
   to that value exactly as it does today — the penalty is a property of the
   park's session type, not of where the value came from, and it must still never
   affect the tier comparison.
6. `QueueMember` (`officeHours.ts:14-27`) gains three fields: `ownTier: number`,
   `ownRank: number` (the pre-lift values, penalty applied, i.e. today's
   semantics), and `liftedFrom: string | null`. The existing `tier`/`rank` field
   names are kept — every consumer already reads them as "the queue's ordering
   key", which is exactly what they remain.
7. The sort comparator at `officeHours.ts:69-74` is unchanged.
8. Missing-attention fallbacks are preserved verbatim: `?? 0` for value, `?? 1`
   for tier, for sources as well as for the member itself.

Behavior for a parked node with no inbound `blocked_by` edges is **byte-identical
to today** — the existing tests in `packages/intentionsutil/test/office-hours.test.ts`
must pass unmodified. Do not edit an existing assertion in that file; only add
cases.

**Why the inbound edge and not `attributes.hold_for`.** A live hold always
carries the inbound edge: `decideHold` writes `source_blocked_by` including the
hold id (`hold-node-decide.ts:184-192`), and `listHoldCandidates` treats a hold
whose source's `blocked_by` no longer contains it as already resolved
(`hold-sweep.ts:125`). So the inbound edge is exactly as authoritative as
`hold_for` for a live hold, needs no `hold_kind`/canonical-id validation in the
surfacing layer, and generalizes for free to a hold blocking more than one source
and to any other parked node that blocks live work. Keying on `hold_for` would
make the surfacing layer a second consumer of a hold-specific attribute for no
added correctness.

**Blast radius, stated deliberately.** This applies to every parked node with
live inbound `blocked_by` edges, not only to holds. For parked nodes blocking
nothing (the overwhelming majority) the emitted key is unchanged. The lift is
monotone-up — a member's key can only rise, never fall — so nothing is demoted
in absolute terms; relative order changes only where a parked node is genuinely
blocking higher-ranked live work, which is the intended correction.

New tests to add in `packages/intentionsutil/test/office-hours.test.ts` (reuse
its existing `anode()`, `kinds()`, `boost()`, `parked()`, `parkedTyped()`
builders at lines 20-71 — do not write a new fixture builder):

- a parked hold with `blocked_by`-inbound source at boost 60 sorts ahead of an
  unrelated park at boost 40, and reports `ownRank` 0 and
  `liftedFrom: "<source-id>"`;
- a source at a higher **tier** lifts the hold's tier (tier dominates value);
- two blocking sources → the max is taken, `liftedFrom` names it, ties by id asc;
- a blocking source at `phase: "done"` does NOT lift (cleared blocker);
- a parked node whose own rank exceeds every blocking source keeps its own key and
  reports `liftedFrom: null`;
- the session-type penalty still applies to a lifted value, and still cannot cross
  a tier boundary;
- a parked node with no inbound edges is unchanged (`liftedFrom: null`,
  `rank === ownRank`, `tier === ownTier`).

**Recommended model.** opus

---

## Unit 2 — surface the lift in `office-hours-select --list` (stderr advisory)

**Scope.** `packages/intentionsutil/scripts/office-hours-select.ts` and its tests.

An operator reading `--list` must be able to see WHY a hold jumped the queue.

- `formatQueueRow` (`office-hours-select.ts:130-132`) is **unchanged**: its four
  tab-separated columns (`rank`, `sessionType`, `nodeId`, `since`) are parsed
  positionally by `packages/intentionsutil/scripts/office-hours-graph:253`
  (`while IFS=$'\t' read -r score sessiontype nid date`), where a fifth column
  would be absorbed into `$date` and a reorder would shift `$nid` and produce a
  false empty queue. Its pinning unit test stays as-is.
- In the `--list` branch (`office-hours-select.ts:246-249`), for each member with
  `liftedFrom !== null`, write ONE advisory line to **stderr**:
  `NOTE — <nodeId> ranks at tier <tier>/<rank> inherited from blocked source <liftedFrom> (own: tier <ownTier>/<ownRank>)`.
  Export the formatter as `formatLiftNote(m: QueueMember): string` so the wording
  is pinned by a unit test rather than by comment.
- stderr is safe here by construction: `office-hours-graph` captures only stdout
  (`listing=$(npx tsx … --list)`), and this CLI's header already declares stderr
  advisory-only ("Signal, not gate"). Follow the existing `NOTE —` convention at
  `office-hours-select.ts:92-95` (`formatBlockerNote`).
- Update the `--list output columns` header comment block
  (`office-hours-select.ts:42-46`) to state that the columns are unchanged and
  that lift advisories go to stderr. `office-hours-graph`'s in-loop comment cites
  that block by phrase, not line number — no edit needed there.

Out of scope: any change to `office-hours-graph`, to `formatDisposition`, or to
the launch/`empty`/`not-parked` stdout contract.

Tests: add `formatLiftNote` cases to `packages/intentionsutil/test/office-hours.test.ts`,
and assert `formatQueueRow` still emits exactly four tab-separated fields.

**Dependencies.** Unit 1.

**Recommended model.** sonnet

---

## Unit 3 — pure alert enumerator: `src/hold-alerts.ts` + read-only CLI

**Scope.** New `packages/intentionsutil/src/hold-alerts.ts`, new
`packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts`, new
`packages/intentionsutil/test/hold-alerts.test.ts`. No existing file is edited.

Export from `hold-alerts.ts`:

```ts
export interface UnclaimedHoldAlert {
  holdId: string;
  sourceId: string;
  kind: HoldKind;
  ageSeconds: number;
  sourceTier: number;
  sourceValue: number;
}
export interface HoldAlertOpts { now: Date; minAgeSeconds: number; topK: number; }
export function listUnclaimedHoldAlerts(
  nodes: IntentionNode[], opts: HoldAlertOpts,
): UnclaimedHoldAlert[];
```

Composition (pure — no fs, git, network, daemon; the whole decision comes from
`nodes`):

1. `listHoldCandidates(nodes)` (`packages/intentionsutil/src/hold-sweep.ts:106-140`)
   → keep only `cls === "manual"`. Reuse it as-is: it already enforces the
   canonical-hold-id binding, drops holds whose source is gone, and drops holds
   whose `blocked_by` edge already cleared. Do NOT re-derive hold discovery, and
   do NOT modify `hold-sweep.ts`. `cls === "manual"` is precisely
   `KIND_RECHECK[kind].policy === "manual"`
   (`packages/intentionsutil/src/holds.ts:117-132`) — today
   `provision-conflict` AND `fix-attempt-cap`; both are in scope for alerting.
2. `resolveAttention(nodes)` (`packages/intentionsutil/src/attention.ts:312`) —
   called exactly once.
3. Age: from the hold node's `office_hours.since` (`schema.ts:505-511`; a
   `requireDateString`), `ageSeconds = floor((opts.now - since) / 1000)`. This is
   the right clock precisely because `decideHold` deliberately does NOT refresh
   `since` on a repeat occurrence — see the `EXISTING` branch comment at
   `hold-node-decide.ts:166-170`: "`office_hours.since` is NOT refreshed (its age
   is the signal)". Because `since` is durable graph state, this predicate needs
   no cross-pass state file.
   A `manual`-class hold with `office_hours === null` (structurally possible: the
   terminal test at `hold-sweep.ts:127` requires `phase === "done"` AND
   `office_hours === null`) is never emitted — it is not sitting in the
   office-hours queue at all, so "unclaimed in the queue" is not a statement about
   it. Document that skip in the doc comment; do not silently coerce a missing
   `since` to age 0.
4. Top-K gate: compute the `(tier, value)` of every **eligible, live, unparked**
   node — eligible per the same `kind-<k>.attributes.goal_layer` test
   `resolveAttention` uses (a node absent from the resolved Map is not eligible),
   `office_hours === null`, `phase !== "done"` — sort lexicographically desc, take
   the Kth entry as the cutoff. Emit a candidate only when its source's
   `(tier, value)` is `>=` that cutoff. Fewer than K such nodes ⇒ no cutoff, all
   sources qualify.
   Top-K rather than an absolute value floor on purpose: resolved values drift as
   the graph changes, so an absolute floor needs retuning; "is this blocking one
   of the top K things in the graph" does not. (On the 2026-08-01 reading the
   source was #1 of the unparked set.)
5. Age gate: `ageSeconds >= opts.minAgeSeconds`.
6. Sort by `(sourceTier, sourceValue)` desc, then `holdId` asc.

CLI `scripts/list-unclaimed-hold-alerts.ts` — copy the shape of
`packages/intentionsutil/scripts/list-recheckable-holds.ts:22-72` verbatim
(strict arg parse, `listNodesStrict`, `pathToFileURL` main guard, exit 2 on usage
error or malformed store, exit 0 otherwise, no writes of any kind):

- flags: `--dir <intentions-dir>` (required), `--now <iso8601>` (default: current
  time), `--min-age-seconds <n>` (required), `--top-k <n>` (required). Unknown
  flag / missing value ⇒ exit 2 with a message, never a silent default — see
  `.claude/rules/code-style.md`.
- stdout: one TSV line per alert,
  `<hold-id>\t<source-id>\t<kind>\t<age-seconds>\t<source-tier>\t<source-value>`;
  nothing when there are none.
- `listNodesStrict` (not the tolerant reader) for the same reason
  `list-recheckable-holds.ts:52-58` gives: a dropped node file would silently
  under-report.

**Do NOT touch `list-recheckable-holds.ts`'s TSV.** `lib-stale-hold-recheck.sh`
reads it with a four-variable `read`, so an appended column would land inside
`cls`.

Tests (`packages/intentionsutil/test/hold-alerts.test.ts`) — reuse the `anode()`
fixture builder shape already in `packages/intentionsutil/test/hold-sweep.test.ts:5-40`
plus its `PARKED` record and canonical-hold-id helper: a manual hold over the
age bound blocking a top-K source is emitted; the same hold under the age bound
is not; a hold blocking a source outside top-K is not; an `auto`-policy
(`worktree-residue`) hold is never emitted; a hold whose source's `blocked_by`
edge already cleared is not emitted (inherited from `listHoldCandidates`); a
`manual` hold with `office_hours === null` is not emitted; ordering is by source
`(tier, value)` desc then `holdId` asc; tier dominates value.

**Recommended model.** opus

---

## Unit 4 — fleet-watch predicate 5 (`unclaimed-hold`) and the new alarm kind

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm`,
`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch`,
`.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh`.

**4a — alarm kind.** Add `unclaimed-hold` to the closed `KINDS` enum at
`dispatch-fleet-alarm:180` and to the `kinds:` lines in `usage()` at
`dispatch-fleet-alarm:188-189`. Nothing else in that script changes — find-or-
create idempotency (`tactic-fleet-alarm-<kind>` with `kind: unclaimed-hold`), the two brakes,
the graph-write mutex, the post-write blob verification, and NEVER-FLEET-HALT are
inherited. Note for the implementer: alarm nodes are born UNPARKED drafts
(`dispatch-fleet-alarm:641-671` — `status: raw`, `phase: null`,
`office_hours: null`, `serves: ["strategy-autonomous-execution"]`), so this
surface adds no mechanical park, consistent with this strategy's
"the defect is in the PRODUCERS" clarification.

**4b — predicate 5 in `dispatch-fleet-watch`.** Add a fifth predicate,
`unclaimed-hold`, following the existing four exactly:

- **Verdict variables** `V_HOLD` / `D_HOLD` / `B_HOLD`, per the "TWO DETAIL
  STRINGS PER PREDICATE" contract at `dispatch-fleet-watch:46-64`. **D_ carries
  the reading** (ages in seconds, resolved tier/value, counts). **B_ carries
  condition identity only** — the offending `<hold-id> → <source-id>` pairs
  (sorted, deterministic) plus the threshold names/values. Ages and resolved
  attention values MUST NOT appear in the body: resolved values change on
  essentially every graph commit, and a churning body pushes to `origin/main`
  once per 5-minute pass.
- **Pause**: evaluate regardless of pause, tagged with the pause state, like
  predicates 2 and 4 (`dispatch-fleet-watch:89-99`). Paused-scheduling with
  manual-only dispatch is a supported STANDING operating mode for this strategy,
  and a top-ranked node blocked by an unclaimed hold is exactly what a human
  driving a paused fleet needs to know.
- **Repo root**: source `lib-graph-worktree.sh` and use `resolve_main_worktree`
  (`lib-graph-worktree.sh:27`, honours `DISPATCH_GRAPH_MAIN_WORKTREE`) —
  the same anchor `lib-stale-hold-recheck.sh` step 1 uses, so the enumerator reads
  the main checkout's `intentions/` regardless of cwd. Unresolvable ⇒ `unknown`.
- **Enumerator**: `node --import tsx/esm <root>/packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts --dir <root>/intentions --now <iso> --min-age-seconds "$HOLD_MIN_AGE" --top-k "$HOLD_TOP_K"`,
  run with cwd `<root>` (the invocation shape `lib-stale-hold-recheck.sh` step 2
  uses). Non-zero exit or unparseable output ⇒ `unknown`, never `clear`.
  Test seam: `DISPATCH_FLEET_WATCH_HOLDALERT_CMD` replaces the whole invocation
  with no arguments appended, mirroring `DISPATCH_HOLD_RECHECK_ENUM`; register it
  in the header's dependency-injection seam list
  (`dispatch-fleet-watch:139-147`).
- **Claimed check** (the "unclaimed" half), per candidate, for the **source id
  and the hold id alike**:
  `reservation_exists <id>` (`lib-reservation-ledger.sh:409`) OR
  `worktree_has_live_session "<root>/.claude/worktrees/<id>"`
  (`lib-claude-agents.sh:970`) ⇒ that candidate is claimed, drop it. This is the
  same ladder as `lib-stale-hold-recheck.sh` step 3c, applied to trigger an alert
  instead of to gate a resolve. Source `lib-reservation-ledger.sh`;
  `lib-claude-agents.sh` is already sourced at `dispatch-fleet-watch:250-252`.
  Pass the **full worktree path**, never a bare id — see
  `worktree-has-live-session-basename-path-false-occupied` in memory.
- **Fail direction, and why it needs an extra guard.** For the resolve sweep,
  fail-safe means KEEP (unknown folds to occupied). For an ALERT, an unknown
  folding to "occupied" would SUPPRESS the alarm — a false all-clear, the exact
  failure `dispatch-fleet-watch`'s header forbids. `worktree_has_live_session`
  cannot report unknown separately, so capture the snapshot's readability at the
  existing capture site (`dispatch-fleet-watch:254-258`): record
  `SNAPSHOT_OK=1` only when `claude_agents_snapshot_capture` succeeds, and make
  predicate 5 `unknown` (naming the daemon snapshot) when it did not. An
  `unknown` raises `watch-unknown` and resolves nothing, which is the correct
  posture.
- **Thresholds** (declared here; both env-overridable so retuning needs no code
  change, and both integer-guarded like the existing three at
  `dispatch-fleet-watch:186-191`):
  `DISPATCH_FLEET_WATCH_HOLD_MIN_AGE` default **86400** (24h) — a fresh hold is
  ordinary and frequently self-resolves against a moving main;
  `DISPATCH_FLEET_WATCH_HOLD_TOP_K` default **10**. Document both in the header's
  Thresholds block (`dispatch-fleet-watch:114-118`).
- **Verdicts**: ≥1 unclaimed candidate ⇒ `finding`; enumerator/root/snapshot
  unreadable ⇒ `unknown`; otherwise `clear`. Wire it through
  `note_verdict` and one `dispatch_predicate "$V_HOLD" unclaimed-hold …` call
  (`dispatch-fleet-watch:593-598`) — reuse that function verbatim, no bespoke
  alarm branch. A `clear` resolves the alarm node; `unknown` and `quiet` resolve
  nothing.
- **Statement** for the alarm: `A tracked hold has blocked top-ranked work with no session claiming it`.
- Update the header's predicate list (`dispatch-fleet-watch:26-31`), the "WHY ONE
  SNAPSHOT" note (`:33-44`) to mention the fifth predicate's use of the snapshot,
  the PAUSE contract block (`:89-99`), `usage()` (`:157-166`, which says "four
  predicates"), and the `--json` output object (`:700-728`) with a
  `"unclaimed-hold"` entry carrying `verdict`, `detail`, and the candidate count.
- No state file entry is added — the span comes from `office_hours.since`.
- The existing ratchets in `test-dispatch-fleet-watch.sh` (no pause/stop
  reference, no graph-write command, every red-sync call `--read-only`) must stay
  green: the new enumerator is read-only and is none of the ratcheted commands.

**4c — tests** in `test-dispatch-fleet-watch.sh`, using its existing stub/bin
pattern (`test-dispatch-fleet-watch.sh:50-100`) and the recording alarm stub:

- finding: enumerator stub emits one row, `CLAUDE_AGENTS_CMD` stub reports no
  sessions, reservation dir empty ⇒ exactly one
  `dispatch-fleet-alarm --kind unclaimed-hold` invocation, exit 1;
- clear: enumerator emits nothing ⇒ one `--resolve --kind unclaimed-hold`, exit 0;
- claimed: enumerator emits a row but the agents stub reports a live session under
  the source's worktree ⇒ verdict `clear`, resolve issued, no finding;
- unknown on enumerator failure (stub exits 2) ⇒ no `unclaimed-hold` alarm, no
  resolve, `watch-unknown` raised, exit 2;
- body stability: two passes whose enumerator rows carry different ages and
  different tier/value readings but the same hold/source ids emit **byte-identical**
  alarm bodies (the same ratchet the existing suite applies to predicates 1-4);
- pause: with the pause sentinel set, predicate 5 still evaluates and its verdict
  is tagged with the pause state (not `quiet`).

**Dependencies.** Unit 3 (the CLI it invokes), Unit 1 only insofar as both land in
the same PR — predicate 5 does not read the queue.

**Recommended model.** opus

---

## Reuse

- `packages/intentionsutil/src/officeHours.ts:48-75` — `officeHoursQueue`, the
  single site the priority half changes; its existing `resolveAttention` call at
  `:49` is reused, never duplicated.
- `packages/intentionsutil/src/officeHours.ts:89-103` — `openBlockers`, the
  existing "a `phase: done` blocker is cleared" convention Unit 1 reuses for its
  source filter.
- `packages/intentionsutil/src/attention.ts:162-173` — the `reverseBlockers`
  build loop inside `computeSignalPath`: the shape Unit 1 mirrors. Private to
  `attention.ts`; mirror it, never import it, and never edit `attention.ts`.
- `packages/intentionsutil/src/attention.ts:312` — `resolveAttention`, called once
  per entry point.
- `packages/intentionsutil/src/hold-sweep.ts:106-140` — `listHoldCandidates` /
  `HoldCandidate` / `HoldClass`: the ready-made hold enumerator, already
  canonical-id-bound and already excluding stale/resolved holds. Unit 3 composes
  it; nothing modifies it.
- `packages/intentionsutil/src/holds.ts:117-132` — `KIND_RECHECK`; `policy ===
  "manual"` is the existing predicate for "this hold kind has no auto re-check",
  reached through `HoldCandidate.cls === "manual"`.
- `packages/intentionsutil/scripts/list-recheckable-holds.ts:22-72` — the thin,
  strict, read-only TSV CLI pattern Unit 3's new CLI copies. Its own TSV contract
  is left untouched.
- `packages/intentionsutil/scripts/office-hours-select.ts:92-95,130-132` —
  `formatBlockerNote` (the `NOTE —` stderr convention) and `formatQueueRow` (the
  pinned four-column contract).
- `packages/intentionsutil/scripts/office-hours-graph:249-253` — the positional
  `--list` reader whose four-field `read` is the reason Unit 2 adds no column.
- `packages/intentionsutil/scripts/hold-node-decide.ts:96-131,166-170` — hold
  birth (`attention` never set, `parent: null`) and the deliberate non-refresh of
  `office_hours.since` that makes it a sound age input. Not edited.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:26-64,89-99,254-258,593-598`
  — the one-shot predicate host: predicate list, D_/B_ split, pause contract, the
  single agents snapshot captured at the input boundary
  (`DISPATCH_AGENTS_SNAPSHOT`, reused rather than re-querying the daemon), and
  `dispatch_predicate` for finding→raise / clear→resolve wiring.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:38-63,180,188-189`
  — the shared alarm surface: closed KINDS enum, two brakes, find-or-create
  idempotency, mutex, blob verification, NEVER-FLEET-HALT.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:970` —
  `worktree_has_live_session <path> [exclude_sid]`.
- `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:409` —
  `reservation_exists <node-id>`.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27` —
  `resolve_main_worktree`.
- `.claude/skills/dispatch-propagate/scripts/lib-stale-hold-recheck.sh` (steps
  1-3c) — the end-to-end template for "resolve root → enumerate via a tsx CLI →
  per-candidate claimed ladder", copied in shape by predicate 5. That file itself
  is NOT edited: its contract forbids a second graph-write path, and an in-band
  tick sweep structurally cannot report a condition that persists while the tick
  is dead.
- `packages/intentionsutil/test/office-hours.test.ts:20-71` and
  `packages/intentionsutil/test/hold-sweep.test.ts:5-40` — the existing `anode()`
  / `kinds()` / `PARKED` fixture builders; extend these rather than writing new
  ones.

## Verification

Auto-runnable:

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --app packages/intentionsutil
```

The shell suites under `.claude/skills/dispatch-propagate/scripts/` are also
picked up in CI by `run-unit-tests.sh`'s `test-*.sh` glob whenever that directory
changes, so no `unit-tests.yml` edit is needed for `test-dispatch-fleet-watch.sh`
or `test-dispatch-fleet-alarm.sh` (that workflow's explicit list exists only for
suites whose SUT lives outside that directory — see `.github/workflows/unit-tests.yml:198-206`).

Manual / judgment (run from the PR worktree, against the real store):

1. **Priority half, before/after.** Run
   `npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list | head -30`
   on `origin/main` and on the branch. Confirm: the row count and the four-column
   shape are identical; any live hold whose blocked source is high-ranked has
   moved up; each moved row is explained by exactly one stderr
   `NOTE — … inherited from blocked source …` line; and no row moved that has no
   inbound `blocked_by`. If the store currently holds no live manual hold, say so
   explicitly rather than reporting a vacuous pass — construct the case with a
   temporary local fixture store (`--dir` is not available on this CLI, so use the
   vitest cases as the standing evidence and record the empty live reading).
2. **Enumerator on the live store.** `npx tsx packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts --dir intentions --now "$(date -u +%FT%TZ)" --min-age-seconds 0 --top-k 10`
   — exit 0, and every row is a real manual-policy hold with a live source.
   Re-run with `--min-age-seconds 86400` and confirm the rows are a subset.
3. **One live watcher pass**, with the alarm command stubbed so nothing is written
   to the graph: run `dispatch-fleet-watch --json` with
   `DISPATCH_FLEET_WATCH_ALARM_CMD=/bin/true`. Confirm the JSON carries a
   `"unclaimed-hold"` predicate entry whose verdict is `clear`, `finding`, or
   `unknown` (never absent), and that the other four predicates are unchanged.
   **Run this with `dangerouslyDisableSandbox: true`** — the claimed check reaches
   the local Claude daemon over a Unix socket, and a sandboxed pass gets `[]`
   back, which reads every node as unclaimed and would fabricate a finding (see
   `.claude/rules/sandbox.md`).
4. **Observe in production, post-merge.** After the systemd timer has fired a few
   times (`journalctl --user -t dispatch-fleet-watch`, 5-minute cadence): confirm
   the predicate reports on every pass; confirm no `tactic-fleet-alarm-<kind>`
   (kind `unclaimed-hold`) push storm (at most one commit per condition episode,
   and none while a condition merely persists — cross-check with
   `git log --oneline origin/main -- intentions/tactic-fleet-alarm-*.md`
   filtered to the `unclaimed-hold` kind's node once it exists); and confirm the alarm node,
   when one exists, is a plain unparked draft tactic, never an `office_hours` park
   and never accompanied by a `blocked_by` write on another node.
5. **Threshold judgment, author-facing.** The 24h age bound and top-K=10 are
   declared defaults, not author decisions. After a week of production readings,
   the counts in the journald lines are the evidence for retuning
   `DISPATCH_FLEET_WATCH_HOLD_MIN_AGE` / `DISPATCH_FLEET_WATCH_HOLD_TOP_K` — both
   env-overridable, so retuning needs no code change.

## needs-main residue

- **id:** 7 — Threshold defaults (24h age, top-K=10) are operationally sane
  against the live graph
  - URL path: current (repo/journal check, not a route)
  - Expected outcome: the shipped defaults (`DISPATCH_FLEET_WATCH_HOLD_MIN_AGE`
    default 86400s, `DISPATCH_FLEET_WATCH_HOLD_TOP_K` default 10) produce a
    useful signal on the deployed fleet-watch timer — neither dead silence nor
    an alarm-node push storm — over roughly a week of production readings, per
    this node's own Verification §5 (author-facing tuning, not a merge gate)
    and §4 (explicit observe-in-production check on the 5-minute systemd
    cadence).
  - Finding: this item is a documented planned deferral — the node body's own
    Verification section states the thresholds are declared defaults evaluated
    from a week of production journald readings, not assertable at merge time.
    A qa-fix pre-merge sanity run against the live `intentions/` store at the
    shipped defaults returned 2 rows (`tactic-hold-fix-cap-strategy-fingerprint-stamp-coverage`,
    `tactic-hold-conflict-manual-path-reservation-sweep`) — neither zero
    (dead signal) nor a flood (storm) — supporting shipping the defaults as-is
    and deferring the tuning judgment to post-merge observation.
  - Verifiability: MACHINE
  - Check: `journalctl --user -t dispatch-fleet-watch --since -7d | grep -c
    'unclaimed-hold:'` to confirm the predicate reports every pass over the
    week; `git log --oneline origin/main -- 'intentions/tactic-fleet-alarm-unclaimed-hold*.md'`
    to confirm at most one commit per condition episode (no push storm) and
    that the alarm node, if any exists, is a plain unparked draft tactic
    (`office_hours: null`, no `blocked_by` write on another node).
