---
id: tactic-session-reap-authorization-durability
kind: tactic
statement: The session-reap sweep must derive its authorization from durable
  state, not from a job dir with an independent lifetime -- gates 3 and 4 both
  read `<jobs-root>/<jid>/`, so a terminal session whose job dir is absent or
  nameless can never become a sweep candidate and its registration strands
  forever, holding its node against every launch path
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
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap band 2 (50/20/10 interim scale): a containment defect that
    strands worker slots and manufactures duplicate-session invalid states by
    accretion -- same band as the other dispatch-containment fixes."
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
# Session-reap authorization must outlive the job dir
