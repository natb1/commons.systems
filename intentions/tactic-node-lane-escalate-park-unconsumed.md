---
id: tactic-node-lane-escalate-park-unconsumed
kind: tactic
statement: Give the node lane's qa/fix escalate path a consumer that actually
  lands the park — today dispatch-mark-node-park writes its escalation only into
  $CLAUDE_JOB_DIR and delegates the landing to
  terminal_without_disposition_sweep, which now DEFERS a terminal-session
  candidate to the invalid-state lane instead of parking it, so the node stays
  unparked at its work phase and the escalation text survives only in a job dir
owner: ai
status: raw
parent: null
rationale: "Observed live on 2026-08-12 during the FIRST end-to-end
  /dispatch-ladder run, on node tactic-attention-namespaced-rank at phase qa (PR
  #3075). The qa pass was correct on its own terms: it found no fixable defects,
  classified one item needs-human (2/2 adversarial skeptics upheld), wrote a
  full office-hours recommendation, called dispatch-mark-node-park, and emitted
  disposition escalated. It then stopped. Nothing landed.
  dispatch-mark-node-park by design writes ONLY the marker files
  office-hours-reason / -recommendation / -pr into $CLAUDE_JOB_DIR -- it never
  touches the node and never writes a node-terminal marker, because the node
  lane forbids gh and the park is delegated. qa-main/SKILL.md:398 and
  fix-checks/SKILL.md:235 both name terminal_without_disposition_sweep as that
  delegate, and the sweep's own header (lib-frozen-session-park.sh:823-853) is
  built around consuming exactly these markers, treating a surviving
  office-hours-reason as proof a park did not land. But the sweep no longer
  parks this shape: run by hand against the live candidate it printed 'routed
  tactic-attention-namespaced-rank to the invalid-state lane (terminal-session)
  -- deferred, not parked; markers left intact', then 'routed candidates are
  DEFERRED, not resolved'. The terminal-session routing token arrived with
  tactic-invalid-state-lane (62ac5bb1, 2026-08-05) and intercepts the candidate
  ahead of the park arm. The receiving arm disclaims the duty in the opposite
  direction: dispatch-invalid-state-sweep's header states 'THIS ARM NEVER PARKS,
  NEVER HOLDS, NEVER REAPS' because 'dispatch-tick runs both defensive sweeps on
  every cadence, so the sweep tier is ALWAYS the escalation path'. Each arm
  names the other as the escalation owner. The lane does have a real resolver
  (dispatch-invalid-state-route spawns a session), so this is not a strict
  deadlock -- but it runs only on the tick, and the tick is exactly what is
  paused in the bootstrap case /dispatch-ladder exists to serve. Net observed
  state: node at phase qa with office_hours null, a terminal session held alive
  by dispatch-stop.sh occupying a worker slot and keeping the node unselectable,
  and the only copy of a carefully-written author-facing recommendation sitting
  in ~/.claude/jobs/17e4bf6c/. Resolved by hand: park-node landed it as
  069d1372, markers deleted, session released with claude rm. Second, coupled
  defect found on the same run and recorded here because neither fix alone makes
  the ladder work: dispatch-ladder-await throws held-session on the FIRST poll
  that sees a terminal row with no marker (dispatch-ladder-await:325-333, driver
  poll 60s), while terminal_without_disposition_sweep only acts once a candidate
  is idle past DISPATCH_TERMINAL_DISPOSITION_GRACE_S, default 300. The driver
  runs that sweep precisely so it can resolve out-of-session states
  (tactic-detached-driver-owed-tick-sweeps), but on this path the halt beats its
  own healer by 5x and the sweep can never fire. The await's header comment
  still reads the held row as needing 'that human act', which predates the sweep
  being able to resolve it autonomously."
reading: null
serves:
  - strategy-graph-native-dispatch
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
pace_exempt: false
rounds: null
attributes: {}
---
# Give the node lane's qa/fix escalate path a consumer that actually lands the park — today dispatch-mark-node-park writes its escalation only into $CLAUDE_JOB_DIR and delegates the landing to terminal_without_disposition_sweep, which now DEFERS a terminal-session candidate to the invalid-state lane instead of parking it, so the node stays unparked at its work phase and the escalation text survives only in a job dir

## How it was found

The first end-to-end `/dispatch-ladder` run, 2026-08-12, on
`tactic-attention-namespaced-rank`. The ladder walked the node
`implement → fix → qa` with no model turn between phases and landed four graph
commits of its own. At `qa` it halted, exit 11,
`throw tactic-attention-namespaced-rank held-session`.

The QA pass itself was not at fault. It found no fixable defects, classified one
item `needs-human` (2/2 adversarial skeptics upheld), wrote a full office-hours
recommendation naming the exact decision and the two ways to route the answer,
called `dispatch-mark-node-park`, and emitted `disposition: escalated`. Its own
closing words were "the node stays at phase `qa`; `dispatch-tick`'s sweep will
park it to office-hours from here."

That sweep does not park it.

## The chain

1. **`dispatch-mark-node-park` lands nothing, by design.** It writes only
   `office-hours-reason` / `-recommendation` / `-pr` into `$CLAUDE_JOB_DIR`
   (`dispatch-mark-node-park:1-32`). It never touches the node and never writes
   a node-terminal marker — the node lane forbids `gh`, so the park is
   delegated to "a later graph-native step".

2. **The doctrine names that step.** `qa-main/SKILL.md:398` and
   `fix-checks/SKILL.md:235` both say `terminal_without_disposition_sweep`
   reads the markers and parks the node via `park-node`. The sweep is built for
   it: `lib-frozen-session-park.sh:823-853` treats a *surviving*
   `office-hours-reason` as proof a park did not land, and calls that its own
   success criterion.

3. **The sweep no longer parks this shape.** Run by hand against the live
   candidate, past its grace window:

   ```
   routed tactic-attention-namespaced-rank to the invalid-state lane
     (terminal-session; session=17e4bf6c) — deferred, not parked; markers left intact
   terminal-disposition sweep complete (terminal=1 parked=0 observing=0 deferred=0)
   terminal-disposition lane pre-tier (routed=1 kept-by-lane=0)
     — routed candidates are DEFERRED, not resolved
   ```

   The `terminal-session` token arrived with [[tactic-invalid-state-lane]]
   (`62ac5bb1`, 2026-08-05) and intercepts the candidate *ahead of* the park
   arm.

4. **The receiving arm disclaims the duty in the opposite direction.**
   `dispatch-invalid-state-sweep`'s header: "THIS ARM NEVER PARKS, NEVER HOLDS,
   NEVER REAPS", justified by "dispatch-tick runs both defensive sweeps on
   every cadence, so the sweep tier is ALWAYS the escalation path" — the tier
   that just deferred to it. **Each arm names the other as the escalation
   owner.**

Not a strict deadlock: the lane has a real resolver, `dispatch-invalid-state-route`,
which spawns a session. But it runs only on the tick — and the tick being paused
is exactly the bootstrap case `/dispatch-ladder` exists to serve.

## What the observed state actually cost

- Node at `phase: qa` with `office_hours: null` — unparked, so it stays in the
  selectable population on paper while being unworkable in fact.
- A terminal session held alive by `dispatch-stop.sh`, occupying a worker slot
  and keeping the node unselectable (`worktree_has_live_session` is name-keyed).
- The only copy of a carefully-written, author-facing recommendation sitting in
  `~/.claude/jobs/17e4bf6c/`, one `rm -rf` from gone.

That third one is the real severity. The escalation text is the whole product of
the QA pass, and the pass that produced it has already exited.

## The coupled second defect: the ladder outruns its own healer

Recorded here rather than on its own node because neither fix alone makes the
ladder work.

| | trigger | latency |
|---|---|---|
| `dispatch-ladder-await` throws `held-session` | first poll seeing a terminal row with no marker (`:325-333`) | driver poll, **60s** |
| `terminal_without_disposition_sweep` acts | candidate idle past `DISPATCH_TERMINAL_DISPOSITION_GRACE_S` | default **300s** |

The driver runs that sweep *precisely* so it can resolve out-of-session states
([[tactic-detached-driver-owed-tick-sweeps]]). On this path the halt beats its
own healer by 5×, so the sweep can never fire before the driver is gone. The
await's header still reads a held row as needing "that human act" — written
before the sweep could resolve it autonomously.

## Resolved by hand this session

`park-node` landed the park from the session's own text as `069d1372`
(`office_hours` verified non-null at `origin/main`); markers deleted; session
released with `claude rm 17e4bf6c`. The node now sits correctly in the
office-hours queue awaiting the author's answer on PR #3075. None of that is a
fix — it is one operator doing by hand what no automated arm would do.

## Directions, for whoever picks this up

1. **Make one arm own it.** Either the invalid-state lane parks when it holds a
   consumable escalation, or the terminal-disposition sweep parks *before*
   routing when `office-hours-reason` exists. The second is smaller and matches
   the marker-deletion-as-proof discipline already written into the sweep.
2. **Stop delegating the park at all.** `dispatch-mark-node-park` could call
   `park-node` directly — it is the same in-process guarantee `park-node`
   already gives via `mark-node-terminal`, and it removes the cross-process
   handoff that broke here. Weigh against the node lane's no-`gh` rule, which
   `park-node` already respects.
3. **Give the await a grace that clears the sweep's.** Whatever else changes,
   a driver that halts faster than its own healer can act will keep converting
   recoverable states into operator work.

Related: [[tactic-qa-fix-terminal-marker-ratchet]] covers the *marker* half of
this same path — a prose-only guarantee with no mechanical pin. This node is the
*consumer* half: even a correctly-written marker set has nobody to land it.
