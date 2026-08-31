---
id: tactic-review-dispatch-charter-split
kind: tactic
statement: "Review sitting: split strategy-graph-native-dispatch by charter —
  its 328 tactic children (measured at origin/main 174a19e8, 2026-08-31) share
  one defect-ratio signal, so the ratio means less than it appears to"
owner: human
status: raw
parent: null
rationale: "Born parked 2026-08-14 by the ratifying /align round on
  strategy-discovered-requirements, which asked whether the greenfield recorded
  in that node's third clarification was worth its own round; the author said it
  was. Serves strategy-graph-integrity rather than
  strategy-graph-native-dispatch itself because the finding is a coherence and
  parsimony property of the record — one strategy carrying 275 children under a
  single backlog ratio — which is integrity's charter, not dispatch's. It is a
  review sitting rather than an executable tactic because /align is
  human-invoked on demand: no tactic can dispatch an /align round, so the
  office_hours park is what surfaces it to the author."
reading: null
serves:
  - strategy-graph-integrity
recovers: []
clarifications:
  - question: Is the 275-child figure in the statement and rationale still current?
    answer: "No — re-measured 2026-08-28 at origin/main 96dc5a14: 316 tactics carry
      a serves edge to strategy-graph-native-dispatch (done 102, open 79,
      born-parked 57, draft 78). The statement is updated to 316; the rationale
      and office_hours.reason keep 275 because both are explicitly dated
      2026-08-14 and are correct as of that measurement. The 41-child growth in
      two weeks strengthens rather than weakens the finding: the population the
      single defect ratio pools over is still growing, so the ratio is averaging
      over more unlike work than when the split was proposed, not less. Measured
      with a serves-edge scan over `git archive origin/main intentions` rather
      than listNodes, which reads the worktree on-disk and absorbs untracked
      strays."
  - question: How many charters does the split produce, and where do the boundaries fall?
    answer: "RULED 2026-08-29, author present, in the Part I author sitting. THREE
      charters, cut along the strategy body's existing sections. (1) RECORDING
      SURFACE — Serialization & Commit, Other Settled Mechanism. (2) ROUTER AND
      SELECTION — Router Mechanism, Phase Transitions & Fix State, Fingerprint &
      Freeze, Pace/Backlog/Attention, Review & QA Disposition. (3) SESSION
      LIFECYCLE — Worktree Claiming & Liveness, Recovery & Session Lifecycle,
      Execution Substrate. Two alternatives were declined: a two-way cut
      separating only session lifecycle, which leaves the largest unlike-work
      pairing (recording versus router) still averaged into one ratio and so
      fails to answer the complaint this node was filed for; and a four-way cut
      promoting Execution Substrate to its own charter, which would give a
      fourth denominator too few children to measure anything but noise."
  - question: After the split, do the children keep serving the parent — and what
      happens to the parent's defect-ratio signal?
    answer: "RULED 2026-08-29, author present. EXCLUSIVE RE-SERVE: each child serves
      exactly one charter, and strategy-graph-native-dispatch's defect-ratio
      success_signal is RETIRED, replaced by per-charter bands. This is the
      honest fix — averaging unlike work into one population is the complaint
      this node was filed for, and dual-serving would preserve the denominator
      only by preserving the defect. THE MECHANICAL REASON THIS MATTERS,
      measured 2026-08-29 and not previously recorded anywhere:
      strategyBacklogBand (packages/intentionsutil/src/census.ts:30-32) selects
      children with n.serves.includes(strategyId) — DIRECT MEMBERSHIP, WITH NO
      ANCESTRY WALK. So re-serving children onto charters removes them from the
      parent's denominator outright; the parent's band would not measure the
      same population re-cut, it would measure a shrinking rump, and at total
      === 0 it returns pct null rather than erroring. The earlier carve-out of
      strategy-discovered-requirements (2026-08-13) hid this because it took
      only 5 of 317 children; a three-way charter split will not. Retiring the
      parent's ratio is therefore not optional bookkeeping — leaving it in place
      after an exclusive re-serve produces a signal that reads green because it
      measures almost nothing. A third option, making the census ancestry-aware
      so the parent still aggregates, was declined: it changes shared band
      semantics for every strategy in the graph to solve one strategy's
      problem."
  - question: What sequencing and paired code changes does executing this split require?
    answer: "Recorded 2026-08-29. EXECUTION IS DEFERRED PAST POSITION 12 of the Part
      II sequence, per D1's ruling, so that re-serving ~317 children cannot
      invalidate the --base CAS manifests in flight. This node records the spec;
      it is not the execution. The success_signal edit CANNOT GO THROUGH
      graph-commit, and the reason is stronger than graph-commit merely
      excluding non-intentions changes:
      packages/intentionsutil/test/lifecycle-sensor.test.ts:330 asserts that
      LIFECYCLE_SENSOR_NAME
      (packages/intentionsutil/scripts/read-sensors.ts:485) equals this
      strategy's success_signal.sensor VERBATIM, and a second guard in the same
      file requires every registered sensor name to be recorded by some node.
      Editing either side alone turns CI red. The node edit, the read-sensors.ts
      constant and the test must land together in one ordinary branch and PR.
      Note also that read-sensors.ts hardcodes BACKLOG_STRATEGY_ID =
      'strategy-graph-native-dispatch' and BACKLOG_BAND_PCT = 35, both of which
      the retirement makes stale."
  - question: Why is this node phase done with no diff and no execution record?
    answer: (Closed 2026-08-29 by author disposition during the dispatch/RSI-window
      pre-batch review.) The review sitting this node exists to hold was held at
      the 2026-08-28 author round; its ruling is recorded in
      plans/dispatch-rsi-sequence.md and carried onto the nodes it governs. The
      author ruled 2026-08-29 to close all five sitting nodes on their held
      sittings rather than route them to a post-window review. There is no diff
      and no PR — the node's deliverable was the sitting itself — so execution
      stays null; this clarification is the completion record.
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Review sitting: split strategy-graph-native-dispatch by charter — its 275 tactic children share one defect-ratio signal, so the ratio means less than it appears to
