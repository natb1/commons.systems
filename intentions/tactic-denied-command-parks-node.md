---
id: tactic-denied-command-parks-node
kind: tactic
statement: A worker frozen by an auto-mode classifier denial must park its node
  instead of holding it silently — a denied command leaves the session at state
  blocked / status waiting, which drops it out of
  claude_agents_count_busy_workers (so the concurrency gate sees a free slot)
  while worktree_has_live_session still holds the node, with no timeout, no
  office_hours park and no journal line, making the frozen node invisible to
  every existing fleet check
owner: ai
status: raw
parent: null
rationale: "Observed live 2026-07-31T00:42:30Z during the dispatch-pipeline
  bootstrap, on what was then the fleet's serial critical-path node
  (tactic-dispatch-test-monolith-split). The worker issued a sandbox-off `git
  reset --hard` and the auto-mode classifier denied it; the session went state:
  blocked, status: waiting, waitingFor: \"input needed\", and stayed there. Its
  transcript stopped growing — the denial was the last entry — so the freeze is
  distinguishable from slowness by mtime alone. The denial was gratuitous: the
  worktree was already at the target sha and clean, so the reset was a no-op
  whose only effect was freezing the session. The structural defect is that two
  predicates disagree about the same session: claude_agents_count_busy_workers
  (lib-claude-agents.sh) selects status == busy and so stops counting a waiting
  session, while worktree_has_live_session (graph-select-target:669) matches ANY
  session in the worktree and so keeps holding the node. The router therefore
  sees a free slot and keeps selecting, but every node it wants is pinned by a
  session doing no work — the measured consequence on 2026-07-31T01:50Z was BUSY
  = 1 (the human's own monitoring session) against target_n: 3, with six nodes
  held and zero productive fleet workers. Denial is not rare and not confined to
  gh: within one hour the classifier also denied a compound read-only `gh pr
  list && git ls-remote`, a `claude agents --json | jq` plus `gh pr list` pair,
  and `claude rm <id>` twice having ALLOWED two identical `claude rm` calls
  minutes earlier — so it is nondeterministic across identical inputs and cannot
  be avoided by construction. Routing around a denial is explicitly not the
  remedy; failing loudly is. Filed together with
  tactic-phase-terminal-requires-disposition and
  tactic-standdown-winner-liveness: all three are the same root confusion —
  'held' and 'being worked' are not the same predicate and no code distinguishes
  them — and tactic-router-spawn-window-duplicate-worker is the fourth member,
  spawning a second worker onto a node already claimed. Whoever plans any of
  them should read all four together, because fixing them piecemeal will keep
  producing variants. tactic-stopped-session-blocks-node is adjacent but
  distinct and must NOT be deduped against this node: there the hold is the
  author-stated REQUIREMENT (release is an explicit human act), whereas here the
  hold is an accident of a frozen session. Interim attention scaffolding only —
  tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks. blocked_by is empty, so this Wave A
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
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    converts a concurrency slot into a permanently frozen node with no
    surfacing, and it was one of the three defects that took measured fleet
    throughput to zero on 2026-07-31 (BUSY = 1, and that one the human's
    monitoring session). blocked_by is empty, so this promotion lifts no blocker
    and cannot compound. status stays raw and phase stays null so the selector
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
# A worker frozen by an auto-mode classifier denial must park its node instead of holding it silently — a denied command leaves the session at state blocked / status waiting, which drops it out of claude_agents_count_busy_workers (so the concurrency gate sees a free slot) while worktree_has_live_session still holds the node, with no timeout, no office_hours park and no journal line, making the frozen node invisible to every existing fleet check

## Context

Observed live **2026-07-31T00:42:30Z**, on what was then the fleet's serial
critical-path node (`tactic-dispatch-test-monolith-split`).

The worker issued a sandbox-off `git reset --hard`. The **auto-mode classifier
denied it.** The session went `state: blocked`, `status: waiting`,
`waitingFor: "input needed"` — and stayed there. Its transcript stopped growing;
the last entry was the denial.

**The denial was gratuitous.** The worktree was already at the target sha and
clean, so the reset was a no-op. Its only effect was freezing the session.

## Why this is worse than an ordinary stall

Two predicates disagree about the same session, and the disagreement is the
whole defect:

| predicate | how it reads the session | effect |
|---|---|---|
| `claude_agents_count_busy_workers` (`lib-claude-agents.sh`) | selects `status == "busy"`; a `waiting` session does not match | **stops counting it** — the concurrency gate sees a free slot |
| `worktree_has_live_session` (`graph-select-target:669`) | matches **any** session in the worktree | **keeps holding the node** |

So the router correctly sees headroom and keeps selecting, while every node it
wants is pinned by a session doing no work. There is **no timeout, no
`office_hours` park, no journal line, and nothing in `routing-decisions.jsonl`** —
the frozen node is invisible to every existing fleet check.

The measured consequence, 2026-07-31T01:50Z: **BUSY = 1** — and that one was the
human's own monitoring session — against `target_n: 3`, with **six nodes held**
and **zero productive fleet workers**.

### Detecting it

The freeze is distinguishable from slowness by transcript mtime alone:

```bash
D=/home/n8/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-<node-id>
F=$(ls -1t "$D"/<session-id>*.jsonl | head -1)
stat -c 'mtime %y' "$F"     # stopped growing ⇒ frozen, not slow
```

## Denial is not rare, and not confined to `gh`

Within one hour on 2026-07-30/31 the classifier also denied:

- a compound **read-only** `gh pr list … && git ls-remote`
- a `claude agents --json | jq` + `gh pr list` pair
- **`claude rm <id>` twice — having *allowed* two identical `claude rm` calls
  minutes earlier**

It is **nondeterministic across identical inputs**, so this cannot be avoided by
constructing commands more carefully. Any fix that assumes a denial is
predictable will not hold.

## Direction for planning (not a plan)

A worker that is denied must **fail loudly**: write an `office_hours` park naming
the denied command, so the node leaves the lane and surfaces in office hours
instead of silently pinning a worktree.

Secondarily — and this is the deeper item — `claude_agents_count_busy_workers`
and `worktree_has_live_session` disagreeing about the same session is the
underlying hazard. Either a session that holds a node counts against the cap, or
it does not hold the node. Both predicates being "right" independently is what
produces a fleet that is simultaneously at capacity and idle.

**Do not route around a denial.** Escalation is the correct response; a standing
permission rule or the author running the command are the correct remedies.

## Read this with its three siblings — do not plan it alone

`tactic-denied-command-parks-node`, `tactic-phase-terminal-requires-disposition`,
`tactic-standdown-winner-liveness` and
`tactic-router-spawn-window-duplicate-worker` are **one family**: the fleet cannot
reliably tell whether a node is being worked on. The duplicate-worker node spawns
a second worker onto a node already claimed; the other three each leave a session
holding a node it is not working. Same root confusion — **"held" and "being
worked" are not the same predicate, and no code distinguishes them.** Fixing them
piecemeal will keep producing variants.

## Adjacent but distinct — do not dedupe

- `tactic-stopped-session-blocks-node` — there the hold is the author-stated
  **requirement** (a stopped session *must* keep blocking; release is an explicit
  human act). Here the hold is an **accident** of a frozen session. The two look
  identical in `claude agents` output and must not be collapsed.
