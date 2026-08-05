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
gap: "Still open (decision made 2026-08-04, see clarifications): how many OTHER
  already-parked nodes in the current graph are silently in this same state
  (Workflow landed, session dead, park is the only symptom) -- the one-time
  sweep cross-checking parked nodes against their originating session's Workflow
  completion record has not been run."
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Gap decision — session-level hardening of Step 2's mark-node-terminal
      call, or sweep-level reap of the dead job, given condition 14 reserved the
      freeze-for-debug trade for the author?
    answer: "(Ruled 2026-08-04 /align interview, author-ratified.) Both, with the
      doctrine trade made: condition 14's keep-for-debug is amended
      (strategy-graph-native-dispatch 2026-08-04 clarification) — an undeclared
      terminal exit now routes to the invalid-state lane, whose intervention
      session consumes the debugging artifact autonomously (transcript review,
      find-or-create root-cause follow-up, then reap or park) instead of
      freezing until an operator debugs by hand. This node's class (Workflow
      completed, graph write landed, mark-node-terminal skipped) is the worked
      example the intervention resolves mechanically: the transcript shows the
      completed Workflow, so the intervention performs the missed
      mark-node-terminal disposition, reaps, and files the hardening follow-up —
      the runtime discriminator the park said was missing is supplied by reading
      the transcript, not by a sweep-time flag. Session-level hardening of
      /align-tactics Step 2 (move mark-node-terminal into the same block as the
      graph-commit it follows, mirroring park-node:310-317 and transition-node's
      mark_terminal helper) remains in scope as prevention, as does correcting
      the shipped park-recommendation text at lib-frozen-session-park.sh:1034
      and the one-time cross-check audit still recorded in gap. Re-run
      /align-tactics on this node to finalize against this ruling. Park
      cleared."
  - question: The 2026-08-04 park (commit 13f4efa7) blocked this node's finalize
      round on its serving strategy's own office_hours park. Does that block
      still stand?
    answer: "No — it was already void when it was written, and is now disproven
      by direct observation. (Ruled 2026-08-05, author-directed, during the
      bootstrap monitor pass.) 13f4efa7 landed at 23:25:02Z and gave as its sole
      reason that the /align-tactics drift-review gate 'requires the serving
      strategy's office_hours be null before it authors any plan, tactic-mode
      included', so the round returned decomposable=false and escalated. PR
      #2982 removed exactly that coupling and merged at 00:15:46Z — fifty
      minutes later. On the code now at origin/main, tactic mode sets
      eligibility.decomposable=true by construction (align-tactics.js:728) and
      the plan gate reads planProceed = isTactic ? proceed : proceed &&
      decomposable (align-tactics.js:474), so a parked serving strategy no
      longer blocks a tactic-mode finalize. Behavioural proof, not inference:
      at 00:50Z tactic-reconcile-park-clobber — which also carries serves:
      [strategy-graph-native-dispatch], still parked — cleared its drift review
      with proceed=true and no parks, authored a full three-unit plan, and
      landed as status codified / phase implement (commit 4d737d0e). That is the
      identical shape this park declared impossible. Disposition: unpark and
      re-run /align-tactics to finalize. The alternative reading — that the bug
      ledger's note calling this node 'subsumed by the invalid-state lane (1d)'
      should close it instead — was considered and rejected, because 13f4efa7's
      own drift review recorded this tactic's three-item scope as intact and not
      deficient (Step 2 hardening, correcting lib-frozen-session-park.sh's
      park-recommendation text, and the one-time cross-check audit), and none of
      those three is covered by the invalid-state lane, which addresses
      detection and intervention rather than that script's wording. Note that
      the three record-completeness gaps 13f4efa7 raised against
      strategy-graph-native-dispatch itself (its office_hours missing from the
      drift agent's input dump; rounds.count 0 and rounds.last_aligned null
      despite a dozen-plus documented rounds; three attributes.conditions
      entries narrating mechanisms that are still open tactics) are independent
      of this ruling and remain owed to an /align sitting on the strategy — a
      tactic-target session never edits the serving strategy's frontmatter."
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
office_hours:
  reason: "This tactic's /align-tactics finalize round (2026-08-04) could not
    author a plan: its serving strategy (strategy-graph-native-dispatch) is
    itself office_hours-parked at origin/main since 2026-08-04 for an unresolved
    measurement-instrument ratification hold (success_signal.sensor no longer
    resolves to any registered sensor under SensorRegistry.resolve's exact-match
    design, sensors.ts:49-59; success_signal.threshold's two quantitative terms
    -- the maintenance-burden band and the sample-history home -- are
    undeclared). The /align-tactics Workflow's drift-review gate requires the
    serving strategy's office_hours be null before it authors any plan,
    tactic-mode included, so this round's drift phase returned
    decomposable=false and disposition=escalated before writing a body for this
    node (Workflow run wf_d7572c90-18f, 2026-08-04). This tactic's own scope was
    not found deficient -- the drift review confirmed the tactic's three-item
    scope (Step 2 hardening, correcting lib-frozen-session-park.sh's
    park-recommendation text, the one-time cross-check audit) is unchanged; the
    block is entirely upstream, in the serving strategy's own measurement
    instrument. Separately, this round's drift review surfaced three
    record-completeness gaps on the strategy itself, none of which are written
    here -- a tactic-target /align-tactics session never edits the serving
    strategy's frontmatter: (a) the strategy record supplied to the drift
    agent's input dump omitted the strategy's own office_hours field entirely,
    so a reviewer trusting its input would have proceeded to plan against a live
    park -- worth checking whether the dump path strips office_hours or was
    simply taken before this park landed; (b) rounds.count reads 0 and
    rounds.last_aligned reads null at origin/main despite a dozen-plus
    documented re-evaluation rounds on this strategy since 2026-07-03, so the
    round-cap and fresh-reading gates that read those fields have never actually
    contained anything; (c) three attributes.conditions entries (the 2026-07-26
    pause-config-field migration, the PR-title CI guard, the
    bounded-ancestry-projection script) narrate landed mechanisms that are in
    fact still open, unplanned tactics. Recommend: do not re-plan this tactic
    directly against this park. First clear the strategy's own standing park via
    an /align interview ratifying its sensor-name and threshold premises (see
    strategy-graph-native-dispatch's own office_hours.reason for the two
    ratification options), landing the three drift-surfaced record-completeness
    gaps above as dated clarifications in that same sitting if the author judges
    them worth recording; then re-run /align-tactics
    tactic-align-tactics-mark-terminal-skipped to finalize this tactic. Until
    the strategy's park clears, leaving this tactic unparked would let the
    router's frozenTacticSelectable gate keep re-selecting it every tick (the
    draft-tactic candidate emission in router.ts checks only this tactic's own
    office_hours, never its serving strategy's), re-spawning a session that
    would hit this identical block every time -- this park exists to stop that
    churn, not to flag a defect in this tactic's own content."
  since: 2026-08-04
  recommendation: Run an /align interview against strategy-graph-native-dispatch
    to ratify its own pending office_hours hold (sensor-name drift + unreadable
    threshold), clear that park, then re-run /align-tactics
    tactic-align-tactics-mark-terminal-skipped to finalize this tactic. Do not
    attempt to plan this tactic while the strategy park is live -- the
    Workflow's drift gate will re-park identically.
  session_type: other
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
