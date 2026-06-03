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
worktree cross-check, the `dispatch-ci-ready` gate, `dispatch-phase`, and the
race-window `dispatch-ci-ready` re-check — and prints exactly one directive line.
Run it (`dangerouslyDisableSandbox: true` — it calls `gh`), capturing both the
directive on stdout and the exit code. `ARGUMENTS` has the shape `<N>
<worktree-path>`:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-route <N> <worktree-path>
```

Act on the one directive:

| Directive | Exit | Meaning | Action |
|---|---|---|---|
| `INVOKE /verify-pr` | 0 | draft PR, CI completed and failed | invoke `/verify-pr` |
| `INVOKE /qa-fix` | 0 | draft PR, CI green, no `dispatch:*` label | invoke `/qa-fix` |
| `INVOKE /code-review-fix` | 0 | draft PR + `dispatch:qa-done` | invoke `/code-review-fix` |
| `INVOKE /review-fix` | 0 | draft PR + `dispatch:code-reviewed` | invoke `/review-fix` |
| `INVOKE /security-review-fix` | 0 | draft PR + `dispatch:reviewed` (or `dispatch:security-reviewed` re-entry) | invoke `/security-review-fix` |
| `RELEVANCE-REVIEW` | 0 | no PR on the target (`implement`) | run the Step 2 relevance review, then dispatch its verdict |
| `STOP done` | 0 | non-draft (ready) PR | stop without invoking a phase skill |
| `STOP waiting` | 0 | draft PR's CI is back in progress | print the verbatim message below and stop |
| `STOP wrong-worktree` | non-zero | spawn cwd / branch did not match `<N>` / `<worktree-path>` | stop |

### `INVOKE` — run exactly one phase skill

Invoke the one named phase skill via the Skill tool. Run exactly one phase per
`/dispatch-worker` invocation. The PR stays a **draft** through every phase; the
`security` phase's `/security-review-fix` flips it to ready as the workflow's
terminal action. Each phase skill owns and applies its own `dispatch:*` label —
the worker applies none:

- **`/verify-pr`** — runs a single pass: fix one set of failed CI checks, record
  the outcome, post it, stop. No label.
- **`/qa-fix`** — runs the autonomous portion of QA and applies `dispatch:qa-done`
  itself on a clean pass. On a user-input blocker (a needs-human-judgment item, a
  bug, a failed pre-QA check) it escalates to the office-hours queue instead,
  where `/office-hours` runs the interactive residue.
- **`/code-review-fix`** — runs `/code-review max --fix`, applies the recommended
  fixes, defers important out-of-scope findings to tracking issues, posts a PR
  comment, and applies `dispatch:code-reviewed` itself.
- **`/review-fix`** — runs `/review`, applies the recommended fixes, posts a PR
  comment, and applies `dispatch:reviewed` itself.
- **`/security-review-fix`** — its Step 1 classifies the diff's changed surface: a
  docs-only diff skips the fan-out with a one-line "no attack surface" PR comment;
  a code diff fans out the relevant domain subagents (plus a red team and the
  built-in `/security-review` scan, subagent-wrapped Skill invocation) and runs
  CodeQL and the dependency audit inline when relevant. It then applies the
  required fixes, posts a PR comment, applies `dispatch:security-reviewed`, and
  marks the PR ready. It is idempotent on re-entry.

After the phase skill returns, the worker session ends; the Stop hook reads the
marker the phase skill wrote and propagates the chain. The worker does not advance
to the next phase in the same tick — one phase per `/dispatch-worker` invocation.

`/ultrareview` is intentionally **never** invoked: it is user-triggered and
billed, so `/dispatch-worker` cannot launch it.

### `RELEVANCE-REVIEW` — run the relevance review, then dispatch its verdict

Run the Step 2 relevance review and dispatch the verdict it returns (`proceed` /
`adjust` / `stop` — see Step 2). The draft PR's existence plus its CI status is
its own marker — `/plan-implement` gets **no** `dispatch:*` label.

### `STOP waiting` — re-gate to the router, no marker

CI transitioned back to in-progress since the router selected this target. Stop
with no marker and print this user-visible report verbatim:

```
#<N>: CI transitioned back to in-progress since router selection; next router tick will re-gate.
```

Apply no `dispatch:office-hours` and spawn no babysitter — a not-ready target is
not worker-actionable; the router owns the CI gate. See `reference.md` for the
Stop-hook re-gate rationale.

### `STOP done` / `STOP wrong-worktree` — stop with no marker

Stop without invoking a phase skill and without writing a marker. The Stop hook
reads marker-absence and applies `dispatch:office-hours` to the issue. For `done`
(a non-draft PR), no phase skill ran and the slip-past sweep (#843) flags this PR
for office-hours review. For `wrong-worktree`, the spawn was incoherent — the
branch-name sanity check rejected the spawn cwd, or the positional
`<worktree-path>` disagreed with `git rev-parse --show-toplevel`; see
`reference.md`.

## 2. Pre-Implementation Relevance Review

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

If it prints a PR number, **skip this relevance review** and re-run Step 1
(`dispatch-route`) — a PR already exists and implementation is underway.

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
