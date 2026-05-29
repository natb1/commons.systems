---
name: dispatch-worker
description: Worker for the dispatch chain — runs one phase skill in its target worktree, then hands off to a fresh `/dispatch-propagate` router
---

# Dispatch Worker

The worker is the per-worktree execution half of the dispatch chain. The other
half — `/dispatch-propagate` — is the router: it selects a target, resolves its worktree,
and spawns this worker. The worker then enters the target worktree, derives
the phase, runs exactly one phase skill, and hands off.

The worker is spawned from `worktrees/main` (the router's cwd) — not from the
target worktree. Spawning from the target worktree would pollute the Claude
daemon's "+ new session" launcher default cwd; spawning from `worktrees/main`
keeps that default anchored at the router's worktree. The worker enters its
target worktree as the first action of Step 0 by `cd`-ing into the
`<worktree-path>` it receives as a positional argument. After that initial
entry, the worker's cwd is anchored to the target worktree for its entire
lifetime — it never calls `EnterWorktree` or `ExitWorktree`. That means
`SessionStart`-derived attributes (title, restored skill set) and per-worktree
sandbox concerns all naturally key on the right worktree once Step 0 runs.

The worker takes `<N> <worktree-path>` arguments — the issue number and the
absolute path to its target worktree — and ends after one phase. The router
is the one who decides what to work on next; the worker just executes.

Run `gh` commands (`gh label create`, `gh pr edit`, and the scripts that invoke
`gh`) with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## 0. Enter the Worker's Worktree

The worker is spawned from `worktrees/main` and `cd`s into its target
worktree itself as the first action. `ARGUMENTS` has the shape
`<N> <worktree-path>` (e.g. `860 /home/n8/natb1/commons.systems/worktrees/860-dispatch-spawn-worker-from-m`).
Parse both, `cd` into the worktree, then run the branch-name sanity check —
the assertion is the contract enforcement that the spawner passed a coherent
worktree path for the named issue.

```bash
read -r ISSUE_NUM WORKTREE_PATH <<<"$ARGUMENTS"
if [[ -z "${ISSUE_NUM:-}" || -z "${WORKTREE_PATH:-}" ]]; then
  echo "dispatch-worker: expected ARGUMENTS '<N> <worktree-path>', got '$ARGUMENTS'" >&2
  exit 1
fi
if ! cd "$WORKTREE_PATH"; then
  echo "dispatch-worker: cd to '$WORKTREE_PATH' failed" >&2
  exit 1
fi
EXPECTED="${ISSUE_NUM}-"
ACTUAL_BRANCH=$(basename "$(git rev-parse --show-toplevel)")
case "$ACTUAL_BRANCH" in
  ${EXPECTED}*) ;;
  *)
    echo "dispatch-worker invoked with wrong worktree: expected branch '${EXPECTED}…' under worktrees/, got '${ACTUAL_BRANCH}'" >&2
    echo "The spawner must pass <worktree-path> matching the issue number <N>." >&2
    exit 1
    ;;
esac
```

The bash above exits 1 to signal the wrong-worktree disposition — either the
`cd` to `<worktree-path>` failed, or the branch-name sanity check rejected the
resulting worktree. When that exit fires, the worker session ends; the Stop
hook applies `dispatch:office-hours` to the issue because no marker was
written.

## 1. Derive the Phase

Derive the phase via `dispatch-phase <N>`:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-phase <N>
```

It prints exactly one phase name. CI status is checked **before** labels — a
draft PR with non-green CI is always `verify`, regardless of which `dispatch:*`
labels are present.

**Do not infer the phase from hand-rolled `gh` queries.** `dispatch-phase` is
the only valid phase-derivation path. PR existence in particular **must not** be
checked via title search (e.g. `gh pr list --search "<N> in:title"`) — a PR's
title may not contain the issue number. The only correct PR-existence check is
`dispatch-find-pr <N>`, which uses the `<issue>-` branch-prefix convention.

Map the phase:

| Phase | Meaning | Next action |
|---|---|---|
| `implement` | no PR on the target | relevance review (Step 3), then dispatch its verdict |
| `verify` | draft PR, CI completed and failed | `/verify-pr` |
| `waiting` | draft PR, CI in progress (running/queued/not started) | monitor CI to completion with a `sonnet` subagent, then re-derive the phase and dispatch it (Step 2) |
| `qa` | draft PR, CI green, no `dispatch:*` label | `/dispatch-qa` |
| `code-review` | draft PR + `dispatch:qa-done` | `/code-review-fix` (applies `dispatch:code-reviewed` itself) |
| `review` | draft PR + `dispatch:code-reviewed` | `/review-fix` (applies `dispatch:reviewed` itself) |
| `security` | draft PR + `dispatch:reviewed` (or `dispatch:security-reviewed` — re-entry; `/security-review-fix` is idempotent) | `/security-review-fix` (applies `dispatch:security-reviewed` and marks ready itself) |
| `done` | non-draft (ready) PR | already complete — stop without invoking a phase skill; the Stop hook applies `dispatch:office-hours` to the issue |

## 2. Dispatch One Phase, Then Hand Off

Invoke the one mapped phase skill via the Skill tool. Run exactly one phase per
`/dispatch-worker` invocation.

- **`implement`** — run the Step 3 relevance review and dispatch the verdict it
  returns (`proceed` / `adjust` / `stop` — see Step 3). The draft PR's existence
  plus its CI status is its own marker — `/plan-implement` gets **no**
  `dispatch:*` label.
- **`verify`** — invoke `/verify-pr`. It runs a single pass: fix one set of
  failed CI checks, record the outcome, post it, stop. No label.
- **`waiting`** — CI checks are still running or queued. Monitor them to
  completion, then re-derive and dispatch the resolved phase within this same
  `/dispatch-worker` invocation:
  1. Resolve the draft PR number for the target.
  2. Spawn a subagent via the Agent tool (`subagent_type: general-purpose`,
     `model: sonnet`) that:
     - first waits for CI to register at least one check — a freshly-pushed
       branch can briefly have an empty check rollup;
     - then runs `.claude/skills/dispatch-propagate/scripts/run-pr-checks-wait.sh
       <pr-num>` with `dangerouslyDisableSandbox: true`, which blocks until
       every check concludes;
     - returns once all checks have completed.
  3. After the subagent returns, re-run Step 1 (`dispatch-phase`) to re-derive
     the phase from the now-complete CI, then dispatch the resolved phase per
     this step — `/verify-pr` if any check failed, otherwise the green-CI
     phases (`qa` / `code-review` / `review` / `security` / `ready`).
  4. If the re-derived phase is still `waiting` (CI never registered any
     check), stop; the Stop hook applies `dispatch:office-hours` to the
     issue because no marker was written. Do not loop.
- **`qa`** — invoke `/dispatch-qa`. It owns and applies `dispatch:qa-done`
  itself on a clean pass; `/dispatch-worker` applies no label.
- **`code-review`** — invoke `/code-review-fix`. It runs `/code-review max`,
  applies the recommended fixes, defers important out-of-scope findings to
  tracking issues, posts a PR comment, and applies the `dispatch:code-reviewed`
  label itself — `/dispatch-worker` applies no label.
- **`review`** — invoke `/review-fix`. It runs `/review`, applies the
  recommended fixes, posts a PR comment, and applies the `dispatch:reviewed`
  label itself — `/dispatch-worker` applies no label.
- **`security`** — invoke `/security-review-fix`. Its Step 2 directly fans out
  9 parallel subagents — 6 security domains, a red team, the built-in
  `/security-review` scan (subagent-wrapped Skill invocation), and the PR's
  CodeQL alerts — then applies the required fixes, posts a PR comment, applies
  the `dispatch:security-reviewed` label, and marks the PR ready. It is
  idempotent on re-entry — `/dispatch-worker` applies no label.
- **`done`** — stop without invoking a phase skill; the Stop hook applies
  `dispatch:office-hours` to the issue. No phase skill ran; the slip past
  sweep (#843) flags this PR for office-hours review.

The PR stays a **draft** through every phase; the `security` phase's
`/security-review-fix` flips it to ready as the workflow's terminal action.

After the phase skill returns, the worker session ends; the Stop hook reads
the marker the phase skill wrote and propagates the chain. The worker does
not advance to the next phase in the same tick — one phase per
`/dispatch-worker` invocation.

`/ultrareview` is intentionally **never** invoked: it is user-triggered and
billed, so `/dispatch-worker` cannot launch it.

## 3. Pre-Implementation Relevance Review

This step runs **only** for the `implement` phase — a no-PR target. Every phase
with an existing PR (`verify` onward) skips it: implementation is already
underway. It is the implementation-time counterpart of `ref-ready`'s Step 3e
relevance check; the two are deliberately separate — Step 3e is creation-time
and `$BASELINE_BRANCH`-anchored, this step is pre-implementation and
`createdAt`-anchored.

Before invoking `/plan-implement` on an `implement`-phase issue, confirm no PR
exists for the target by running:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-find-pr <N>
```

If it prints a PR number, **skip this relevance review** and advance directly to
Step 1 of this skill — a PR already exists and implementation is underway.

If `dispatch-find-pr` prints nothing, run a creation-date-anchored drift
analysis. First, fetch the issue's creation timestamp
(`dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
gh issue view <N> --json createdAt -q .createdAt
```

Then gather evidence of drift since that timestamp across the paths, references,
and conventions the issue body names.

### Drift-analysis inputs

Inputs 1, 3, and 4 are independent — issue them in parallel (one message,
multiple tool calls), together with input 2's initial list call. Input 2 then
has a dependent per-PR follow-up once that list returns.

1. **Commits since creation** — one `git log --since=<createdAt> -- <path1> <path2>
   ...` across every file path the issue body names. Relevant commits indicate the
   area is actively changing and may have shifted the issue's assumptions.

2. **Merged PRs since creation that touched the same files** — list merged PRs in
   the window (`dangerouslyDisableSandbox: true` — `gh` needs network):
   ```bash
   gh pr list --state merged --search "merged:>=<createdAt>" --limit 100
   ```
   If the result hits the limit, the drift window is too wide to analyze cheaply
   — report that and recommend re-running `/ready` instead. Otherwise, for the
   PRs whose titles plausibly relate to the issue's domain, fetch their changed
   files and keep the ones overlapping the paths the issue names. Titles and
   descriptions often surface whether the overlap is incidental or substantive.

3. **Named-reference validity** — one `grep`/`rg` with all names alternated as a
   single pattern. Names include any file paths, module names, function names, CLI
   commands, env vars, or npm scripts the issue body cites. Flag anything renamed,
   moved, or removed since the issue was created.

4. **Convention drift** — re-read `CLAUDE.md` and any `.claude/rules/*.md` whose
   domain the issue touches. Flag approaches the issue assumes that no longer match
   current conventions (e.g. a deprecated pattern, a renamed package, a changed
   config shape).

Input 4 stays with the dispatching session. Inputs 1-3 may be handed to a
one-shot subagent that returns a structured drift summary — decide this before
the parallel dispatch so the calls are not run twice. The dispatching session
always owns the verdict.

### Three-way verdict

- **`proceed`** — drift absent or cosmetic; invoke `/plan-implement`.
- **`adjust`** — issue still wanted but references, conventions, or scope have
  shifted; invoke `/new-requirement` with the drift findings as the revised
  understanding, then `/plan-implement`.
- **`stop`** — codebase has moved past the need; report what changed and
  recommend closing the issue or re-running `/ready`. Do **not** invoke
  `/plan-implement`; print the drift report and stop. The Stop hook
  applies `dispatch:office-hours` to the issue because no marker was
  written.

## 4. Stop

The Stop hook (`.claude/hooks/dispatch-stop.sh`) owns label management,
router spawn, and self-close. The worker reaches the end of its tick by
stopping naturally — there is no model-driven hand-off here.

Marker writes happen inside each phase skill at its clean-completion
terminal step (see each phase skill's SKILL.md). A skill that detects a
deviation skips the marker; the Stop hook reads marker presence and
current PR/CI state to decide propagate vs park.

### The #725 cap-keyed re-seed

See `/dispatch-propagate` Step 7's *The #725 cap-keyed re-seed* subsection
— the worker's relationship to the re-seed is the same as the router's.
The cap-keyed re-seed covers chain stalls caused by a rate-limit cap hit;
an empty queue or all-parked stall is handled by the office-hours queue,
not this mechanism.
