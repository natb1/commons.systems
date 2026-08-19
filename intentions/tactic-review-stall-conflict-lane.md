---
id: tactic-review-stall-conflict-lane
kind: tactic
statement: reconcile-graph-review-stall enters the conflict resolution lane on a
  CONFLICTING reviewed node instead of holding it immediately — converging the
  two conflict producers on one policy
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview, implementing the author's clarification that merge conflicts are
  not expected to self-heal and that a conflict always enters the resolution
  lane. Two producers currently diverge: provision exit 11 spawns Lane 3
  immediately (dispatch-graph-execute:274) and is correct;
  reconcile-graph-review-stall:320 calls hold-node --kind provision-conflict
  immediately with no resolution attempt and is now a defect. Adjacent
  tactic-conflict-lane-exit11-retry-bound bounds ineffective lane kicks and is
  not superseded by this — it remains the backstop for a lane that runs and does
  not resolve."
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
office_hours:
  reason: |-
    Dead premise — the recorded defect no longer exists, and the fix actually shipped went the opposite way. This node (recorded 2026-07-29, ec1f6ed1, status raw, empty body) says reconcile-graph-review-stall:320 calls `hold-node --kind provision-conflict` immediately on a CONFLICTING reviewed node and should instead enter the conflict resolution lane. Verified against HEAD in this worktree: that call site is gone. Commit fa9c4338 (2026-08-05, tactic-graph-router-conflict-routing, status codified / phase done, confirmed ancestor of HEAD) retired the sweep's `conflict` arm to a bare `continue` with an inline comment (reconcile-graph-review-stall:297-304; header doctrine at :23-29) and moved CONFLICTING handling to the selector's `execution.conflict` interrupt (graph-select-target `_gate_pending_merge` / `_gate_conflict_active`), on the ground that running both would double-handle the same PR. So the author-ratified goal — the review-stall producer no longer holding immediately — is achieved, but by deleting the responsibility rather than by the mechanism this node proposes. Planning it as written would author a plan against a dead premise; planning it as re-scoped would silently substitute new scope for ratified scope.

    Two author rulings are needed, both stated as proposed clarifications in this round's unrecorded_premises:
    (1) Is tactic-review-stall-conflict-lane delivered-and-prunable (superseded by tactic-graph-router-conflict-routing / fa9c4338), or re-scoped to a named residual?
    (2) If re-scoped: the only unconverged limb is the OTHER producer, dispatch-graph-execute's provision exit-11 strike/hold ladder (CONFLICT_STRIKE_CAP=5 at :145, strikes at :347-353, `hold-node --kind provision-conflict` at :379 — the last non-test call site of that primitive). Its CONVERGENCE NOTE (:275-281) marks itself interim pending exactly the tactic that has now landed, yet tactic-dispatch-conflict-branch-merge-lane (done) deliberately kept the branch and only corrected the note's wording. Retiring it is an authored decision to revisit, not a stale-oversight cleanup.

    PROPOSED STRATEGY CLARIFICATIONS (verbatim, for the author to paste onto strategy-graph-native-dispatch if either ruling is made — this per-node session may not write the strategy itself):

    PREMISE 1:
    The target tactic's core recorded defect no longer exists in the code. Its rationale (recorded 2026-07-29, commit ec1f6ed1) states that reconcile-graph-review-stall:320 calls `hold-node --kind provision-conflict` immediately with no resolution attempt, and proposes teaching that sweep to enter the conflict lane instead. Commit fa9c4338 (2026-08-05, tactic-graph-router-conflict-routing, status codified / phase done, verified an ancestor of HEAD) took the OPPOSITE fix direction: it removed conflict responsibility from the sweep entirely. The `conflict` arm is now a documented no-op (.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:297-304, plus the header comment at :23-29 — 'The `conflict` route below is therefore a deliberate no-op — acting on it too would double-handle the same PR'), and CONFLICTING is handled every tick by the selector's `execution.conflict` interrupt (graph-select-target `_gate_pending_merge` / `_gate_conflict_active`). Whether this tactic is therefore already delivered (prune) or must be re-scoped to a residual is an author decision the strategy does not record; no plan can be authored without it.

    PROPOSED CLARIFICATION 1:
    (Recorded 2026-08-19 /align-tactics round.) tactic-review-stall-conflict-lane's recorded defect — reconcile-graph-review-stall calling `hold-node --kind provision-conflict` immediately on a CONFLICTING reviewed node — was resolved by tactic-graph-router-conflict-routing (commit fa9c4338, 2026-08-05, phase done) in the opposite direction from the one this tactic proposes: rather than teaching the sweep to enter the conflict lane, that tactic removed CONFLICTING handling from the sweep entirely (its `conflict` arm is now a deliberate no-op) and moved conflict-lane entry to the selector's `execution.conflict` interrupt, because running both would double-handle the same PR. The two-producer convergence this tactic targets is therefore complete on the review-stall limb. <AUTHOR: confirm whether tactic-review-stall-conflict-lane is delivered-and-prunable, or is to be re-scoped to a named residual.>

    ---

    PREMISE 2:
    The only unconverged limb left is the OTHER producer, which this tactic's rationale explicitly calls 'correct' and leaves alone: dispatch-graph-execute's provision exit-11 strike/hold ladder (CONFLICT_STRIKE_CAP=5 at :145, strike logic at :347-353, `hold-node --kind provision-conflict` at :379 — the only remaining non-test call site of that primitive in the repo). Its own CONVERGENCE NOTE (:275-281) self-describes as interim and 'expected to be replaced wholesale' once tactic-graph-router-conflict-routing's interrupt lands. That interrupt HAS landed, and the branch was deliberately NOT replaced: tactic-dispatch-conflict-branch-merge-lane (phase done) corrected the note's wording and left the branch interim. Whether that deliberate retention is now to be revisited, and whether it belongs to this tactic at all, is unrecorded — and clarification 161 (recorded 2026-07-31) predates fa9c4338, so it does not settle it: it answers only whether the interrupt supersedes tactic-conflict-lane-exit11-retry-bound, a different node.

    PROPOSED CLARIFICATION 2:
    (Recorded 2026-08-19 /align-tactics round.) The residual of the two-conflict-producer convergence is dispatch-graph-execute's exit-11 strike/hold ladder (CONFLICT_STRIKE_CAP + `.conflict-strikes` sidecar + `hold-node --kind provision-conflict` backstop, dispatch-graph-execute:145,275-281,347-379). Its CONVERGENCE NOTE marks it interim pending tactic-graph-router-conflict-routing, which has since landed (fa9c4338, 2026-08-05) — yet tactic-dispatch-conflict-branch-merge-lane (done) deliberately kept the branch and only corrected the note's wording, so the retention is an authored decision, not stale oversight. Scope must stay disjoint from tactic-conflict-lane-exit11-retry-bound (phase qa), which bounds a Lane 3 session that launches but stalls via an external sweep (lib-conflict-lane-hold.sh) and is explicitly not superseded. <AUTHOR: rule on whether retiring the exit-11 strike/hold ladder in favor of the selector interrupt is wanted, and whether it is this tactic's scope or a new node's.>
  since: 2026-08-19
  recommendation: "prune this node as superseded (fa9c4338 delivered its ratified
    outcome), and — only if ruling (2) says the exit-11 ladder should now be
    retired — mint a NEW tactic for that, scoped disjoint from
    tactic-conflict-lane-exit11-retry-bound (phase qa), which bounds a
    launched-but-stalled Lane 3 session via an external sweep
    (lib-conflict-lane-hold.sh) and is explicitly NOT superseded by this node.
    Note that clarification 161 (2026-07-31) predates fa9c4338 and addresses
    tactic-conflict-lane-exit11-retry-bound, not this node, so it does not
    settle either ruling. Reuse anchors if work does proceed:
    transitions.ts:301-353 (reviewStallRoute/interruptRoute — the single
    (mergeable, ci) precedence cascade), transitions.ts:130-132
    (conflictInterrupt), packages/intentionsutil/scripts/apply-conflict-state.ts
    (the only primitive that mutates execution.conflict),
    .claude/skills/dispatch-conflict/SKILL.md:221-234 (Lane 3 entry
    discriminator). No strategy condition failed — Side A is clean; this is a
    target-node scope deviation only."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# reconcile-graph-review-stall enters the conflict resolution lane on a CONFLICTING reviewed node instead of holding it immediately — converging the two conflict producers on one policy
