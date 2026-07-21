---
id: tactic-graph-commit-cwd-repo-resolution
kind: tactic
statement: graph-commit resolves its target repo from the caller's cwd, not the
  invoked script's checkout, so a worktree invocation never silently commits the
  primary checkout.
owner: ai
status: raw
parent: null
rationale: "Surfaced live in a 2026-07-21 office-hours drain: clearing a park
  via the emulated clear-park sequence, graph-commit was invoked as
  `../../../packages/intentionsutil/scripts/graph-commit` from inside a
  worktree. Because graph-commit derives REPO_ROOT from the invoked script's own
  location, the `../../../` path resolved to the primary checkout's copy of the
  script, so it staged the primary checkout (where the edit did not exist),
  printed `no new changes to stage ... landing current HEAD`, and falsely
  reported `landed`. The worktree edit stayed uncommitted, leaving the FORBIDDEN
  still-parked terminal state despite a success message. A localized
  tool-correctness defect in the sanctioned graph-write path."
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
# graph-commit target-repo resolution

Draft tactic (retained interview byproduct, `/align-strategy` 2026-07-21). Not
yet decomposed — `/align-tactics` refines and unit-splits this.

## Context

`packages/intentionsutil/scripts/graph-commit` sets
`REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"` and `cd "$REPO_ROOT"` before
staging. So it operates on whichever checkout **owns the script binary that was
invoked**, not the caller's cwd. `$SCRIPT_DIR` is legitimately needed to locate
sibling helper scripts (`write-node.ts` etc.); the defect is that the *same*
location is reused to choose which checkout gets staged and committed. Two
distinct jobs, one derivation — that conflation is the bug.

Failure mode (observed live, see `rationale`): from inside a worktree at
`.claude/worktrees/<id>`, invoking `../../../packages/intentionsutil/scripts/graph-commit`
climbs three levels out to the **primary checkout's** copy of the script, so
`$SCRIPT_DIR/../../..` = the primary checkout. graph-commit then stages the
primary checkout — where the worktree's edit does not exist — prints
`no new changes to stage ... landing current HEAD`, and reports `landed` while
the real edit stays uncommitted in the worktree. For an office-hours
clear-park emulation this silently leaves the FORBIDDEN still-parked terminal
state behind a success message.

## Greenfield design (author-selected 2026-07-21)

1. **Derive `REPO_ROOT` from the caller, not the script.** Use
   `git rev-parse --show-toplevel` against cwd (or an explicit `-C <path>` /
   `--repo <path>` flag when given). Keep `$SCRIPT_DIR` for locating sibling
   scripts only. Result: `../../../…/graph-commit` from a worktree operates on
   the worktree, as the caller means — the silent-wrong-checkout class is gone.
   If cwd is not inside a git repo and no `-C` is given, **error clearly**
   (`.claude/rules/code-style.md`: prefer clear errors over defensive
   fallbacks), never fall back to the script's own checkout.

2. **Fail-loud guard against a silent false "landed."** RESOLVED EDGE CASE
   (interview 2026-07-21): a blanket "error whenever there is nothing to stage"
   is wrong — `no new changes to stage` is a *legitimate* path when a node's
   content already landed on main out-of-band (see memories
   `qa-fix-content-on-main-outofband-close-pr-done`,
   `graph-tick-outofband-merge-mainqa-absorption`), so a hard error there would
   break those flows. The guard must instead distinguish "already on
   origin/main (benign)" from "wrong checkout (bug)": when asked to commit
   node `<id>` and the resolved repo has no staged change for it, compare the
   resolved repo's `<id>` blob against `origin/main:<id>`. Equal → benign,
   proceed. Differing (the caller's edit exists somewhere but not in the repo
   graph-commit resolved) → **error, do not print "landed."** With design #1 in
   place this residual case only arises from a mis-pointed `-C`, so the guard
   is a cheap secondary net, not the primary fix.

## Migration path (owed audit — do not assume done)

Design #1 changes which checkout graph-commit targets. Before flipping the
derivation, **audit every caller** to confirm none relies on script-location
targeting a checkout other than its cwd — in particular any headless path that
invokes graph-commit from a neutral directory intending to operate on the
primary/main checkout (e.g. dispatch tick scripts). Sequence as: (unit 1) grep
all `graph-commit` invocation sites across `.claude/skills/**` and
`packages/**`, classify each by cwd-at-invocation; (unit 2) implement `-C` +
cwd-derivation + the guard, updating any caller that depended on the old
behavior to pass `-C` explicitly; (unit 3) tests. This is the reason the fix is
not a one-line change.

## Reuse / neighbors

- Analog draft (different surface, same failure family — silent write to the
  primary checkout): `tactic-subagent-cwd-worktree-guard` (subagent relative
  `Write` landing in the primary checkout). Worth a shared cwd-safety helper if
  both land together.
- Invocation-ergonomics sibling: the classifier-bypass tactic under
  `strategy-owned-orchestration` (created in the same 2026-07-21 interview)
  adds the same `-C <path>` flag to shape graph-commit to the allowedTools
  matcher. The `-C` flag is the shared surface — coordinate so one
  implementation serves both; that tactic depends on this one for the flag.
- Memory: `graph-commit-repo-root-from-script-location` records the live
  symptom and the worktree-local-invocation workaround that stands in until
  this lands.

## Verification

- Unit test: invoke the built graph-commit from a worktree via a
  `../../../…/graph-commit` path and assert it stages/commits the *worktree's*
  `intentions/<id>.md`, not the primary checkout's.
- Regression: a node whose content is already on `origin/main` still succeeds
  ("benign already-landed" path) without the guard erroring.
- Negative: a `-C` pointing at a checkout lacking the edit errors loudly and
  never prints `landed`.
