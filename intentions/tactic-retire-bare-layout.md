---
id: tactic-retire-bare-layout
kind: tactic
statement: Retire the .bare bare-repo layout — main becomes the standard git
  root; Claude Code native worktrees under <repo>/.claude/worktrees/ are the
  only worktree surface
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-21 (strategy-graph-native-dispatch interview): the
  .bare bare-repo-with-worktrees layout makes the Claude Code harness key the
  project on the git-common-dir (.bare), so EnterWorktree(path=…) into any graph
  worktree at <main>/.claude/worktrees/ is rejected as outside the harness's
  managed root and prompts for a permission-root relocation. Physically
  de-baring aligns the repo with Claude Code defaults and eliminates the prompt;
  descoping .bare from scripts alone does not. Author elected an in-session
  direct-to-main hotfix under a manual fleet quiesce (drain + scheduling
  disabled), bypassing dispatch."
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

# Retire the `.bare` bare-repo layout for Claude Code defaults

Draft (retained context, not router-selectable — executed as an in-session
hotfix, not a dispatched phase). See `strategy-graph-native-dispatch`
clarifications dated 2026-07-21 for the decision and rejected alternatives.

## Problem

The repo is a bare-repo-with-worktrees: `.bare` is the git common dir,
`commons.systems` is the `main` worktree, and there are two worktree
conventions (legacy `<issue-num>-<slug>` lane anchored at
`<.bare>/.claude/worktrees/`; graph lane at `<main>/.claude/worktrees/`). The
Claude Code harness keys the project on the git-common-dir (`.bare`), so its
managed worktree root is `<.bare>/.claude/worktrees/`. Graph worktrees live at
`<main>/.claude/worktrees/`, which the harness's `path`-based `EnterWorktree`
re-entry validator treats as "outside .claude/worktrees/" → a permission-root
relocation prompt on every graph-worktree entry.

## Greenfield target

A standard Claude Code repository: the working tree at the project root IS the
git root (`.git` a normal directory inside it), no `.bare` common dir, no
sibling `worktrees/` container. Worktrees are Claude Code native under
`<repo>/.claude/worktrees/`, which the harness manages and re-enters without a
prompt. Collapses `worktree-create.sh` to a single lane and removes the
gh-identity stub and git-common-dir anchoring (subsumes / co-lands with
`tactic-legacy-router-removal`, whose gh-drain gate is now satisfied —
`hasIssuesEnabled: false`).

## Migration (in-session hotfix, fleet quiesced)

Preconditions: all active sessions drained, scheduling disabled (author-owned).
Sketch — to be finalized before execution:

1. De-bare: make `<repo>/.git` the real git dir (convert from the `.bare`
   common-dir + `main` worktree arrangement to a standard checkout), preserving
   history and origin remote. Re-register/re-cut existing graph worktrees under
   the standard layout as needed (most are disposable).
2. Update `.claude/settings.json` sandbox `allowWrite` (`../../.bare`,
   `../../worktrees`) and the WorktreeCreate/WorktreeRemove hooks to the
   standard layout; collapse `worktree-create.sh` to the single graph lane.
3. Purge remaining `.bare` / sibling-`worktrees/` assumptions from dispatch
   scripts and skill docs (the clarification-23 "no machinery references .bare"
   goal, now including the physical layout).

## Verification

- `EnterWorktree(path=<repo>/.claude/worktrees/<id>)` into a graph worktree
  completes with NO permission-root relocation prompt.
- `git rev-parse --git-common-dir` from the main checkout resolves inside the
  repo (`.git`), not `.bare`.
- No repo machinery references `.bare` or a sibling `worktrees/` container.
- `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes;
  `npm test --prefix packages/intentionsutil` green.

## Outcome (2026-07-21) — core delivered, script residual deferred

The statement is **achieved**: the repo is now a standard Claude Code
repository (`git rev-parse --git-common-dir` → `.git`, `core.bare=false`, `main`
the primary working tree at the repo root), Claude Code native worktrees under
`<repo>/.claude/worktrees/` are the only worktree surface, and
`EnterWorktree(path=…)` into a graph worktree completes with **no**
permission-root relocation prompt — verified in a fresh session and again in
this one.

Delivered:

- **De-bare migration** via a fresh-clone swap (old layout retained as the
  author-owned backup `commons.systems.bare-bak`).
- **`.claude/settings.json`** sandbox `allowWrite` → `[".git"]` (was
  `["../../.bare","../../worktrees"]`) — commit `183600bc`; sandboxed `git
  worktree add` + commit succeed without an override.
- **`.claude/rules/sandbox.md`** rewritten for the standard layout (commit
  `73127088`).
- **Auto-memory** re-keyed to the new project slug (the git-common-dir change
  moved the Claude project identity); the de-bare is recorded as a project
  memory so `.bare`-era notes are marked historical.
- Decision + rejected alternatives recorded on `strategy-graph-native-dispatch`
  (clarifications dated 2026-07-21, commit `70a48530`).

Deferred (not part of this statement, and not a blocker — the prompt is already
gone):

- **Collapsing `worktree-create.sh` to a single graph lane** (and the broader
  purge of `.bare` strings from live dispatch scripts) is owned by
  `tactic-legacy-router-removal`, which is parked in office-hours because
  several legacy scripts remain live-wired into the graph-native tick and need a
  re-plan. Removing the legacy lane here would re-open that parked scope and risk
  live dispatch — out of scope for a hygiene pass. The legacy lane's
  `--git-common-dir` anchoring is not broken by the de-bare (it now resolves
  `.git`); it is simply dead, since no `<issue-num>-<slug>` branches are created
  with gh issues disabled.
- **Residual `.bare` mentions** in dispatch scripts / `office-hours` are
  layout-agnostic robustness (code that resolves the graph source under *either*
  layout) and test fixtures that exercise that code. They are not a dependency
  on the bare layout; leaving them is deliberate (removing robustness has no
  upside and would weaken tests).
