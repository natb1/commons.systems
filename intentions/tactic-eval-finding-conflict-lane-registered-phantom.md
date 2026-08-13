---
id: tactic-eval-finding-conflict-lane-registered-phantom
kind: tactic
statement: The conflict-lane post-launch check treats claude-daemon registration
  as sufficient evidence a worker started, but a session can register and then
  die before writing any file, leaving dispatch-ladder-await to burn its full
  timeout before an unfollowable "stalled" halt.
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: conflict-lane-launch-to-stalled-elapsed-s
      value: 734
      unit: seconds
      window: single-run
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: conflict-lane-post-launch-filesystem-trace-count
      value: 0
      unit: files
      window: single-run
      sensor: rsi
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## Finding: conflict-lane launch verifies "registered" yet produces zero filesystem trace

**Observed in:** `tactic-attention-namespaced-rank`, phase `qa`, the ladder's second
qa-phase attempt (the first attempt had already thrown `held-session` at
02:32:16Z and was evaluated separately; this eval's `--since 1786592808`
scopes strictly to the second attempt).

**Timeline (from `events.jsonl`):**
- `2026-08-13T03:46:48Z` — `launched tactic-attention-namespaced-rank tactic qa
  /dispatch-conflict`. This exact echo (`launched $NODE_ID $KIND $PHASE
  /dispatch-conflict`) only fires from `dispatch-ladder-advance`'s
  `conflict-lane` case AFTER `verify_launch "$PROJECT_ROOT" "$NODE_WT"`
  returns true (`LAUNCH_VERIFY_STATE=registered`) — every other verify outcome
  (`absent`/`unknown`) routes to `launch_unverified`, which emits a `throw
  ... launch-unverified` / `launch-unverifiable` disposition instead, and no
  such throw is in the ledger. So the daemon's `claude agents --json` registry
  affirmatively reported a session registered for this node within the ~24s
  verify budget.
- `2026-08-13T03:59:02Z` (734s later) — `halt ... stalled ... the worker
  stopped with no graph change; read its transcript before re-running`, from
  `dispatch-ladder-await`.

**The contradiction:** despite the daemon-side registration passing, no file
of any kind was created or modified anywhere under `~/.claude/projects` during
the entire `[03:46:48Z, 03:59:02Z]` window — confirmed with an unscoped
`find ~/.claude/projects -newermt ... -not -newermt ...` spanning both
candidate cwds (`PROJECT_ROOT` and the node's worktree) with margin on both
ends. Specifically: no `*.jsonl` transcript, no session directory, and no
`*.dispatch-stamp.json` sidecar (the `SessionStart` hook that writes the
stamp never fired). The node's own `execution.conflict` attempt counter is
still `null` — the conflict lane never got far enough to record an attempt.

**Why this matters:** `dispatch-ladder-advance`'s post-launch verification
(added to catch exactly the "`claude --bg` exits 0 having started nothing"
class of failure — see its own inline comments at lines 276–297) treats daemon
registration as sufficient evidence a worker is real, and lets the ladder
commit to the full await window on that basis. This run shows registration is
not sufficient: a session can register with the daemon and then die before
ever touching disk, producing a phantom that the existing verification cannot
distinguish from a healthy worker. The ladder then burns the entire
`dispatch-ladder-await` `TIMEOUT_S` window (540s, i.e. 9 minutes — the
observed 734s implies either a repoll or `BOOT_GRACE_S` stacked on top) before
declaring `stalled`, and the halt's own remediation ("read its transcript
before re-running") is unfollowable because no transcript was ever written.

**What would have to change:** the post-launch check would need a second,
cheaper confirmation beyond registry presence — e.g. polling for the
`*.dispatch-stamp.json` sidecar (written at `SessionStart`) to appear within a
short window (tens of seconds) after registration, before committing to the
full multi-minute await budget. This is a recommendation for the finding's
author to weigh, not a rule this eval job may apply.
