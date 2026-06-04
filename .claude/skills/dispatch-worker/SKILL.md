---
name: dispatch-worker
description: Worker for the dispatch chain — runs one phase skill in its target worktree, then hands off — via the Stop hook — to a fresh headless dispatch tick
---

# Dispatch Worker

The worker is the per-worktree execution half of the dispatch chain. The other
half is the headless `dispatch-tick` script: it selects a target, resolves its
worktree, and spawns this worker into that worktree. The worker derives the
phase, runs exactly one phase skill, and hands off.

The worker is spawned **into** its target worktree by `dispatch-spawn-worker`
— the script invokes `claude --bg` from a subshell that has `cd`'d into
`<worktree-path>`, so the new worker is born in that worktree. It runs there
from spawn through its entire lifetime; it never calls `EnterWorktree` or
`ExitWorktree`. `SessionStart`-derived attributes (title, restored skill set)
and per-worktree sandbox concerns all naturally key on the spawn cwd, which
is the target worktree.

Trade-off: the Claude daemon's "+ new session" launcher default cwd tracks
the most-recent worker's worktree rather than `worktrees/main` — a
recoverable UI default, accepted in exchange for sessions whose cwd does not
silently drift mid-tick when subsequent `Bash` / `Skill` tool calls reset to
the spawn cwd.

The worker takes `<N> <worktree-path>` arguments — the issue number and the
absolute path to its target worktree — and ends after one phase. The router
is the one who decides what to work on next; the worker just executes.

Run `gh` commands (`gh label create`, `gh pr edit`, and the scripts that invoke
`gh`) with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## 0. Cross-check the Worker's Worktree

The worker is born in its target worktree via spawn cwd (`dispatch-spawn-worker`
runs `claude --bg` from a subshell `cd`'d into `<worktree-path>`). This step
is a defensive cross-check that the spawner passed a coherent
`<worktree-path>` matching the named issue and matching the session's actual
spawn cwd. `ARGUMENTS` has the shape `<N> <worktree-path>` (e.g.
`860 /home/n8/natb1/commons.systems/worktrees/860-dispatch-spawn-worker-from-m`).
Parse both, then assert the current worktree matches.

```bash
read -r ISSUE_NUM WORKTREE_PATH <<<"$ARGUMENTS"
if [[ -z "${ISSUE_NUM:-}" || -z "${WORKTREE_PATH:-}" ]]; then
  echo "dispatch-worker: expected ARGUMENTS '<N> <worktree-path>', got '$ARGUMENTS'" >&2
  exit 1
fi
ACTUAL_TOPLEVEL=$(git rev-parse --show-toplevel)
ACTUAL_BRANCH=$(basename "$ACTUAL_TOPLEVEL")
EXPECTED="${ISSUE_NUM}-"
case "$ACTUAL_BRANCH" in
  ${EXPECTED}*) ;;
  *)
    echo "dispatch-worker invoked with wrong worktree: expected branch '${EXPECTED}…' under worktrees/, got '${ACTUAL_BRANCH}'" >&2
    echo "The spawner must spawn the worker with cwd matching <worktree-path>." >&2
    exit 1
    ;;
esac
if [[ "$ACTUAL_TOPLEVEL" != "$WORKTREE_PATH" ]]; then
  echo "dispatch-worker invoked with mismatched <worktree-path>: spawn cwd '$ACTUAL_TOPLEVEL' != argument '$WORKTREE_PATH'" >&2
  exit 1
fi
```

The bash above exits 1 to signal the wrong-worktree disposition — either the
branch-name sanity check rejected the spawn cwd, or the positional
`<worktree-path>` disagreed with `git rev-parse --show-toplevel`. When that
exit fires, the worker session ends; the Stop hook applies
`dispatch:office-hours` to the issue because no marker was written.

## 1. Derive the Phase

First confirm the target is CI-ready via `dispatch-ci-ready <N>`:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-ci-ready <N>
```

This prints `ready` (exit 0) when there is an actionable next step — no PR,
a non-draft PR, or a draft PR whose CI has concluded (passing or failing). It
prints `waiting` (exit 1) when the draft PR's checks are still in progress and
no verdict is available yet. Only proceed to `dispatch-phase` when
`dispatch-ci-ready` exits 0. If it exits 1, stop and handle as not-ready (see
Step 2).

Then derive the phase via `dispatch-phase <N>`:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-phase <N>
```

It prints exactly one actionable phase name (`implement | verify | qa |
review | done`). It never prints `waiting`. For a
draft PR whose CI has no verdict yet, it prints an error to stderr and exits 3
— which is why the `dispatch-ci-ready` gate above must run first.

CI status is checked **before** labels — a draft PR with non-green CI is always
`verify`, regardless of which `dispatch:*` labels are present.

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
| `qa` | draft PR, CI green, no `dispatch:*` label | `/qa-fix` |
| `review` | draft PR + `dispatch:qa-done` | `/review-fix` (applies `dispatch:reviewed` and marks the PR ready itself) |
| `done` | non-draft (ready) PR | already complete — stop without invoking a phase skill; the Stop hook applies `dispatch:office-hours` to the issue |

## 2. Dispatch One Phase, Then Hand Off

Invoke the one mapped phase skill via the Skill tool. Run exactly one phase per
`/dispatch-worker` invocation.

**Race-window check first.** Re-run `dispatch-ci-ready <N>` at the start of
Step 2 — CI may have transitioned back to in-progress since the router selected
this target (e.g. a new push between selection and worker boot). If
`dispatch-ci-ready` now exits 1 (`waiting`), stop with no marker and print the
user-visible report verbatim: `#<N>: CI transitioned back to in-progress since
router selection; next router tick will re-gate.` Apply no
`dispatch:office-hours` and spawn no babysitter — a not-ready target is not
worker-actionable; the router owns the CI gate. The Stop hook's early
`dispatch-ci-ready` gate runs before the marker check: it detects the not-ready
target and hands the issue back to the router (spawns a fresh router **without**
applying `dispatch:office-hours`), which re-gates on `dispatch-ci-ready` and
picks the target up once CI concludes.

- **`implement`** — run the Step 3 relevance review and dispatch the verdict it
  returns (`proceed` / `adjust` / `stop` — see Step 3). The draft PR's existence
  plus its CI status is its own marker — `/plan-implement` gets **no**
  `dispatch:*` label.
- **`verify`** — invoke `/verify-pr`. It runs a single pass: fix one set of
  failed CI checks, record the outcome, post it, stop. No label.
- **`qa`** — invoke `/qa-fix`. It runs the autonomous portion of QA and owns and
  applies `dispatch:qa-done` itself on a clean pass; `/dispatch-worker` applies
  no label. On a user-input blocker (a needs-human-judgment item, a bug, a failed
  pre-QA check) it escalates to the office-hours queue instead, where `/office-hours`
  runs the interactive residue.
- **`review`** — invoke `/review-fix`. It runs `/code-review max --fix`,
  `/review`, and the full security pass (surface-gated) as direct subagents,
  aggregates and de-duplicates findings, applies fixes, files out-of-scope
  findings as follow-ups, posts one PR comment, applies the `dispatch:reviewed`
  label, and marks the PR ready. It is idempotent on re-entry — `/dispatch-worker`
  applies no label.
- **`done`** — stop without invoking a phase skill; the Stop hook applies
  `dispatch:office-hours` to the issue. No phase skill ran; the slip past
  sweep (#843) flags this PR for office-hours review.

The PR stays a **draft** through every phase; the `review` phase's
`/review-fix` flips it to ready as the workflow's terminal action.

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

See `reference.md`'s *The #725 cap-keyed re-seed* section — the worker's
relationship to the re-seed is the same as the tick's.
The cap-keyed re-seed covers chain stalls caused by a rate-limit cap hit;
an empty queue or all-parked stall is handled by the office-hours queue,
not this mechanism.
