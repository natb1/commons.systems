---
id: tactic-review-dispatch-charter-split
kind: tactic
statement: "Review sitting: split strategy-graph-native-dispatch by charter —
  its 316 tactic children share one defect-ratio signal, so the ratio means less
  than it appears to"
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
  - question: Is the 275-child figure in the statement and rationale still
      current?
    answer: "No — re-measured 2026-08-28 at origin/main 96dc5a14: 316 tactics
      carry a serves edge to strategy-graph-native-dispatch (done 102, open 79,
      born-parked 57, draft 78). The statement is updated to 316; the rationale
      and office_hours.reason keep 275 because both are explicitly dated
      2026-08-14 and are correct as of that measurement. The 41-child growth in
      two weeks strengthens rather than weakens the finding: the population the
      single defect ratio pools over is still growing, so the ratio is
      averaging over more unlike work than when the split was proposed, not
      less. Measured with a serves-edge scan over `git archive origin/main
      intentions` rather than listNodes, which reads the worktree on-disk and
      absorbs untracked strays."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Born parked for an author-run /align round. The design is already
    recorded in strategy-discovered-requirements' third clarification and is
    repeated here so this node stands alone: strategy-graph-native-dispatch is
    served by 275 tactics (measured 2026-08-14 with listNodes; the 2026-08-13
    re-homing barely moved this number, because the /align family kept its
    second serves edge rather than moving outright) under one success_signal
    that reads its open children as a machinery-defect backlog ratio, so work of
    unlike kinds is counted as one defect population. The greenfield splits it
    by charter — recording surface, router and selection, session lifecycle —
    with strategy-discovered-requirements as one of several children; carving
    out /align on 2026-08-13 was the migration path's first step, not the
    greenfield. Two measurements from the 2026-08-14 round are worth carrying
    in: only ONE of the 46 open children carries a non-null
    execution.strategy_fingerprint stamp, so the freeze cost of re-homing
    doctrine off that node is near zero today (which is itself the argument for
    tactic-strategy-fingerprint-stamp-coverage); and strategy-explicit-intent is
    the common ancestor of that strategy and strategy-discovered-requirements,
    via strategy-graph-drives-dispatch, so doctrine binding every graph writer
    can move UP rather than sideways — an option the 2026-08-14 round raised and
    declined for the draft-review gate specifically, but which a charter split
    should reconsider for the rest."
  since: 2026-08-14
  recommendation: "Run /align against strategy-graph-native-dispatch to split it
    by charter. Expect the round to decide: how many children the split produces
    and their boundaries; which of the ~30 existing conditions follow each child
    and which belong on strategy-explicit-intent as binding every graph writer;
    what happens to the lifecycle success_signal, whose sensor string is
    mirrored character-for-character by read-sensors.ts's LIFECYCLE_SENSOR_NAME
    under test guard, so any edit to it needs a paired code change outside
    intentions/ that graph-commit cannot carry; and the re-serve of 275
    children, which is the bulk of the work and is mechanical rather than
    dialectical. Do not treat this as a rename: the point is that a defect ratio
    over unlike work is not a signal."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Review sitting: split strategy-graph-native-dispatch by charter — its 275 tactic children share one defect-ratio signal, so the ratio means less than it appears to
