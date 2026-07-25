---
id: tactic-graph-commit-invocation-classifier-bypass
kind: tactic
statement: Shape graph-commit to the allowedTools matcher (a -C flag, no
  cd-compound) and add it to permissions.allow so the auto-mode classifier never
  false-denies the sole main-landing graph-write path.
owner: ai
status: raw
parent: null
rationale: "Surfaced live in a 2026-07-21 office-hours drain: invoking
  graph-commit from a worktree, a `cd <wt> && ./…graph-commit` one-line compound
  was firmly denied by the auto-mode classifier ('Blocked by classifier'), and
  even the bare invocation drew transient 'Stage 2 classifier error' denials
  that cleared only on retry. Friction on the only path that lands graph edits
  on main, directly against strategy-owned-orchestration's wrapper-to-matcher
  doctrine. blocked_by tactic-graph-commit-cwd-repo-resolution because both
  tactics add the same -C flag to graph-commit; that tactic owns the flag
  implementation and this one consumes it."
reading: null
gap: null
serves:
  - strategy-owned-orchestration
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-graph-commit-cwd-repo-resolution
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit invocation: matcher-shaped and classifier-exempt

Draft tactic (retained interview byproduct, `/align-strategy` 2026-07-21). Not
yet decomposed — `/align-tactics` refines and unit-splits this.

## Context

Two distinct approval gates sit in front of a Bash command, and the recorded
wrapper-to-matcher doctrine (`strategy-owned-orchestration`, "Why do wrapper
scripts exist") only addresses the first:

1. **The static `allowedTools` prefix matcher** — pattern-matches from the start
   of the command string. `cd <path> && <cmd>` breaks its prefix match; `git -C`
   and `--prefix`/`--root` flags preserve it. Existing doctrine.
2. **The auto-mode permission classifier** — a separate, probabilistic gate that
   fires when the static allowlist does not match. It produced the live
   failures: a `cd <wt> && ./…graph-commit` compound was firmly denied
   ("Blocked by classifier"), and even the bare invocation drew transient
   "Stage 2 classifier error" denials that cleared only on retry.

graph-commit is the sole path that lands graph edits on `origin/main`. Having it
blocked or round-tripped by a probabilistic gate is friction on the most
load-bearing tool in the dispatch loop.

## Greenfield design (author-selected 2026-07-21)

1. **`-C <path>` / `--repo <path>` flag on graph-commit** so directory context
   is passed as a flag, never a `cd <wt> &&` compound — the same git-C-over-cd&&
   shape the wrapper doctrine already prescribes, extended to graph-commit. This
   is the *shared surface* with `tactic-graph-commit-cwd-repo-resolution` (this
   node is `blocked_by` it): that tactic lands the flag as part of fixing repo
   resolution; this node consumes it for invocation ergonomics. One flag, one
   implementation, two motivations.
2. **Add graph-commit to static `permissions.allow`** so the classifier is never
   consulted for it (a static allow bypasses the classifier — see memory
   `auto-mode-classifier-permissions-allow`). Cover the invocation forms that
   actually occur: the worktree-local relative form
   (`packages/intentionsutil/scripts/graph-commit`) and the `-C` form. This kills
   both the firm cd-compound denial and the transient Stage-2 round-trips at once.

## Tradeoff (author-accepted 2026-07-21)

Static-allowing graph-commit removes per-call classifier gating on the only
main-landing path. Accepted deliberately: the sanctioned write path should not
depend on a probabilistic gate's judgment. Its safety comes from graph-commit's
own machinery — compare-and-swap (`--base`), bounded rebase-retry, the landing
lock — not from per-call approval. This is recorded as a strategy clarification
on `strategy-owned-orchestration`, not left implicit in this tactic.

## Migration / sequencing

- Depends on `tactic-graph-commit-cwd-repo-resolution` landing the `-C` flag
  (the `blocked_by` edge). If that tactic is deferred, this one can still add the
  `permissions.allow` entries for the existing worktree-local relative form
  independently — the two halves (flag, allowlist) are separable.
- The `permissions.allow` change touches `.claude/settings.json` (agent-behavior
  config); committing agent-behavior config in auto mode is itself gated (memory
  `dispatch-hooks-edit-blocked-automode`) — expect the settings edit to need an
  explicit grant when this is implemented under dispatch.

## Verification

- After the flag lands: `graph-commit -C <worktree> <id>` runs with no `cd`
  compound and is auto-approved by the static allowlist (no classifier prompt).
- Confirm the `permissions.allow` pattern matches the actual invocation strings
  used by the align/office-hours skills (worktree-local relative form and `-C`
  form), so no real call falls through to the classifier.
