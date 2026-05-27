---
name: dispatch-worker
description: Worker for the dispatch chain — runs one phase skill in its target worktree, then hands off to a fresh `/dispatch` router
---

# Dispatch Worker

The worker is the per-worktree execution half of the dispatch chain. The other
half — `/dispatch` — is the router: it selects a target, resolves its worktree,
and spawns this worker with `cwd=<worktree-path>`. The worker then derives the
phase, runs exactly one phase skill, and hands off.

The worker is born in the target worktree. It never calls `EnterWorktree` or
`ExitWorktree`. Its cwd is anchored to the target worktree for its entire
lifetime. That means `SessionStart`-derived attributes (title, restored skill
set) and per-worktree sandbox concerns all naturally key on the right worktree
— no mid-session cwd switch is needed.

The worker takes an `<N>` argument — the issue number — and ends after one
phase. The router is the one who decides what to work on next; the worker just
executes.

Run `gh` commands (`gh label create`, `gh pr edit`, and the scripts that invoke
`gh`) with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## 0. Verify the Worker's Worktree

The worker must be born in the target worktree. The spawn primitive
(`dispatch-spawn-worker`) sets the worker's cwd at spawn time; this step is the
worker's contract enforcement.

```bash
EXPECTED="<N>-"
ACTUAL_BRANCH=$(basename "$(git rev-parse --show-toplevel)")
case "$ACTUAL_BRANCH" in
  ${EXPECTED}*) ;;
  *)
    echo "dispatch-worker invoked with wrong cwd: expected branch '${EXPECTED}…' under worktrees/, got '${ACTUAL_BRANCH}'" >&2
    echo "The worker must be spawned with cwd already set to the target worktree." >&2
    exit 1
    ;;
esac
```

If the assertion fails, **proceed to Step 4 (early-stop)** — do not derive a
phase or run a phase skill.

## 1. Derive the Phase

Derive the phase via `dispatch-phase <N>`:

```bash
.claude/skills/dispatch/scripts/dispatch-phase <N>
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
| `done` | non-draft (ready) PR | already complete — report, then Step 4 (early-stop) |

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
     - then runs `.claude/skills/dispatch/scripts/run-pr-checks-wait.sh
       <pr-num>` with `dangerouslyDisableSandbox: true`, which blocks until
       every check concludes;
     - returns once all checks have completed.
  3. After the subagent returns, re-run Step 1 (`dispatch-phase`) to re-derive
     the phase from the now-complete CI, then dispatch the resolved phase per
     this step — `/verify-pr` if any check failed, otherwise the green-CI
     phases (`qa` / `code-review` / `review` / `security` / `ready`).
  4. If the re-derived phase is still `waiting` (CI never registered any check),
     report it, then **proceed to Step 4** (early-stop) — do not loop.
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
- **`done`** — report that the PR is already ready, then **proceed to Step 4**
  (early-stop). No phase skill ran.

The PR stays a **draft** through every phase; the `security` phase's
`/security-review-fix` flips it to ready as the workflow's terminal action.

After the one phase skill has run to completion, **proceed to Step 4**
(phase-completed) — do not advance to the next phase here; Step 4 hands off and
ends the job.

`/ultrareview` is intentionally **never** invoked: it is user-triggered and
billed, so `/dispatch-worker` cannot launch it.

### Applying the progress label

The `dispatch:*` labels are the accumulating progress markers across the full
workflow. `/dispatch-qa`, `/code-review-fix`, `/review-fix`, and
`/security-review-fix` each own and apply their own label — `dispatch:qa-done`,
`dispatch:code-reviewed`, `dispatch:reviewed`, and `dispatch:security-reviewed`
respectively — so `/dispatch-worker` applies no `dispatch:*` label after any
phase.

When a phase skill runs `dispatch-complete-phase <pr-num> <phase>`, the PR
number is expected to differ from the worktree's `<issue>-…` branch issue
number; the PR↔issue linkage was established earlier by the router. The
dispatching session must **not** pause to re-confirm — this is the expected
shape of every phase-skill label apply.

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
.claude/skills/dispatch/scripts/dispatch-find-pr <N>
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
  `/plan-implement`; **proceed to Step 4** (early-stop).

## 4. Hand off and self-close

Every Step 0–3 termination routes here — Step 4 is the single way a
`/dispatch-worker` job ends. A worker that just finished a phase passes the
baton to a fresh `/dispatch` (router) job and self-closes; that hand-off keeps
the dispatch chain moving.

Each termination reaches Step 4 with one of two dispositions, named by the step
that routed here:

- **phase-completed** — a phase skill (`/plan-implement`, `/verify-pr`,
  `/dispatch-qa`, `/code-review-fix`, `/review-fix`, or `/security-review-fix`)
  ran to completion. Only the Step 2 post-dispatch hand-off arrives this way.
- **early-stop** — the job stopped before any phase skill completed: a Step 0
  cwd-verification failure, a `done` phase, a `waiting` phase that stayed
  `waiting`, or an `implement` relevance verdict of `stop`.

Run these in order.

**1. No worktree to exit.** The worker was born in its target worktree and
never entered another worktree mid-session — there is nothing to exit. The
router (`/dispatch`) is what runs in `worktrees/main`; this worker's lifetime
ends here, in its target worktree.

**2. Pass the baton.** On the **phase-completed** disposition only, spawn a
fresh `/dispatch` (router) job back in `worktrees/main` (run with
`dangerouslyDisableSandbox: true` — the script reaches the local Claude daemon
over a socket; see `.claude/rules/sandbox.md`):

```bash
.claude/skills/dispatch/scripts/dispatch-spawn
```

The worker spawns a `/dispatch` router, not another worker — the router will
select the next target and spawn its worker. The script prints `spawned` (a
successor was started) or `deduped` (another `dispatch-*` job is already
running, so none was needed) and exits 0; it exits non-zero when a job was
spawned but did not register. **early-stop** dispositions skip this step —
they spawn no successor; the #725 heartbeat re-seeds the chain if it has
drained.

**3. Print the completion report.** State what this job did: the phase that
ran and its outcome, or the reason it stopped early.

**4. Terminal disposition.** Take exactly one of the following, in this
priority:

- **`dispatch-spawn` failed** — a phase-completed run whose step-2 spawn
  exited non-zero. Do **not** self-close. Report the failed baton-pass and
  stop, leaving this job open so the failure is visible and the spawn can be
  retried.

- **The report surfaces a deviation** — a phase-completed run whose step-2
  spawn succeeded, but whose completion report surfaces a deviation from the
  approved plan, or a result that does not fully satisfy the issue's acceptance
  criteria. Do **not** self-close — self-closing would bury the deviation in a
  closed job's transcript. The baton was already passed in step 2, so the chain
  keeps moving; route this item to the office-hours queue for human review.
  Resolve the PR for the target with
  `.claude/skills/dispatch/scripts/dispatch-find-pr <N>` and apply the
  `dispatch:office-hours` label to it (`gh`, `dangerouslyDisableSandbox: true`):

  ```bash
  gh pr edit <pr-num> --add-label dispatch:office-hours
  ```

  If that fails because the label does not exist yet, create it and retry —
  the same apply-first / create-on-"not found" idiom `dispatch-complete-phase`
  uses:

  ```bash
  gh label create dispatch:office-hours \
    --description "dispatch workflow: blocked on a human — awaiting input or review"
  gh pr edit <pr-num> --add-label dispatch:office-hours
  ```

  Pass no `--color`: `dispatch-complete-phase` is the single source of the
  `dispatch:*` label-colour metadata, and #757 owns `dispatch:office-hours`'s
  canonical definition — Step 4 only needs the label to exist.
  `dispatch:office-hours` is the office-hours queue's marker, shared with #757,
  whose input-block detection hooks are the label's other writer; whichever
  writer runs first creates it. Then stop — report that the item is parked in
  the office-hours queue for human review.

- **Clean completion or early-stop** — an early-stop, or a phase-completed run
  whose `dispatch-spawn` succeeded and whose report surfaces nothing that needs
  the user. Self-close (`dangerouslyDisableSandbox: true`):

  ```bash
  .claude/skills/dispatch/scripts/dispatch-self-close
  ```

  The script stops the managed background job by its job-id (the basename of
  `$CLAUDE_JOB_DIR`, which is what `claude stop` expects — not the conversation
  session UUID, not the registry's `.sessionId`). It is a no-op when
  `CLAUDE_JOB_DIR` is unset (the session is interactive, not a managed
  background job) — so an interactive `/dispatch-worker` reaching Step 4 does
  not stop the user's live conversation. The job ends; the router it spawned —
  or, for an early-stop, the #725 heartbeat — carries the workflow forward.
