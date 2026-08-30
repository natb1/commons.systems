---
id: tactic-fleet-alarm-busy-stall
kind: tactic
statement: No dispatch worker has been busy for a sustained span
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-fleet-alarm from an out-of-band fleet
  instrument reading. See the body for the reading.
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "phase session ended without declaring a disposition — `claude agents
    --all` reports the session for this node in a terminal state and it has had
    no transcript activity for `13750`s, while `origin/main` still shows the
    node at a working phase with `office_hours: null`; the node is therefore
    both re-selectable and held, so the dispatch-tick
    terminal-without-disposition sweep parked it"
  since: 2026-08-09
  recommendation: "Reap THEN clear — this order is mandatory, not a choice between
    two options. (1) Read the session's transcript or attach the held job
    (`claude agents --all`, `claude attach <job-id>`) to see what it concluded;
    deciding the judgment item the session stopped on is done IN ADDITION to the
    reap, never instead of it. (2) Reap the terminal session: whenever the
    terminal session is still present, reap it before clearing the park — that
    order is mandatory — by stopping it (`claude stop <job-id>`) and letting
    `dispatch-sweep` reap the worktree. (3) Only if step (2) does not clear the
    session (e.g. an unpushed branch whose content is already landed elsewhere),
    verify the worktree is safe to discard BEFORE the destructive fallback,
    using the same reap-safety gate `lib-session-reap.sh` applies: (a) `git -C
    <worktree> status --porcelain --untracked-files=no` prints nothing (no
    uncommitted work), (b) `git -C <worktree> diff --quiet origin/main HEAD -- .
    ':!intentions'` exits 0 (tree content already landed; the `intentions/`
    carve-out is deliberate — graph commits land separately), and (c) no OPEN PR
    still has that branch as its head; judge by that content diff, never by a
    commits-ahead count: GitHub squash-merges, so a safe branch routinely reads
    many commits ahead. If any of (a)-(c) does not pass, do NOT remove the
    worktree — the work in it is not yet landed. Only once they all pass, fall
    back to `git worktree remove` plus `claude rm <job-id>`. (4) ONLY THEN
    `clear-park <node-id>` to return the node to the lane. Exception — if
    `claude agents --all` shows no session for this node, the session is already
    gone, the reap step is already satisfied, and `clear-park <node-id>` alone
    is the correct and sufficient action. Why the order is mandatory: clearing
    the park while the session is still present is a no-op — the same sweep
    re-parks the node on its next pass, because the condition it detects (a
    terminal, un-reaped session with no recorded disposition) is unchanged by
    the clear alone. (Observed: a park was cleared with the session left alive,
    and the same sweep re-parked the node twice.)"
  session_type: other
pace_exempt: true
rounds: null
attributes: {}
---
<!-- generated:dispatch-fleet-alarm -->
zero busy dispatch workers have been observed continuously for longer than the 2700s stall limit

Threshold: DISPATCH_FLEET_WATCH_IDLE_LIMIT=2700s
State file: /home/n8/.local/share/commons-dispatch/fleet-watch-state.json (busy_zero_since — the live value is in this pass's
journald output and in --json)
Pause state: not-paused
<!-- /generated:dispatch-fleet-alarm -->
