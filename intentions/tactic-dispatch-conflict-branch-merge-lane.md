---
id: tactic-dispatch-conflict-branch-merge-lane
kind: tactic
statement: "/dispatch-conflict gains a lane that reproduces and resolves a live
  origin/main merge conflict on a node's PR branch: Lane 1's
  reproduce-in-the-worktree behavior accepts node-id targets, so provision
  exit-11 holds are resolved autonomously instead of consuming office-hours
  slots"
owner: ai
status: raw
parent: null
rationale: "Draft retained from the 2026-07-25 office-hours drain sweep (10
  parked nodes reviewed, 6 drained). Five of the queue's top-ranked parks were
  the same provision exit-11 hold — 'origin/main does not merge clean into this
  tactic's branch' — on a node's PR branch, and every one was resolved by hand
  in the drain session. Four of the five needed no author judgment at all (two
  pure unions against an upstream commit touching adjacent lines, one
  take-origin/main's-copy of a superseded node file, one additive union), which
  makes them invalid parks under the no-autonomous-path doctrine: the graph
  already held the direction and only execution was owed. The gap is on the
  CONSUMER side and is not covered by the two in-flight producer-side tactics:
  /dispatch-conflict Lane 1 does reproduce a live git conflict but accepts only
  issue-branch draft PRs, while Lane 2 accepts a node id yet handles
  graph-commit concurrent-edit parks and explicitly does not reproduce a live
  git conflict (PR #2951, tactic-dispatch-conflict-greenfield, since pruned,
  shipped Lane 2 for mechanical-unresolved office-hours parks — not for branch
  merge conflicts). So a node-branch code merge conflict has no lane and falls
  through to the human queue. Awaiting an /align-tactics round to finalize;
  recorded as a draft rather than planned because the lane's boundary with
  tactic-mechanical-park-producers needs an author decision (see Open
  questions)."
reading: null
gap: null
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
# /dispatch-conflict gains a lane that reproduces and resolves a live origin/main merge conflict on a node's PR branch

## Context

A park (`office_hours` on a node) asserts that no autonomous path forward
exists and a human is required. A merge conflict between `origin/main` and a
node's PR branch does not meet that bar: the resolution is usually mechanical,
and nothing about it needs the author.

The 2026-07-25 drain sweep measured how much of the queue this class occupies.
Of 112 parked nodes, 37 were curriculum-reading entries and 9 were
discovery/decomposition entries; of the remaining 66, the **five
highest-ranked** were all provision exit-11 branch-merge holds:

| node | PR | conflict | judgment needed |
| --- | --- | --- | --- |
| `tactic-align-tactics-workflow` | 2931 | `.claude/skills/align-tactics/SKILL.md` | yes — where doctrine lives |
| `tactic-office-hours-pr-custody` | 2963 | `park-node`, `test-park-node.sh` | no — union |
| `tactic-align-tactics-mechanical-floor` | 2896 | a graph node file | no — take origin/main |
| `tactic-graph-commit-cwd-repo-resolution` | 2938 | `park-node`, `demote-node-to-implement` | no — union |
| `tactic-exercised-paths-reading` | 2857 | `read-sensors.ts` | no — additive union |

Only the first involved a real design call. The other four were owed labor.

`tactic-graph-commit-cwd-repo-resolution` is the sharpest evidence that this
recurs rather than resolving itself: commit `e2c0fd81` records a 2026-07-23
drain that already cleared this exact park once, and it was re-parked the same
day.

## The gap

`/dispatch-conflict` has two lanes and neither covers this case:

- **Lane 1** reproduces a live `origin/main` merge conflict in a worktree and
  resolves it — but its input contract is an issue-branch draft PR.
- **Lane 2** accepts a node id, but it handles a `graph-commit` concurrent-edit
  park on an `intentions/*.md` node, using the park text as its only input. It
  does not reproduce a live git conflict.

What is missing is Lane 1's *behavior* reachable through Lane 2's *addressing*:
given a node id, check out that node's PR branch, merge `origin/main`, resolve,
run the node's own `## Verification` block, and push.

## Relationship to the in-flight siblings (this is not a duplicate)

- `tactic-mechanical-park-producers` (`phase: implement`, boost 85) fixes the
  **producer** side: provision exit-11 and the fix-attempt cap emit a
  `blocked_by` edge against a tracked incident tactic instead of setting
  `office_hours` on the source. That stops the queue pollution but resolves no
  conflict — something must still perform the merge. This draft is that
  something.
- `tactic-graph-router-conflict-routing` (`phase: implement`) adds the **router
  seam**: a mergeable sensor plus an orthogonal `execution.conflict` interrupt
  that dispatches `dispatch-conflict` on `CONFLICTING`. Its `blocked_by` is
  correctly empty now that Lane 2 landed — but its dispatch call site assumes a
  lane that can resolve a branch conflict for a node target. That assumption is
  what this draft supplies.

Both siblings presuppose this lane. Neither contains it.

## Implementation sketch (to be confirmed by /align-tactics)

- Extend `.claude/skills/dispatch-conflict/SKILL.md` with a third lane, or
  widen Lane 2 with a branch-conflict branch, keyed on whether the node has an
  `execution.pr`/`execution.branch` with a live git conflict versus a
  `graph-commit` park.
- Resolution loop per conflicted file: read both sides
  (`log --oneline origin/main..HEAD -- <file>` and `HEAD..origin/main -- <file>`),
  prefer a union that preserves upstream evolution and re-applies the tactic's
  intent, and treat "upstream already did this" as a first-class outcome that
  reports supersession rather than forcing a merge.
- **Node-file conflicts get a distinct rule.** When the conflicted path is
  `intentions/*.md`, the branch copy is almost always stale and origin/main's
  copy is authoritative — clobbering main's newer `office_hours` /
  `attributes.phase` / `blocked_by` / freshness fields is the stale-worktree
  revert defect. Default to main's side unless the branch authored real intent
  there.
- **Verify, do not just check for conflict markers.** The sweep found a
  semantic conflict git did not flag: upstream renamed `readFrontierSensors` →
  `readStoreSensors`, so `tactic-exercised-paths-reading`'s test file merged
  textually clean and failed at runtime. The lane must run the node's named
  tests, not merely confirm the tree is markerless.
- Expect `validate-graph` to false-fail on an uncommitted merge —
  `deletedNodeIds()` traverses HEAD, so prose refs to nodes pruned upstream
  dangle until the merge commit exists. The lane should either commit first or
  recognize the artifact instead of treating it as a defect.

## Scope boundary — the config-commit gate is NOT in scope

A conflict whose resolution lands under `.claude/**` still requires the author,
because auto mode denies an agent commit of agent-behavior config. The
2026-07-25 sweep hit this on every config-carrying branch: the merge commits
were denied by the classifier even with the resolution complete and CI green,
because merging `origin/main` pulls in whatever `.claude/skills/**` changed
upstream. So this lane can only fully close the loop for conflicts confined to
`packages/**`, `intentions/**`, and app code; a config-carrying merge still
terminates in a human grant. That is a correct gate, not a defect, and the lane
should detect it early and hand off rather than resolving and then failing to
commit.

## Open questions for /align-tactics

1. Third lane, or widen Lane 2? Widening keeps one node-target entry point;
   a third lane keeps each lane's input contract single-purpose.
2. Does this land before or after `tactic-mechanical-park-producers`? If the
   producer switches to `blocked_by` edges first, this lane's trigger becomes
   the incident tactic rather than a park, which changes its input contract.
3. Should the lane attempt a config-carrying merge at all, or refuse up front
   when it detects staged `.claude/**` paths and route straight to
   office-hours with the resolution pre-staged? The sweep suggests
   pre-staging plus a grant request is the cheaper shape.
