---
id: tactic-transition-node-scope-stale-test-coverage
kind: tactic
statement: "Add shell-level test coverage for transition-node's scope-stale
  handling: (a) a scope-stale main-qa node must transition to done rather than
  being demoted to implement, and (b) the scope-fingerprint stamp is
  read/refreshed at the main-checkout root (not the invoking PR-branch worktree)
  when transition-node runs with cwd inside a nested .claude/worktrees/<id>
  worktree. Surfaced by review-fix on PR #2882
  (tactic-graph-node-lane-write-hardening): the shell-only guard and MAIN_ROOT
  stamp-path resolution added there are exercised by no test
  (test-transition-node.sh has zero references to transition-node's scope-stale handling), so a
  regression -- the guard removed, a typo in the main-qa phase string, or
  MAIN_ROOT mis-resolving -- would silently re-demote an already-merged node to
  implement or reintroduce the stamp-missing bug with nothing to catch it."
owner: ai
status: raw
parent: null
rationale: null
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
# Add shell-level test coverage for transition-node's scope-stale handling

## Finding

**Source:** `code-review` finder, `/review-fix` pass on PR #2882
(`tactic-graph-node-lane-write-hardening`).

**Location:** `.claude/skills/dispatch-propagate/scripts/transition-node:138`

**Description:** The new shell-only logic has no test coverage.
`test-transition-node.sh` contains zero references to this scope-stale logic, and
the pure layer (`apply-node-transition`/`transitions`) is never handed
`scopeStale` by this wrapper — `transition-node` handles scope-stale entirely
in bash and forwards only `--ci`/`--strategy-stale`/`--set-pr`. So the newly
added `&& "$PHASE" != "main-qa"` guard and the `MAIN_ROOT` stamp-path
resolution are exercised by no test.

**Failure scenario:** A regression — the guard removed, a typo in the
`"main-qa"` phase string, or `MAIN_ROOT` mis-resolving — would silently
re-demote an already-merged node to `implement` (re-implementing merged work)
or reintroduce the stamp-missing bug, with nothing to catch it.

**Adversarial verdict:** Not adversarially verified — this is a `Deferred`
code-review finding (test-coverage gap, not a security-required finding), so
the review Workflow's adversarial-verify step does not apply to it.

**Recommended fix:** Add a shell-level test that (a) exercises a scope-stale
`main-qa` node and asserts it transitions to `done` rather than demoting, and
(b) asserts `transition-node` reads/refreshes the stamp at the main-checkout
root (not the PR-branch worktree) when invoked with cwd inside a nested
worktree.

**Source PR:** `execution.pr: 2882`
