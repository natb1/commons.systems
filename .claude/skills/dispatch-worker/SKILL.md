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

If the assertion fails, proceed to Step 4 with `notify worker-wrong-cwd` —
do not derive a phase or run a phase skill.

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
| `done` | non-draft (ready) PR | already complete — proceed to Step 4 with `notify already-done` |

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
  4. If the re-derived phase is still `waiting` (CI never registered any
     check), proceed to Step 4 with `drain waiting` — do not loop.
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
- **`done`** — proceed to Step 4 with `notify already-done`. No phase skill
  ran; the slip past sweep (#843) flags this PR for office-hours review.

The PR stays a **draft** through every phase; the `security` phase's
`/security-review-fix` flips it to ready as the workflow's terminal action.

After the one phase skill has run to completion, proceed to Step 4 with the
`propagate` disposition — do not advance to the next phase here; Step 4 hands
off and ends the job.

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
  `/plan-implement`; proceed to Step 4 with `notify implement-stop`.

## 4. Hand off and self-close

Every Step 0–3 termination routes here — Step 4 is the single way a
`/dispatch-worker` job ends. The disposition that routed it here determines
the action.

The dispatch-chain terminal-disposition invariant is stated in `/dispatch`
Step 7 and applies equally here — every disposition other than `propagate`
on success emits a user-visible report before any tool action; a silent
`notify` or silent `drain` is a defect.

The worker reaches Step 4 with one of these dispositions:

| Disposition | Source |
|---|---|
| `propagate` (silent on success; falls through to `notify spawn-failed` / `notify deviation` / `notify phase-non-advancement` per the priority below) | Step 2 — phase skill ran to completion |
| `notify worker-wrong-cwd` | Step 0 — cwd verification failed |
| `notify already-done` | Step 2 — `done` phase (non-draft PR slipped past sweep) |
| `notify implement-stop` | Step 3 — relevance verdict `stop` |
| `drain waiting` | Step 2 — `waiting` phase stayed `waiting` after the CI subagent returned |

The worker was born in its target worktree and never entered another
worktree mid-session — there is nothing to exit. The router (`/dispatch`)
is what runs in `worktrees/main`; this worker's lifetime ends here, in its
target worktree.

### `propagate`

The phase skill ran to completion; the chain moves forward. Spawn a fresh
`/dispatch` (router) job back in `worktrees/main`
(`dangerouslyDisableSandbox: true` — the script reaches the local Claude
daemon over a socket; see `.claude/rules/sandbox.md`):

```bash
.claude/skills/dispatch/scripts/dispatch-spawn-router
```

The worker spawns a `/dispatch` router, not another worker — the router will
select the next target and spawn its worker. The script prints `spawned` or
`deduped` and exits 0 on success; exits non-zero when a job was spawned but
did not register.

Print the completion report — the phase that ran and its outcome.

The disposition then resolves in this priority order:

1. **`notify spawn-failed`** — `dispatch-spawn-router` exited non-zero. Do
   **not** self-close. Report the failed baton-pass and stop, leaving this
   job open so the failure is visible and the spawn can be retried.

2. **`notify deviation`** — spawn succeeded, but the completion report
   surfaces a deviation from the approved plan, or a result that does not
   fully satisfy the issue's acceptance criteria. Self-closing would bury
   the deviation in a closed job's transcript; instead, route the item to
   the office-hours queue for human review. Resolve the PR for the target
   with `.claude/skills/dispatch/scripts/dispatch-find-pr <N>` and apply
   the `dispatch:office-hours` label (`gh`,
   `dangerouslyDisableSandbox: true`):

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
   canonical definition — this step only needs the label to exist.
   `dispatch:office-hours` is the office-hours queue's marker, shared with
   #757, whose input-block detection hooks are the label's other writer;
   whichever writer runs first creates it. Then report that the item is
   parked in the office-hours queue for human review, and stop (no
   self-close).

3. **`notify phase-non-advancement`** — spawn succeeded, but the phase skill
   returned success without flipping its workflow marker. Without this
   check, the next router tick would re-derive the same phase, spawn a
   worker, run the same phase skill, and loop forever — nothing observable
   has changed. Re-derive the phase against current PR/CI ground truth:

   ```bash
   .claude/skills/dispatch/scripts/dispatch-phase <N>
   ```

   If the re-derived phase **differs** from the phase that just ran, the
   workflow advanced — fall through to the silent propagate-success bullet.

   If the re-derived phase **equals** the phase that just ran, the workflow
   did not advance. Apply the verify-phase exemption: `/verify-pr` does not
   flip a marker on a single pass (CI re-runs in the background and either
   flips the PR back to `qa` or stays in `verify`), and is allowed up to 3
   cumulative attempts. For a non-advanced `verify` phase, read the highest
   extant `dispatch:verify-attempt-<n>` label on the PR
   (`dangerouslyDisableSandbox: true` — `gh`):

   ```bash
   PR_NUM=$(.claude/skills/dispatch/scripts/dispatch-find-pr <N>)
   N=$(gh pr view "$PR_NUM" --json labels \
     --jq '[.labels[].name | capture("^dispatch:verify-attempt-(?<n>[0-9]+)$").n | tonumber] | max // 0')
   ```

   When `N < 3`, fall through to the silent propagate-success bullet (the
   chain retries on the next router tick). When `N >= 3` — or for any
   non-`verify` phase that did not advance — apply `dispatch:office-hours`
   to the PR (same apply-first / create-on-"not found" idiom as `notify
   deviation` above), report that the loop was broken, and stop (no
   self-close). The parked job's transcript is the diagnostic record of the
   loop the chain just escaped.

4. **propagate-success (silent)** — spawn succeeded, no deviation, phase
   advanced. This is the only silent terminal path. Self-close
   (`dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/dispatch/scripts/dispatch-self-close
   ```

### `notify worker-wrong-cwd`

Step 0 detected that the worker was spawned into the wrong cwd. No phase
ran and no PR is typically resolvable. Print the Step 0 diagnostic to
stderr, report the variance to the user, and stop (no self-close) — the
session stays in `claude agents` until the user closes it, so the wrong-cwd
spawn is visible rather than buried in a closed transcript.

### `notify already-done`

Step 2 found a non-draft (ready) PR (`done` phase) that slipped past the
sweep — `dispatch-sweep` (#843) is meant to adopt these before they reach a
worker, so this is a real variance. Resolve the PR with
`.claude/skills/dispatch/scripts/dispatch-find-pr <N>` and apply
`dispatch:office-hours` to it with the same apply-first / create-on-"not
found" idiom as `notify deviation` above so the slip is queued for human
review. Report the variance and stop (no self-close).

### `notify implement-stop`

Step 3's relevance verdict was `stop` — the codebase has moved past the
issue's need. No PR exists yet for an `implement`-phase target, so there is
nothing to label. Print the Step 3 drift report (what changed, the
recommendation to close the issue or re-run `/ready`), and stop (no
self-close).

### `drain waiting`

Step 2's CI subagent returned but the re-derived phase is still `waiting`
because CI registered no checks. Print a **mandatory** user-visible report
("CI registered no checks for issue `<N>`'s draft PR; closing — #725
restart will re-check at 9 AM"), then self-close
(`dangerouslyDisableSandbox: true`):

```bash
.claude/skills/dispatch/scripts/dispatch-self-close
```

A silent `drain` is a defect.

---

`dispatch-self-close` stops the managed background job by its job-id (the
basename of `$CLAUDE_JOB_DIR`, which is what `claude stop` expects — not
the conversation session UUID, not the registry's `.sessionId`). It is a
no-op when `CLAUDE_JOB_DIR` is unset (the session is interactive, not a
managed background job) — so an interactive `/dispatch-worker` reaching
Step 4 does not stop the user's live conversation.

### The #725 daily restart

The #725 daily 9 AM dispatch restart is the workflow's restart-from-zero
mechanism. It re-seeds the chain when the prior day ended without an
in-flight worker — covering the cumulative end-of-day drain (every `drain
waiting` that ended a tick), rate-limit cap reached (#845), predecessor
crash, and missed ticks (e.g. a WSL shutdown). It is not tied to any one
disposition; every terminal state, including `notify` paths whose sessions
the user closes without manual restart, falls within its scope.
