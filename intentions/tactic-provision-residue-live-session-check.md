---
id: tactic-provision-residue-live-session-check
kind: tactic
statement: provision-node-worktree's exit-14 precondition guard must consult
  worktree_has_live_session before escalating a dirty tracked tree to a
  human-drained worktree-residue hold, so a live session's in-progress edit is
  not misclassified as dead-session residue and frozen with a false blocked_by
  edge
owner: ai
status: raw
parent: null
rationale: "Surfaced as a red-team finding during /review-fix on PR #2992
  (tactic-provision-exit11-worktree-residue). Adversarially verified and upheld
  — see body for the reproduction/rationale — but deliberately deferred rather
  than fixed inline: the first-occurrence-no-strike-ladder escalation is a
  specification of that tactic's own plan (Unit 3), so loosening it is a policy
  revision, not a bug fix, and needs its own sequencing decision (in particular
  against tactic-graph-router-conflict-routing, which is expected to replace the
  whole strike/hold branch)."
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
# provision-node-worktree's exit-14 precondition guard must consult worktree_has_live_session before escalating a dirty tracked tree to a human-drained worktree-residue hold, so a live session's in-progress edit is not misclassified as dead-session residue and frozen with a false blocked_by edge

## Provenance

Surfaced by the `red-team` finder during `/review-fix` on PR #2992
(`tactic-provision-exit11-worktree-residue`), adversarially verified (upheld,
1/1 skeptic vote).

**Location.** `.claude/skills/dispatch-propagate/scripts/provision-node-worktree`
(the `dirty-tracked-tree` arm of `check_worktree_usable`) and
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`'s `14)` arm.

**Failure scenario.** `provision-node-worktree`'s precondition guard classifies
ANY non-empty `git status --porcelain --untracked-files=no` as "mechanical
residue from a dead session" and exits 14. `dispatch-graph-execute`'s `14)` arm
escalates that to a `worktree-residue` tracked hold on the FIRST occurrence,
with no strike ladder, adding a `blocked_by` edge that makes the source node
unselectable until a human drains it. Nothing verifies the premise the guard's
own comment states — "the residue is by definition unattended (the session
that created it is gone)". The selector's `worktree_has_live_session` gate ran
at selection time, minutes earlier, and is known to undercount (the
duplicate-worker race — see `dispatch-duplicate-worker-one-worktree` /
`worktree-has-live-session-basename-path-false-occupied` in project memory). A
live session mid-edit, or a phase that legitimately leaves a tracked file
modified between steps, therefore produces a false hold that costs a human
drain and freezes the node.

**Proposed change.** Before classifying a dirty tracked tree as residue,
source `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` and
consult `worktree_has_live_session "$WT"` (it folds UNKNOWN into "occupied",
so it fails safe). If a live session owns the worktree, return a retryable
disposition — a new exit code the caller treats like exit 10/12 (clear the
reservation, re-select next tick) — instead of exit 14.

**Why deferred rather than fixed inline.** The first-occurrence-no-ladder
escalation is what `tactic-provision-exit11-worktree-residue`'s own plan
explicitly specifies (Unit 3), so changing it is a deliberate policy revision,
not a bug fix — out of scope for that PR. Constraints to settle before
implementing:

- `worktree_has_live_session` shells out to `claude agents --json`, which
  returns a vacuous `[]` under the sandbox (project memory:
  `monitor-tool-runs-sandboxed-vacuous-checks`,
  `worktree-has-live-session-basename-path-false-occupied`). Provisioning
  already runs sandbox-off, but the failure modes need to be reasoned about
  explicitly before the guard depends on it.
- A new retryable exit code needs an arm in `dispatch-graph-execute` and a
  case in `test-dispatch-graph-execute.sh`, plus a case in
  `test-provision-node-worktree.sh` with the helper stubbed.
- `tactic-graph-router-conflict-routing` is expected to replace the whole
  strike/hold branch with an `execution.conflict` interrupt; sequence against
  it.

**Source PR.** #2992.
