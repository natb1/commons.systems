---
id: tactic-align-tactics-mark-terminal-skipped
kind: tactic
statement: An /align-tactics tactic-mode session's Workflow can complete cleanly
  and Step 2 can land the graph write, yet the session dies/idles before calling
  mark-node-terminal -- leaving the node terminal-held with no disposition until
  a defensive sweep parks it, and clearing that park alone restarts the churn
  because the dead session is still un-reaped
owner: ai
status: raw
parent: null
rationale: "Confirmed THREE times in one 08-01 investigation session, all the
  same shape: (1) tactic-stale-hold-auto-resolve -- Workflow disposition
  completed_with_fixes, 0 parks, plan landed at 668186a7, session died before
  mark-node-terminal, park cleared ab63dbda; (2) tactic-attention-boost-scripts
  -- plan landed earlier at c1773223, mark-node-terminal skipped, caught by a
  separate terminal-without-disposition sweep (park 3fff8088), cleared 9fb3b7ae;
  (3) tactic-test-decision-log-prod-leak -- Workflow wf_54f470ca-95b.json
  completed_with_fixes 2026-08-01T02:30:36Z, Step 2 landed bd8a7e02 (body diffed
  materially identical to the Workflow's authored body_markdown),
  mark-node-terminal skipped, parked by the terminal-without-disposition sweep
  18 min later (6201012b), cleared 93e3ab38 -- but clearing alone did NOT close
  the loop: the still-un-reaped session (41df3a8c) triggered a
  concurrent-edit-conflict park (754c2916) from another actor racing the same
  node, then the SAME terminal-without-disposition sweep re-parked it (1de047b3)
  8 hours later because the job was still un-reaped and therefore still read as
  terminal-without-disposition. The loop only stopped once the session was
  actually reaped (worktree remove + claude rm, since its branch was never
  pushed to a remote) AND the park cleared afterward, together, in that order --
  final clear 241489ee. Direct proof that 'clear the park' and 'reap the
  session' are two separate required actions, and doing only the first is a
  no-op that gets re-undone by the same sweep that originally caught it."
reading: null
gap: "Not yet decided: (1) should Step 2 be hardened to retry/guarantee
  mark-node-terminal before the session is allowed to go idle (a session-level
  fix), or (2) should the terminal-without-disposition sweep itself reap a dead
  job before or as part of clearing its park (a sweep-level fix) -- these are
  different owners and either could close the loop; needs an /align-tactics
  round to decide scope. Also open: how many OTHER already-parked nodes in the
  current graph are silently in this same state (Workflow landed, session dead,
  park is the only symptom) -- a one-time sweep cross-checking parked nodes
  against their originating session's Workflow completion record would answer
  this but has not been run."
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: an /align-tactics tactic-mode session that completes its Workflow to
    disposition completed_with_fixes always has mark-node-terminal recorded
    before the session goes idle, verified by cross-referencing the session's
    workflows/wf_*.json completion timestamp against its mark-node-terminal call
    in the same session's transcript
  sensor: test-align-tactics-mark-terminal.sh (new, or a fault-injection addition
    to an existing align-tactics test)
  threshold: new test asserts mark-node-terminal is called (or retried) before the
    session can go idle after a completed Workflow; existing suite unaffected
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
# An /align-tactics tactic-mode session's Workflow can complete cleanly and Step 2 can land the graph write, yet the session dies/idles before calling mark-node-terminal -- leaving the node terminal-held with no disposition until a defensive sweep parks it, and clearing that park alone restarts the churn because the dead session is still un-reaped

Draft finding, not yet decomposed — recorded per the standing rule that findings
land as graph nodes, never journald or plan prose alone. Filed after a single
08-01 investigation session hit this same shape three separate times while
resolving unrelated stopped-node reports.

## The three occurrences

| node | Workflow completion | graph write | mark-node-terminal | caught by | cleared |
|---|---|---|---|---|---|
| `tactic-stale-hold-auto-resolve` | `completed_with_fixes`, 0 parks | landed `668186a7` | skipped | (found by this session directly) | `ab63dbda` |
| `tactic-attention-boost-scripts` | `completed_with_fixes` | landed earlier, `c1773223` | skipped | separate terminal-without-disposition sweep, park `3fff8088` | `9fb3b7ae` |
| `tactic-test-decision-log-prod-leak` | `completed_with_fixes`, `wf_54f470ca-95b.json`, 2026-08-01T02:30:36Z | landed `bd8a7e02` (diffed materially identical to the Workflow's `body_markdown`) | skipped | terminal-without-disposition sweep 18 min later, park `6201012b` | `93e3ab38`, but see below |

In all three, the plan content the Workflow authored was never lost — it
landed. The only gap is the mechanical `mark-node-terminal align-round` call
at the end of the SKILL's Step 2, which the session never reached before going
idle.

## Why "clear the park" alone is not sufficient — direct evidence

`tactic-test-decision-log-prod-leak`'s clear (`93e3ab38`) did not close the
loop. The originating session (`41df3a8c`) was still alive-but-idle and
un-reaped. Over the following hours: a second actor raced the same node and
landed a concurrent-edit-conflict park (`754c2916`); then the *same*
terminal-without-disposition sweep re-parked it a second time (`1de047b3`),
because from the sweep's point of view the job was still terminal with no
disposition — clearing `office_hours` doesn't change that. The loop only
stopped once the session was actually reaped (`git worktree remove` then
`claude rm` — its branch had never been pushed to a remote, a known reap
gotcha) **and then** the park was cleared again (`241489ee`), in that order.

**Clearing a park without reaping the session that produced it is a no-op**:
the same sweep that caught the gap will re-catch it on its next pass, because
the underlying condition (a terminal, un-reaped session with no recorded
disposition) is unchanged.

## Shape of a fix (not yet decided — decompose in `/align-tactics`)

1. Harden `/align-tactics` tactic-mode Step 2 so `mark-node-terminal
   align-round` is guaranteed to run (retry-on-session-exit, or move it earlier
   so a partial Step 2 can't skip it) — the session-level fix.
2. Alternatively/additionally, have the terminal-without-disposition sweep
   itself reap the dead job as part of (or immediately before) clearing its
   park, so a human/session never has to do both halves by hand.
3. Run a one-time audit: cross-check every currently-parked node against its
   originating session's `workflows/wf_*.json` completion record, to find out
   how many more nodes are silently sitting in this same state right now.
