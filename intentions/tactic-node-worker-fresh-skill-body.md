---
id: tactic-node-worker-fresh-skill-body
kind: tactic
statement: The exit-11 conflict lane reads its skill body from fresh state
  instead of from the node worktree whose origin/main merge just failed — spawn
  it with --cwd on the primary checkout while keeping --name <node-id>
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview. Observed live: Lane 3 landed on main 2026-07-28T16:05 and the tick
  spawned it at 16:39 into a worktree 142 commits behind whose
  dispatch-conflict/SKILL.md carried only Lanes 1-2; the session read pre-Lane-3
  instructions, found office_hours null, took Lane 2's 'wrong tool for this
  node' dead end, and the real conflict went unresolved. Structural, not
  incidental: provision exit 11 fires BECAUSE the worktree's merge with
  origin/main failed (provision-node-worktree:126-129), and
  dispatch-graph-execute:274 then spawns the lane with --cwd on that same
  checkout. Generalizes to every phase skill spawned into a node worktree.
  Candidate directions (not yet decided): freshen the checkout before the lane
  reads its body, or source skill bodies from the primary checkout at spawn
  time. Needs /align-tactics to pick one and plan it. SCOPE NARROWED 2026-07-29
  (same day, after reading provision-node-worktree:98-132): this is an
  exit-11-only defect, not a general phase-skill defect. Line 126's merged-tree
  guarantee means every successful provision already refreshes the worktree's
  skill bodies before spawning; exit 11 is the one path that spawns after that
  merge failed and was aborted. Worktrees are reused (provision creates only
  when the directory is absent), so staleness accumulates between merges.
  DECIDED FIX DIRECTION (was two open candidates): spawn with --cwd on the
  primary checkout, keeping --name \"$id\". The root cause is that --cwd
  conflates where the git work happens with where instructions come from; Lane 3
  already receives the node id as an argument and can drive the node worktree by
  absolute path via `git -C`, which its subagent absolute-path contract already
  requires. The primary checkout is the freshest reliably-available tree: a
  recorded condition pins it to main and dispatch-select-tick step 1 ff-syncs it
  every tick. Both contracts dispatch-graph-execute's own REAP CONTRACT comment
  warns about were verified to survive: worktree_has_live_session matches the
  session NAME (column 3 of claude agents --json) against the worktree basename
  and never inspects the session's cwd, so occupancy is cwd-independent; and
  dispatch-stop.sh:63 keys on JOB_NAME plus intentions/<JOB_NAME>.md existing at
  the hook root, both of which hold in the primary checkout. Side benefit: a
  node whose branch edits dispatch-conflict/SKILL.md gets the lane running the
  SHIPPED version of itself rather than its own in-flight edit. REJECTED: `git
  checkout origin/main -- .claude/` before the spawn — 20 of 47 live node
  branches (43%) modify .claude/, disproportionately the dispatch-machinery
  nodes most likely to conflict there, so it would clobber in-flight
  self-modification work exactly where the fix is most needed. Also rejected:
  any in-skill freshness self-check, since the stale body is the thing being
  read and an old body predates the check — the fix must live in the spawner.
  OPEN FOR PLANNING: whether any Lane 3 step relies on relative paths assuming
  cwd, and whether it needs the worktree-scoped direnv step provisioning
  performs. RECURRED 2026-07-30 with a strictly worse outcome, during the
  dispatch bootstrap's Stage 4 drain. The tick spawned Lane 3 into the
  tactic-graph-tick-node-lane-auto-merge worktree - 365 commits behind
  origin/main (HEAD 165a589e, 2026-07-23) - whose dispatch-conflict/SKILL.md
  carried ZERO '## Lane' sections and ZERO mark-node-terminal calls, a body
  predating the three-lane split entirely. The session applied the old
  single-lane Step 1 gate (branch must match '<N>-...'), correctly concluded the
  skill did not apply to a node-id target, and stopped having written no marker.
  dispatch-stop.sh discriminator 2 handed it to dispatch-self-close --node,
  which HOLDs absent a node-terminal marker, so the session stayed live and idle
  for over an hour. Because worktree_has_live_session is name-keyed on the node
  id, that simultaneously consumed one of only three worker slots AND made the
  node unselectable, with no autonomous recovery path; it was freed by hand.
  This is worse than the 2026-07-29 observation (an unresolved conflict) because
  a body predating the terminal-declaration contract cannot declare even in
  principle - it converts dispatch-graph-execute's REAP CONTRACT assumption
  ('Lane 3 therefore declares it on BOTH terminal paths') into a deadlock rather
  than a missed resolution. Note the compounding: exit 11 fires BECAUSE the
  worktree is far behind, so the staler the worktree the likelier the spawn -
  and worktree GC had itself been down via tactic-sweep-timer-unit-dir-leak,
  which is what let this worktree survive seven days past its own PR merge."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale
    (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Promoted into Wave A after the defect recurred live
    during the bootstrap Stage 4 drain and deadlocked a node worker - a stale
    worktree served a dispatch-conflict body predating the terminal-declaration
    contract, so the session could not declare, which permanently consumed a
    worker slot and made the node unselectable with no autonomous recovery path.
    It belongs in this band on the band's own criterion: it takes fleet capacity
    down rather than corrupting one node. blocked_by is empty, so this promotion
    lifts no blocker and cannot compound - contrast the 65.33 sum
    tactic-dispatch-test-monolith-split produced when it kept its own boost
    while being lifted. status stays raw and phase stays null so the selector
    emits it as an /align-tactics candidate for planning, not as an implement
    candidate. Interim scaffolding only - tactic-attention-tier-ranking replaces
    the whole numeric scheme with lexicographic (tier, rank) and max-lifting,
    and tactic-attention-boost-scripts converts these boosts to tier/bug_fix
    marks."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A node-worker session reads its skill body from fresh state rather than from the node's own possibly-stale worktree — closing the conflict lane's guaranteed-stale case, where exit 11 spawns Lane 3 into the very checkout whose merge with origin/main just failed
