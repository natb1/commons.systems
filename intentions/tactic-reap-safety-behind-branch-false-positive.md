---
id: tactic-reap-safety-behind-branch-false-positive
kind: tactic
statement: "The session-reap safety gate proves reap-safety with a two-dot
  `git diff origin/main HEAD`, which reports every commit main gained since the
  branch was cut — so a branch that is strictly BEHIND with nothing of its own
  reads as unlanded content and is refused a reap permanently"
owner: ai
status: raw
parent: null
rationale: "Confirmed live 2026-08-06 by direct measurement during an N+7
  monitor pass. THE DEFECT: `lib-session-reap.sh` gate 7b proves reap-safety
  with `git -C $wt_path diff --quiet origin/main HEAD -- . ':!intentions'`
  (lib-session-reap.sh:328). Two-dot was chosen deliberately over a commit count
  and that reasoning is SOUND and must be preserved — GitHub squash-merges, so a
  branch's individual commits are never ancestors of main, only their content
  is, and a commit-count gate therefore refuses a safe reap after every squash
  merge (recorded at length on the sibling
  tactic-self-close-reap-silent-noop). But two-dot is symmetric: it also reports
  every commit MAIN gained since the branch was cut. A worktree sitting on a
  branch with zero commits of its own, merely stale, therefore diffs against
  origin/main by main's entire subsequent history — rendered as deletions — and
  the gate reads that as the branch's own unlanded work. MEASURED: session
  2551a780 on node tactic-fleet-alarm-unclaimed-hold logged
  SESSION_REAP_SKIP_UNLANDED_CONTENT every ~15 minutes for hours; its worktree
  was 0 commits ahead of origin/main and 182 behind, with a clean tree and no
  open PR — nothing whatsoever to lose. THE BLAST RADIUS: of 66 worktrees
  enumerated the same day, 32 were 0-ahead-and-clean and would false-positive
  identically the moment a terminal session held one. THE CONSEQUENCE: the
  refusal is permanent, not transient — a stale branch only gets staler, so the
  diff only grows. The session stays registered, holds a live-session slot, and
  its node stays unselectable (worktree_has_live_session is NAME-keyed on the
  node id), which is the same double-bind the auto-heal contract exists to
  prevent. THE FIX DIRECTION (greenfield): the gate is safe if EITHER predicate
  holds — `git rev-list --count origin/main..HEAD` is 0 (the branch has nothing
  of its own, so it is trivially safe), OR the existing two-dot content diff is
  empty (the content already landed — the squash-merge case). Add the cheap
  rev-list short-circuit BEFORE the diff. It is a pure widening of the safe set:
  every worktree the gate accepts today it still accepts, and it must fail
  closed exactly as the rest of the file does — a git error on either arm still
  skips the session, per the file's standing UNKNOWN-toward-KEEP posture.
  SIBLING, worth citing when planning: tactic-graph-commit-noop-shortcircuit-head-behind
  carries the same strictly-behind theme in graph-commit — a HEAD behind
  origin/main misread as a state to act on. The nearest reap-lane neighbours do
  NOT own this: tactic-self-close-reap-silent-noop owns the `claude rm` decline
  (a later step in the same sweep, different failure),
  tactic-session-reap-authorization-durability owns gates 3/4 (job-dir-keyed
  authorization, a different gate), and tactic-graph-node-session-reap is
  phase: done. Dedup-checked 2026-08-06: free."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap band 2 (50/20/10 interim scale): a reap-path correctness
    defect that permanently strands a worker slot and freezes its node — the
    same band as the other dispatch-containment fixes
    (tactic-graph-execute-fresh-main-read, tactic-probe-unknown-never-clear),
    which carry the identical boost."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# A strictly-behind branch is not unlanded work

`session_reap_sweep`'s reap-safety gate (gate 7b) asks whether the worktree's
tree differs from `origin/main` outside `intentions/`:

```sh
git -C "$wt_path" diff --quiet origin/main HEAD -- . ':!intentions'
```

Two-dot `diff A B` is a comparison of two trees. It answers "do these differ",
not "does B carry work A lacks". Those coincide only when `B` is at or ahead of
`A`. When `B` is strictly behind, the diff is populated entirely by `A`'s own
newer content, rendered as deletions — and the gate reads it as the branch's
unlanded work.

## Measured 2026-08-06

Session `2551a780`, node `tactic-fleet-alarm-unclaimed-hold`, logging on every
sweep interval for hours:

```
SESSION_REAP_SKIP_UNLANDED_CONTENT: name=tactic-fleet-alarm-unclaimed-hold
  session=2551a780-... worktree=.../tactic-fleet-alarm-unclaimed-hold
  branch=tactic-fleet-alarm-unclaimed-hold
  (tree differs from origin/main outside intentions/)
```

The worktree at that moment:

| probe | value |
|---|---|
| `rev-list --count origin/main..HEAD` | **0** |
| `rev-list --count HEAD..origin/main` | 182 |
| `status --porcelain --untracked-files=no` | empty |
| open PRs on the branch | 0 |

Nothing to lose, refused forever. The operator reaped it by hand, which is the
absence of an auto-heal rather than one.

## Why it is systemic, not incidental

A worktree provisioned for a node and then left behind by `main` is the normal
resting state of the fleet, not an edge case. Of 66 worktrees enumerated on
2026-08-06, **32 were 0-ahead and clean** — every one of them would trip this
gate identically the moment a terminal session held it. The refusal is also
monotone: a stale branch only falls further behind, so the false diff only
grows. There is no interval after which the gate self-corrects.

## Do not "fix" this by reverting to a commit count

The two-dot choice is deliberate and its motivating case is real. GitHub
squash-merges: a branch's individual commits are never ancestors of `main`, only
their content is. A commit-count-only gate therefore refuses a safe reap after
every squash merge — sessions measured 11 and 12 commits "ahead" on 2026-08-03
were entirely safe. That reasoning is recorded on
`tactic-self-close-reap-silent-noop` and must survive this change intact.

The two gates fail in opposite directions, which is why the fix is a
disjunction rather than a replacement.

## Fix direction — greenfield

The gate is safe if **either** holds:

1. `git rev-list --count origin/main..HEAD` is `0` — the branch has no commits
   of its own. Trivially safe: there is nothing that could fail to have landed.
2. The existing two-dot content diff is empty — the content already landed
   (the squash-merge case).

Add (1) as a short-circuit *before* (2). It is cheaper than the diff, and it is
a pure widening: every worktree accepted today is still accepted.

Both arms must fail closed, matching the file's standing posture — a `git`
error on either arm skips the session (UNKNOWN → KEEP), never reaps on it.

## Scope

In scope: gate 7b of `session_reap_sweep` in
`.claude/skills/dispatch-propagate/scripts/lib-session-reap.sh`, and its unit
coverage.

Out of scope: the `claude rm` decline that follows a successful gate pass
(`tactic-self-close-reap-silent-noop`), the job-dir-keyed authorization gates 3
and 4 (`tactic-session-reap-authorization-durability`), the terminal-marker
requirement (Invariant 2, deliberately unchanged), and the worktree-path
derivation at `lib-session-reap.sh:291` — that last is a separate, independently
confirmed defect recorded on `tactic-self-close-reap-silent-noop`.
