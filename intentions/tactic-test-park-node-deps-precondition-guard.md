---
id: tactic-test-park-node-deps-precondition-guard
kind: tactic
statement: "test-park-node.sh fails fast with a clear 'install dependencies
  first' error when the harness root has no node_modules, instead of dangling
  a symlink into every clone and surfacing the missing precondition as an
  opaque tsx ERR_MODULE_NOT_FOUND inside one unrelated-looking case"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-28 at an office-hours drain sitting, after
  packages/intentionsutil/scripts/test-park-node.sh was observed failing 1 of 15
  cases — 'demote-node-to-implement byte-identical restore (rc=1)' — on a clean
  checkout of origin/main with all unrelated changes stashed, and was initially
  read as a pre-existing product defect in demote-node-to-implement. Verified
  during this filing session and it is NOT: CI is GREEN on this suite. Evidence:
  the 'Unit Tests & Lint' workflow (.github/workflows/unit-tests.yml, which runs
  the suite at line 207) declares 'on: push: branches-ignore: [main,
  graph/**]', so it never runs on main at all and there is no CI-on-main state
  for it; on branches it passes — run 30372398110 (branch
  tactic-dispatch-conflict-branch-merge-lane, conclusion success) records step
  'Run park-node CAS-guard tests: success'. The local failure is
  environment-specific. Root cause: the harness's make_clone
  (packages/intentionsutil/scripts/test-park-node.sh:191-202) symlinks
  $REAL_REPO_ROOT/node_modules into each clone, because case 5 alone runs the
  real apply-node-transition.ts through 'node --import tsx/esm' and resolves
  tsx and yaml by walking up from the clone root. A fresh worktree that has
  never had dependencies installed has no node_modules, so the symlink dangles
  and only case 5 fails, with 'Error [ERR_MODULE_NOT_FOUND]: Cannot find
  package tsx imported from /tmp/tmp.XXXX/g/' — a message that names a temp
  directory and points nowhere near the real precondition. Confirmed both
  directions in the same worktree: 14 passed / 1 failed with no node_modules;
  15 passed / 0 failed after symlinking the primary checkout's node_modules in,
  with no other change. Per .claude/rules/test-integrity.md the case stays
  enabled — the change belongs in the harness's precondition handling, not in
  the assertion."
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
# test-park-node.sh should fail fast on a missing node_modules precondition

## Context

`packages/intentionsutil/scripts/test-park-node.sh` is the bare-origin +
multi-clone functional harness for `park-node` and `resolve-park`. CI runs it at
`.github/workflows/unit-tests.yml:207` ("Run park-node CAS-guard tests").

Its `make_clone` helper (`test-park-node.sh:191-202`) creates each writer clone
and then symlinks the real repository's dependency tree into it:

```
ln -s "$REAL_REPO_ROOT/node_modules" "$1/node_modules"
```

with `REAL_REPO_ROOT` derived from the harness's own location
(`test-park-node.sh:96`). The symlink exists for exactly one case: case 5,
`demote-node-to-implement byte-identical restore`, which is the only case that
executes the real `apply-node-transition.ts` via `node --import tsx/esm` and
therefore has to resolve the `tsx` loader and the `yaml` package by walking up
from the clone's own root. Every other case goes through the harness's `npx`
PATH shim and never touches real dependencies.

## The problem

The symlink is created unconditionally, with no check that
`$REAL_REPO_ROOT/node_modules` exists. In a checkout that has never had
dependencies installed — which is the normal state of a freshly-created
worktree — it dangles. The harness then runs to completion and reports:

```
demote-node-to-implement: failed to write the demotion for t-demote
NO: demote-node-to-implement byte-identical restore (rc=1)
...
passed: 14  failed: 1
```

with the underlying cause buried in the case's captured output as
`Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'tsx' imported from
/tmp/tmp.XXXXXXXX/g/`. Nothing in that output names `node_modules`, the harness
root, or the missing install step; the temp path actively misdirects. The
observable result reads as a product defect in `demote-node-to-implement`, and
was in fact first reported as one.

Per `.claude/rules/code-style.md` (prefer clear errors over defensive
fallbacks), this is a precondition the harness should assert up front and fail
loudly on — not degrade into one confusing case failure.

## Verified state

- **CI on `main` for this suite: not applicable.**
  `.github/workflows/unit-tests.yml` declares
  `on: push: branches-ignore: [main, 'graph/**']`, so the workflow — and this
  suite with it — never runs on `main`. There is no red-main condition here.
- **CI on branches: green.** Run `30372398110` (branch
  `tactic-dispatch-conflict-branch-merge-lane`, conclusion `success`) records
  step `Run park-node CAS-guard tests: success`. CI installs dependencies
  before the step, so the symlink resolves and all 15 cases pass.
- **Local, no `node_modules`: 14 passed / 1 failed.** Reproduced in a detached
  worktree at `origin/main` with nothing else modified.
- **Local, `node_modules` symlinked in: 15 passed / 0 failed.** Same worktree,
  same commit, symlink the only difference.

So the failure is environment-specific — a missing-precondition ergonomics
defect in the harness — not a universal or product-level one. This is
materially narrower than the original report, and it is the reason this node
exists rather than a `demote-node-to-implement` bug node.

## Scope

- Assert the precondition where it belongs (harness startup, or `make_clone`
  before the `ln -s`): if `$REAL_REPO_ROOT/node_modules` is absent, exit
  non-zero immediately with a message naming the missing directory and the
  install command to run.
- Keep case 5 enabled and unchanged in what it asserts
  (`.claude/rules/test-integrity.md`).
- Consider whether the sibling harnesses that use the same `make_clone` shape
  (`test-graph-commit.sh`, `test-transition-node.sh`, `test-hold-node.sh`)
  share the gap; if so, the guard belongs somewhere they can all reach rather
  than copy-pasted.

## Reuse

- `packages/intentionsutil/scripts/test-park-node.sh:96` (`REAL_REPO_ROOT`) and
  `:191-202` (`make_clone`) — the two sites involved.
- `packages/intentionsutil/scripts/test-graph-commit.sh`,
  `test-transition-node.sh`, `test-hold-node.sh` — sibling harnesses to check
  for the same pattern.
- `.github/workflows/unit-tests.yml:207` — the CI invocation, which must keep
  passing unchanged.

## Out of scope

- Any change to `demote-node-to-implement` or `apply-node-transition.ts`; both
  are correct, as the 15/15 run with dependencies present demonstrates.
- Changing the workflow's `branches-ignore` policy so the suite also runs on
  `main`. That is a separate question about main coverage and is not decided
  here.
- No implementation plan is written here; this node is `status: raw`,
  `phase: null` for a later `/align-tactics` pass.
