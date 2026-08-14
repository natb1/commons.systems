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
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 20
  rationale: "Bootstrap band 2 (50/20/10 interim scale): a containment defect that
    strands worker slots and manufactures duplicate-session invalid states by
    accretion -- same band as the other dispatch-containment fixes."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
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
