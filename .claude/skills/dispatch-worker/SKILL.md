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
| `INVOKE /review-fix` | 0 | draft PR + `dispatch:qa-done` | invoke `/review-fix` |
| `INVOKE /budget-parse-job` | 0 | a statement parse-job issue (`statements:<key>` label, no PR) | invoke `/budget-parse-job` (see below) |
| `INVOKE /fix-conflicts` | 0 | provisioning hit an `origin/main` merge conflict | invoke `/fix-conflicts` (the generic INVOKE path below) |
| `INVOKE /implement` | 0 | no PR + `dispatch:planned` (`implement` phase) | invoke `/implement` (the generic INVOKE path below) |
| `INVOKE /plan-issue` | 0 | no PR, unplanned (`plan` phase) | invoke `/plan-issue` (the generic INVOKE path below) |
| `STOP done` | 0 | non-draft (ready) PR, or a draft PR carrying `dispatch:reviewed` (review-complete — draft→ready owned by `dispatch-reconcile-ready`) | stop without invoking a phase skill |
| `PUSH-STRANDED` | 0 | `done` PR, but the worktree has commits `origin/<branch>` hasn't seen | push `origin HEAD`, write an office-hours reason, stop with no marker |
| `STOP waiting` | 0 | draft PR's CI has no verdict yet | print the verbatim message below and stop |
| `STOP provision-failed` | 0 | `direnv`/merge provisioning failed (non-conflict) | stop with no marker (reason already written) |
| `STOP wrong-worktree` | non-zero | spawn cwd / branch did not match `<N>` / `<worktree-path>` | stop |

### `INVOKE` — run exactly one phase skill

Invoke the one named phase skill via the Skill tool. Run exactly one phase per
`/dispatch-worker` invocation. The PR stays a **draft** through every phase;
after `/review-fix` applies `dispatch:reviewed`, draft→ready promotion is owned
by the router's `dispatch-reconcile-ready` on a later tick (once CI is passing
and `mergeable == MERGEABLE`). Each phase skill owns and applies its own
`dispatch:*` label — the worker applies none:

- **`/fix-checks`** — runs a single pass: fix one set of failed CI checks, record
  the outcome, post it, stop. No label.
- **`/qa-fix`** — runs the autonomous portion of QA and applies `dispatch:qa-done`
  itself on a clean pass. On a user-input blocker (a needs-human-judgment item, a
  bug, a failed pre-QA check) it escalates to the office-hours queue instead,
  where `/office-hours` runs the interactive residue.
- **`/review-fix`** — the single terminal review pass. It invokes the Workflow
  tool on `.claude/workflows/review-fix.js`, which fans out surface-conditional
  finders (`/code-review max` findings-only, `/review`, and the surface-gated
  security reviewers) over the same diff, de-duplicates and classifies the
  findings in code, adversarially verifies `Required` findings before spending an
  Opus fix, and runs an Opus fix fan-out. The skill then commits the fixes via one
  `/commit-merge-push`, files meaningful out-of-scope findings as `blocked_by`
  follow-ups, posts one PR comment covering every finding, applies
  `dispatch:reviewed`, and stops — draft→ready promotion is owned by the router's
  `dispatch-reconcile-ready` on a later tick.
- **`/implement`** — the `implement`-phase build skill for a no-PR issue carrying
  `dispatch:planned`. It reads the plan persisted to the issue's
  `<!-- dispatch:plan -->` comment, builds each unit via `/implement-unit`, and
  opens a draft PR. Planning already happened in the `plan` phase, so the worker
  runs no relevance review before it. No `dispatch:*` label — the draft PR it opens
  is its own marker.
- **`/plan-issue`** — the `plan`-phase skill for a no-PR, unplanned issue. It runs
  the `createdAt`-anchored pre-planning relevance review itself (the worker no
  longer gates it), then plans the issue into an ordered unit breakdown, persists
  the plan to the issue, and applies `dispatch:planned` on completion — the worker
  applies no label.

After the phase skill returns, the worker session ends; the Stop hook reads the
marker the phase skill wrote and propagates the chain. The worker does not advance
to the next phase in the same tick — one phase per `/dispatch-worker` invocation.

`/ultrareview` is intentionally **never** invoked: it is user-triggered and
billed, so `/dispatch-worker` cannot launch it.

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
`dispatch-merge-main` / `/fix-conflicts` merge commits that, if
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
reads marker-absence and applies `dispatch:office-hours` to the issue.

`dispatch-route` emits `STOP done` for two distinct kinds of `done` PR:

- **A draft PR carrying `dispatch:reviewed`** — `dispatch-phase` derives `done`
  for it because review is complete (the `dispatch:reviewed` label is the
  completion signal); draft→ready promotion is owned by the router's
  `dispatch-reconcile-ready` on a later tick (once CI is passing and
  `mergeable == MERGEABLE`). This is the **normal** clean-`/review-fix`-pass
  outcome, not a defensive guard. In the normal flow the review worker already
  ran `/review-fix` and wrote a `phase=review` marker, so its Stop hook sees the
  derived `done` advance past `review` and **self-closes** (it does not park on
  `dispatch:office-hours`). A worker that reaches this directive directly — spawned
  against an already-reviewed PR with no phase skill to run — stops with no marker
  and the Stop hook parks it for office-hours review.
- **A non-draft (ready) PR** — no phase skill ran and the slip-past sweep (#843)
  flags this PR for office-hours review. Since #1109 the spawn boundary
  (`dispatch-materialize-spawn`) re-checks done before spawning and refuses to
  dispatch a done target, so for this case `STOP done` is a defensive guard for
  the sub-millisecond residual window between that re-check and worker boot — the
  normal-case ready PR is caught upstream and no worker is spawned.

For `wrong-worktree`, the spawn was incoherent — the branch-name sanity check
rejected the spawn cwd, or the positional `<worktree-path>` disagreed with `git
rev-parse --show-toplevel`; see `reference.md`.

## 2. Stop

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
