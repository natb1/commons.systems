---
id: tactic-retire-bare-layout
kind: tactic
statement: Retire the .bare bare-repo layout — main becomes the standard git
  root; Claude Code native worktrees under <repo>/.claude/worktrees/ are the
  only worktree surface
owner: ai
status: raw
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

## Status (2026-07-21) — core migration delivered; `.bare` purge remaining

The core migration is **done** and the user-facing goal is met: the repo is a
standard Claude Code repository (`git rev-parse --git-common-dir` → `.git`,
`core.bare=false`, `main` the primary working tree at the repo root), Claude
Code native worktrees under `<repo>/.claude/worktrees/` are the only worktree
surface, and `EnterWorktree(path=…)` into a graph worktree completes with **no**
permission-root relocation prompt — verified in multiple fresh sessions.

Delivered:

- **De-bare migration** via a fresh-clone swap (old layout retained as the
  author-owned backup `commons.systems.bare-bak`).
- **`.claude/settings.json`** sandbox `allowWrite` → `[".git"]` (was
  `["../../.bare","../../worktrees"]`) — commit `183600bc`.
- **`.claude/rules/sandbox.md`** rewritten for the standard layout (commit
  `73127088`).
- **Stale `.bare` comments** corrected in `.claude/hooks/worktree-create.sh`
  and `office-hours/src/graph-source.ts` (+ its test comment).
- **Auto-memory** re-keyed to the new project slug; de-bare recorded as a
  project memory so `.bare`-era notes are marked historical.
- Decision + rejected alternatives on `strategy-graph-native-dispatch`
  (clarifications dated 2026-07-21, commit `70a48530`).

## Remaining scope — purge `.bare` from test fixtures

Correction to an earlier note that mislabeled these as "layout-agnostic
robustness": they are **not** robustness. The tested production code
(`resolve_project_root`, `resolveGitDirs`) is layout-generic and has **no**
`.bare`-specific branch — there is no dead production code to remove. But
several **test fixtures model the retired `.bare` layout**, and a test that
exercises a scenario the standard layout can never produce is pinning a dead
scenario. Those must be purged (not kept). Per-site, this is either deleting a
dead-scenario test or re-modeling a fixture to the standard `.git` layout — it
is **not** a blind `.bare`→`.git` rename (in the standard layout a worktree's
`.git` *file* and the common `.git` *dir* collide by name and live in different
containers, so re-modeling is semantic, not textual).

Sites and their disposition:

- `office-hours/src/graph-source.ts` `resolveGitDirs` worktree-`.git`-FILE
  branch + its test (`graph-source.test.ts` "follows a worktree checkout's .git
  FILE …"): satisfiable only when the picked root contains the common dir —
  the `.bare` layout. Likely dead in the standard layout (a picked worktree's
  common dir sits at the repo root, unreachable via FSA). Confirm office-hours'
  intended FSA usage, then remove the branch + test or re-model. Self-contained
  to office-hours.
- `test-dispatch-plan-io.sh` "5. bare+worktree repo resolution" block
  (`make_bare_worktree_fixture`, tests 5/5b–5e) tests `dispatch-write-plan` /
  `dispatch-read-plan` (legacy gh-issue scripts) against the `.bare` layout —
  a dead scenario for scripts already slated for deletion. **Co-lands with
  `tactic-legacy-router-removal`** (which deletes those scripts); do not
  duplicate here.
- Remaining `.bare` fixtures across the per-SUT test files (worktree-list
  parsing, `resolve_project_root` — e.g. `test-dispatch-tick.sh`,
  `test-lib-worktree-records.sh`), `test-phase-log-reentry.sh`,
  `test-write-phase-log.sh`, `test-worktree-remove.sh`: for **kept** plumbing,
  re-model to the standard `.git` common dir; for fixtures that only exist to
  test a legacy script, co-land with `tactic-legacy-router-removal`.

## `worktrees/main` primary-checkout residual — hotfixed 2026-07-21

Step 3 above ("purge sibling-`worktrees/` assumptions from dispatch scripts")
had a missed residual: the de-bare moved the primary checkout from
`<repo>/worktrees/main` to the repo root, but nine dispatch scripts plus
`office-hours-select-target` still defaulted `MAIN_WORKTREE` to
`$PROJECT_ROOT/worktrees/main` (now a dead path), and the host systemd units
(`dispatch-heartbeat.service`, `dispatch-tick-recover.service`,
`dispatch-sweep-periodic.service`) hard-coded that path in `ExecStart`/
`WorkingDirectory`. Effect: manual `dispatch` aborted at
`assert_primary_checkout_on_main` (exit 2); the headless heartbeat failed even
earlier at systemd `203/EXEC`, so the autonomous fleet was silently down.

Landed as an in-session direct-to-main hotfix (fleet paused via the
`~/.local/share/commons-dispatch/paused` sentinel — only manual `dispatch`
executes for now):

- `MAIN_WORKTREE` default `$PROJECT_ROOT/worktrees/main` → `$PROJECT_ROOT` (the
  standard-layout primary checkout) in: `dispatch-tick`, `dispatch-select-tick`,
  `dispatch-schedule-reseed`, `dispatch-schedule-convergence-reseed`,
  `dispatch-schedule-target-reseed`, `dispatch-schedule-rate-limit-resume`,
  `dispatch-spawn-tick`, `dispatch-spawn-sweep`, `dispatch-tick-recover`; plus
  `office-hours-select-target`'s `resolve_main_worktree` (`$root/worktrees/main`
  → `$root`). Functional-doc comments updated to match.
- Host systemd units regenerated at the repo root via `ensure_heartbeat_units` /
  `ensure_sweep_timer` / `ensure_recover_unit`.

## `<repo>/worktrees` container residual — hotfixed 2026-07-21

A second, distinct de-bare residual (surfaced reviewing the primary-checkout
hotfix): three sites still resolved the **native worktree container** as the
retired sibling `<repo>/worktrees` instead of `<repo>/.claude/worktrees` — a
path that no longer exists. Unlike the primary-checkout residual, this one did
not crash; it silently mis-scoped:

- `lib.sh` `cleanup_stale_worktree_processes` (process-match prefix) — never
  matched a native worktree, so stale-worktree-process cleanup was a no-op.
- `dispatch-sweep` `WORKTREES_ROOT` — the direct-child filter never matched a
  native worktree, so the sweep skipped every one.
- `commit-merge-push` `WORKTREES_ROOT` — the `--worktree` containment guard
  would reject every `.claude/worktrees/<id>` path as "not under the worktrees
  root" (latent: no current caller passes `--worktree`).

Fixed (direct-to-main hotfix): all three repointed to `<repo>/.claude/worktrees`
(comments updated to match). `dispatch-sweep` gained a
`DISPATCH_SWEEP_WORKTREES_ROOT` test seam (mirroring `commit-merge-push`'s
`DISPATCH_WORKTREES_ROOT`) so its fixture injects the container path; the sweep
fixture's dir-name re-model to `.claude/worktrees` stays deferred to the
fixture-purge scope below. `commit-merge-push`'s and `cleanup`'s own tests were
unaffected (override-seam'd / mirror the loop, not the real function). Full
dispatch suite: 2993/2994 — the one failure (`dispatch-complete-phase owns
BFD4F2`) is a pre-existing environment-specific flake unrelated to layout,
present identically on the pre-hotfix baseline.

## Remaining scope — still open under this node

- `.bare` / `worktrees/main` **test fixtures** (enumerated in the section above,
  plus the `dispatch-sweep` `project/worktrees` fixture now injected via the
  `DISPATCH_SWEEP_WORKTREES_ROOT` seam) — purge or re-model to the standard
  `.git` / `.claude/worktrees` layout; legacy-script sites co-land with
  `tactic-legacy-router-removal`.
- **Narrative `worktrees/main` comments** in `office-hours-select-target`
  (lines ~115, ~452, ~573) — descriptive only, reword to the standard layout.
- **Greenfield DRY**: the `MAIN_WORKTREE` resolution idiom is copy-pasted across
  ~10 scripts. Centralize it (a shared lib helper, or adopt
  `dispatch-graph-execute`'s robust `git worktree list … branch main`
  resolution) so a future layout change is one edit, not ten.

This node stays open (`raw`) until the fixture purge lands (kept-code sites
here; legacy-script sites via `tactic-legacy-router-removal`), at which point
the tactic's own success signal — "No repo machinery references `.bare`" — is
met.
