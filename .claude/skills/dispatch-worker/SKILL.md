---
name: dispatch-worker
description: Worker for the dispatch chain — runs one phase skill in its target worktree, then hands off — via the Stop hook — to a fresh headless dispatch tick
---

# Dispatch Worker

The worker is the per-worktree execution half of the dispatch chain. The other
half is the headless `dispatch-tick` script: it selects a target, resolves its
worktree, and spawns this worker into that worktree. The worker derives the
phase, runs exactly one phase skill, and hands off.

The worker is spawned **into** its target worktree by `dispatch-spawn-worker` —
the script invokes `claude --bg` from a subshell that has `cd`'d into
`<worktree-path>`, so the new worker is born in that worktree and runs there from
spawn through its entire lifetime; it never calls `EnterWorktree` or
`ExitWorktree`. See `reference.md` for the spawn-cwd mechanics and the
"+ new session" launcher trade-off.

The worker takes `<N> <worktree-path>` arguments — the issue number and the
absolute path to its target worktree — and ends after one phase. The router
decides what to work on next; the worker just executes.

Run `gh` commands (and the scripts that invoke `gh`, including `dispatch-route`)
with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## 1. Route via `dispatch-route`, Then Act on the Directive

`dispatch-route` performs the entire deterministic prelude in one call — the
worktree cross-check, the worktree provisioning + `origin/main` merge, the
`dispatch-ci-ready` gate, and `dispatch-phase` — and prints exactly one directive
line. The router's held-lock fan-out does only the cheap `git worktree add`; the
multi-minute `direnv`/`npm` provisioning and the `origin/main` merge run **here**,
inside `dispatch-route`, after the cross-check and before phase derivation (so the
phase skill the worker later loads reads the merged `.claude/` tree — #1047). Run
it (`dangerouslyDisableSandbox: true` — it calls `gh`, and provisioning runs
`git merge`/`direnv`/`npm`), capturing both the directive on stdout and the exit
code. `ARGUMENTS` has the shape `<N> <worktree-path>`:

```bash
read -r N WORKTREE_PATH <<<"$ARGUMENTS"
DIRECTIVE=$(.claude/skills/dispatch-propagate/scripts/dispatch-route "$N" "$WORKTREE_PATH"); ROUTE_RC=$?
```

`$DIRECTIVE` holds the one directive line and `$ROUTE_RC` its exit code (non-zero
only for `STOP wrong-worktree`). Look `$DIRECTIVE` up in the table below and act on
the matching row.

Act on the one directive:

| Directive | Exit | Meaning | Action |
|---|---|---|---|
| `INVOKE /fix-checks` | 0 | draft PR, CI completed and failed | invoke `/fix-checks` |
| `INVOKE /qa-fix` | 0 | draft PR, CI green, no `dispatch:*` label | invoke `/qa-fix` |
| `INVOKE /review-fix` | 0 | draft PR + `dispatch:qa-done` (or `dispatch:reviewed` re-entry) | invoke `/review-fix` |
| `INVOKE /budget-parse-job` | 0 | a statement parse-job issue (`statements:<key>` label, no PR) | invoke `/budget-parse-job` (see below) |
| `INVOKE /implement` | 0 | no PR + `dispatch:planned` (`implement` phase) | invoke `/implement` (the generic INVOKE path below) |
| `INVOKE /dispatch-resolve-conflict` | 0 | provisioning hit an `origin/main` merge conflict | invoke `/dispatch-resolve-conflict` (see below) |
| `RELEVANCE-REVIEW` | 0 | no PR, unplanned (`plan` phase) | run the Step 2 relevance review, then dispatch its verdict |
| `STOP done` | 0 | non-draft (ready) PR — should-never-happen; spawn boundary (#1109) prevents it upstream | stop without invoking a phase skill |
| `PUSH-STRANDED` | 0 | `done` PR, but the worktree has commits `origin/<branch>` hasn't seen | push `origin HEAD`, write an office-hours reason, stop with no marker |
| `STOP waiting` | 0 | draft PR's CI has no verdict yet | print the verbatim message below and stop |
| `STOP provision-failed` | 0 | `direnv`/merge provisioning failed (non-conflict) | stop with no marker (reason already written) |
| `STOP wrong-worktree` | non-zero | spawn cwd / branch did not match `<N>` / `<worktree-path>` | stop |

### `INVOKE` — run exactly one phase skill

Invoke the one named phase skill via the Skill tool. Run exactly one phase per
`/dispatch-worker` invocation. The PR stays a **draft** through every phase; the
`review` phase's `/review-fix` flips it to ready as the workflow's terminal
action. Each phase skill owns and applies its own `dispatch:*` label — the worker
applies none:

- **`/fix-checks`** — runs a single pass: fix one set of failed CI checks, record
  the outcome, post it, stop. No label.
- **`/qa-fix`** — runs the autonomous portion of QA and applies `dispatch:qa-done`
  itself on a clean pass. On a user-input blocker (a needs-human-judgment item, a
  bug, a failed pre-QA check) it escalates to the office-hours queue instead,
  where `/office-hours` runs the interactive residue.
- **`/review-fix`** — the single terminal review pass. It runs `/code-review max
  --fix`, `/review`, and the full surface-gated security fan-out as direct
  subagents over the same diff, unifies and de-duplicates the findings, applies
  the in-scope fixes via one `/commit-merge-push`, files meaningful out-of-scope
  findings as `blocked_by` follow-ups, posts one PR comment covering every
  finding, applies `dispatch:reviewed`, and marks the PR ready. It is idempotent
  on re-entry.
- **`/implement`** — the `implement`-phase build skill for a no-PR issue carrying
  `dispatch:planned`. It reads the plan persisted to the issue's
  `<!-- dispatch:plan -->` comment, builds each unit via `/implement-unit`, and
  opens a draft PR. Planning already happened in the `plan` phase, so the worker
  runs no relevance review before it. No `dispatch:*` label — the draft PR it opens
  is its own marker.

After the phase skill returns, the worker session ends; the Stop hook reads the
marker the phase skill wrote and propagates the chain. The worker does not advance
to the next phase in the same tick — one phase per `/dispatch-worker` invocation.

`/ultrareview` is intentionally **never** invoked: it is user-triggered and
billed, so `/dispatch-worker` cannot launch it.

### `INVOKE /dispatch-resolve-conflict` — hand off the merge conflict

Provisioning found that `origin/main` does not merge cleanly into this worktree.
Invoke `/dispatch-resolve-conflict $N $WORKTREE_PATH` via the Skill tool **instead
of** any phase skill. The worker is already a session in the worktree, named
`<N>-slug`, with `CLAUDE_JOB_DIR` set — exactly the environment that skill expects
(it normally runs as a bg job the router spawns). Write **no** phase marker: the
Stop hook's conflict-resolver branch owns the disposition — re-seed at `<N>` on
`resolved`, or park an ambiguous conflict to office-hours — via the
`conflict-resolver` / `conflict-resolved` sentinels that skill writes. Then stop.

### `INVOKE /budget-parse-job` — merge one statement, close the issue

The routed target is a statement parse-job issue (filed by
`dispatch-statements-scan`, carrying a `statements:<key>` label, with no PR).
Invoke `/budget-parse-job` via the Skill tool **instead of** any phase skill. It
is a **one-phase** handler with no PR and no `dispatch:*` label: report-first via
`budget-etl` to detect uncategorized transactions, then idempotently merge the
statement into the user's encrypted `.benc` snapshot in the shared folder, close
the issue, and write the `parse-job-done` sentinel (Stop-hook Branch P) on a
clean run. On **any** blocker — a malformed body, a missing/changed file, a
missing snapshot or password, or (the central case) an uncategorized transaction
needing the author's judgment — it escalates via `dispatch-mark-deviation` and
stops with no sentinel, so the Stop hook parks the still-open issue on
`dispatch:office-hours` for the `/office-hours` residue.

### `RELEVANCE-REVIEW` — run the relevance review, then dispatch its verdict

Run the Step 2 relevance review and dispatch the verdict it returns (`proceed` /
`adjust` / `stop` — see Step 2). This gates the `plan` phase — a no-PR, unplanned
issue. `/plan-issue` gets **no** `dispatch:*` label here; it applies
`dispatch:planned` itself when it finishes and persists the plan.

### `STOP waiting` — re-gate to the router, no marker

The draft PR's CI has no verdict yet. Stop with no marker and print this
user-visible report verbatim:

```
#<N>: CI transitioned back to in-progress since router selection; next router tick will re-gate.
```

Apply no `dispatch:office-hours` and spawn no babysitter — a not-ready target is
not worker-actionable; the router owns the CI gate. See `reference.md` for the
Stop-hook re-gate rationale.

### `PUSH-STRANDED` — push unpushed local commits, then park

A `done` PR's worktree is ahead of its remote branch — unpushed
`dispatch-merge-main` / `/dispatch-resolve-conflict` merge commits that, if
left, keep the PR `CONFLICTING` with no later tick able to push them.

Run `git push origin HEAD` to flush them. This is sandbox-safe: it uses HTTPS
to `github.com`, an allowlisted host, so no `dangerouslyDisableSandbox` is
needed.

Then call `dispatch-mark-deviation` with a one-line reason, then stop with
no marker. The push heals the `CONFLICTING` PR; stopping without a marker means
the Stop hook applies `dispatch:office-hours`, surfacing the unexpected
late-skip for a human.

```bash
git push origin HEAD
.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
  "/dispatch-worker: PUSH-STRANDED — pushed unpushed local commits a done PR left behind; parking for review"
```

Note: with the `/review-fix` terminal-flush guard (#1105 Unit 1) in place, this
path is a true backstop that should essentially never fire.

### `STOP provision-failed` — stop with no marker

Provisioning failed for a non-conflict reason (a fetch failure or a non-conflict
merge failure). `dispatch-route` has already written the one-line reason to
`$CLAUDE_JOB_DIR/office-hours-reason`, so just stop without invoking a phase skill
and without writing a marker. The Stop hook reads that reason and parks the issue
on `dispatch:office-hours`.

### `STOP done` / `STOP wrong-worktree` — stop with no marker

Stop without invoking a phase skill and without writing a marker. The Stop hook
reads marker-absence and applies `dispatch:office-hours` to the issue. For `done`
(a non-draft PR), no phase skill ran and the slip-past sweep (#843) flags this PR
for office-hours review. Since #1109 the spawn boundary
(`dispatch-materialize-spawn`) re-checks done before spawning and refuses to
dispatch a done target, so `STOP done` is now a defensive guard for the
sub-millisecond residual window between that re-check and worker boot — the
normal-case done PR is caught upstream and no worker is spawned. For
`wrong-worktree`, the spawn was incoherent — the branch-name sanity check
rejected the spawn cwd, or the positional `<worktree-path>` disagreed with `git
rev-parse --show-toplevel`; see `reference.md`.

## 2. Pre-Planning Relevance Review

This step runs **only** for the `plan` phase — a no-PR, unplanned target. Every
phase with an existing PR (`fix-checks` onward) skips it, as does the `implement`
phase (a planned no-PR issue routes straight to its build skill): implementation
is already planned or underway. It is the planning-time counterpart of
`ref-ready`'s Step 3e relevance check; the two are deliberately separate — Step 3e
is creation-time and `$BASELINE_BRANCH`-anchored, this step is pre-planning and
`createdAt`-anchored.

Before invoking `/plan-issue` on a `plan`-phase issue, confirm no PR
exists for the target by running:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-find-pr <N>
```

If it prints a PR number, **skip this relevance review** and re-run Step 1
(`dispatch-route`) — a PR already exists and implementation is underway.

If `dispatch-find-pr` prints nothing, run a creation-date-anchored drift
analysis. Gather the deterministic evidence in one call
(`dangerouslyDisableSandbox: true` — it calls `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-drift-scan <N>
```

`dispatch-drift-scan` emits, in one invocation, the three mechanical drift
inputs anchored on the issue's `createdAt`: commits to the paths the issue body
names since creation, PRs merged in the window, and the validity of the issue's
named references (paths existence-checked, names grepped — anything renamed,
moved, or removed is flagged `[ABSENT]`/`[NOT FOUND]`). It mines those
references from the single-backtick spans in the issue body; read its header for
what the heuristic does and does not cover. When the merged-PR query hits its
100-result limit the script prints a `WINDOW-TOO-WIDE` marker recommending
`/ready` instead of a partial scan — treat that as the too-wide-window signal in
the verdict below.

Two judgments stay with the dispatching session, after reading the script's
evidence:

1. **Convention drift** — re-read `CLAUDE.md` and any `.claude/rules/*.md` whose
   domain the issue touches. Flag approaches the issue assumes that no longer
   match current conventions (e.g. a deprecated pattern, a renamed package, a
   changed config shape). The script does not mine conventions; this read is
   yours.
2. **Merged-PR overlap** — for any merged PR the script lists whose title
   plausibly relates to the issue's domain, optionally fetch its changed files
   to judge whether the overlap is incidental or substantive.

### Three-way verdict

- **`proceed`** — drift absent or cosmetic; invoke `/plan-issue`.
- **`adjust`** — issue still wanted but references, conventions, or scope have
  shifted; invoke `/new-requirement` with the drift findings as the revised
  understanding, then `/plan-issue`.
- **`stop`** — codebase has moved past the need; report what changed and
  recommend closing the issue or re-running `/ready`. Do **not** invoke
  `/plan-issue`; print the drift report and stop. The Stop hook
  applies `dispatch:office-hours` to the issue because no marker was
  written.

## 3. Stop

The Stop hook (`.claude/hooks/dispatch-stop.sh`) owns label management,
router spawn, and self-close. The worker reaches the end of its tick by
stopping naturally — there is no model-driven hand-off here.

Marker writes happen inside each phase skill at its clean-completion
terminal step (see each phase skill's SKILL.md). A skill that detects a
deviation skips the marker; the Stop hook reads marker presence and
current PR/CI state to decide propagate vs park.

### The #725 cap-keyed re-seed

See `reference.md`'s *The #725 cap-keyed re-seed* section — the worker's
relationship to the re-seed is the same as the tick's.
The cap-keyed re-seed covers chain stalls caused by a rate-limit cap hit;
an empty queue or all-parked stall is handled by the office-hours queue,
not this mechanism.
