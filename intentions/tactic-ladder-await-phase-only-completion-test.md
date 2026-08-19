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
status: codified
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
clarifications:
  - question: "This tactic's entire recorded scope shipped and is green at
      origin/main, yet the node read status: raw / phase: null / execution:
      null. What lifecycle action does it take, and what must survive it?"
    answer: "(Ruled by the author in a 2026-08-19 /office-hours sitting over the PR2
      park cohort; the park's own recommendation reserved the done-versus-prune
      choice to the author.) DONE, not prune. The node is transitioned to phase:
      done, status: codified, with execution credited to PR #3077 (merge commit
      7410e07f, merged 2026-08-13T13:24:02Z) — the same landing whose absence
      made this node read as unstarted work. Re-verified at origin/main before
      the ruling: execution.lane_pass and the LanePass {at, lane, phase, sha}
      interface in schema.ts, apply-lane-pass.ts as an orthogonal writer,
      dispatch-ladder-await's --since window and lane_pass probe (8 references),
      and dispatch-ladder-run's PASS_SINCE threading — all present. The '-test'
      half is satisfied too: test-dispatch-ladder-await.sh carries seven
      lane_pass cases and apply-lane-pass.test.ts 17. Prune was declined because
      the body's '## Resolved' section is the only record of a design point a
      future reader is explicitly warned not to undo — the lane_pass stamp is
      compared against a LAUNCH WINDOW (--since, seeded from PASS_SINCE captured
      before the advance), never read as mere presence, because a merely-present
      stamp would mask a genuine stall at a later pass on the same phase. That
      section must survive verbatim. The interrupt-rung half of the residual
      stays where dispatch-conflict/SKILL.md:1305-1312 assigns it, on
      tactic-ladder-await-interrupt-rung-vacuous-advanced; it is NOT folded in
      here. Note for a later reader:
      intentions/tactic-dispatch-ladder-exit-code-space.md lists this node under
      'await test coverage gaps' — that cross-reference is stale relative to the
      shipped coverage and is not an outstanding obligation."
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: ladder-unwedge-followup
  pr: 3077
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T13:24:02Z
    mergeCommitSha: 7410e07f73066a8f779ab3017d1cc798924a2558
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
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
