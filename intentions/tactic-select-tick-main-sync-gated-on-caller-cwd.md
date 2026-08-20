---
id: tactic-select-tick-main-sync-gated-on-caller-cwd
kind: tactic
statement: Gate dispatch-select-tick's main-checkout sync on the checkout it is
  about to sync, not on the caller's cwd, and stop one stray dirty file there
  from wedging every writer
owner: ai
status: raw
parent: null
rationale: "Found by the 2026-08-11 rsi iteration; the write-side counterpart of
  the split-brain tactic-graph-execute-fresh-main-read records on the read side.
  dispatch-select-tick computes BRANCH from the caller's cwd (:316) and runs its
  fetch + ff-only merge of the shared main checkout (:379) only when that reads
  main, so invoking the script by absolute path from any other worktree — the
  normal thing to do from an rsi or node worktree — silently skips the sync and
  selects anyway. Observed live: origin/main carried execution.fix attempt 2
  while the shared checkout still read attempt 1 / pushed_sha null, and a
  single-node run left it that way. Separately, one unrelated dirty tracked file
  in that checkout (a stray modified flake.lock) wedged three writers at once —
  graph-commit refused to start, reconcile-graph-merged then rolled the apply
  run's node writes back to HEAD 78dc28b5, and the router's own fix-state write
  failed as fix-write-failed — because the fix-state write and the merged-node
  reconciler both run inside that checkout. Together these turn an ordinary
  uncommitted edit by any session into a queue-wide outage with three
  different-looking symptoms."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Gate dispatch-select-tick's main-checkout sync on the checkout it is about to sync, not on the caller's cwd, and stop one stray dirty file there from wedging every writer

## Context

This is the **write side** of the split-brain that
tactic-graph-execute-fresh-main-read records on the read side.
`graph-select-target` reads phase and fix state from `origin/main`, but
`_apply_fix` (`.claude/skills/dispatch-propagate/scripts/graph-select-target:514-517`)
reads and writes `$NATIVE_ROOT/intentions` — the shared `main` checkout. A fix
that only freshens reads leaves everything below in place, which is why this is
tracked separately rather than folded into that node.

### Cause 1 — the sync is gated on the wrong repository

`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:316`:

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [[ "$BRANCH" == "main" ]]; then
```

That reads the **caller's cwd**, then guards the fetch + `git merge --ff-only
origin/main` of the shared checkout at `:379`. The condition and the thing it
guards are about two different repositories. Invoking the script by absolute
path from any other worktree — the normal thing to do from an rsi or node
worktree, and what the single-node `dispatch-select-tick <node-id>` lane invites
— skips the sync entirely and proceeds to select anyway. Nothing on stdout or
stderr says the freshen did not happen.

Observed live on 2026-08-11: `origin/main` carried `execution.fix` attempt 2
with `pushed_sha` set, while the shared checkout still read attempt 1 /
`pushed_sha: null`. A single-node `dispatch-select-tick` run invoked by absolute
path left it that way.

Over this iteration the stale shared store produced three different-looking
symptoms — a false `pruned` verdict, `fix-write-failed`, and
`fix-cap-check-failed` — each costing a full failed launch cycle before the
common cause was visible.

### Cause 2 — one dirty file in that checkout wedges every writer

A single unrelated modified tracked file there (a stray `flake.lock`) was enough
to stop three writers at once:

```
error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:
 M flake.lock
reconcile-graph-merged: graph-commit failed
reconcile-graph-merged: rolled the apply run's node writes back to HEAD 78dc28b5
```

and, from the router's own fix-state write, `fix-write-failed`. The same file
also blocks the `--ff-only` merge from Cause 1. Because the fix-state write and
the merged-node reconciler both execute inside the shared checkout, an ordinary
uncommitted edit by any session — including the author's own — becomes a
queue-wide outage whose three symptoms do not obviously share a cause.

`graph-commit`'s refusal is correct and must not be relaxed: it is what stops a
concurrent writer's work from being swept into an unrelated commit. The defect
is that the harness routes writes through a checkout that anyone may dirty.

## Unit 1 — Gate the sync on the target checkout

**Recommended model: sonnet.** A localized, well-specified correction with a
clear observable.

### Scope

File: `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`, the
guard at `:316` and the sync it protects at `:379`.

Resolve the main worktree path the same way the rest of the router does, then
read *that* checkout's branch — `git -C "$MAIN" rev-parse --abbrev-ref HEAD` —
and sync when it is on `main`, regardless of the caller's cwd. The caller's own
branch stops being consulted at all.

When the sync is skipped, say so on stderr with the reason and the path
inspected. A silent skip is what made this cost three launch cycles;
`.claude/rules/code-style.md` prefers the clear error over the quiet fallback.

**Out of scope:** `graph-select-target`'s `NATIVE_ROOT` derivation
(`:498-499`) and `_apply_fix` itself. Redirecting the router's writes away from
the shared checkout is the larger greenfield change described below and is not
attempted here.

### Reuse

`resolve_main_worktree` (already used by `graph-select-target:498-499` to derive
`NATIVE_ROOT`) — do not add a second way to locate the main checkout. Per
`.claude/rules/sandbox.md`, the ff-only merge must run with
`dangerouslyDisableSandbox: true` when invoked through the Bash tool, since it
updates the working tree across the read-only `.claude/` carve-outs.

## Unit 2 — Report the wedge as one diagnosis, not three symptoms

**Recommended model: sonnet.**

**Dependencies:** Unit 1.

### Scope

Before selecting, check the resolved main checkout for dirty tracked files. If
any exist, emit one diagnostic naming them and stating plainly that graph
writes, the fix-state write, and the merged-node reconciler will all fail until
they are committed or removed — then let the run proceed. Do not auto-stash, do
not discard, do not commit on the author's behalf: the file belongs to whoever
made it, and this iteration deliberately left a colleague's `flake.lock` bump
alone rather than stashing it.

**Out of scope:** any automatic remediation of the dirty file.

### Reuse

`graph-commit`'s existing dirty-file detection and its message wording, so the
two reports name the same condition the same way.

## Greenfield note — the design this works around

The ideal shape is that no router write path depends on a shared mutable
checkout at all: `_apply_fix` and the reconcilers operate on a private,
freshly-cut worktree per invocation (what `provision-node-worktree` already does
for phase workers), so no external session can dirty or stale the state a write
depends on. Both causes above then cease to exist rather than being detected.

That is a larger change than this node claims, and it needs its own design
round — the shared checkout is also what several read paths resolve against.
Units 1 and 2 are the incremental step: make the sync actually run, and make the
wedge legible when it happens.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

`test-dispatch-scripts.sh` (globbed by that loop, `run-unit-tests.sh:197`) is the
home for both cases:

1. **Unit 1.** With a fixture main checkout on `main` and the caller's cwd on a
   different branch, the sync must run. Assert the merge actually happened — the
   fixture checkout's HEAD moved to the fixture origin's tip — not merely that
   the script exited 0. The inverse case must also hold: a fixture main checkout
   **not** on `main` must skip the sync and say why on stderr.
2. **Unit 2.** A fixture main checkout with a dirty tracked file must produce
   exactly one diagnostic naming that file, and the run must still proceed to
   selection.

Manual (judgment): from a node worktree, run
`dispatch-select-tick <node-id>` by absolute path against a main checkout that is
behind `origin/main`, and confirm the checkout is left at `origin/main`'s tip
afterward. Before this change the same command leaves it behind silently, which
is the whole defect — so run it once on the unfixed script first to see the
failure, or the check proves nothing.
