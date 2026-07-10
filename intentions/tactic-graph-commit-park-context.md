---
id: tactic-graph-commit-park-context
kind: tactic
statement: "graph-commit conflict-park writes recoverable context:
  recommendation and snapshot pointer in the park record, and a clear pre-flight
  error (or autostash) for unrelated dirty tracked files"
owner: ai
status: raw
parent: null
rationale: "Draft finding from the 2026-07-06/07 emulated router ticks
  (graph-tick-emulation-workflow-gotchas). Residual after
  tactic-graph-commit-hardening (PR #2778, review) whose Unit 2 covers
  park_write atomicity, id validation, and signal traps but not park content or
  the dirty-tree failure mode."
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
# graph-commit conflict-park writes recoverable context: recommendation and snapshot pointer in the park record, and a clear pre-flight error (or autostash) for unrelated dirty tracked files

**Draft** — retained finding from the 2026-07-06/07 emulated router ticks;
input to a later `/align-tactics strategy-graph-native-dispatch` round.
Residual after `tactic-graph-commit-hardening` (PR #2778): its Unit 2 covers
`park_write` atomicity, id validation, and signal traps — not park *content*
and not the dirty-tree failure mode below.

## Finding 1 — conflict-park content violates condition 6

`park_write()` in `packages/intentionsutil/scripts/graph-commit` hardcodes
`reason: "graph-commit: concurrent-edit conflict — manual merge needed"`.
Strategy condition 6 requires every park to carry recoverable context: the
reason, a best-next-steps recommendation, and the state a fresh session needs.
The conflict park's essential state is the SNAP_DIR path (the losing writer's
only surviving content copy — the park message prints it to stderr, which a
fresh session never sees) and the instruction that the loser re-lands and
clears the park while third sessions wait (the mailbox discipline).

Direction: once `office_hours.recommendation` is first-class
(`tactic-office-hours-graph-entry`, PR #2787 Unit 1 adds it to `schema.ts`),
`park_write` populates it with the snapshot path + mailbox instruction; until
then, append both to the `reason` string as the labelled trailing sentence
convention.

## Finding 2 — unrelated dirt aborts with a misleading error

`try_land()`'s `git pull --rebase origin main` refuses to start on ANY dirty
tracked file — including files entirely outside `intentions/` (observed: the
main checkout's modified `flake.lock`; also any later-bundle node edit). The
resulting error ("dirty tree or fetch failure" via `die`) does not name the
offending paths, and the failure is indistinguishable from a real environment
problem. Per `.claude/rules/code-style.md` this should be a clear error:
pre-flight `git status --porcelain` scoped to paths *outside* the requested id
set, and fail with the offending paths named and the remediation (stash or
commit them; a re-run pushes the already-made commit) — or rebase with
`--autostash` if the safety analysis holds for the `.bare`+worktree layout.

## Reuse

- `id_files_dirty()` / `snapshot()` / `assert_staged_safe()` patterns already
  in `packages/intentionsutil/scripts/graph-commit`.
- `park-node` primitive (`tactic-graph-router-selector` PR #2785) for the
  recommendation-bearing park write shape.
