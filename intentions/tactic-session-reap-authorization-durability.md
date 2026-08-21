---
id: tactic-session-reap-authorization-durability
kind: tactic
statement: Record a node's claim and release as durable graph state, written as
  ONE batched graph-commit per selection tick before the workers spawn, so a
  claimed node's freeze survives loss of the daemon-backed session registry
owner: ai
status: raw
parent: null
rationale: "Measured 2026-08-05 while reaping the fleet by hand at the author's
  instruction; ELEVEN terminal sessions had accumulated unreaped, the oldest
  holding a node whose PR merged 2026-07-26 -- roughly ten days. Every one was
  safe to reap: worktree clean, `git diff origin/main HEAD -- . ':!intentions'`
  EMPTY, and its PR MERGED, which is gate 6 in full. So the reap-safety gate was
  never the blocker; the sweep never considered these sessions AT ALL. THE
  MECHANISM, read off lib-session-reap.sh's own gate list (lines 75-101): gate 3
  requires `<jobs-root>/<jid>/state.json`'s `.name` to equal the node id, and
  gate 4 requires a valid `<jobs-root>/<jid>/node-terminal` marker naming that
  node. Both read the job dir, keyed on the registry `.id`. The session
  REGISTRATION and the JOB DIR therefore have independent lifetimes, and the
  registration outlives the dir. Once the dir is gone or nameless there is no
  path back: the sweep's candidate set cannot include the session, so it is not
  merely delayed but permanently stranded -- an absorbing state. THE CENSUS,
  taken on the live host the same night: 27 job dirs under ~/.claude/jobs.
  TWENTY of them have an EMPTY `.name` in state.json, so gate 3 is unsatisfiable
  for them by construction. Exactly ONE carries a `node-terminal` marker at all,
  so gate 4 is satisfiable for at most one. The sweep's candidate set is thus
  close to empty regardless of how clean the worktrees are -- which is exactly
  what eleven stranded sessions look like from the outside. WHY IT IS NOT
  COSMETIC, and this is the part that makes it a containment defect rather than
  tidiness: tactic-stopped-session-blocks-node (phase: done) deliberately
  establishes that a stopped-but-not-removed session MUST continue to block its
  node's concurrent execution, and worktree_has_live_session reads the
  REGISTERED view precisely so a node is never double-booked. That posture is
  correct. Its consequence is that every stranded registration is a node held
  out of selection indefinitely. Two of the eleven sat on ONE node
  (tactic-phase-terminal-requires-disposition), which is the duplicate-session
  invalid state the 2026-08-05 concurrency ruling governs, reached by accretion
  rather than by a racing launch. The plan's own standing verification criterion
  -- no node worktree carries more than one registered session -- was failing
  because of this, and could not be made to pass by any autonomous path. IT ALSO
  FALSIFIES A RECORDED PREMISE. tactic-terminal-declaration-verified-
  against-node states that the marker-missing direction `fails safe
  (dispatch-self-close HOLDs)` and is `the opposite (safe) direction` of the
  defect it covers. Against wrongly reaping, yes. Against slot exhaustion, no:
  missing evidence strands the node forever and no fuse fires, because nothing
  is watching for a session that the sweep never enumerated. `Fails safe` is
  true only with respect to the loss it was reasoned about. Dedup: a
  find-or-create pass found NO owner. The three nearest are each a DIFFERENT
  link in the same chain -- tactic-qa-fix-node-terminal-declaration (phase: qa)
  covers a skill that never WRITES the marker;
  tactic-terminal-declaration-verified-against-node (raw) covers a marker
  written while the graph write FAILED, the false-positive direction; and
  tactic-stopped-session-blocks-node (done) establishes the blocking posture
  that makes stranding costly. None addresses the marker's STORAGE outliving
  neither the session nor the claim. Fix directions to weigh at planning time:
  (a) derive the terminal disposition from durable node state at origin/main --
  phase, execution.markers, execution.pr merge state -- so authorization needs
  no job dir, which is the same remedy
  tactic-terminal-declaration-verified-against-node reaches for from the other
  side and would close both directions at once; (b) keep the marker but write it
  somewhere with the session's lifetime rather than the job's; (c) add a
  reconciling arm that enumerates TERMINAL registrations with no job dir and
  routes them to the invalid-state lane, which already owns the no-declaration
  class, so the absorbing state at least drains."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Do this node's four cited source anchors still resolve at origin/main?
    answer: "Re-verified 2026-08-21 on the caller thread: all four claims hold in
      SUBSTANCE, but three of the four LINE anchors have drifted and must not be
      trusted verbatim by a fresh session. (1) 'graph-commit already accepts
      multiple node ids (graph-commit:531)' — TRUE; the multi-id contract is now
      the usage string at packages/intentionsutil/scripts/graph-commit:629
      ('<node-id> [<node-id> ...]') with the positional collection loop at
      :3664. Line 531 is now unrelated lock-state prose. (2) 'the global
      refs/graph/landing-lock (graph-commit:355)' — TRUE;
      LOCK_REF=\"refs/graph/landing-lock\" is now at :369, with the design note
      at :2544. Line 355 is now MAX_ORPHAN_RESTAMPS prose. (3)
      'provision-node-worktree:113 places EVERY node worktree at
      PROJECT_ROOT/.claude/worktrees/<node-id>' — TRUE; that assignment is now
      at :131 (WT=\"$PROJECT_ROOT/.claude/worktrees/$NODE_ID\"), with the same
      path restated in the header at :14 and the scope stamp at :179. Line 113
      is now argument parsing. (4) 'its only claim-time write is
      reservation_mark_spawned into the file ledger at
      dispatch-graph-execute:159' — TRUE AND THE ANCHOR IS EXACT; the call is
      still at
      .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:159, and
      provision-node-worktree still contains no graph-commit or write-node call
      at all, so 'performs no graph write' also still holds."
  - question: Do the reap-gate log-line anchors in the 2026-08-10 rescope still resolve?
    answer: "Re-verified 2026-08-21: the three skip codes still exist with the same
      names and the same relative order, but both cited line numbers have
      drifted. In .claude/skills/dispatch-propagate/scripts/lib-session-reap.sh,
      SESSION_REAP_SKIP_NO_JOB_DIR is now emitted at :594 (cited :548),
      SESSION_REAP_SKIP_FOREIGN_JOB_DIR at :603 (cited :557), and
      SESSION_REAP_SKIP_NO_TERMINAL_MARKER at :616. The rescope's structural
      argument is unaffected — both job-dir codes still sit BEFORE the marker
      gate, so the inference it draws from zero NO_JOB_DIR/FOREIGN_JOB_DIR
      records (gate 3 was reached and passed, rather than never reached) still
      holds. Only the line citations are stale."
  - question: Has the durable claim/release deliverable been overtaken by merged
      work since the 2026-08-10 sitting?
    answer: 'No — verified 2026-08-21 at origin/main.
      packages/intentionsutil/src/schema.ts carries no claim-bearing field of
      any kind: no execution.claim, no claimed_at, no claim_sha (grep over the
      whole file returns only unrelated prose uses of the word "claim" in the
      attention-boost documentation and error strings). provision-node-worktree
      still performs no graph write, and the file-ledger reservation path
      (reservation_mark_spawned, lib-reservation-ledger.sh, called from
      dispatch-graph-execute:159) is still the only claim-time record. The
      ratified design — one batched graph-commit per selection tick, issued
      before the spawns — is entirely unimplemented, so this node is live work
      and not stale by resolution.'
  - question: What is the current state of the five siblings this node's body
      dispositions?
    answer: "Re-verified 2026-08-21 at origin/main, one per sibling. (1)
      tactic-claim-containment-durable-anchor — status raw, phase null,
      office_hours NULL: its park was indeed cleared by the 2026-08-10 sitting
      as the body states, but it remains UNPLANNED, which is what makes this
      round's Ground B live. (2) tactic-reap-session-worktree-classification —
      status codified, phase implement: the \"Migration step 1\" split named in
      this body was not merely filed, it has since been finalized and is in
      flight, so a fresh session must not re-file it. (3)
      tactic-qa-fix-node-terminal-declaration — status codified, phase qa: still
      exactly where the 2026-08-10 rescope placed it when it handed the gate-4
      stranding mechanism to that node. (4)
      tactic-terminal-declaration-verified-against-node — status raw,
      office_hours SET: still parked, as the body predicts. (5)
      tactic-router-failure-fuses — status raw, office_hours SET: still parked,
      as the body predicts. All five dispositions in the body are therefore
      accurate as of this round, with the single amendment that sibling (2) has
      advanced from filed to phase implement."
  - question: Was this node's attention.boost value changed by this round's write?
    answer: "Not in value — only in serialization, recorded here so the diff does
      not read as a stealth re-rank. This node carried the LEGACY sugar form
      `attention.boost: 0.04` with `attention.tier: 1`, one of the ~91 store
      nodes still on that spelling per the schema comment at
      packages/intentionsutil/src/schema.ts:439-447. dump-node.ts normalizes
      that form to the canonical per-tier map on read and write-node.ts
      serializes exactly what it is given, so this round's park write lands it
      as `attention.boosts: {\"1\": 0.04}`. The magnitude 0.04 and the tier 1
      are preserved unchanged, and attributes.pre_namespacing_boost stays at 20
      for the eventual restoration. This is the schema's own documented
      compatibility path, not a hand-conversion; the bulk rewrite of the
      remaining legacy-form nodes is owned by
      tactic-attention-per-tier-boost-migration and must not be done here.
      Verified 2026-08-21."
  - question: Is the park-time recommendation carried in the reason string or in a
      dedicated field?
    answer: "In the dedicated field, as of this round.
      .claude/skills/align-tactics/references/autonomy.md lines 50-57 still
      carry a transitional note saying a first-class office_hours.recommendation
      'is not yet in schema.ts, so write-node.ts rejects that key today' and
      instructing authors to fold the recommendation into the reason string as a
      trailing sentence. That note is STALE: verified 2026-08-21, OfficeHours
      declares `recommendation: string | null` at
      packages/intentionsutil/src/schema.ts:705 and validateOfficeHours parses
      it via optionalString at :931, alongside a session_type field the note
      does not mention at all. This round therefore writes the recommendation to
      the first-class field. Recorded on this node because a per-node
      tactic-target session may not edit the skill's own reference files;
      correcting autonomy.md is separate work for whoever owns that surface."
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.04
  rationale: >-
    Bootstrap band 2 (50/20/10 interim scale): a containment defect that strands
    worker slots and manufactures duplicate-session invalid states by accretion
    -- same band as the other dispatch-containment fixes.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.04 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    PARKED on TWO independent grounds; neither is a defect in this node.


    GROUND A — SIDE A, a recorded condition on the serving strategy has failed,
    measured.

    strategy-graph-native-dispatch's ARMED maintenance-burden band (armed
    2026-08-05, measured at arming 59/197 = 30.0%) declares that the open
    machinery-defect population — open (phase set, not done) plus born-parked
    tactics serving this strategy — 'stays at or below 35% of all tactics
    serving this strategy, and is non-increasing across consecutive samples
    derived from intentions/ git history at read time'. Re-measured on the
    CALLER THREAD on 2026-08-21 at origin/main through the canonical census
    functions themselves (listNodes from packages/intentionsutil/src/store.ts
    plus strategyBacklogBand and classifyTactic from
    packages/intentionsutil/src/census.ts, imported directly rather than shelled
    out through align-tactics-census.ts): 316 tactics serve this strategy — 97
    done, 84 draft, 84 open, 51 born-parked — giving backlog 135/316 = 42.72%.

    CEILING LIMB: 42.72% > 35%, FAILED by 7.72 points. NON-INCREASING LIMB: the
    same-day series now reads 38.5 -> 39.4 -> 40.19 -> 40.5 -> 41.14 -> 41.77 ->
    42.09 -> 42.72, monotonically rising within a single day, against the
    strategy's own recorded descent 47.6% -> 38.2% -> 31.4% -> 24.6%. FAILED.
    The strategy's stored `reading` field still records 58/236 = 24.6% and is
    stale by ~18 points and 80 tactics; it must not be read as the condition
    still passing.


    THE BREACH IS NOT AN ARTIFACT OF THE PARK LOOP, measured this round rather
    than asserted. classifyTactic scores born-parked as backlog and draft as
    neither, so every park (this one included) feeds the numerator it reports
    on. Two sensitivity cuts, both computed on the caller thread: removing all
    13 pure `-drift-observations` observation carriers leaves 122/303 = 40.26%,
    and removing all 11 nodes currently parked citing this same band leaves
    124/305 = 40.66%. The ceiling limb fails on every cut, so the band is
    genuinely breached and not merely self-inflated.


    THIS IS THE TWELFTH NODE PARKED ON THIS ONE CONDITION. Eleven already carry
    it — tactic-align-tactics-drift-dump-office-hours,
    tactic-align-tactics-immaterial-drift-redirect,
    tactic-align-tactics-migration-tightening-split,
    tactic-align-tactics-premise-preflight,
    tactic-dispatch-conflict-substance-allowlist-drift-observations,
    tactic-graph-commit-park-content-durability,
    tactic-graph-refsplit-blocker-audit,
    tactic-graph-scratch-sweep-drift-observations,
    tactic-invalid-state-rc-f1c843b1, tactic-supersession-retirement-sweep,
    tactic-supersession-retirement-sweep-drift-observations (nine since
    2026-08-21, two since 2026-08-20). The band must be ruled ONCE for the whole
    strategy rather than re-measured per node; one ruling clears all twelve.


    MATERIAL FACT FOR THE RULING, verified on the host this round: DISPATCH IS
    PAUSED. The sentinel dispatch_pause_state reads (lib-pause-state.sh:73-101)
    is present at ~/.local/share/commons-dispatch/paused with mtime 2026-08-10
    11:51. While the fleet is paused, no worker pass drains an open tactic, so
    the non-increasing limb cannot recover through execution at all — only an
    author ruling or a resume can move it. Every /align-tactics round run during
    the pause adds a born-parked node to the numerator and nothing removes one.


    GROUND B — MAJOR SCOPE DEVIATION: the recorded requirement for this node is
    structurally unexecutable from a per-node tactic-target session.

    The sibling tactic-claim-containment-durable-anchor (verified live this
    round at raw / phase: null / office_hours: null — its own park was cleared
    by the same 2026-08-10 sitting) records, in its own body under 'Ordering and
    scope': 'This node and tactic-session-reap-authorization-durability now
    share one design. That node was rescoped in the same sitting onto the
    surviving claim/release deliverable, so the two must be planned together or
    merged by the next /align-tactics round rather than each planning the same
    write.' This node's own body agrees, stating under its 2026-08-10 rescope
    that 'what survives here is the durable claim/release design above, shared
    with tactic-claim-containment-durable-anchor'.

    Both discharges of that requirement are outside this path's write contract.
    A per-node /align-tactics <tactic-id> session operates on EXACTLY ONE
    pre-existing tactic node (references/tactic-target.md, 'Per-node tactic
    target'); the only multi-node write it may land atomically is a NEW
    born-parked sibling alongside the parent edit (the split exception), never a
    plan authored onto a PRE-EXISTING sibling, and never the retirement of one.
    'Plan together' would require writing
    tactic-claim-containment-durable-anchor; 'merge' would require retiring one
    of the two. Finalizing THIS node alone to phase: implement would do
    precisely what the record forbids — leave each of two open nodes planning
    the same write — so proceeding is a scope deviation, not a judgement call
    this session may make.


    NEITHER GROUND IS A DEFECT IN THIS NODE, and the underlying work is NOT
    stale by resolution. Verified live at origin/main this round: schema.ts
    carries no claim field of any kind (no execution.claim, claimed_at, or
    claim_sha), and provision-node-worktree performs no graph write at all — its
    only claim-time write is still reservation_mark_spawned into the file ledger
    at dispatch-graph-execute:159, exactly as this node's body records. The
    durable graph-anchored claim/release design is entirely unimplemented, so
    the deliverable is live work awaiting only the two rulings above.


    COVERAGE BOUND ON THIS ROUND, stated explicitly rather than left implicit:
    no Workflow fan-out ran. The serving strategy file is 577,004 bytes, which
    exceeds the Workflow args limit, so mode: 'tactic' args could not be
    assembled. The two-sided drift review was therefore performed on the caller
    thread against the live repo. Side A was measured directly and is reported
    above. Side B was checked only against this node's own cited anchors and its
    five named siblings (the clarifications below record what was found); no
    full Side-B sweep of the strategy's remaining conditions and clarifications
    was performed, so 'no further drift' is UNESTABLISHED for this round, not
    checked-and-clear.
  since: 2026-08-21
  recommendation: >-
    TWO rulings are owed, and they are independent — take them in either order,
    but both are needed before this node can be planned.


    RULING 1 (strategy-wide, clears twelve nodes): rule the maintenance-burden
    band on strategy-graph-native-dispatch — re-affirm the 35% ceiling, declare
    a different ceiling, or accept the breach with a stated remediation — and
    refresh the strategy's stale `reading` field, which still records 58/236 =
    24.6% against a live 135/316 = 42.72%. Both writes are on the strategy and
    require an /align round; a per-node session may not make them, which is why
    this park lands on the tactic and names the strategy's record as the
    incomplete half. Note when ruling that the fleet has been paused since
    2026-08-10, so the backlog cannot drain by execution while the pause stands,
    and that the breach survives removing every observation carrier and every
    band-park (40.26% and 40.66% respectively).


    RULING 2 (scoped to this node and its sibling): decide which node carries
    the shared durable claim/release design. Three shapes, all of which a human
    or a strategy-scope /align-tactics round may take but a per-node session may
    not: (a) MERGE — retire one node onto the other, most plausibly folding this
    node into tactic-claim-containment-durable-anchor, which holds the fuller
    ratified design plus the 2026-08-14 measured occurrence; (b) SPLIT THE
    DELIVERABLE — give each node a disjoint half (e.g. the claim WRITE site to
    one, the release/reconcile arm to the other) and record the split in both
    bodies; or (c) PLAN TOGETHER — run a strategy-scope /align-tactics round on
    strategy-graph-native-dispatch, which may author both plans in one landing.


    ONCE BOTH ARE RULED, this node is ready to plan from its existing body with
    the corrections in its clarifications applied — nothing about the node
    itself needs re-derivation. The 2026-08-10 sitting already ratified the
    design (batched per tick, graph-anchored, issued BEFORE the spawns; option
    (b) the reservation-ledger and option (c) the worktree/PR reconciler both
    ruled out on condition 10), and all four of its structural anchors were
    re-verified live this round. If ruling 2 lands as a MERGE onto the sibling,
    this node should be pruned rather than re-planned.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Durable, graph-anchored claim/release written once per selection tick

## Office-hours sitting 2026-08-10 — ratified

The 2026-08-09 park asked ONE question: the cost of the claim write site. It is
answered, and this node is rescoped on the same day's measurements.

### Ratified: where and how the claim is written

**Batched per tick, graph-anchored, issued BEFORE the spawns.** The selection
loop issues one `graph-commit` carrying every claim for that tick;
`graph-commit` already accepts multiple node ids (`graph-commit:531`).

Rejected: a per-spawn write in `provision-node-worktree` (the shape the
2026-08-09 sitting ratified without pricing it). Verified 2026-08-10 —
`provision-node-worktree` performs no graph write at all today; its only
claim-time write is `reservation_mark_spawned` into the file ledger at
`dispatch-graph-execute:159`. Measured cost of putting a landing there:

- ~92 graph landings/day baseline over the trailing 14 days (1293 landings),
  peaking at 27 in a single hour.
- ~22 completed worker passes/day (312 phase transitions / 14d), so a per-spawn
  write adds only ~24% to landing VOLUME.
- Volume is not the problem. Each landing is CI-stamped (~30-60s check poll)
  and serialized behind the global `refs/graph/landing-lock`
  (`graph-commit:355`), so a per-spawn write puts a lock-serialized landing on
  the spawn critical path. An N-wide fan-out serializes into N landings; a
  5-wide fan-out costs ~4 minutes before the last worker starts. Batching makes
  the cost independent of fan-out width.

**Issue the batch BEFORE spawning.** This inverts the risk window: instead of a
spawn briefly unclaimed (the cost the park attributed to batching, which
applies only to claim-after-spawn), the window is claimed-but-not-yet-spawned —
a state `reservation_sweep` already reconciles, and which fails safe.

### Ratified: condition 10 binds the per-claim anchor

Condition 10's closing text governs the anchor directly: the containment holds
only where "the freeze must anchor on durable graph state rather than on a
process-level session registry". That binds the per-claim evidence anchor, not
merely the tripped-breaker incident record. This resolves the cross-cutting
question `tactic-claim-containment-durable-anchor` has carried since
2026-07-31, and rules out option (b) of that park (a reservation-ledger
extension) on doctrine.

Recorded consequence: a ledger-anchored claim may still be defensible one day,
but it would be an **amendment** to condition 10, not a reading of it, and must
be put to the author as such.

## Rescope 2026-08-10 — the reap-authorization framing is retired

This node's original rationale is **falsified**. Its mechanism was gate 3
(job-dir ownership) being unsatisfiable. Measured on the live host 2026-08-10
against `tmp/dispatch-sweep.log` (38231 lines, 2026-07-22 to 2026-08-10): of
1184 `SESSION_REAP_SKIP_*` records, 1060 are `NO_TERMINAL_MARKER`, 123
`UNLANDED_CONTENT`, 1 `GRACE`, and **zero** are `NO_JOB_DIR` or
`FOREIGN_JOB_DIR`. Both of those ARE logged when they fire
(`lib-session-reap.sh:548` and `:557`) and both sit BEFORE the marker gate, so
zero occurrences means gate 3 was reached and PASSED 1060 times — not that
candidates never arrive. Host census the same day: 35 job dirs, 13 with `.name`
set, 1 empty, 20 with no `state.json` at all. Job dirs are now keyed by the
session-id prefix, tying dir identity to session lifetime and removing the
independent-lifetime mechanism the 2026-08-05 census measured.

**The live stranding mechanism is gate 4, not gate 3.** Zero `node-terminal`
markers exist anywhere on the host, so gate 4 is unsatisfiable for every
candidate and all 1060 skips land there. That is
`tactic-qa-fix-node-terminal-declaration`'s territory (already at phase `qa`),
not this node's.

What survives here is the durable claim/release design above, shared with
`tactic-claim-containment-durable-anchor`. The reap-authorization framing is
retired.

## Sibling disposition

- `tactic-claim-containment-durable-anchor` — the identical anchor question;
  cleared by this same sitting with this same answer.
- `tactic-terminal-declaration-verified-against-node` — **stays parked, and is
  NOT subsumed by this answer**, correcting the 2026-08-09 park's assumption.
  Its park asks a different question: what "verify the claimed disposition
  against the node" means for the four marker dispositions with no node-state
  correlate. That is untouched by where the claim anchor lives.
- `tactic-router-failure-fuses` — stays parked. This sitting satisfies one of
  its two recorded ordering legs (the claim-anchor leg); the
  terminal-declaration leg remains open, and that node also carries a separate
  scope collision with the merged `tactic-phase-terminal-requires-disposition`.

Do not settle the subsumption or pruning of either on the pre-2026-08-10
framing — with gate 3 not firing, re-derive from the measurements above.

## Migration step 1 — split out, but NOT as originally recorded

Filed separately as `tactic-reap-session-worktree-classification`. The park
proposed making `lib-session-reap.sh` read a recorded worktree path instead of
deriving `$worktrees_root/$name`, calling it small and independent. Measured
2026-08-10, that is false: `provision-node-worktree:113` places EVERY node
worktree at exactly `PROJECT_ROOT/.claude/worktrees/<node-id>` — the same path
the reap derives — so the derivation is correct by construction for provisioned
worktrees. See that node for the actual defect and why the naive fix is
destructive.

## Status — PARKED to `office_hours`, 2026-08-21 (no plan authored)

A `/align-tactics tactic-session-reap-authorization-durability` per-node
tactic-target round ran on 2026-08-21 and **parked** this node on two
independent grounds rather than finalizing it to `phase: implement`. Neither
ground is a defect in this node; both are recorded in full in
`office_hours.reason`, with the two rulings they need in
`office_hours.recommendation`. This section records what the round measured, so
a fresh session need not re-derive any of it.

### Ground A — the serving strategy's armed maintenance-burden band fails

Measured on the caller thread at `origin/main` through the canonical census
functions themselves — `listNodes` from `packages/intentionsutil/src/store.ts`
plus `strategyBacklogBand` and `classifyTactic` from
`packages/intentionsutil/src/census.ts`, imported directly rather than shelled
out through `align-tactics-census.ts`:

| quantity | value |
| --- | --- |
| tactics serving `strategy-graph-native-dispatch` | 316 |
| done / draft / open / born-parked | 97 / 84 / 84 / 51 |
| backlog (open + born-parked) | 135 |
| band | **42.72%** against a declared **35%** ceiling |

Both limbs fail. The ceiling limb is breached by 7.72 points. The
non-increasing limb fails against a same-day series that is monotonically
rising — 38.5 → 39.4 → 40.19 → 40.5 → 41.14 → 41.77 → 42.09 → 42.72 — and
against the strategy's own recorded descent 47.6% → 38.2% → 31.4% → 24.6%. The
strategy's stored `reading` still claims 58/236 = 24.6%, stale by ~18 points
and 80 tactics.

**The breach is not an artifact of the park loop.** `classifyTactic` scores
born-parked as backlog and draft as neither, so every park — this one included
— feeds the numerator it reports on. Two sensitivity cuts computed this round:

- removing all 13 pure `-drift-observations` observation carriers → 122/303 =
  **40.26%**
- removing all 11 nodes currently parked citing this same band → 124/305 =
  **40.66%**

The ceiling limb fails on every cut.

**This is the twelfth node parked on this one condition** (nine since
2026-08-21, two since 2026-08-20). The band needs one strategy-wide ruling, not
a thirteenth per-node re-measurement.

**Dispatch is paused.** The sentinel `dispatch_pause_state` reads
(`lib-pause-state.sh:73-101`) is present at
`~/.local/share/commons-dispatch/paused`, mtime 2026-08-10 11:51. No worker
pass drains an open tactic while the pause stands, so the non-increasing limb
cannot recover through execution — only a ruling or a resume moves it. Every
`/align-tactics` round run during the pause adds to the numerator and nothing
removes from it.

### Ground B — the recorded requirement is unexecutable from this path

`tactic-claim-containment-durable-anchor` — verified live this round at `raw` /
`phase: null` / `office_hours: null`, its own park cleared by the same
2026-08-10 sitting — records under its "Ordering and scope" heading that this
node and that one "now share one design", and that **"the two must be planned
together or merged by the next `/align-tactics` round rather than each planning
the same write."** This node's own 2026-08-10 rescope agrees: "what survives
here is the durable claim/release design above, shared with
`tactic-claim-containment-durable-anchor`."

Both discharges of that requirement lie outside this path's write contract. A
per-node `/align-tactics <tactic-id>` session operates on exactly **one**
pre-existing tactic (`references/tactic-target.md`, "Per-node tactic target");
its only permitted atomic multi-node write is a **new** born-parked sibling
landed alongside the parent edit (the split exception) — never a plan authored
onto a **pre-existing** sibling, never the retirement of one. "Plan together"
requires writing the sibling; "merge" requires retiring one of the two.
Finalizing this node alone would leave two open nodes each planning the same
write — exactly what the record forbids.

### The deliverable is live, not stale by resolution

Verified at `origin/main` this round: `schema.ts` carries no claim-bearing
field of any kind (no `execution.claim`, `claimed_at`, or `claim_sha`), and
`provision-node-worktree` still performs no graph write — its only claim-time
write remains `reservation_mark_spawned` into the file ledger at
`dispatch-graph-execute:159`. The ratified design (one batched `graph-commit`
per selection tick, issued **before** the spawns) is entirely unimplemented.

### Anchor drift found and corrected

Landed as clarifications on this node rather than edited into the prose above,
so the 2026-08-10 record stays intact and the corrections are dated. In
substance all four of this body's cited anchors hold; three of the four line
numbers have drifted and must not be trusted verbatim:

| cited in this body | still true? | current anchor |
| --- | --- | --- |
| `graph-commit:531` accepts multiple node ids | yes | usage at `graph-commit:629`, arg loop at `:3664` |
| `graph-commit:355` global landing lock | yes | `LOCK_REF` at `graph-commit:369` |
| `provision-node-worktree:113` worktree path | yes | `WT=` at `provision-node-worktree:131` |
| `dispatch-graph-execute:159` `reservation_mark_spawned` | yes | **unchanged — still `:159`** |

The 2026-08-10 rescope's reap-gate citations drifted the same way:
`SESSION_REAP_SKIP_NO_JOB_DIR` is now `lib-session-reap.sh:594` (cited `:548`)
and `SESSION_REAP_SKIP_FOREIGN_JOB_DIR` is now `:603` (cited `:557`), with
`SESSION_REAP_SKIP_NO_TERMINAL_MARKER` at `:616`. Both job-dir codes still sit
before the marker gate, so the rescope's structural inference is unaffected.

### Coverage bound on this round

**No Workflow fan-out ran.** `intentions/strategy-graph-native-dispatch.md` is
577,004 bytes, which exceeds the Workflow `args` limit, so `mode: "tactic"`
`args` could not be assembled and the two-sided drift review was performed on
the caller thread against the live repo. Side A was measured directly and is
reported above. Side B was checked only against this node's own cited anchors
and its five named siblings. **No full Side-B sweep of the strategy's remaining
conditions and clarifications was performed**, so "no further drift" is
*unestablished* for this round — not checked-and-clear.

### No strategy write was made

The band re-measurement, the stale-`reading` finding, and the ruling request
are recorded here rather than on `strategy-graph-native-dispatch`. A per-node
tactic-target session never touches the serving strategy's frontmatter, and
conditions are human-decided; the strategy's record is the incomplete half, and
naming it that way is the recorded framing for an unrecorded-context park. No
separate `-drift-observations` carrier was minted either: a round that parks
its target folds its observations into the target, and minting a born-parked
carrier here would write into the very backlog numerator this park is about.
