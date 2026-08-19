---
id: tactic-ladder-await-phase-only-completion-test
kind: tactic
statement: Teach dispatch-ladder-await/-run the completion signals that are not
  a phase change — today graph_verdict decides completion from origin/main graph
  state alone (a phase comparison plus one carve-out for the review lane's
  `reviewed` marker), but the conflict lane and a qa fixing pass both complete
  by pushing to the branch and writing job-dir markers while leaving graph state
  untouched, so the ladder reports successful work as `stalled` (exit 12, "the
  worker stopped and NOTHING happened") and halts
owner: ai
status: raw
parent: null
rationale: "Observed live twice in succession on 2026-08-13, on node
  tactic-attention-namespaced-rank at phase qa (PR #3075), during the
  /dispatch-ladder re-run that followed PR #3076. FIRST instance, the conflict
  lane: dispatch-graph-execute reported conflict-lane (origin/main had moved 9
  commits ahead and the branch went CONFLICTING), /dispatch-conflict Lane 3 ran
  for 734s and SUCCEEDED -- it resolved five conflicts against c3c229f0, git
  rm'd three files origin/main had already retired, pushed merge commit
  855a060e, and flipped PR #3075 from CONFLICTING to MERGEABLE/CLEAN with all 23
  checks passing -- and the ladder halted `stalled`. SECOND instance, a qa
  fixing pass: /qa-fix found a real defect the merge had introduced (a doc
  comment in office-hours-select.ts naming render-rsi-plan.ts, a file the merge
  deleted), fixed it in 36534b85, verified clean (typecheck, 960/960 vitest,
  lint, gap-audit ratchet), posted the QA summary to the PR, and did NOT
  escalate -- and the ladder halted `stalled` again. Both are correct,
  successful passes. The cause is structural, not a flake. Lane 3's completion
  is `git push origin HEAD` plus dispatch-mark-complete --phase fix-conflicts
  and mark-node-terminal conflict-resolved (dispatch-conflict/SKILL.md Steps
  9-10); a qa fixing pass likewise writes only job-dir markers and pushes -- it
  applies the qa phase-completed marker WITHOUT qa-done precisely because a
  fixing pass expects a re-QA after CI. Verified after the second halt: the node
  at origin/main still read execution.fix null, execution.conflict null, markers
  [planned] -- graph state was untouched while the branch had gained two real
  commits. dispatch-ladder-await's graph_verdict reads only origin/main and ends
  in a `.phase != $FROM_PHASE` comparison, so both outcomes can only ever return
  `unchanged`, which maps to `stalled`/exit 12 and a remediation line telling
  the reader the worker failed silently. dispatch-ladder-advance's conflict-lane
  case already predicts this in an inline comment (Lane 3 'resolves the conflict
  and the node re-enters at that phase, so a plain phase-changed check would
  read as stalled') and delegates to 'the attended thread'. Consequence: the
  ladder cannot drive the fix -> re-QA cycle at all, and every successful
  conflict resolution halts it."
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
  reason: >-
    Nothing left to plan: this tactic's entire recorded scope already shipped
    and is verified green at origin/main, so any plan body would schedule a
    vacuous implement -> qa -> review -> main-qa run. The node needs a lifecycle
    action this run may not author, not a decomposition.


    VERIFIED AT origin/main (826e9da7; the node's own blob 512b1f64 is unmoved
    since this round's diagnosis), all four limbs of the fix the node's own '##
    Resolved' section describes: (1) schema — Execution.lane_pass, the LanePass
    {at, lane, phase, sha} interface, validateLanePass, LANE_PASS_LANES and
    DISPATCH_PHASE_NAMES in packages/intentionsutil/src/schema.ts; (2) writer —
    packages/intentionsutil/scripts/apply-lane-pass.ts, the orthogonal primitive
    deliberately NOT built on apply-fix-state/apply-conflict-state; (3) reader —
    .claude/skills/dispatch-ladder/scripts/dispatch-ladder-await carries --since
    (SINCE_EPOCH/SINCE_ISO parsing at :292-339), the execution.lane_pass probe
    inserted AFTER the .phase != FROM_PHASE arm (:456-461), and the
    lane-complete verdict at exit 0 (:523-525); (4) driver — dispatch-ladder-run
    captures PASS_SINCE immediately before the advance (:1315), passes --since
    PASS_SINCE to every await call (:1380), and seeds EVAL_LAUNCH_EPOCH from it
    (:1368). Both producing lanes stamp: dispatch-conflict/SKILL.md Step 7b
    (:1301) and qa-fix/references/auto-fix-lane.md item 6 (:208), each
    push-first-stamp-second with a failed stamp WARNing rather than
    hard-stopping.


    REGRESSION COVERAGE EXISTS AND IS GREEN (run in this round's worktree): bash
    .claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh -> 48
    passed, 0 failed, including seven lane_pass cases (a stamp is never
    consulted without --since; a stamp at or after the launch is lane-complete
    exit 0; no stamp or a stamp older than the launch is still stalled exit 12;
    an unreadable stamp is exit 14 unknown, never completion; a phase change, a
    park and a prune each outrank a fresh stamp; a held session with a fresh
    stamp is still held-observing) plus --since usage-error cases. npx vitest
    run --root . packages/intentionsutil/test/apply-lane-pass.test.ts -> 17
    passed. test-dispatch-ladder-run.sh asserts the driver threads a --since
    launch window on both the complete and routed paths and that it is
    PASS_SINCE (pre-launch), not LAUNCH_EPOCH (post-launch). So the '-test' in
    this node's id is satisfied too — the coverage landed with the fix.


    THE ONE RESIDUAL IS OWNED ELSEWHERE. dispatch-conflict/SKILL.md:1305-1312
    records a deliberate KNOWN GAP: on the router's conflict-interrupt entry the
    selector's awaited rung is 'conflict', but the stamp there passes the node's
    persisted phase, so the reader's phase equality cannot match. It costs
    nothing today because the reader's phase probe fires first and returns
    'advanced' on any rung that is not a real Phase member. That masking defect
    is tactic-ladder-await-interrupt-rung-vacuous-advanced (still status: raw,
    phase: null), and both the SKILL comment ('Whoever fixes that must make this
    call pass conflict on the interrupt path') and this node's own '## Related'
    section assign the producer-side half there. Folding it in here would
    duplicate that node's scope and couple the two PRs.


    STALE CROSS-REFERENCE FOUND:
    intentions/tactic-dispatch-ladder-exit-code-space.md:340-342 lists this node
    under 'await test coverage gaps' in its adjacent-siblings section. That note
    is stale relative to the shipped coverage and must not be read as an
    outstanding obligation on this node.


    ONE IMMATERIAL DRIFT OBSERVATION HAS NO LEGAL DESTINATION FROM THIS RUN, so
    it is recorded here rather than dropped (a per-node /align-tactics session
    never writes the serving strategy; the born-parked observation-node redirect
    is still only a draft, tactic-align-tactics-immaterial-drift-redirect). The
    observation: strategy-graph-native-dispatch records the ladder's halt
    discipline (conditions 25-28) but no COMPLETION-SIGNAL contract, so nothing
    at strategy level says a completion signal must live in graph state rather
    than in the driver's launch identity. Proposed clarification text, for an
    author /align round to accept or discard: 'The /dispatch-ladder completion
    contract has three classes, not two. A phase change and the review lane's
    reviewed marker were the original pair; PR #3077 added execution.lane_pass —
    {at, lane, phase, sha}, lanes limited to LANE_PASS_LANES (conflict, qa-fix,
    fix-checks), at pinned to fixed-width YYYY-MM-DDTHH:MM:SSZ so lexicographic
    order equals chronological order — written by apply-lane-pass.ts and read by
    dispatch-ladder-await lane-complete arm at exit 0. Two design points are
    load-bearing and should not be undone: the stamp is an ORTHOGONAL field,
    deliberately not folded into execution.fix or execution.conflict, because
    those are live routing interrupts the selector re-dispatches on and a
    completion record must not double as a dispatch instruction; and the probe
    compares against a LAUNCH WINDOW (--since, seeded from dispatch-ladder-run
    PASS_SINCE captured before the advance), not mere presence, because a
    merely-present stamp would mask a genuine stall at a later pass on the same
    phase. This extends condition 25 rather than qualifying it: the completion
    knowledge stayed in the graph, so the driver still sequences without gating,
    and a genuine unchanged with no in-window stamp still halts unconditionally
    at exit 12.' It is immaterial (plan_depends=false): no plan depended on
    ratifying it, and it corroborates rather than contradicts condition 25.
  since: 2026-08-19
  recommendation: >-
    Do NOT dispatch an implementation session on this node.


    (1) Re-verify in about a minute, from a fresh worktree: `git show
    origin/main:.claude/skills/dispatch-ladder/scripts/dispatch-ladder-await |
    grep -n lane_pass`; `git show
    origin/main:packages/intentionsutil/scripts/apply-lane-pass.ts | head`; then
    `bash .claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh`
    and `npx vitest run --root .
    packages/intentionsutil/test/apply-lane-pass.test.ts`.


    (2) Then take the lifecycle action a per-node /align-tactics run may not
    author: correct the stale frontmatter (status: raw, phase: null, execution:
    null) so it records the delivered state — set phase: done (the lifecycle's
    only terminal, per clarification 247) or prune, per whichever the
    prune/retention policy prefers for a shipped node that carries no
    attributes.measured_impact. Clearing this park is what an attended commit
    touching the node does anyway; the point of the park is that the choice
    between done and prune is yours, not this lane's.


    (3) KEEP THE BODY'S '## Resolved' SECTION VERBATIM if the node is retained.
    It is the only record of the design decision a future reader is explicitly
    warned not to undo — the lane_pass stamp is compared against a launch window
    (--since), never read as mere presence, because a merely-present stamp would
    mask a genuine stall at a later pass on the same phase. This round
    deliberately wrote no body at all, precisely so that section survives.


    (4) Leave tactic-ladder-await-interrupt-rung-vacuous-advanced open — it is
    the correct home for the interrupt-rung half of the residual, and
    dispatch-conflict/SKILL.md:1305-1312 already assigns it there.


    (5) Two byproducts worth a moment while you are here: the stale 'await test
    coverage gaps' cross-reference at
    intentions/tactic-dispatch-ladder-exit-code-space.md:340-342, and the
    immaterial drift observation quoted in full in this park's reason (a
    proposed completion-contract clarification for
    strategy-graph-native-dispatch, which only an author /align round may land).
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
## The defect

`dispatch-ladder-await`'s `graph_verdict` determines whether a phase completed
by reading `origin/main` graph state and comparing `.phase != "$FROM_PHASE"`.
That test assumes every legitimate completion moves the phase. Three lanes
violate the assumption; only one is handled.

| Lane | How it completes | Await sees |
|---|---|---|
| review (`review-fix`) | `reviewed` marker in `execution.markers` — **graph** state | handled by an explicit carve-out |
| conflict (`/dispatch-conflict` Lane 3) | branch push + **job-dir** markers | `unchanged` → `stalled` |
| qa fixing pass (`/qa-fix`) | branch push + **job-dir** markers, `qa` phase-completed *without* `qa-done` | `unchanged` → `stalled` |

The review carve-out carries a comment that states the general problem exactly:
"Without this check the phase comparison below calls a finished review
`stalled`, and the ladder halts one step short of merge-and-absorb." The same
sentence is true of the other two lanes; they simply have no carve-out.

## Why the review fix does not transfer unchanged

The `reviewed` marker lives in `execution.markers` — graph state the await can
read at `origin/main`. The conflict lane's and the fixing pass's markers are
files in `$CLAUDE_JOB_DIR`, which the await never reads and, being per-job,
cannot meaningfully read.

So the missing knowledge is not in the graph at all. It is in the **driver**,
which received the launch disposition from `dispatch-ladder-advance` —
`launched <id> <kind> <phase> /dispatch-conflict` for the conflict lane, and for
a qa launch the fixing-vs-terminal distinction the pass itself later records in
its markers.

## Directions

1. **Carry the launch identity forward in `dispatch-ladder-run`.** The driver
   already knows which skill it launched. Treat a subsequent `unchanged` from a
   `/dispatch-conflict` launch as that lane's expected success shape and
   re-enter the phase once, bounded — the same bounded-wait discipline PR #3076
   added for `held-observing`, not a blind retry. The genuine failure signals
   stay distinct and available: the PR still `CONFLICTING`, or the absent
   phase-completed marker.

2. **Give the await a non-phase completion signal it can actually read.** The
   durable fix is for these passes to record their outcome in graph state the
   way the review lane does — e.g. a fixing pass advancing `execution.fix` via
   `apply-fix-state --set-fix` (writer-agnostic and safe), and the conflict lane
   recording `execution.conflict`. Then `graph_verdict` gains one carve-out per
   lane instead of the driver carrying launch-specific knowledge, and the signal
   survives a driver restart. This is the better greenfield answer: it keeps the
   completion contract in the graph, where every other consumer can see it.

3. **At minimum, stop mislabelling it.** Even before either fix, `stalled`'s
   text — "the worker stopped and NOTHING happened … a blind retry spends budget
   on a repeat of whatever failed silently" — actively misdirects the attended
   reader away from a pass that did substantial correct work. A distinct
   disposition for "completed without a phase change" would have saved two
   transcript investigations in one run.

Direction 2 is the design to aim for; direction 1 is the smaller change that
unwedges the ladder now. They are compatible — 1 is a driver-side stopgap that
2 later makes redundant.

## Resolved

Fixed by PR #3077, merged 2026-08-13 as `7410e07f`.

**Direction 2 was taken**, and it supersedes direction 1 — the driver does not
carry launch identity, and no bounded re-entry was added. Direction 3 is
satisfied as a by-product: the new `lane-complete` disposition is exactly the
distinct disposition it asked for.

What shipped:

- **`execution.lane_pass`** in `packages/intentionsutil/src/schema.ts` —
  `{at, lane, phase, sha}`, validated by `validateLanePass`, with `at` pinned to
  a fixed-width `YYYY-MM-DDTHH:MM:SSZ` shape by `requireTimestampString`. The
  second-precision-with-literal-`Z` format is load-bearing: it makes
  lexicographic order equal chronological order, which is what lets the reader
  compare with a plain jq `>=` and no date arithmetic.

- **A new writer**, `packages/intentionsutil/scripts/apply-lane-pass.ts`.
  Direction 2 above suggested reusing `apply-fix-state --set-fix` and
  `apply-conflict-state`. That suggestion was examined and rejected.
  `--set-fix` *enters* the live CI-fix interrupt — routing state the selector
  re-dispatches on, and whose `--clear-fix` resets `phase` to `review` and
  strips the reviewed marker. And every `apply-conflict-state` mode but
  `--set-conflict` throws on a null interrupt (`requireConflict`), which is
  exactly the ladder's own entry state. An orthogonal field was the right call
  because the stamp's whole job is to record that a pass *finished* while
  changing no routing state at all; folding it into either interrupt would have
  made a completion record double as a dispatch instruction.

- **Two lanes stamp it**: `dispatch-conflict` SKILL Step 7b, and `qa-fix`'s
  auto-fix lane. Policy in both is push first, stamp second; a failed stamp
  WARNS and continues rather than hard-stopping. A Lane 3 session that stops
  before its terminal marker wedges a worker slot, which is strictly worse than
  today's false `stalled`.

- **The reader**: `dispatch-ladder-await` gained a `--since <epoch>` flag and a
  new probe after the `.phase != FROM_PHASE` arm, reporting `lane-complete` at
  exit 0 (sharing that code with `reviewed`). `dispatch-ladder-run` captures
  `PASS_SINCE` immediately before the advance and passes it through.

**The one design decision a future reader will be tempted to undo.** The
comparison is against a **launch window**, not mere presence of a stamp. A
stamp that is merely present would mask a genuine stall at a later pass on the
same phase — the accumulation trap the `reviewed` carve-out's own comment
already documents. `--since` is what keeps a previous pass's stamp from
answering for this one.

And the halt discipline is unchanged: a genuine `unchanged` with no stamp still
halts exactly as before — exit 12, `stalled`. No re-entry, no retry, no
branch-tip backstop. Every halt stays unconditional.

## Related

- [[tactic-ladder-await-interrupt-rung-vacuous-advanced]] — the mirror-image
  defect found while reviewing the fix: a false *success* on rungs that are not
  `Phase` members, where the phase probe short-circuits before the lane-pass
  probe is consulted.
- [[tactic-node-lane-escalate-park-unconsumed]] — the same family, already
  fixed: an arm whose output no consumer read. This node is the reporting-side
  twin of that defect.
- [[tactic-eval-finding-conflict-lane-registered-phantom]] — the eval entry
  raised against the first instance, whose phantom-session premise is falsified.
