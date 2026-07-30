---
id: tactic-stopped-session-blocks-node
kind: tactic
statement: A session that has stopped but has not been claude rm'd must continue
  to block its node's concurrent execution — the router's occupancy path queries
  claude agents --json without --all, so a done-but-not-removed session is
  invisible to it and the node becomes selectable again while the held debugging
  artifact is never inspected
owner: ai
status: raw
parent: null
rationale: "AUTHOR-STATED REQUIREMENT (2026-07-30, dispatch-pipeline bootstrap):
  a session that is stopped but not claude rm'd must continue to block that
  node's concurrent execution. Releasing the node is an explicit human act
  (claude rm <id>), not something that happens by the session merely finishing.
  Today the system does the opposite, by explicit design: claude agents --json
  lists only ACTIVE sessions and --all adds completed ones (state done), and the
  router's occupancy path never passes --all. Filed as a NEW node during the
  bootstrap after confirming three adjacent nodes each miss this predicate:
  tactic-claim-containment-durable-anchor is the closest (anchoring the freeze
  in durable state would incidentally satisfy this) but its stated trigger is
  registry LOSS, not the registry deliberately hiding done rows, and it is a
  much larger redesign; tactic-frozen-session-debug-count is observability only
  — it makes accumulation visible, never blocking;
  tactic-graph-node-session-reap runs the opposite direction, removing sessions
  on terminal exit, where this node is about ones that linger. Filed separately
  so the cheap fix (teach the occupancy check to count a done-but-not-removed
  session as occupied) does not wait on the expensive redesign. Scoped small
  deliberately. Interim attention scaffolding only —
  tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks. blocked_by is empty, so the Wave A
  promotion lifts no blocker and cannot compound."
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
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is a live containment hole that silently voids the doctrine
    tactic-router-failure-fuses records, so an undeclared pass stops holding its
    node the moment its session goes done, and the node is re-selected with the
    debugging artifact still unexamined. Observed exactly this way during the
    bootstrap Stage 4 drain. blocked_by is empty, so this promotion lifts no
    blocker and cannot compound — contrast the 65.33 sum
    tactic-dispatch-test-monolith-split produced when it kept its own boost
    while being lifted. status stays raw and phase stays null so the selector
    emits it as an /align-tactics candidate for planning, not as an implement
    candidate."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# A stopped-but-not-removed session must keep blocking its node

## The requirement

Stated by the author on 2026-07-30, during the dispatch-pipeline bootstrap:

> A session that is stopped but not `rm`'d must continue to block that node's
> concurrent execution.

Releasing the node is an explicit human act — `claude rm <id>` — not something
that happens by the session merely finishing.

## Today the system does the opposite, by design

`claude agents --json` lists only *active* sessions; `--all` adds completed ones
(`state: "done"`). The dispatch router's occupancy path never passes `--all`.

In `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`:

| helper | line | query |
|---|---|---|
| `_claude_agents_raw` | 199 | `claude agents --json` — no `--all` |
| `claude_agents_snapshot_capture` | 211 | `claude agents --json >"$pth"` (line 217) |
| `claude_sessions_under` | 222 | `claude agents --json --cwd <path>` — no `--all` |
| `claude_sessions_with_name` | 266 | via `_claude_agents_raw` |
| `claude_agents_list_all` | 438 | via `_claude_agents_raw` — "all" here means *machine-wide*, **not** including `done` |
| `worktree_has_live_session` | 550 | via `_claude_agents_raw` |
| `claude_agents_count_busy_workers` | 600 | via `_claude_agents_raw` |

The per-tick snapshot at line 217 is captured the same way, so the *entire tick*
runs against an array with no `done` rows in it — every helper reading
`DISPATCH_AGENTS_SNAPSHOT` inherits the blindness even if it were changed
individually.

Only three helpers use `--all`, and all three are name-lookup helpers scoped
away from the shared occupancy path: `claude_sessions_with_name_all` (309),
`claude_job_id_for_name_all` (363), `claude_sessions_with_name_prefix_all`
(394). The first carries this contract comment at line 58:

> SCOPED TO THE OFFICE-HOURS SELECTOR ONLY. The shared helpers […]

— because making `done` sessions visible to the shared helpers "would change
those decisions". Changing those decisions is precisely what this requirement
asks for. Note also that `claude_agents_list_all`'s name is a trap for a reader
skimming for the fix site: its `_all` suffix means machine-wide scope, not
`--all`.

## Why it matters: it silently voids the containment doctrine

[[tactic-router-failure-fuses]] records the design as: a pass that declares
neither progression, bounded retry, nor park **has not ended**, so its session is
not reaped and the node freezes behind the concurrency controls with the held
session as the debugging artifact.

That freeze holds only while the session is **live**. Once it goes
`done`-but-not-removed it vanishes from the router's view, the node becomes
selectable again, and the artifact is never inspected. The containment is not
merely weakened — it expires on its own, at exactly the moment the pass stops.

## Evidence

Observed during the bootstrap's Stage 4 drain, and still observable at the time
of filing:

- Session `c0a852b4`, name `tactic-graph-tick-node-lane-auto-merge`, deadlocked
  at 17:02:38Z (it was the [[tactic-node-worker-fresh-skill-body]] defect — a
  stale worktree serving a `dispatch-conflict` body predating the
  terminal-declaration contract, so it could not declare and stopped with no
  marker).
- It then went `state: "done"` with no `pid` and no `status`, and dropped out of
  `claude agents --json`.
- The node was re-selected by the 18:16:09Z tick and worked again, with the
  session still registered and never `rm`'d.
- `claude agents --json --all` still lists it. The two listings disagree, which
  is the signature:

```bash
# both listings must agree, or a done-not-removed session is un-freezing a node
diff <(claude agents --json      | jq -r '.[].name' | sort) \
     <(claude agents --json --all| jq -r '.[].name' | sort)   # sandbox-off
```

The containment lifted itself while the debugging artifact was sitting there
unexamined. That is the defect this node records — it is distinct from the
stale-skill cause that produced the deadlock in the first place.

## The query shape is already proven

`claude_sessions_with_name_all` demonstrates that `--all` parses and filters the
same way the non-`--all` helpers do; this is not a new capability, only a scope
change to the shared occupancy path. The work is in deciding which helpers flip
(and whether the tick snapshot becomes an `--all` capture with `done` rows
filtered per-caller, rather than each caller re-querying), not in learning
whether the daemon can answer.

## Interaction with adjacent nodes

- [[tactic-claim-containment-durable-anchor]] is the durable superset: anchoring
  the freeze in durable state makes it indifferent to session state, which would
  *incidentally* satisfy this requirement. But its stated trigger is registry
  **loss**, not the registry deliberately hiding `done` rows, and it is a much
  larger redesign. This node is filed separately so the cheap fix does not wait
  on the expensive one; if the durable anchor lands first, this node should be
  re-examined for supersession rather than assumed dead.
- [[tactic-frozen-session-debug-count]] is the mitigation, not an overlap: it
  gives operators a visible count of held-for-debug sessions. Blocking (this
  node) plus visibility (that node) plus explicit human release (`claude rm`) is
  the coherent design; either alone is incomplete.
- [[tactic-graph-node-session-reap]] runs the opposite direction — it reaps node
  worker sessions on terminal exit. It does not cover sessions that linger
  precisely *because* they never reached a terminal declaration.

## The one design question to settle when planning

A `done` session blocks until a human `rm`s it — which is the point — but it
means an unattended fleet can accumulate permanently-blocked nodes.

That is the intended trade: containment over throughput. Do **not** resolve it
by adding a timeout; a timeout reintroduces the exact silent expiry this node
exists to remove. State the interaction with
[[tactic-frozen-session-debug-count]] instead, and treat operator visibility as
the pressure valve.

Also worth settling: `claude rm <id>` deletes the session **and its worktree**,
while `stop` does not — so the human release act and the worktree reap are
already coupled, and the plan should say whether that coupling is relied upon.
